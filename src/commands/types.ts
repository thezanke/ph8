import { Message } from 'discord.js';

export interface Command {
  commandName: string;

  /* if true, command will be omitted from commands list reply */
  omitFromListing?: boolean;

  execute(message: Message, ...args: string[]): Promise<void> | void;
}
