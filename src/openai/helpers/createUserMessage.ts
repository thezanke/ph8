import OpenAI from 'openai';
import { createCompletionRequestMessage } from './createCompletionRequestMessage';

export function createUserMessage(
  content: OpenAI.Chat.CreateChatCompletionRequestMessage['content'],
  name?: OpenAI.Chat.CreateChatCompletionRequestMessage['name'],
) {
  return createCompletionRequestMessage('user', content, name);
}
