import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { openaiProvider } from './openai.provider';
import { OpenAIChatService } from './openai-chat.service';
import { OpenAIModerationService } from './openai-moderation.service';

@Module({
  imports: [ConfigModule],
  providers: [openaiProvider, OpenAIChatService, OpenAIModerationService],
  exports: [OpenAIChatService, OpenAIModerationService],
})
export class OpenAIModule {}
