import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';

import { DISCORD_EVENTS } from '../discord/constants';
import { DiscordService } from '../discord/discord.service';
import { GptService } from '../gpt/gpt.service';
import { CommandsService } from './commands.service';
import { Command } from './types';

@Injectable()
export class ChitchatCommandService implements Command {
  public commandName = 'chitchat';
  public omitFromListing = true;

  constructor(
    commandsService: CommandsService,
    private readonly gptService: GptService,
    private readonly discordService: DiscordService,
  ) {
    commandsService.registerCommand(this);
  }

  @OnEvent(DISCORD_EVENTS.messageCreate)
  async handleMessage(message: Message) {
    if (!message.reference) return;
    const lastMessage = await message.fetchReference();
    if (lastMessage.author.id !== this.discordService.userId) return;
    this.execute(message);
  }

  public async execute(message: Message) {
    const messageParts = message.cleanContent.split(' ');
    const [, ...promptWords] = messageParts;
    const prompt = [
      await this.getPromptMessageContext(message),
      `${this.gptService.humanPrompt} ${promptWords.join(' ')}`,
      this.gptService.botPrompt,
    ].join('\n');

    const response = await this.gptService.getCompletion(prompt);

    message.reply(response.data?.choices[0]?.text ?? '??');
  }

  private async getPromptMessageContext(message: Message) {
    const promptMessageHistory = await this.buildPromptMessageHistory(message);
    const prompt = [
      this.gptService.startingPrompt,
      ...promptMessageHistory,
    ].join('\n');

    return prompt;
  }

  private async buildPromptMessageHistory(message: Message) {
    const messageHistory: string[] = [];

    let lastMessage = message;

    while (lastMessage.reference) {
      lastMessage = await lastMessage.fetchReference();
      const wasAuthor = lastMessage.author.id === this.discordService.userId;
      const userPrompt = wasAuthor
        ? this.gptService.botPrompt
        : this.gptService.humanPrompt;

      messageHistory.unshift(`${userPrompt} ${lastMessage.cleanContent}`);
    }

    return messageHistory;
  }
}
