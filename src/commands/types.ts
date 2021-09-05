import { Message } from 'discord.js';

export interface Command {
  commandName: string;
  execute(message: Message, ...args: any[]): Promise<void> | void;
}
