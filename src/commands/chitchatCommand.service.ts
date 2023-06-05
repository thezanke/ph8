import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
} from 'openai';

import { EnvironmentVariables } from '../config/validate';
import { DISCORD_EVENTS } from '../discord/constants';
import { DiscordService } from '../discord/discord.service';
import { OpenAIService } from '../openai/openai.service';
import { CommandsService } from './commands.service';
import { Command } from './types';

@Injectable()
export class ChitchatCommandService implements Command {
  constructor(
    commandsService: CommandsService,
    private readonly openaiService: OpenAIService,
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

  private readonly gptChitchatMaxTokens = parseInt(
    this.configService.get<string>('GPT_CHITCHAT_MAX_TOKENS', '1000'),
    10,
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
    return replyChain
      .reverse()
      .map((m) =>
        this.createUserMessage(m.member?.id ?? 'unknown_user', m.content),
      );
  }

  private createUserMessage = (
    name: string,
    content: string,
  ): ChatCompletionRequestMessage => ({ role: 'user', content, name });

  private async determineIfHandledByMessageCreateHandler(message: Message) {
    if (!message.reference) return false;

    const lastMessage = await message.fetchReference();

    if (lastMessage.author.id !== this.discordService.userId) return false;

    return true;
  }

  private getCompletionResponseMessage(response: CreateChatCompletionResponse) {
    const [choice] = response.choices;
    const responseMessageChoice = choice.message?.content;

    if (!responseMessageChoice) {
      throw new Error('No response message for choice');
    }

    return responseMessageChoice;
  }

  private async getPromptMessageContext(message: Message) {
    const replyChain = await this.discordService.fetchReplyChain(message);

    const replyChainMessageHistory =
      this.buildReplyChainMessageHistory(replyChain);

    const prompt: ChatCompletionRequestMessage[] = [
      {
        content: [
          this.preamble,
          `NAME: ${this.discordService.username}`,
          `ID: ${this.discordService.userId}`,
          `TODAY'S DATE: ${new Date().toISOString()}`,
        ].join('\n'),
        role: 'system',
      },
      ...replyChainMessageHistory,
    ];

    return prompt;
  }

  private async handleChitchatMessage(message: Message) {
    if (this.isGptEnabled) {
      return this.handleGptChitchat(message);
    }

    message.reply(`what's up bud?`);
  }

  private createUserChatMessageFromDiscordMessage(
    message: Message,
  ): ChatCompletionRequestMessage {
    const messageText = message.content.trim();

    return {
      content: messageText,
      role: 'user',
      name: message.member?.id,
    };
  }

  private async handleGptChitchat(message: Message) {
    try {
      const chatRequestMessage =
        this.createUserChatMessageFromDiscordMessage(message);

      const replyChainMessageHistory = await this.getPromptMessageContext(
        message,
      );

      const messageChain = [...replyChainMessageHistory, chatRequestMessage];

      this.logger.debug(
        'Requesting AI Completion\n' +
          `  Message Chain: ${JSON.stringify(messageChain, null, 2)}`,
      );

      const response = await this.openaiService.getCompletion(
        messageChain,
        this.gptChitchatMaxTokens,
      );

      const responseMessage = this.getCompletionResponseMessage(response);

      this.logger.debug('GPT Response:\n' + JSON.stringify(responseMessage));

      message.reply(responseMessage);
    } catch (e) {
      this.logger.error(e);

      if (e.response?.status === 429) {
        message.reply('Out of credits... Please insert token.');
      } else {
        message.reply('That one hurt my brain..');
      }
    }
  }
}
