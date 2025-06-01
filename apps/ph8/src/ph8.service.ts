import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { OpenaiService } from './openai/openai.service';

@Injectable()
export class Ph8Service {
  @Inject()
  private readonly openaiService: OpenaiService

  getHello() {
    return this.openaiService.createChatCompletion({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: 'Hello, world!' }],
      max_tokens: 50,
      temperature: 0.7,
    });
  }
}
