import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GptService {
  constructor(private readonly httpService: HttpService) {}

  public getCompletion(prompt: string): Promise<AxiosResponse<unknown>> {
    return firstValueFrom(
      this.httpService.post('/completions', { prompt, max_tokens: 50 }),
    );
  }
}
