import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DiscordModule } from '../discord/discord.module';
import { GptModule } from '../gpt/gpt.module';
import { ScoringModule } from '../scoring/scoring.module';
import { ChitchatCommandService } from './chitchatCommand.service';
import { CommandsService } from './commands.service';
import { FactCheckCommandService } from './factCheckCommand.service';
import { GoogleCommandService } from './googleCommand.service';
import { PizzaCommandService } from './pizzaCommand.service';
import { ScoreCommandService } from './scoreCommand.service';
import { UnknownCommandService } from './unknownCommand.service';

@Module({
  imports: [ConfigModule, ScoringModule, HttpModule, DiscordModule, GptModule],
  controllers: [],
  providers: [
    ChitchatCommandService,
    CommandsService,
    FactCheckCommandService,
    GoogleCommandService,
    PizzaCommandService,
    ScoreCommandService,
    UnknownCommandService,
  ],
  exports: [],
})
export class CommandsModule {}
