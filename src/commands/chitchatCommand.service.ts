import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';

import { EnvironmentVariables } from '../config/validate';
import { DISCORD_EVENTS } from '../discord/constants';
import { DiscordService } from '../discord/discord.service';
import { CompletionResponse, GptService } from '../gpt/gpt.service';
import { getJoinedStringArray } from '../helpers/getJoinedStringArray';
import { CommandsService } from './commands.service';
import { Command } from './types';

@Injectable()
export class ChitchatCommandService implements Command {
  constructor(
    commandsService: CommandsService,
    private readonly gptService: GptService,
    private readonly discordService: DiscordService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    commandsService.registerCommand(this);
  }

  public commandName = 'chitchat';
  public omitFromListing = true;

  private logger = new Logger(ChitchatCommandService.name);

  private readonly gptChitchatMaxTokens = parseInt(
    this.configService.get<string>('GPT_CHITCHAT_MAX_TOKENS', '120'),
    10,
  );

  public async execute(message: Message) {
    if (await this.determineIfMessageIsReply(message)) return;
    await this.handleChitchatMessage(message);
  }

  @OnEvent(DISCORD_EVENTS.messageCreate)
  public async handleMessageCreate(message: Message) {
    if (await this.determineIfMessageIsReply(message)) {
      await this.handleChitchatMessage(message);
    }
  }

  private async buildReplyChainMessageHistory(replyChain: Message[]) {
    return replyChain
      .reverse()
      .map((m) =>
        this.createChatMessageLine(
          m.member?.displayName ?? 'User',
          m.cleanContent,
        ),
      );
  }

  private createChatMessageLine = (username: string, message: string) => {
    return `${username}: ${message}`;
  };

  private createExampleConvo(participantNames: string[]) {
    const botName = this.discordService.username ?? 'Ph8';
    const [, ...names] = participantNames;
    const user1 = names.pop() ?? 'User';
    const user2 = names.pop() ?? user1;

    return [
      this.createChatMessageLine(user1, 'Oh hi, what is your name?'),
      this.createChatMessageLine(botName, `Hi! My name is ${botName}.`),
      this.createChatMessageLine(user2, 'Whats up?'),
      this.createChatMessageLine(botName, 'Just hanging out, relaxing. You?'),
    ];
  }

  // private determineIfTagged(message: Message) {}

  private async determineIfMessageIsReply(message: Message) {
    if (!message.reference) return false;

    const lastMessage = await message.fetchReference();

    if (lastMessage.author.id !== this.discordService.userId) return false;

    return true;
  }

  private getCompletionResponseMessage(response: CompletionResponse) {
    if (!response.choices.length) return '??';

    const responseMessageChoice = response?.choices[0]?.text;

    return responseMessageChoice.replace('@', '').trim();
  }

  private getParticipantsNames(message: Message, replyChain: Message[]) {
    const names: Set<string> = new Set();
    names.add(this.discordService.username ?? 'Ph8');
    [message, ...replyChain].forEach((m) =>
      names.add(m.member?.displayName ?? 'User'),
    );

    return Array.from(names);
  }

  private async getPromptMessageContext(message: Message) {
    const replyChain = await this.discordService.fetchReplyChain(message);
    const participantsNames = this.getParticipantsNames(message, replyChain);
    const joinedParticipantNames = getJoinedStringArray(participantsNames);

    const replyChainMessageHistory = await this.buildReplyChainMessageHistory(
      replyChain,
    );

    const prompt = [
      `Here is a conversation between ${joinedParticipantNames}.`,
      '',
      ...this.createExampleConvo(participantsNames),
      ...replyChainMessageHistory,
    ].join('\n');

    return prompt;
  }

  private async handleChitchatMessage(message: Message) {
    if (this.configService.get('ENABLE_GPT3', false)) {
      return this.handleGptChitchat(message, message.cleanContent.trim());
    }

    message.reply(`what's up bud?`);
  }

  private async buildFinalPrompt(message: Message, messageText?: string) {
    return [
      await this.getPromptMessageContext(message),
      messageText?.length && `${message.member?.displayName}: ${messageText}`,
      `${this.discordService.username}:`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async handleGptChitchat(message: Message, messageText?: string) {
    try {
      const prompt = await this.buildFinalPrompt(message, messageText);

      this.logger.debug('Requesting GPT3 Completion:\n' + prompt);

      const response = await this.gptService.getCompletion(
        prompt,
        ['\n', '\n\n'],
        this.gptChitchatMaxTokens,
      );

      const responseMessage = this.getCompletionResponseMessage(response.data);

      this.logger.debug('GPT3 Response:\n' + responseMessage);

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
