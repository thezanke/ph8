import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Context, ContextOf, On } from 'necord';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  @Inject('PH8_SERVICE')
  private readonly ph8: ClientProxy;

  @On('messageCreate')
  public async onMessageCreate(
    @Context() [message]: ContextOf<'messageCreate'>,
  ) {
    if (message.author.bot) return;

    let log = '';
    let isDM = false;
    if (message.guild) {
      log += `[${message.guild.name}]`;
    }

    if ('name' in message.channel) {
      log += `[#${message.channel.name}] `;
    } else {
      isDM = true;
      log += `[DM]\n`;
    }

    log += `${message.author.displayName}: ${message.content}`;

    if (isDM) {
      const response = await firstValueFrom(
        this.ph8.send<string>({ cmd: 'chat' }, message.content),
      );

      if (response) {
        log += `\nph8: ${response}`;
        await message.reply(response);
      }
    }

    this.logger.verbose(log);
  }
}
