import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Context, ContextOf, On } from 'necord';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DiscordService {
  @Inject('PH8_SERVICE')
  private readonly ph8: ClientProxy;

  @On('messageCreate')
  public async onMessageCreate(
    @Context() [message]: ContextOf<'messageCreate'>,
  ) {
    if (message.author.bot) return;

    let log = '';
    if (message.guild) {
      log += `[${message.guild.name}]`;
    }

    if ('name' in message.channel) {
      log += `[#${message.channel.name}]`;
    } else {
      log += `[DM]`;
    }

    if (log) log += ' ';

    log += `@${message.author.displayName}: ${message.content}`;

    const response = await firstValueFrom(
      this.ph8.send<string>({ cmd: 'chat' }, message.content),
    );

    if (response) {
      log += `\n> ${response}`;
      await message.reply(response);
    }
  }
}
