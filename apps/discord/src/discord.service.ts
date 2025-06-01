import { Injectable } from '@nestjs/common';
import { DMChannel } from 'discord.js';
import { Context, ContextOf, On } from 'necord';

@Injectable()
export class DiscordService {
  @On('messageCreate')
  public async onMessageCreate(
    @Context() [message]: ContextOf<'messageCreate'>,
  ) {
    if (message.author.bot) return;

    let log = '';
    if (message.guild) {
      log += `[${message.guild.name}]`;
    }

    if ('name' in message.channel)  {
      log += `[#${message.channel.name}]`;
    } else {
      log += `[DM]`;
    }
    
    if (log) log += ' ';

    log += `@${message.author.displayName}: ${message.content}`;

    console.log(log);
  }
}
