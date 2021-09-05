import { Injectable } from '@nestjs/common';
import { Message } from 'discord.js';

import { CommandsService } from './commands.service';
import { CommandService } from './types';

@Injectable()
export class UnknownCommandService implements CommandService {
  public commandName = 'unknown';
  public omitFromListing = true;

  constructor(commandsService: CommandsService) {
    commandsService.registerCommand(this);
  }

  public execute(message: Message) {
    message.reply("I'm not sure what that means m8.");
  }
}
