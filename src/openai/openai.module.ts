import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OpenAIChatService } from './openai-chat.service';
import { OpenAIModerationService } from './openai-moderation.service';
import { openaiProvider } from './openai.provider';

@Module({
  imports: [ConfigModule],
  providers: [openaiProvider, OpenAIChatService, OpenAIModerationService],
  exports: [OpenAIChatService, OpenAIModerationService],
})
export class OpenAIModule {}
