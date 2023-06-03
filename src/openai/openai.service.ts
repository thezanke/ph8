import { Inject, Injectable } from '@nestjs/common';
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
  OpenAIApi,
} from 'openai';

export type CompletionResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    text: string;
    index: number;
    logprobs: unknown;
    finish_reason: string;
  }>;
};

@Injectable()
export class OpenAIService {
  @Inject(OpenAIApi)
  private readonly api: OpenAIApi;

  private defaultCompletionOptions = {
    model: 'gpt-4-0314',
    presence_penalty: 0.6,
    temperature: 0.9,
  };

  public async getCompletion(
    messages: ChatCompletionRequestMessage[],
    maxTokens: number,
  ): Promise<CreateChatCompletionResponse> {
    try {
      const response = await this.api.createChatCompletion({
        ...this.defaultCompletionOptions,
        max_tokens: maxTokens,
        messages,
      });

      return response.data;
    } catch (e) {
      console.error(e);

      if (e.response?.data?.error) console.error(e.response.data.error);

      throw e;
    }
  }
}
