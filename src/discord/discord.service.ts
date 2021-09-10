import { Inject, Injectable, Logger } from '@nestjs/common';
import { Client, Message, MessageReaction, User } from 'discord.js';
import { EventEmitter2 } from 'eventemitter2';

import { DISCORD_EVENTS } from './constants';
import { DISCORD_CLIENT } from './providers/discordClient.provider';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(
    @Inject(DISCORD_CLIENT)
    private readonly discordClient: Client,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.discordClient.on('error', this.logger.error.bind(this.logger));
    this.discordClient.on('debug', this.logger.verbose.bind(this.logger));
    this.discordClient.on('messageCreate', this.handleMessageCreate);
    this.discordClient.on('messageReactionAdd', this.handleMessageReactionAdd);
    this.discordClient.on('messageReactionRemove', this.handleMessageReactionRemove);
    this.discordClient.on('ready', this.handleReady);
    this.discordClient.on('warn', this.logger.warn.bind(this.logger));
  }

  public get userId() {
    return this.discordClient.user?.id;
  }

  private determineIfOwnMessage(message: Message) {
    return message.author.id === this.discordClient.user?.id;
  }

  private handleMessageCreate = async (message: Message) => {
    if (this.determineIfOwnMessage(message)) return;
    this.eventEmitter.emit(DISCORD_EVENTS.messageCreate, message);
  };

  private handleMessageReactionAdd = async (reaction: MessageReaction, user: User) => {
    this.eventEmitter.emit(DISCORD_EVENTS.reactionAdded, reaction, user);
  };

  private handleMessageReactionRemove = async (reaction: MessageReaction, user: User) => {
    this.eventEmitter.emit(DISCORD_EVENTS.reactionRemoved, reaction, user);
  };

  private handleReady = () => {
    this.logger.log('Discord client ready');
  };
}
