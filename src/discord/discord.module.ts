import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscordService } from './discord.service';
import { discordClientProvider } from './providers/discordClient.provider';
import { discordRestClientProvider } from './providers/discordRestClient.provider';

@Module({
  imports: [ConfigModule],
  providers: [discordClientProvider, discordRestClientProvider, DiscordService],
  exports: [DiscordService],
})
export class DiscordModule {}
