import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import * as rxjs from 'rxjs';

import { GptService } from './gpt.service';

const TEST_PROMPT = 'test prompt';

describe('GptService', () => {
  let gptService: GptService;
  let httpService: HttpService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [GptService],
    }).compile();

    gptService = moduleRef.get(GptService);
    httpService = moduleRef.get(HttpService);

    jest.spyOn(rxjs, 'firstValueFrom').mockImplementation();
  });

  describe('getCompletion()', () => {
    let postMock;

    beforeAll(async () => {
      postMock = jest.spyOn(httpService, 'post').mockImplementation();
      await gptService.getCompletion(TEST_PROMPT);
    });

    it('should call HttpService.post() with proper url and prompt', () => {
      expect(postMock).toHaveBeenCalledWith(
        expect.stringContaining('/completions'),
        expect.objectContaining({ prompt: TEST_PROMPT }),
      );
    });
  });
});
