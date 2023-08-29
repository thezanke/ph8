import OpenAI from 'openai';
import { createCompletionRequestMessage } from './createCompletionRequestMessage';

export function createSystemMessage(
  content: OpenAI.Chat.CreateChatCompletionRequestMessage['content'],
) {
  return createCompletionRequestMessage('system', content);
}
