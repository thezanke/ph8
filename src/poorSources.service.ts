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
  private readonly poorSourceDomains = this.getPoorSourceDomainNames();
  private readonly replies = this.getReplies();

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly scoringService: ScoringService,
  ) {}

  @OnEvent(DISCORD_EVENTS.messageCreate)
  handleMessage(message: Message) {
    const poorSourceDomains = this.findPoorSourceDomainsInMessageContent(message.content);

    if (!poorSourceDomains.length) return;

    this.logger.verbose(`${message.author.username} used poor source(s): ${poorSourceDomains.join(', ')}`);
    this.handlePoorSources(message, poorSourceDomains.length);
  }

  private findPoorSourceDomainsInMessageContent(messageContent: string) {
    const contentHostnames = findHostnamesInString(messageContent);

    return this.poorSourceDomains.filter((poorSourceDomain) =>
      contentHostnames.some((hostname) => hostname.endsWith(poorSourceDomain)),
    );
  }

  private handlePoorSources(message: Message, count: number) {
    this.scoringService.removeScore(message.author.id, 3 * count);
    message.reply(pickRandom(this.replies) as string);
  }

  private getPoorSourceDomainNames() {
    return parseEnvStringList(this.configService.get('POOR_SOURCES', ''));
  }

  private getReplies() {
    return parseEnvStringList(this.configService.get('POOR_SOURCE_REPLIES', ''));
  }
}
