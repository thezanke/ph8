import { Injectable } from '@nestjs/common';
import { Message } from 'discord.js';

import { CommandsService } from './commands.service';
import { Command } from './types';

@Injectable()
export class GoogleCommandService implements Command {
  public commandName = 'google';

  constructor(commandsService: CommandsService) {
    commandsService.registerCommand(this);
  }

  public execute(message: Message, ...words) {
    if (!words.length) return this.replyWithDefaultMessage(message);

    const searchPhrase = encodeURIComponent(words.join(' '));
    message.reply(
      `Ugh, you're so lazy...\nhttps://www.google.com/search?q=${searchPhrase}&btnI`,
    );
  }

  private replyWithDefaultMessage(message: Message) {
    message.reply('Google what?');
  }
}
