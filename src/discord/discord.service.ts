import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Message, MessageReaction, User } from 'discord.js';
import { EventEmitter2 } from 'eventemitter2';

import { DISCORD_EVENTS } from './constants';
import { DISCORD_CLIENT } from './providers/discordClient.provider';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  private readonly replyChainLimit = Number(
    this.configService.get('CHITCHAT_MESSAGE_CONTEXT_LIMIT', '5'),
  );

  constructor(
    @Inject(DISCORD_CLIENT)
    private readonly discordClient: Client,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.discordClient.on('error', this.logger.error.bind(this.logger));
    this.discordClient.on('debug', this.logger.verbose.bind(this.logger));
    this.discordClient.on('messageCreate', this.handleMessageCreate);
    this.discordClient.on('messageReactionAdd', this.handleMessageReactionAdd);
    this.discordClient.on(
      'messageReactionRemove',
      this.handleMessageReactionRemove,
    );
    this.discordClient.on('ready', this.handleReady);
    this.discordClient.on('warn', this.logger.warn.bind(this.logger));
  }

  public get userId() {
    return this.discordClient.user?.id;
  }

  public get username() {
    return this.discordClient.user?.username ?? 'ph8';
  }

  public get user() {
    return this.discordClient.user;
  }

  public async fetchReplyChain(message: Message): Promise<Message[]> {
    const replyChain: Message[] = [];
    let m = message;

    while (m.reference && replyChain.length < this.replyChainLimit) {
      m = await m.fetchReference();
      replyChain.push(m);
    }

    return replyChain;
  }

  private determineIfOwnMessage(message: Message) {
    return message.author.id === this.discordClient.user?.id;
  }

  private handleMessageCreate = async (message: Message) => {
    if (this.determineIfOwnMessage(message)) return;
    this.eventEmitter.emit(DISCORD_EVENTS.messageCreate, message);
  };

  private handleMessageReactionAdd = async (
    reaction: MessageReaction,
    user: User,
  ) => {
    this.eventEmitter.emit(DISCORD_EVENTS.reactionAdded, reaction, user);
  };

  private handleMessageReactionRemove = async (
    reaction: MessageReaction,
    user: User,
  ) => {
    this.eventEmitter.emit(DISCORD_EVENTS.reactionRemoved, reaction, user);
  };

  private handleReady = () => {
    this.logger.log('Discord client ready');
  };
}
