import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { validate } from './config/validate';
import { DiscordModule } from './discord/discord.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ validate }),
    EventEmitterModule.forRoot(),
    DiscordModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
