import { Controller } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { Context, ContextOf, On } from 'necord';

@Controller()
export class DiscordController {
  constructor(private readonly discordService: DiscordService) {}

  @On('messageCreate')
  async onMessageCreate(@Context() [message]: ContextOf<'messageCreate'>) {
    const response = await this.discordService.handleMessage(message);

    await message.channel.send(response);
  }
}
