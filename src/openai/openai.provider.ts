import { ConfigService } from '@nestjs/config';
import { Configuration, OpenAIApi } from 'openai';

import { EnvironmentVariables } from '../config/validate';

export const openaiProvider = {
  provide: OpenAIApi,
  useFactory: (configService: ConfigService<EnvironmentVariables>) => {
    const configuration = new Configuration({
      apiKey: configService.get('GPT_API_SECRET'),
    });

    return new OpenAIApi(configuration);
  },
  inject: [ConfigService],
};
