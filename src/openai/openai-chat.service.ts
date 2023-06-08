import { Inject, Injectable, Logger } from '@nestjs/common';
import { stripIndent } from 'common-tags';
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  OpenAIApi,
} from 'openai';

type CreateChatCompletionRequestDefaultOptions =
  Partial<CreateChatCompletionRequest> &
    Pick<CreateChatCompletionRequest, 'model'>;

const defaultRequestOptions: CreateChatCompletionRequestDefaultOptions = {
  model: 'gpt-4-0314',
  presence_penalty: 0.6,
  temperature: 0.9,
};

@Injectable()
export class OpenAIChatService {
  @Inject(OpenAIApi)
  private readonly api: OpenAIApi;
  private readonly logger = new Logger(OpenAIChatService.name);

  private createCompletionMessage = (
    role: ChatCompletionRequestMessage['role'],
    content: ChatCompletionRequestMessage['content'],
    name?: ChatCompletionRequestMessage['name'],
  ): ChatCompletionRequestMessage => {
    return { role, content, name };
  };

  public createUserMessage = (
    content: ChatCompletionRequestMessage['content'],
    name?: ChatCompletionRequestMessage['name'],
  ) => {
    return this.createCompletionMessage('user', content, name);
  };

  public createSystemMessage = (
    content: ChatCompletionRequestMessage['content'],
  ) => {
    return this.createCompletionMessage('system', content);
  };

  public createAssistantMessage = (
    content: ChatCompletionResponseMessage['content'],
  ): ChatCompletionResponseMessage => {
    return this.createCompletionMessage('assistant', content);
  };

  public async getCompletion(
    messages: ChatCompletionRequestMessage[],
    maxTokens: number,
  ): Promise<CreateChatCompletionResponse> {
    const chatCompletionRequest: CreateChatCompletionRequest = {
      ...defaultRequestOptions,
      max_tokens: maxTokens,
      messages,
    };

    this.logger.verbose(
      `Requesting Chat Completion: ${JSON.stringify(chatCompletionRequest)}`,
    );

    try {
      const response = await this.api.createChatCompletion({
        ...defaultRequestOptions,
        max_tokens: maxTokens,
        messages,
      });

      const { data } = response;

      this.logger.verbose(`Completion Response: ${JSON.stringify(data)}`);

      return data;
    } catch (e) {
      if (e.response) {
        this.logger.error(
          stripIndent(`
            Chat Completion Error Response:
              Status: ${e.response.status}
              Data: ${JSON.stringify(e.response.data)}
          `),
        );
      } else {
        this.logger.error(`Chat Completion Error: ${e.message}`);
      }

      throw e;
    }
  }
}
