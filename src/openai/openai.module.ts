import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIChatService } from './openai-chat.service';
import { OpenAIModerationService } from './openai-moderation.service';
import { OpenAIProvider } from './openai.provider';

@Module({
  imports: [ConfigModule],
  providers: [OpenAIProvider, OpenAIChatService, OpenAIModerationService],
  exports: [OpenAIChatService],
})
export class OpenAIModule {}
