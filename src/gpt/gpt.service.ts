import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

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
export class GptService {
  constructor(private readonly httpService: HttpService) {}

  private defaultCompletionOptions = {
    temperature: 0.9,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
  };

  public getCompletion(
    prompt: string,
    stop: string[],
    maxTokens: number,
  ): Promise<AxiosResponse<CompletionResponse>> {
    return firstValueFrom(
      this.httpService.post('/completions', {
        ...this.defaultCompletionOptions,
        prompt,
        stop,
        max_tokens: maxTokens,
      }),
    );
  }
}
