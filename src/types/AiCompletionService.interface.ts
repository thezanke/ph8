export interface AiCompletionService<
  T = unknown,
  U = unknown,
  V extends any[] = unknown[],
> {
  createUserMessage: (...args: V) => U | Promise<U>;
  createAssistantMessage: (...args: V) => U | Promise<U>;
  createSystemMessage: (...args: V) => U | Promise<U>;
  getCompletion: (prompt: T) => Promise<string> | string;
}
