import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IntentsBitField, Partials } from 'discord.js';
import { NecordModule } from 'necord';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NecordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow('DISCORD_TOKEN'),
        partials: [
          Partials.Channel,
          Partials.GuildMember,
          Partials.Message,
          Partials.Reaction,
          Partials.ThreadMember,
          Partials.User,
        ],
        intents: [
          IntentsBitField.Flags.DirectMessagePolls,
          IntentsBitField.Flags.DirectMessageReactions,
          IntentsBitField.Flags.DirectMessages,
          IntentsBitField.Flags.DirectMessageTyping,
          IntentsBitField.Flags.GuildMessagePolls,
          IntentsBitField.Flags.GuildMessageReactions,
          IntentsBitField.Flags.GuildMessages,
          IntentsBitField.Flags.GuildMessageTyping,
          IntentsBitField.Flags.Guilds,
          IntentsBitField.Flags.MessageContent,
        ],
        development: config
          .getOrThrow<string>('DISCORD_DEVELOPMENT_GUILD_ID')
          .split(','),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DiscordController],
  providers: [DiscordService],
})
export class DiscordModule {}
