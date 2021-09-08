import { bold, hyperlink } from '@discordjs/builders';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/common/node_modules/axios';
import { ConfigService } from '@nestjs/config';
import { Message, MessageEmbed } from 'discord.js';
import { firstValueFrom } from 'rxjs';

import { EnvironmentVariables } from '../config/validate';
import { CommandsService } from './commands.service';
import { FactCheckClaim, FactCheckResults } from './datatypes/factCheckResults';
import { Command } from './types';

@Injectable()
export class FactCheckCommandService implements Command {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    commandsService: CommandsService,
  ) {
    commandsService.registerCommand(this);
  }

  public commandName = 'factcheck';
  private apiKey = this.configService.get('GOOGLE_API_KEY', '');

  public async execute(message: Message, ...args) {
    const queryString = this.getQueryString(args);
    if (!queryString.length) return this.replyWithConfusion(message);

    const { data } = await this.fetchFactCheck(queryString);
    if (!data.claims?.length) return this.replyWithNotFound(message);

    const embeds = this.buildFactCheckClaimEmbeds(data.claims);
    if (!embeds.length) return this.replyWithNotFound(message);

    message.reply({ content: "Here's what I found:", embeds });
  }

  private buildFactCheckClaimEmbeds(claims: FactCheckClaim[]): MessageEmbed[] {
    const embeds: MessageEmbed[] = [];

    for (const claim of this.getClaimsForEmbed(claims)) {
      if (claim.claimReview.length) {
        const embed = new MessageEmbed();

        const lines = [`${bold('Claim:')} ${claim.text}`];

        for (const claimReview of claim.claimReview) {
          lines.push(
            `${bold('Verdict:')} ${claimReview.textualRating}`,
            `${bold('Source:')} ${hyperlink(claimReview.title || claimReview.url, claimReview.url)}`,
          );
        }

        embed.setDescription(lines.join('\n'));
        embeds.push(embed);
      }
    }

    return embeds;
  }

  private getClaimsForEmbed(claims: FactCheckClaim[]) {
    return claims
      .map((claim) => {
        claim.claimReview = claim.claimReview.filter((cr) => cr.languageCode === 'en');
        return claim;
      })
      .filter((claim) => claim.claimReview.length)
      .slice(0, 10);
  }

  private replyWithConfusion(message: Message) {
    message.reply("I'm not sure what you want me to check...");
  }

  private replyWithNotFound(message: Message) {
    message.reply("Sorry, I couldn't find anything... :(");
  }

  private getQueryString = (parts: string[]) => parts.join(' ').trim();

  private fetchFactCheck(query: string): Promise<AxiosResponse<FactCheckResults>> {
    return firstValueFrom(
      this.httpService.get(`https://factchecktools.googleapis.com/v1alpha1/claims:search`, {
        params: { query, key: this.apiKey },
      }),
    );
  }
}
