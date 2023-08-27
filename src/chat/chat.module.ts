import { Module } from '@nestjs/common';
import { OpenAIModule } from '../openai/openai.module';
import { ChatService } from './chat.service';

@Module({
  imports: [OpenAIModule],
  providers: [ChatService],
})
export class ChatModule {}
