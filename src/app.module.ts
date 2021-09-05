import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { validate } from './config/validate';
import { DigressionService } from './digression.service';
import { DiscordModule } from './discord/discord.module';
import { HealthController } from './health.controller';
import { PoorSourcesService } from './poorSources.service';
import { ReactionsService } from './reactions.service';
import { ScoringModule } from './scoring/scoring.module';

@Module({
  imports: [ConfigModule.forRoot({ validate }), EventEmitterModule.forRoot(), ScoringModule, DiscordModule],
  controllers: [HealthController],
  providers: [DigressionService, PoorSourcesService, ReactionsService],
})
export class AppModule {}
