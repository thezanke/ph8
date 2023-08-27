import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIChatService } from './openai-chat.service';
import { OpenAIModerationService } from './openai-moderation.service';
import { OpenAIProvider } from './openai.provider';
import { OpenAIService } from './openai.service';

@Module({
  imports: [ConfigModule],
  providers: [
    OpenAIProvider,
    OpenAIService,
    OpenAIChatService,
    OpenAIModerationService,
  ],
  exports: [OpenAIService],
})
export class OpenAIModule {}
