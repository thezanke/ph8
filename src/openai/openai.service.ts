import { Injectable } from '@nestjs/common';
import { OpenAIChatService } from './openai-chat.service';
import { OpenAIModerationService } from './openai-moderation.service';

@Injectable()
export class OpenAIService {
  constructor(
    private readonly chatService: OpenAIChatService,
    private readonly moderationService: OpenAIModerationService,
  ) {}

  requestChatResponse(messages: string[]) {
    console.log(messages);
    return 'nerd';
  }
}
