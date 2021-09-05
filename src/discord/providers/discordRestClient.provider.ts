import { REST } from '@discordjs/rest';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/validate';

const REST_API_VERSION = '9';

export const DISCORD_REST_CLIENT = 'DISCORD_REST_CLIENT';

export const discordRestClientProvider = {
  provide: DISCORD_REST_CLIENT,
  useFactory(configService: ConfigService<EnvironmentVariables>) {
    return new REST({ version: REST_API_VERSION }).setToken(configService.get('DISCORD_BOT_TOKEN', ''));
  },
  inject: [ConfigService],
};
