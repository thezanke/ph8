import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/index';

@Injectable()
export class OpenaiService {
  client = new OpenAI();

  async createChatCompletion(body: ChatCompletionCreateParamsNonStreaming) {
    const res = await this.client.chat.completions.create(body);

    return res.choices[0]?.message?.content ?? '';
  }
}
