import { Injectable } from '@nestjs/common';
import { Context, ContextOf, On } from 'necord';

@Injectable()
export class DiscordService {
  @On('messageCreate')
  public async onMessageCreate(
    @Context() [message]: ContextOf<'messageCreate'>,
  ) {
    if (message.author.bot) return;

    console.log(message.content);

    await message.react('🤣');
  }
}
