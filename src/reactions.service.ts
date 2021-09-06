import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MessageReaction, User } from 'discord.js';

import { DISCORD_EVENTS } from './discord/constants';
import { ScoringService } from './scoring/scoring.service';

export const REACTION_SCORES: Record<string, number | undefined> = {
  '1️⃣': 1,
  '2️⃣': 2,
  '3️⃣': 3,
  '4️⃣': 4,
  '5️⃣': 5,
  '6️⃣': 6,
  '7️⃣': 7,
  '8️⃣': 8,
  '9️⃣': 9,
  '🔟': 10,
  '0️⃣': -10,
  '💯': 10,
  '🏆': 10,
  '🙏': 5,
  '👍': 1,
  '👎': -1,
  '⬆️': 1,
  '⬇️': -1,
  '👏': 1,
  '🍆': -3,
  '💩': -5,
  '🤡': -10,
};

@Injectable()
export class ReactionsService {
  private readonly logger = new Logger(ReactionsService.name);

  constructor(private readonly scoringService: ScoringService) {}

  @OnEvent(DISCORD_EVENTS.reactionAdded)
  async handleMessageReactionAdd(reaction: MessageReaction, user: User) {
    const { author } = reaction.message;

    if (!author) return;
    if (!reaction.emoji.name) return;
    if (this.determineIfSelfReaction(author, user)) return;

    const value = this.getReactionValue(reaction.emoji.name);

    if (!value) return;

    this.logger.debug(`${user.username} reacted to ${author.username} with ${reaction.emoji}`);
    await this.scoringService.addScore(author.id, value);
  }

  @OnEvent(DISCORD_EVENTS.reactionRemoved)
  async handleMessageReactionRemove(reaction: MessageReaction, user: User) {
    const { author } = reaction.message;

    if (!author) return;
    if (!reaction.emoji) return;
    if (this.determineIfSelfReaction(author, user)) return;

    const value = this.getReactionValue(`${reaction.emoji}`);

    if (!value) return;

    this.logger.debug(`${user.username} unreacted to ${author.username} with ${reaction.emoji}`);
    await this.scoringService.removeScore(author.id, value);
  }

  private getReactionValue(emojiName: string) {
    return REACTION_SCORES[emojiName] ?? 0;
  }

  private determineIfSelfReaction(author: User, user: User) {
    return author.id === user.id;
  }
}
