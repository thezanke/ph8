import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';

import { DISCORD_EVENTS } from './discord/constants';
import { ScoringService } from './scoring/scoring.service';

@Injectable()
export class DigressionService {
  private readonly logger = new Logger(DigressionService.name);

  constructor(private readonly scoringService: ScoringService) {}

  @OnEvent(DISCORD_EVENTS.messageCreate)
  async handleMessage(message: Message) {
    if (!this.determineIfDigression(message.content)) return;

    this.logger.debug(`${message.author.username} has digressed`);
    await this.handleDigression(message);
  }

  private determineIfDigression(messageContent: string): boolean {
    return /but I digress/gi.test(messageContent);
  }

  private async handleDigression(message: Message) {
    message.reply(
      "You've digressed? Are you sure?\nhttps://www.google.com/search?q=digress",
    );
    await this.scoringService.removeScore(message.author.id, 1);
  }
}
