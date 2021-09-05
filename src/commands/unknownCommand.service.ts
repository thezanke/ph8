import { Injectable } from '@nestjs/common';
import { Message } from 'discord.js';

import { CommandsService } from './commands.service';
import { Command } from './types';

@Injectable()
export class UnknownCommandService implements Command {
  public commandName = 'unknown';

  constructor(commandsService: CommandsService) {
    commandsService.registerCommand(this);
  }

  public execute(message: Message) {
    message.reply("I'm not sure what that means m8.");
  }
}
