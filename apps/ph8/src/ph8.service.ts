import { Inject, Injectable } from '@nestjs/common';
import { OpenAIService } from './openai/openai.service';

@Injectable()
export class Ph8Service {
  @Inject()
  private readonly openaiService: OpenAIService;

  chat(content: string) {
    return this.openaiService.createChatCompletion({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'given a chat history, respond to the most recent message succinctly',
        },
        { role: 'user', content },
      ],
      temperature: 0.8,
    });
  }
}
