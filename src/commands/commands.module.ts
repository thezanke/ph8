import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DiscordModule } from '../discord/discord.module';
import { ScoringModule } from '../scoring/scoring.module';
import { ChitchatCommandService } from './chitchatCommand.service';
import { CommandsService } from './commands.service';
import { FactCheckCommandService } from './factCheckCommand.service';
import { GoogleCommandService } from './googleCommand.service';
import { ScoreCommandService } from './scoreCommand.service';
import { UnknownCommandService } from './unknownCommand.service';

@Module({
  imports: [ConfigModule, ScoringModule, HttpModule, DiscordModule],
  controllers: [],
  providers: [
    CommandsService,
    ChitchatCommandService,
    UnknownCommandService,
    GoogleCommandService,
    ScoreCommandService,
    FactCheckCommandService,
  ],
  exports: [],
})
export class CommandsModule {}
