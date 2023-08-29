import { Injectable, Logger } from '@nestjs/common';
import { stripIndent } from 'common-tags';
import OpenAI from 'openai';

const defaultRequestOptions: Partial<OpenAI.ModerationCreateParams> = {
  model: 'text-moderation-latest',
};

@Injectable()
export class OpenAIModerationService {
  constructor(private readonly openai: OpenAI) {}

  private readonly logger = new Logger(OpenAIModerationService.name);

  public async validateInput(input: OpenAI.ModerationCreateParams['input']) {
    const moderationRequest: OpenAI.ModerationCreateParams = {
      ...defaultRequestOptions,
      input,
    };

    this.logger.verbose(
      `Requesting Moderation: ${JSON.stringify(moderationRequest)}`,
    );

    try {
      const response = await this.openai.moderations.create(moderationRequest);

      const isValidContent = response.results.every(
        (result) => !result.flagged,
      );

      this.logger.verbose(`Moderation Response: ${JSON.stringify(response)}`);

      return isValidContent;
    } catch (e) {
      if (e instanceof OpenAI.APIError) {
        this.logger.error(stripIndent`
          Moderation Error Response:
            Status: ${e.status}
            Message: ${JSON.stringify(e.message)}
        `);

        return;
      }

      this.logger.error(`Moderation Error: ${(e as Error).message}`);

      throw e;
    }
  }
}
