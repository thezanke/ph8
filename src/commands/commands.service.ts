import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';
import { DISCORD_EVENTS } from '../discord/constants';
import { Command } from './types';

const BOT_NAME = 'ph8';
const DEFAULT_COMMAND = 'chitchat';
const UNKNOWN_COMMAND = 'unknown';

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);
  private readonly commands: Record<string, Command> = {};

  @OnEvent(DISCORD_EVENTS.messageCreate)
  public async handleMessage(message: Message) {
    if (!this.determineIfCommand(message.content)) return;
    await this.handleCommand(message);
  }

  public registerCommand(command: Command) {
    this.commands[command.commandName] = command;
    this.logger.log(`"${command.commandName}" command registered`);
  }

  private determineIfCommand(messageContent: string) {
    return new RegExp(`^!?${BOT_NAME},?`).test(messageContent);
  }

  private getCommand(commandName = DEFAULT_COMMAND) {
    return this.commands[commandName] || this.commands[UNKNOWN_COMMAND];
  }

  private getCommandNameAndArgs(messageContent: string) {
    const [, commandName = DEFAULT_COMMAND, ...args] = messageContent.split(/ +/);
    return [commandName, args] as [string, string[]];
  }

  private async handleCommand(message: Message) {
    const [commandName, args] = this.getCommandNameAndArgs(message.content);

    const command = this.getCommand(commandName);
    if (!command) return;

    this.logCommand(command.commandName, message.author.username, args);
    await command.execute(message, ...args);
  }

  private logCommand(commandName: string, username: string, args: string[]) {
    this.logger.log(`${username} executed ${commandName} command${args.length ? `, args: ${args.join(',')}` : ''}`);
  }
}
