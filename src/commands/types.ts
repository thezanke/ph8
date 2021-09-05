import { Message } from 'discord.js';

export interface Command {
  commandName: string;
  execute(message: Message, ...args: string[]): Promise<void> | void;
}
