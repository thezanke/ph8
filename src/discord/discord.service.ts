import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Client,
  Message,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from 'discord.js';
import { DISCORD_CLIENT } from './providers/discordClient.provider';
import { DiscordEvent } from './types';

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
    return this.discordClient.user?.id ?? 'ph8';
  }

  public get username() {
    return this.discordClient.user?.username ?? 'ph8';
  }

  public get user() {
    return this.discordClient.user;
  }

  public async *traverseMessageChain(
    message: Message,
  ): AsyncGenerator<Message> {
    yield message;

    let lastMessage = message;

    while (lastMessage.reference?.messageId) {
      const referencedMessage = await message.channel.messages.fetch(
        lastMessage.reference.messageId,
      );

      yield referencedMessage;

      lastMessage = referencedMessage;
    }
  }

  public determineIfMentioned(message: Message) {
    return message.mentions.users.has(this.userId);
  }

  private determineIfOwnMessage(message: Message) {
    return message.author.id === this.discordClient.user?.id;
  }

  private handleMessageCreate = async (message: Message) => {
    if (this.determineIfOwnMessage(message)) return;
    this.eventEmitter.emit(DiscordEvent.messageCreated, message);
  };

  private handleMessageReactionAdd = async (
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ) => {
    this.eventEmitter.emit(DiscordEvent.reactionAdded, reaction, user);
  };

  private handleMessageReactionRemove = async (
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ) => {
    this.eventEmitter.emit(DiscordEvent.reactionRemoved, reaction, user);
  };

  private handleReady = () => {
    this.logger.log('Discord client ready');
  };
}
