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
    presence_penalty: 0.6,
    temperature: 0.9,
  };

  public async getCompletion(
    message: ChatCompletionRequestMessage,
    messageHistory: ChatCompletionRequestMessage[],
    maxTokens: number,
  ): Promise<CreateChatCompletionResponse> {
    try {
      const response = await this.api.createChatCompletion({
        model: 'gpt-4-0314',
        messages: [...messageHistory, message],
        ...this.defaultCompletionOptions,
        max_tokens: maxTokens,
      });

      return response.data;
    } catch (e) {
      console.error(e);

      if (e.response?.data?.error) console.error(e.response.data.error);

      throw e;
    }
  }
}
