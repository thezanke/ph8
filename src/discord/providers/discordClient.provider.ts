import { ConfigService } from '@nestjs/config';
import { Client, Intents } from 'discord.js';
import { EnvironmentVariables } from '../../config/validate';

export const DISCORD_CLIENT = 'DISCORD_CLIENT';

export const discordClientProvider = {
  provide: DISCORD_CLIENT,
  useFactory(configService: ConfigService<EnvironmentVariables>) {
    const client = new Client({
      intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      ],
    });
    client.login(configService.get('DISCORD_BOT_TOKEN'));

    return client;
  },
  inject: [ConfigService],
};
