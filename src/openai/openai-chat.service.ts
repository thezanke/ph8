import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { stripIndent } from 'common-tags';
import OpenAI from 'openai';
import { filterMap } from '../helpers/filterMap';
import { OpenAIModerationService } from './openai-moderation.service';

const defaultRequestOptions: Partial<OpenAI.Chat.CompletionCreateParamsNonStreaming> &
  Pick<OpenAI.Chat.CompletionCreateParams, 'model'> = {
  model: 'gpt-4',
  presence_penalty: 0.6,
  temperature: 0.9,
};

@Injectable()
export class OpenAIChatService {
  constructor(
    private readonly configService: ConfigService,
    private readonly moderationService: OpenAIModerationService,
    private readonly openai: OpenAI,
  ) {}

  private readonly logger = new Logger(OpenAIChatService.name);

  private readonly gptChitchatMaxTokens = parseInt(
    this.configService.get<string>('GPT_CHITCHAT_MAX_TOKENS', '1000'),
    10,
  );

  private readonly gptChitchatModel = this.configService.get<string>(
    'GPT_CHITCHAT_MODEL',
    defaultRequestOptions.model,
  );

  public async getCompletion(
    messages: OpenAI.Chat.CreateChatCompletionRequestMessage[],
  ) {
    const isValidContent = await this.moderationService.validateInput(
      filterMap(
        messages,
        (message) => !!message.content,
        (message) => message.content as string,
      ),
    );

    if (!isValidContent) {
      this.logger.verbose('Failed moderation; sending fallback response.');

      return 'uh, b&.';
    }

    const chatCompletionRequest: OpenAI.Chat.CompletionCreateParamsNonStreaming =
      {
        ...defaultRequestOptions,
        model: this.gptChitchatModel,
        max_tokens: this.gptChitchatMaxTokens,
        messages,
      };

    this.logger.verbose(
      `Requesting Completion: ${JSON.stringify(chatCompletionRequest)}`,
    );

    try {
      const response = await this.openai.chat.completions.create(
        chatCompletionRequest,
      );

      this.logger.verbose(`Completion Result: ${JSON.stringify(response)}`);

      const [choice] = response.choices;
      const choiceMessageContent = choice.message?.content;

      if (!choiceMessageContent) {
        throw new Error('No response message for choice');
      }

      return choiceMessageContent;
    } catch (e) {
      if (e.response) {
        this.logger.error(stripIndent`
          Chat Completion Error Response:
            Status: ${e.response.status}
            Data: ${JSON.stringify(e.response.data)}
        `);
      } else {
        this.logger.error(`Chat Completion Error: ${e.message}`);
      }

      throw e;
    }
  }
}
