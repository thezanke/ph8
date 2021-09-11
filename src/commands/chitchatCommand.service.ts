import { Injectable } from '@nestjs/common';
import { Message } from 'discord.js';

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
  ) {
    commandsService.registerCommand(this);
  }

  public async execute(message: Message) {
    const response = await this.gptService.getCompletion();
  }
}
