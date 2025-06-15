import { Inject, Injectable } from '@nestjs/common';
import { OpenAIService } from './openai/openai.service';

@Injectable()
export class Ph8Service {
  @Inject()
  private readonly openaiService: OpenAIService;

  chat(messages: string[]) {
    return this.openaiService.createChatCompletion({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'given a chat history, respond to the most recent message succinctly',
        },
        ...messages.map(
          (content) =>
            ({ role: 'user', content }) as {
              role: 'user';
              content: string;
            },
        ),
      ],
      temperature: 0.8,
    });
  }
}
