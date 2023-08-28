import { Module } from '@nestjs/common';
import { DiscordModule } from '../discord/discord.module';
import { OpenAIModule } from '../openai/openai.module';
import { ChatService } from './chat.service';

@Module({
  imports: [DiscordModule, OpenAIModule],
  providers: [ChatService],
})
export class ChatModule {}
