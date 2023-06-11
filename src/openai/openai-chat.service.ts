import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { stripIndent } from 'common-tags';
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  CreateChatCompletionRequest,
  OpenAIApi,
} from 'openai';

import { AiChatService } from '../types/AiChatSerivce.interface';

const defaultRequestOptions: Partial<CreateChatCompletionRequest> &
  Pick<CreateChatCompletionRequest, 'model'> = {
  model: 'gpt-4-0314',
  presence_penalty: 0.6,
  temperature: 0.9,
};

@Injectable()
export class OpenAIChatService implements AiChatService {
  constructor(private readonly configService: ConfigService) {}

  @Inject(OpenAIApi)
  private readonly api: OpenAIApi;

  private readonly logger = new Logger(OpenAIChatService.name);

  private readonly gptChitchatMaxTokens = parseInt(
    this.configService.get<string>('GPT_CHITCHAT_MAX_TOKENS', '1000'),
    10,
  );

  private createCompletionMessage = (
    role: ChatCompletionRequestMessage['role'],
    content: ChatCompletionRequestMessage['content'],
    name?: ChatCompletionRequestMessage['name'],
  ): ChatCompletionRequestMessage => {
    return { role, content, name };
  };

  public createUserMessage = (content, name?) => {
    return this.createCompletionMessage('user', content, name);
  };

  public createSystemMessage = (
    content: ChatCompletionRequestMessage['content'],
  ) => {
    return this.createCompletionMessage('system', content);
  };

  public createAssistantMessage = (
    content: ChatCompletionResponseMessage['content'],
  ) => {
    return this.createCompletionMessage('assistant', content);
  };

  public async getCompletion(messages: ChatCompletionRequestMessage[]) {
    const chatCompletionRequest: CreateChatCompletionRequest = {
      ...defaultRequestOptions,
      max_tokens: this.gptChitchatMaxTokens,
      messages,
    };

    this.logger.verbose(
      `Requesting Chat Completion: ${JSON.stringify(chatCompletionRequest)}`,
    );

    try {
      const response = await this.api.createChatCompletion({
        ...defaultRequestOptions,
        max_tokens: this.gptChitchatMaxTokens,
        messages,
      });

      const { data } = response;

      this.logger.verbose(`Completion Response: ${JSON.stringify(data)}`);

      const [choice] = data.choices;
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
