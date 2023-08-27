import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { validate } from './config/validate';
import { DiscordModule } from './discord/discord.module';
import { HealthController } from './health.controller';
import { OpenAIModule } from './openai/openai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ validate }),
    EventEmitterModule.forRoot(),
    DiscordModule,
    OpenAIModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
