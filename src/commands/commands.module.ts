import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ScoringModule } from '../scoring/scoring.module';
import { ChitchatCommandService } from './chitchatCommand.service';
import { CommandsService } from './commands.service';
import { GoogleCommandService } from './googleCommand.service';
import { ScoreCommandService } from './scoreCommand.service';
import { UnknownCommandService } from './unknownCommand.service';

@Module({
  imports: [ConfigModule, ScoringModule],
  controllers: [],
  providers: [
    CommandsService,
    ChitchatCommandService,
    UnknownCommandService,
    GoogleCommandService,
    ScoreCommandService,
  ],
  exports: [],
})
export class CommandsModule {}
