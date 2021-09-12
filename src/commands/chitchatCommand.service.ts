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

const MESSAGE_CONTEXT_LIMIT = 10;

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

  private readonly logger = new Logger(ChitchatCommandService.name);

  @OnEvent(DISCORD_EVENTS.messageCreate)
  async handleMessage(message: Message) {
    if (!message.reference) return;

    const lastMessage = await message.fetchReference();

    if (lastMessage.author.id !== this.discordService.userId) return;

    this.execute(message);
  }

  public async execute(message: Message) {
    if (!this.configService.get('ENABLE_GPT3', false)) {
      message.reply(`what's up bud?`);
      return;
    }

    const messageParts = message.cleanContent.split(' ');
    const [, ...promptWords] = messageParts;
    const prompt = [
      await this.getPromptMessageContext(message),
      promptWords.length &&
        `${this.gptService.humanPrompt} ${promptWords.join(' ')}`,
      this.gptService.botPrompt,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await this.gptService.getCompletion(prompt);

    message.reply(this.getCompletionResponseMessage(response.data));
  }

  private getCompletionResponseMessage(response: CompletionResponse) {
    if (!response.choices.length) return '??';

    const responseMessageChoice = response?.choices[0]?.text;

    return responseMessageChoice.replace('@', '').trim();
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

    while (
      messageHistory.length < MESSAGE_CONTEXT_LIMIT &&
      lastMessage.reference
    ) {
      lastMessage = await lastMessage.fetchReference();

      const isBotAuthor = lastMessage.author.id === this.discordService.userId;
      const userPrompt = isBotAuthor
        ? this.gptService.botPrompt
        : this.gptService.humanPrompt;

      messageHistory.unshift(`${userPrompt} ${lastMessage.cleanContent}`);
    }

    return messageHistory;
  }
}
