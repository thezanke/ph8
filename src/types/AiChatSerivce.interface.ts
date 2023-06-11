export interface AiChatService<T = unknown, U = unknown> {
  createUserMessage: (...args: unknown[]) => Promise<T> | T;
  createSystemMessage: (...args: unknown[]) => Promise<T> | T;
  createAssistantMessage: (...args: unknown[]) => Promise<T> | T;
  getCompletion: (prompt: U) => Promise<string> | string;
}
