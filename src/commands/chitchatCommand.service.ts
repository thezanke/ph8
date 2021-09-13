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

  public humanPrompt = this.configService.get<string>(
    'GPT3_HUMAN_PROMPT',
    'human:',
  );
  public botPrompt = this.configService.get<string>('GPT3_BOT_PROMPT', 'bot:');
  public startingPrompt = this.configService.get<string>(
    'GPT3_STARTING_PROMPT',
    'Discussion between a human and a chat bot.\n\nhuman: ',
  );
  public otherPrompt = 'Somebody:';

  private logger = new Logger(ChitchatCommandService.name);

  private readonly messageContextLimit = Number(
    this.configService.get('CHITCHAT_MESSAGE_CONTEXT_LIMIT', '5'),
  );

  public gptChitchatMaxTokens = Number(
    this.configService.get<string>('CHITCHAT_GPT_MAX_TOKENS', '60'),
  );

  @OnEvent(DISCORD_EVENTS.messageCreate)
  async handleMessage(message: Message) {
    if (!message.reference) return;

    const lastMessage = await message.fetchReference();

    if (lastMessage.author.id !== this.discordService.userId) return;

    if (!this.configService.get('ENABLE_GPT3', false)) {
      message.reply(`sorry, I'm not my self right now...`);
      return;
    }

    return this.handleGptChitchat(message, message.cleanContent.trim());
  }

  private async handleGptChitchat(message: Message, humanPromptText?: string) {
    try {
      const prompt = [
        await this.getPromptMessageContext(message),
        humanPromptText?.length && `${this.humanPrompt} ${humanPromptText}`,
        this.botPrompt,
      ]
        .filter(Boolean)
        .join('\n');

      this.logger.debug('Requesting GPT3 Completion:\n' + prompt);

      const response = await this.gptService.getCompletion(
        prompt,
        [`/n`, this.humanPrompt, this.botPrompt, this.otherPrompt],
        60,
      );

      const responseMessage = this.getCompletionResponseMessage(response.data);
      this.logger.debug('GPT3 Response:\n' + responseMessage);

      const [finalResponse, ...discarded] =
        responseMessage.split(/(\r?\n\s*){2,}/);
      if (discarded.length) {
        this.logger.debug(
          `Discarded response: ${JSON.stringify(discarded, null, 2)}`,
        );
      }

      message.reply(finalResponse);
    } catch (e) {
      this.logger.error(e);
      if (e.response?.status === 429) {
        message.reply('Out of credits... Please insert token.');
        return;
      }
      message.reply('That one hurt my brain..');
    }
  }

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

  private getCompletionResponseMessage(response: CompletionResponse) {
    if (!response.choices.length) return '??';

    const responseMessageChoice = response?.choices[0]?.text;

    return responseMessageChoice.replace('@', '').trim();
  }

  private async getPromptMessageContext(message: Message) {
    const promptMessageHistory = await this.buildPromptMessageHistory(message);
    const prompt = [this.startingPrompt, ...promptMessageHistory].join('\n');

    return prompt;
  }

  private async buildPromptMessageHistory(message: Message) {
    const messageHistory: string[] = [];

    let lastMessage = message;

    while (
      messageHistory.length < this.messageContextLimit &&
      lastMessage.reference
    ) {
      lastMessage = await lastMessage.fetchReference();

      let userPrompt = this.otherPrompt;

      const isBotAuthor = lastMessage.author.id === this.discordService.userId;
      if (isBotAuthor) userPrompt = this.botPrompt;

      const isFocusAuthor = lastMessage.author.id === message.author.id;
      if (isFocusAuthor) userPrompt = this.humanPrompt;

      messageHistory.unshift(`${userPrompt} ${lastMessage.cleanContent}`);
    }

    return messageHistory;
  }
}
