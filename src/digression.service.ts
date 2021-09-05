import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';
import { DISCORD_EVENTS } from './discord/constants';
import { ScoringService } from './scoring/scoring.service';

@Injectable()
export class DigressionService {
  constructor(private readonly scoringService: ScoringService) {}

  private readonly logger = new Logger(DigressionService.name);

  @OnEvent(DISCORD_EVENTS.messageCreate)
  handleMessage(message: Message) {
    if (!this.determineIfDigression(message.content)) return;
    this.logger.verbose(`${message.author.username} has digressed`);
    this.handleDigression(message);
  }

  private determineIfDigression(messageContent: string): boolean {
    return /but I digress/gi.test(messageContent);
  }

  private handleDigression(message: Message) {
    this.scoringService.addScore(message.author.id, -1);
    message.reply("You've digressed? Are you sure?\nhttps://www.google.com/search?q=digress");
  }
}
