import { ConfigService } from '@nestjs/config';
import { Client } from 'discord.js';
import { EnvironmentVariables } from '../../config/validate';

export const DISCORD_CLIENT = 'DISCORD_CLIENT';

export const discordClientProvider = {
  provide: DISCORD_CLIENT,
  useFactory(configService: ConfigService<EnvironmentVariables>) {
    const client = new Client({
      intents: [
        'DirectMessages',
        'Guilds',
        'GuildMessages',
        'GuildMessageReactions',
        'MessageContent',
      ],
    });

    client.login(configService.get('DISCORD_BOT_TOKEN'));

    return client;
  },
  inject: [ConfigService],
};
