import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from 'langchain/chat_models/openai';

import { EnvironmentVariables } from '../config/validate';

export const langchainProvider = {
  provide: ChatOpenAI,
  useFactory: (configService: ConfigService<EnvironmentVariables>) => {
    const configuration = {
      openAIApiKey: configService.get('GPT_API_SECRET'),
    };

    return new ChatOpenAI(configuration);
  },
  inject: [ConfigService],
};
