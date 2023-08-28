import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { EnvironmentVariables } from '../../config/validate';

export const DISCORD_CLIENT = 'DISCORD_CLIENT';

export const discordClientProvider = {
  provide: DISCORD_CLIENT,
  useFactory(configService: ConfigService<EnvironmentVariables>) {
    const client = new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
      ],
    });

    client.login(configService.get('DISCORD_BOT_TOKEN'));

    return client;
  },
  inject: [ConfigService],
};
