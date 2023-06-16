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

  private buildReplyChainMessageHistory(replyChain: Message[]) {
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

  private async getPromptMessageContext(message: Message) {
    const replyChain = await this.discordService.fetchReplyChain(message);

    return this.buildReplyChainMessageHistory(replyChain);
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

      const isValidContent = await this.openaiModeration.validateInput(
        message.content,
      );

      if (!isValidContent) {
        return message.reply('Uhhh... B&!');
      }

      const replyChainMessageHistory = await this.getPromptMessageContext(
        message,
      );

      const messageChain = [
        this.aiCompletionService.createSystemMessage(this.preamble),
        this.aiCompletionService.createSystemMessage(stripIndent`
          NAME: ${this.discordService.username}
          ID: ${this.discordService.userId}
          TODAY'S DATE: ${new Date().toISOString()}
        `),
        ...replyChainMessageHistory,
        chatRequestMessage,
      ];

      const response = await this.aiCompletionService.getCompletion(
        messageChain,
      );
      const responseMessages = this.getCompletionResponseMessages(response);

      return this.handleResponseMessages(message, responseMessages);
    } catch (e) {
      if (e.response?.status === HttpStatus.TOO_MANY_REQUESTS) {
        return message.reply('Out of credits... Please insert token.');
      }

      return message.reply('That one hurt my brain..');
    }
  }
}
