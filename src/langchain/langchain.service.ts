import { Inject, Injectable, Logger } from '@nestjs/common';
import { stripIndent } from 'common-tags';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import {
  AIChatMessage,
  BaseChatMessage,
  HumanChatMessage,
  SystemChatMessage,
} from 'langchain/schema';

import { AiCompletionService } from '../types/AiCompletionService.interface';

@Injectable()
export class LangchainService implements AiCompletionService {
  @Inject(ChatOpenAI)
  private readonly ai: ChatOpenAI;

  private readonly logger = new Logger(LangchainService.name);

  public createAssistantMessage(content: string) {
    return new AIChatMessage(content);
  }

  public createSystemMessage(content: string) {
    return new SystemChatMessage(content);
  }

  public createUserMessage(content: string, name?: string) {
    const message = new HumanChatMessage(content);
    message.name = name;

    return message;
  }

  public async getCompletion(prompt: BaseChatMessage[]) {
    this.logger.log(`Requesting Completion: ${JSON.stringify(prompt)}`);

    try {
      const result = await this.ai.call(prompt);

      this.logger.verbose(`Completion Result: ${JSON.stringify(result)}`);

      return result.text;
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
