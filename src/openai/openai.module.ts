import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { openaiProvider } from './openai.provider';
import { OpenAIService } from './openai.service';

@Module({
  imports: [ConfigModule],
  providers: [openaiProvider, OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
