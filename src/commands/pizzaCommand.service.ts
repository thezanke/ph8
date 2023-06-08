import { Injectable } from '@nestjs/common';
import { Message } from 'discord.js';

import { CommandsService } from './commands.service';
import { Command } from './types/Command';

@Injectable()
export class PizzaCommandService implements Command {
  public commandName = 'pizza';

  constructor(commandsService: CommandsService) {
    commandsService.registerCommand(this);
  }

  public execute(message: Message) {
    message.reply(`https://www.toasttab.com/apostrophefoods`);
  }
}
