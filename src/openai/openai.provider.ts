import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EnvironmentVariables } from '../config/validate';

export const OpenAIProvider = {
  provide: OpenAI,
  useFactory: (configService: ConfigService<EnvironmentVariables>) => {
    return new OpenAI({
      apiKey: configService.get('GPT_API_SECRET'),
    });
  },
  inject: [ConfigService],
};
