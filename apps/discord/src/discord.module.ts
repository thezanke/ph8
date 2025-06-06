import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IntentsBitField, Partials } from 'discord.js';
import { NecordModule } from 'necord';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: 'PH8_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            port: config.get<number>('TCP_PH8_PORT', 1111),
          },
        }),
        inject: [ConfigService],
      },
    ]),
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
