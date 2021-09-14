import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';

import { EnvironmentVariables } from '../config/validate';
import { DISCORD_EVENTS } from '../discord/constants';
import { DiscordService } from '../discord/discord.service';
import { CompletionResponse, GptService } from '../gpt/gpt.service';
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

  public async execute(message: Message) {
    if (!this.configService.get('ENABLE_GPT3', false)) {
      message.reply(`what's up bud?`);
      return;
    }

    if (message.reference) {
      const reference = await message.fetchReference();
      if (reference?.author.id === this.discordService.userId) return;
    }

    const messageParts = message.cleanContent.split(' ');

    return this.handleGptChitchat(message, messageParts.slice(1).join(' '));
  }

  @OnEvent(DISCORD_EVENTS.messageCreate)
  public async handleMessage(message: Message) {
    if (!message.reference) return;

    const lastMessage = await message.fetchReference();

    if (lastMessage.author.id !== this.discordService.userId) return;

    if (!this.configService.get('ENABLE_GPT3', false)) {
      message.reply(`sorry, I'm not my self right now...`);
      return;
    }

    return this.handleGptChitchat(message, message.cleanContent.trim());
  }

  private logger = new Logger(ChitchatCommandService.name);

  private readonly gptChitchatMaxTokens = Number(
    this.configService.get<string>('CHITCHAT_GPT_MAX_TOKENS', '60'),
  );

  private async buildReplyChainMessageHistory(replyChain: Message[]) {
    return replyChain
      .reverse()
      .map((m) => this.createChatMessage(m.author.username, m.cleanContent));
  }

  private createChatMessage = (username: string, message: string) => {
    return `${username}: ${message}`;
  };

  private createExampleConvo(participantNames: string[]) {
    const botName = this.discordService.username ?? 'Ph8';
    const [, ...names] = participantNames;
    const user1 = names.pop() ?? 'User';
    const user2 = names.pop() ?? user1;

    return [
      this.createChatMessage(user1, 'Oh hi, what is your name?'),
      this.createChatMessage(botName, `Hi! My name is ${botName}.`),
      this.createChatMessage(user2, 'Whats up?'),
      this.createChatMessage(botName, 'Just hanging out, relaxing. You?'),
    ];
  }

  private getCompletionResponseMessage(response: CompletionResponse) {
    if (!response.choices.length) return '??';

    const responseMessageChoice = response?.choices[0]?.text;

    return responseMessageChoice.replace('@', '').trim();
  }

  private getJoinedStringArray(parts: string[]) {
    if (parts.length < 2) return parts[0];

    const body = [...parts];
    const tail = body.pop();

    return `${body.join(', ')} and ${tail}`;
  }

  private getParticipantsNames(message: Message, replyChain: Message[]) {
    const names: Set<string> = new Set();
    names.add(this.discordService.username ?? 'Ph8');
    [message, ...replyChain].forEach((m) =>
      names.add(m.author.username ?? 'User'),
    );

    return Array.from(names);
  }

  private async getPromptMessageContext(message: Message) {
    const replyChain = await this.discordService.fetchReplyChain(message);
    const participantsNames = this.getParticipantsNames(message, replyChain);
    const joinedParticipantNames = this.getJoinedStringArray(participantsNames);

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

  private async buildFinalPrompt(message: Message, messageText?: string) {
    return [
      await this.getPromptMessageContext(message),
      messageText?.length && `${message.author.username}: ${messageText}`,
      `${this.discordService.username}:`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private;

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
