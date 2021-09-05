import { Injectable, Logger } from '@nestjs/common';
import { Snowflake } from 'discord-api-types';
import { ScoreRepository } from './score.repository';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private readonly scoreRepository: ScoreRepository) {}

  addScore(userId: Snowflake, amount: number) {
    this.logger.verbose(`Adding ${amount} to score for userId=${userId}`);

    const prevScore = this.scoreRepository.getScore(userId);
    const newScore = prevScore + amount;

    return this.scoreRepository.updateScore(userId, newScore);
  }

  removeScore(userId: Snowflake, amount: number) {
    this.logger.verbose(`Removing ${amount} from score for userId=${userId}`);

    const prevScore = this.scoreRepository.getScore(userId);
    const newScore = prevScore - amount;

    return this.scoreRepository.updateScore(userId, newScore);
  }

  getScore(userId: Snowflake) {
    return this.scoreRepository.getScore(userId);
  }
}
