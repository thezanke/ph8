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
import { getJoinedStringArray } from '../helpers/getJoinedStringArray';
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
  public botName = this.discordService.username;

  private logger = new Logger(ChitchatCommandService.name);

  private readonly preamble = this.configService.get<string>(
    'GPT_CHITCHAT_SYSTEM_MESSAGE_PREAMBLE',
    '',
  );

  private readonly gptChitchatMaxTokens = parseInt(
    this.configService.get<string>('GPT_CHITCHAT_MAX_TOKENS', '120'),
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
        this.createUserMessage(m.member?.displayName ?? 'User', m.cleanContent),
      );
  }

  private createUserMessage = (
    username: string,
    message: string,
  ): ChatCompletionRequestMessage => {
    return {
      content: message,
      role: 'user',
      name: `<@${username}>`,
    };
  };

  private createBotMessage = (
    message: string,
  ): ChatCompletionRequestMessage => {
    return {
      content: message,
      role: 'assistant',
      name: this.botName,
    };
  };

  private createExampleConvo() {
    const userId1 = '112395550829146112';
    const userId2 = '249711639157407744';

    return [
      this.createUserMessage(userId1, 'Oh hi, what is your name?'),
      this.createBotMessage(`Hi <@${userId1}>! My name is ${this.botName}.`),
      this.createUserMessage(userId2, 'Whats up?'),
      this.createBotMessage(
        `Just hanging out, relaxing. How about you, <@${userId2}>?`,
      ),
    ];
  }

  // private determineIfTagged(message: Message) {}

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

    return responseMessageChoice.replace('@', '').trim();
  }

  private async getPromptMessageContext(message: Message) {
    const replyChain = await this.discordService.fetchReplyChain(message);

    const replyChainMessageHistory =
      this.buildReplyChainMessageHistory(replyChain);

    const prompt: ChatCompletionRequestMessage[] = [
      {
        content: [this.preamble, `NAME: ${this.botName}`].join('\n'),
        role: 'system',
      },
      ...this.createExampleConvo(),
      ...replyChainMessageHistory,
    ];

    return prompt;
  }

  private async handleChitchatMessage(message: Message) {
    if (this.configService.get('ENABLE_GPT', false)) {
      return this.handleGptChitchat(message);
    }

    message.reply(`what's up bud?`);
  }

  private createUserChatMessageFromDiscordMessage(
    message: Message,
  ): ChatCompletionRequestMessage {
    const messageText = message.cleanContent.trim();

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

      this.logger.debug(
        'Requesting GPT Completion:\n' + JSON.stringify(chatRequestMessage),
      );

      const replyChainMessageHistory = await this.getPromptMessageContext(
        message,
      );

      console.log(replyChainMessageHistory, chatRequestMessage);

      const response = await this.openaiService.getCompletion(
        chatRequestMessage,
        replyChainMessageHistory,
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
