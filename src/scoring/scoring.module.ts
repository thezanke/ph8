import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { initialScoresProvider } from './initialScoresProvider';
import { ScoreRepository } from './score.repository';
import { ScoringService } from './scoring.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [initialScoresProvider, ScoreRepository, ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
