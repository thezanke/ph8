import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';

import { EnvironmentVariables } from './config/validate';
import { DISCORD_EVENTS } from './discord/constants';
import { findHostnamesInString } from './helpers/findHostnamesInString';
import { parseEnvStringList } from './helpers/parseEnvStringList';
import { pickRandom } from './helpers/pickRandom';
import { ScoringService } from './scoring/scoring.service';

@Injectable()
export class PoorSourcesService {
  private readonly logger = new Logger(PoorSourcesService.name);
  private readonly poorSourceHostnames = this.getPoorSourceHostnames();
  private readonly replies = this.getReplies();

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly scoringService: ScoringService,
  ) {}

  @OnEvent(DISCORD_EVENTS.messageCreate)
  handleMessage(message: Message) {
    const poorSources = this.findPoorSources(message.content);

    if (!poorSources.length) return;

    this.logger.verbose(`${message.author.username} used poor source(s): ${poorSources.join(', ')}`);
    this.handlePoorSources(message, poorSources.length);
  }

  private findPoorSources(messageContent: string) {
    const messageDomainNames = findHostnamesInString(messageContent);

    return messageDomainNames.filter((messageDomainName) =>
      this.poorSourceHostnames.some((hostname) => messageDomainName.endsWith(hostname)),
    );
  }

  private handlePoorSources(message: Message, count: number) {
    this.scoringService.removeScore(message.author.id, 3 * count);
    message.reply(pickRandom(this.replies) as string);
  }

  private getPoorSourceHostnames() {
    return parseEnvStringList(this.configService.get('POOR_SOURCES', ''));
  }

  private getReplies() {
    return parseEnvStringList(this.configService.get('POOR_SOURCE_REPLIES', ''));
  }
}
