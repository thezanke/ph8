import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Formatters, Message } from 'discord.js';

import { DISCORD_EVENTS } from '../discord/constants';
import { DiscordService } from '../discord/discord.service';
import { Command } from './types';

const TRIGGER = '!?ph8';
const DEFAULT_COMMAND = 'chitchat';
const UNKNOWN_COMMAND = 'unknown';

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);
  private readonly commands: Record<string, Command> = {};

  constructor(private readonly discordService: DiscordService) {}

  @OnEvent(DISCORD_EVENTS.messageCreate)
  public async handleMessage(message: Message) {
    if (!this.determineIfCommand(message.content)) return;
    await this.handleCommand(message);
  }

  public registerCommand(command: Command) {
    if (this.commands[command.commandName]) {
      this.logger.error(`"${command.commandName}" already registered.`);
      return;
    }

    this.commands[command.commandName] = command;
    this.logger.log(`"${command.commandName}" command registered`);
  }

  private checkIfStringStartsWithMention(messageContent: string) {
    if (!this.discordService.userId) return;

    return (
      messageContent.startsWith(
        Formatters.memberNicknameMention(this.discordService.userId),
      ) ||
      messageContent.startsWith(
        Formatters.userMention(this.discordService.userId),
      ) ||
      messageContent.startsWith(
        Formatters.roleMention(this.discordService.userId),
      )
    );
  }

  private determineIfCommand(messageContent: string) {
    if (this.checkIfStringStartsWithMention(messageContent)) return true;
    return new RegExp(`^${TRIGGER},?`, 'i').test(messageContent);
  }

  private getCommand(commandName = DEFAULT_COMMAND) {
    return this.commands[commandName] || this.commands[UNKNOWN_COMMAND];
  }

  private getCommandNameAndArgs(messageContent: string) {
    const parts = messageContent.split(/ +/);
    const [, commandName = DEFAULT_COMMAND, ...args] = parts;

    return [commandName.toLocaleLowerCase(), args] as [string, string[]];
  }

  private async handleCommand(message: Message) {
    const [commandName, args] = this.getCommandNameAndArgs(message.content);
    if (commandName === 'commands') return this.replyWithCommandList(message);

    const command = this.getCommand(commandName);
    if (!command) return;

    this.logCommand(command.commandName, message.author.username, args);
    await command.execute(message, ...args);
  }

  private replyWithCommandList(message: Message) {
    const commandListString = Object.values(this.commands)
      .filter((cmd) => !cmd.omitFromListing)
      .map((cmd) => cmd.commandName)
      .join(', ');

    message.reply(`Available commands: ${commandListString}.`);
  }

  private logCommand(commandName: string, username: string, args: string[]) {
    this.logger.debug(`${username} executed ${commandName} command`);
    if (args.length) this.logger.debug(`command args: ${args.join(',')}`);
  }
}
