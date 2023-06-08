import { Injectable } from '@nestjs/common';
import { Message, Snowflake } from 'discord.js';

import { DiscordService } from '../discord/discord.service';
import { ScoringService } from '../scoring/scoring.service';
import { CommandsService } from './commands.service';
import { Command } from './types/Command';

@Injectable()
export class ScoreCommandService implements Command {
  public commandName = 'score';

  constructor(
    private readonly scoringService: ScoringService,
    private readonly discordService: DiscordService,
    commandsService: CommandsService,
  ) {
    commandsService.registerCommand(this);
  }

  public execute(message: Message) {
    const userIds = this.getCommandUserIds(message);
    const replyMessage = this.createScoreReplyMessage(userIds);

    if (!replyMessage?.length) return;

    message.reply(replyMessage);
  }

  private getCommandUserIds(message: Message) {
    const userIds = [
      ...message.mentions.users
        .filter((u) => u.username !== this.discordService.username)
        .keys(),
      ...message.mentions.roles.map((r) => r.tags?.botId),
    ];

    if (!userIds.length) userIds.push(message.author.id);

    return userIds as Snowflake[];
  }

  private createScoreReplyMessage(userIds: Snowflake[]) {
    return userIds
      .map((userId) => {
        const score = this.scoringService.getScore(userId);

        return `<@${userId}> has ${score} points`;
      })
      .join('\n');
  }
}
