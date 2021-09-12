import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

const MAX_TOKENS = 100;

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
    max_tokens: MAX_TOKENS,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
  };

  public getCompletion(
    prompt: string,
    stop: string[],
  ): Promise<AxiosResponse<CompletionResponse>> {
    return firstValueFrom(
      this.httpService.post('/completions', {
        ...this.defaultCompletionOptions,
        prompt,
        stop,
      }),
    );
  }
}
