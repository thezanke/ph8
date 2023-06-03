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
    temperature: 0.85,
    top_p: 1,
    presence_penalty: 0.6,
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
      throw e;
    }
  }
}
