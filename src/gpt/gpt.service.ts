import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

import { EnvironmentVariables } from '../config/validate';

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
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  public startingPrompt = this.configService.get(
    'GPT3_STARTING_PROMPT',
    'Discussion between a human and a chat bot.\n\nhuman: ',
  );
  public humanPrompt = this.configService.get('GPT3_HUMAN_PROMPT', 'human:');
  public botPrompt = this.configService.get('GPT3_BOT_PROMPT', 'bot:');

  private logger = new Logger(GptService.name);

  private defaultCompletionOptions = {
    temperature: 0.9,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
    stop: ['/n', this.humanPrompt, this.botPrompt],
  };

  public getCompletion(
    prompt: string,
  ): Promise<AxiosResponse<CompletionResponse>> {
    this.logger.debug(`Requesting completion:\n${prompt}`);

    return firstValueFrom(
      this.httpService.post('/completions', {
        ...this.defaultCompletionOptions,
        prompt,
      }),
    );
  }
}
