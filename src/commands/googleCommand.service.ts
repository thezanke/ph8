import { Injectable } from '@nestjs/common';
import { Message } from 'discord.js';

import { CommandsService } from './commands.service';
import { CommandService } from './types';

@Injectable()
export class GoogleCommandService implements CommandService {
  public commandName = 'google';

  constructor(commandsService: CommandsService) {
    commandsService.registerCommand(this);
  }

  public execute(message: Message, ...words) {
    if (!words.length) return this.replyWithDefaultMessage(message);

    const searchPhrase = encodeURIComponent(words.join(' '));
    message.reply(`Ugh, you're so lazy...\nhttps://www.google.com/search?q=${searchPhrase}&btnI`);
  }

  replyWithDefaultMessage(message: Message) {
    message.reply('Google what?');
  }
}
