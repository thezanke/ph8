import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EnvironmentVariables } from '../config/validate';
import { GptService } from './gpt.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => {
        const baseURL = configService.get('GPT3_API_BASE_URL', '');
        const apiSecret = configService.get('GPT3_API_SECRET', '');

        return {
          baseURL,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiSecret}`,
          },
        };
      },
    }),
  ],
  providers: [GptService],
  exports: [GptService],
})
export class GptModule {}
