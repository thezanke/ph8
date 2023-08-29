import OpenAI from 'openai';
import { createCompletionRequestMessage } from './createCompletionRequestMessage';

export function createAssistantMessage(
  content: OpenAI.Chat.CreateChatCompletionRequestMessage['content'],
) {
  return createCompletionRequestMessage('assistant', content);
}
