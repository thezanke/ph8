import OpenAI from 'openai';

export function createCompletionRequestMessage(
  role: OpenAI.Chat.CreateChatCompletionRequestMessage['role'],
  content: OpenAI.Chat.CreateChatCompletionRequestMessage['content'],
  name?: OpenAI.Chat.CreateChatCompletionRequestMessage['name'],
): OpenAI.Chat.CreateChatCompletionRequestMessage {
  return { role, content, name };
}
