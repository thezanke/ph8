import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { stripIndent } from 'common-tags';
import { Message } from 'discord.js';

import { EnvironmentVariables } from '../config/validate';
import { DISCORD_EVENTS } from '../discord/constants';
import { DiscordService } from '../discord/discord.service';
import { OpenAIChatService } from '../openai/openai-chat.service';
import { OpenAIModerationService } from '../openai/openai-moderation.service';
import { CommandsService } from './commands.service';
import { CommandService } from './types/CommandService';

const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
) => {
  const ret = {} as Pick<T, K>;

  keys.forEach((key) => {
    ret[key] = obj[key];
  });

  return ret;
};

@Injectable()
export class ChitchatCommandService implements CommandService {
  constructor(
    commandsService: CommandsService,
    private readonly openaiModeration: OpenAIModerationService,
    private readonly aiCompletionService: OpenAIChatService,
    private readonly discordService: DiscordService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    commandsService.registerCommand(this);
  }

  public commandName = 'chitchat';
  public omitFromListing = true;

  private logger = new Logger(ChitchatCommandService.name);

  private readonly preamble = this.configService.get<string>(
    'GPT_CHITCHAT_SYSTEM_MESSAGE_PREAMBLE',
    '',
  );

  private readonly isGptEnabled = this.configService.get<boolean>(
    'ENABLE_GPT',
    false,
  );

  public async execute(message: Message) {
    const isHandledByMessageCreateHandler =
      await this.determineIfHandledByMessageCreateHandler(message);

    if (isHandledByMessageCreateHandler) return;

    await this.handleChitchatMessage(message);
  }

  @OnEvent(DISCORD_EVENTS.messageCreate)
  public async handleMessageCreate(message: Message) {
    const isReply = await this.determineIfHandledByMessageCreateHandler(
      message,
    );

    if (isReply) {
      await this.handleChitchatMessage(message);
    }
  }

  public buildReplyChainMessageHistory(replyChain: Message[]) {
    return replyChain.reverse().map((m) => {
      const memberId = m.member?.id;

      if (memberId === this.discordService.userId) {
        return this.aiCompletionService.createAssistantMessage(m.content);
      }

      return this.aiCompletionService.createUserMessage(m.content, memberId);
    });
  }

  private async determineIfHandledByMessageCreateHandler(message: Message) {
    if (!message.reference) return false;

    const lastMessage = await message.fetchReference();

    if (lastMessage.author.id !== this.discordService.userId) return false;

    return true;
  }

  private getCompletionResponseMessages(message: string) {
    return message.split('\n===\n');
  }

  private async handleChitchatMessage(message: Message) {
    if (this.isGptEnabled) {
      return this.handleGptChitchat(message);
    }

    message.reply(`what's up bud?`);
  }

  private createUserChatMessageFromDiscordMessage(message: Message) {
    return this.aiCompletionService.createUserMessage(
      message.content.trim(),
      message.member?.id,
    );
  }

  private async handleResponseMessages(
    message: Message,
    responseMessages: string[],
  ) {
    try {
      for (const responseMessage of responseMessages) {
        await message.reply(responseMessage);
      }
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  private async handleGptChitchat(message: Message) {
    try {
      const chatRequestMessage =
        this.createUserChatMessageFromDiscordMessage(message);

      const replyChain = await this.discordService.fetchReplyChain(message);

      const replyChainMessageHistory = await this.buildReplyChainMessageHistory(
        replyChain,
      );

      const userCompletionContent = replyChainMessageHistory
        .filter((message) => message.role === 'user')
        .map((message) => message.content);

      userCompletionContent.push(chatRequestMessage.content);

      const isValidUserContent = await this.openaiModeration.validateInput(
        userCompletionContent,
      );

      if (!isValidUserContent) {
        return message.reply('Uhhh... B&!');
      }

      const channel = await message.channel.fetch();

      const participantDetails = [
        ...new Set([
          ...replyChain.map((m) => m.member || m.author),
          message.member || message.author,
        ]),
      ].map((author) =>
        pick(author as unknown as Record<string, unknown>, [
          'id',
          'username',
          'displayName',
        ]),
      );

      const messageChain = [
        this.aiCompletionService.createSystemMessage(this.preamble),
        this.aiCompletionService.createSystemMessage(
          stripIndent`
            ASSISTANT USER DETAILS: ${JSON.stringify(
              pick(
                this.discordService.user as unknown as Record<string, unknown>,
                ['id', 'name'],
              ),
            )}
            CHANNEL DETAILS: ${JSON.stringify(
              pick(channel as unknown as Record<string, unknown>, [
                'id',
                'name',
                'type',
              ]),
            )}
            PARTICIPANT DETAILS: ${JSON.stringify(participantDetails)}
          `,
        ),
        ...replyChainMessageHistory,
        chatRequestMessage,
        this.aiCompletionService.createSystemMessage(
          'If completion is larger than 2000 characters it must be split into multiple messages <= 2000 characters in length using `\n===\n` as a delimiter.',
        ),
      ];

      const response = await this.aiCompletionService.getCompletion(
        messageChain,
      );

      const responseMessages = this.getCompletionResponseMessages(response);

      await this.handleResponseMessages(message, responseMessages);
    } catch (e) {
      if (e.response?.status === HttpStatus.TOO_MANY_REQUESTS) {
        await message.reply('Out of credits... Please insert token.');
      } else {
        await message.reply('That one hurt my brain..');
      }
    }
  }
}
