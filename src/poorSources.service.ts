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
  private readonly poorSourcesList = this.getPoorSourcesList();
  private readonly replies = this.getReplies();

  constructor(
    private readonly scoringService: ScoringService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  @OnEvent(DISCORD_EVENTS.messageCreate)
  handleMessage(message: Message) {
    const poorSources = this.findPoorSources(message.content);

    if (!poorSources.length) return;

    this.logger.verbose(`${message.author.username} used poor source(s): ${poorSources.join(', ')}`);
    this.handlePoorSources(message, poorSources.length);
  }

  private findPoorSources(messageContent: string) {
    const domainNames = findHostnamesInString(messageContent);

    return domainNames.filter((domainName) =>
      this.poorSourcesList.some((sourceDomainName) => domainName.endsWith(sourceDomainName)),
    );
  }

  private handlePoorSources(message: Message, count: number) {
    this.scoringService.removeScore(message.author.id, 3 * count);
    message.reply(pickRandom(this.replies) as string);
  }

  private getPoorSourcesList() {
    return parseEnvStringList(this.configService.get('POOR_SOURCES', ''));
  }

  private getReplies() {
    return parseEnvStringList(this.configService.get('POOR_SOURCE_REPLIES', ''));
  }
}
