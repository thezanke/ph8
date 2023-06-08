import { Message } from 'discord.js';

export interface CommandService {
  commandName: string;

  /* if true, command will be omitted from commands list reply */
  omitFromListing?: boolean;

  execute(message: Message, ...args: string[]): Promise<void> | void;
}
