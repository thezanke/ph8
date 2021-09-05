import { Inject, Injectable, Logger } from '@nestjs/common';
import { Snowflake } from 'discord-api-types';
import { INITIAL_SCORES } from './initialScoresProvider';

import * as fs from 'fs';
import * as path from 'path';
import { EnvironmentVariables } from '../config/validate';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScoreRepository {
  private logger = new Logger(ScoreRepository.name);

  constructor(
    @Inject(INITIAL_SCORES)
    private scores: Record<string, number>,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  getScore(userId: Snowflake) {
    return this.scores[userId] ?? 0;
  }

  updateScore(userId: Snowflake, score: number) {
    this.scores[userId] = score;
    this.writeScores();
  }

  writeScores() {
    const scoresJsonFilePath = path.resolve(this.configService.get('SCORES_JSON_FILE_PATH', ''));
    const scoresString = JSON.stringify(this.scores, null, 2);

    fs.writeFile(scoresJsonFilePath, scoresString, (err) => {
      if (err) {
        this.logger.error(err);
      } else {
        this.logger.verbose('Scores saved');
      }
    });
  }
}
