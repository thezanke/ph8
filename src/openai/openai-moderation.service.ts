import { Inject, Injectable, Logger } from '@nestjs/common';
import { stripIndent } from 'common-tags';
import { OpenAIApi } from 'openai';

const defaultRequestOptions = {
  model: 'text-moderation-latest',
};

@Injectable()
export class OpenAIModerationService {
  @Inject(OpenAIApi)
  private readonly api: OpenAIApi;
  private readonly logger = new Logger(OpenAIModerationService.name);

  public async validateInput(input: string[] | string) {
    const moderationRequest = {
      ...defaultRequestOptions,
      input,
    };

    this.logger.verbose(
      `Requesting Moderation: ${JSON.stringify(moderationRequest)}`,
    );

    try {
      const response = await this.api.createModeration(moderationRequest);

      const isValidContent = response.data.results.every(
        (result) => !result.flagged,
      );

      if (!isValidContent) {
        this.logger.verbose(
          `Moderation Failure Response: ${JSON.stringify(response.data)}`,
        );
      }

      return isValidContent;
    } catch (e) {
      if (e.response) {
        this.logger.error(
          stripIndent(`
            Moderation Error Response:
              Status: ${e.response.status}
              Data: ${JSON.stringify(e.response.data)}
          `),
        );
      } else {
        this.logger.error(`Moderation Error: ${e.message}`);
      }

      throw e;
    }
  }
}
