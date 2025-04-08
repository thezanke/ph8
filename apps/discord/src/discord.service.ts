import { Injectable } from '@nestjs/common';
import { Message } from 'discord.js';

@Injectable()
export class DiscordService {
  async handleMessage(message: Message) {
    console.log(message);
    return 'hello';
  }
}
