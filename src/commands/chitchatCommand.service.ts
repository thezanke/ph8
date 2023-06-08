import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { stripIndent } from 'common-tags';
import { Message } from 'discord.js';
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  CreateChatCompletionResponse,
} from 'openai';

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
    private readonly openaiChat: OpenAIChatService,
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
    return replyChain.reverse().map((m) => {
      const memberId = m.member?.id;

      if (memberId === this.discordService.userId) {
        return this.createBotMessage(m.content);
      }

      return this.createUserMessage(m.content, memberId);
    });
  }

  private createUserMessage = (
    content: string,
    name?: string,
  ): ChatCompletionRequestMessage => ({ role: 'user', content, name });

  private createSystemMessage = (
    content: string,
  ): ChatCompletionRequestMessage => ({ role: 'system', content });

  private createBotMessage = (
    content: string,
  ): ChatCompletionResponseMessage => ({ role: 'assistant', content });

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

    return this.buildReplyChainMessageHistory(replyChain);
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
    return this.createUserMessage(message.content.trim(), message.member?.id);
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
        this.createSystemMessage(this.preamble),
        this.createSystemMessage(stripIndent`
          NAME: ${this.discordService.username}
          ID: ${this.discordService.userId}
          TODAY'S DATE: ${new Date().toISOString()}
        `),
        ...replyChainMessageHistory,
        chatRequestMessage,
      ];

      const response = await this.openaiChat.getCompletion(
        messageChain,
        this.gptChitchatMaxTokens,
      );

      const responseMessage = this.getCompletionResponseMessage(response);

      return message.reply(responseMessage);
    } catch (e) {
      this.logger.error(e);

      if (e.response?.status === 429) {
        return message.reply('Out of credits... Please insert token.');
      } else {
        return message.reply('That one hurt my brain..');
      }
    }
  }
}
