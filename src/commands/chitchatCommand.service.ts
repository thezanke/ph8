import { Injectable } from '@nestjs/common';
import { Message } from 'discord.js';
import { CommandsService } from './commands.service';
import { Command } from './types';

@Injectable()
export class ChitchatCommandService implements Command {
  public commandName = 'chitchat';

  constructor(commandsService: CommandsService) {
    commandsService.registerCommand(this);
  }

  public execute(message: Message) {
    message.reply('yeah bud?');
  }
}
