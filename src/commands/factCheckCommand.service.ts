import { bold, hyperlink } from '@discordjs/builders';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/common/node_modules/axios';
import { ConfigService } from '@nestjs/config';
import { Message, MessageEmbed } from 'discord.js';
import { firstValueFrom } from 'rxjs';

import { EnvironmentVariables } from '../config/validate';
import { CommandsService } from './commands.service';
import {
  FactCheckClaim,
  FactCheckClaimReview,
  FactCheckResults,
} from './datatypes/factCheckResults';
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

  public readonly commandName = 'factcheck';
  private readonly apiKey = this.configService.get('GOOGLE_API_KEY', '');

  public async execute(message: Message, ...args) {
    const queryString = await this.getQueryString(message, args);
    if (!queryString?.length) return this.replyWithConfusion(message);

    const { data } = await this.fetchFactCheck(queryString as string);
    if (!data.claims?.length) return this.replyWithNotFound(message);

    const embeds = this.buildFactCheckClaimEmbeds(data.claims);
    if (!embeds.length) return this.replyWithNotFound(message);

    message.reply({ content: "Here's what I found:", embeds });
  }

  private buildFactCheckClaimEmbeds(claims: FactCheckClaim[]): MessageEmbed[] {
    const embeds: MessageEmbed[] = [];

    for (const claim of this.getClaimsForEmbed(claims)) {
      const lines = [`${bold('Claim:')} ${claim.text}`];

      for (const claimReview of claim.claimReview) {
        lines.push(
          `${bold('Verdict:')} ${claimReview.textualRating}`,
          `${bold('Source:')} ${hyperlink(
            claimReview.title || claimReview.url,
            claimReview.url,
          )}`,
        );
      }

      const embed = new MessageEmbed({ description: lines.join('\n') });
      embeds.push(embed);
    }

    return embeds;
  }

  private fetchFactCheck(
    query: string,
  ): Promise<AxiosResponse<FactCheckResults>> {
    const options = { params: { query, key: this.apiKey } };

    return firstValueFrom(
      this.httpService.get(
        `https://factchecktools.googleapis.com/v1alpha1/claims:search`,
        options,
      ),
    );
  }

  private filterReviewsForEmbed = (review: FactCheckClaimReview) => {
    return review.languageCode === 'en';
  };

  private filterClaimsForEmbed = (claim: FactCheckClaim) => {
    return claim.claimReview.length > 0;
  };

  private mapClaimForEmbed = (claim: FactCheckClaim): FactCheckClaim => {
    return {
      ...claim,
      claimReview: claim.claimReview.filter(this.filterReviewsForEmbed),
    };
  };

  private getClaimsForEmbed(claims: FactCheckClaim[]) {
    return claims
      .map(this.mapClaimForEmbed)
      .filter(this.filterClaimsForEmbed)
      .slice(0, 10);
  }

  private getQueryString(message: Message, args: string[]) {
    if (args.length) return this.getQueryStringFromArgs(args);

    return this.getQueryStringFromReply(message);
  }

  private getQueryStringFromArgs = (parts: string[]) => {
    return parts.join(' ').trim();
  };

  private async getQueryStringFromReply(message: Message) {
    const reply = await message.fetchReference();

    if (!reply?.content.length) return;

    return reply.content;
  }

  private replyWithConfusion(message: Message) {
    message.reply("I'm not sure what you want me to check...");
  }

  private replyWithNotFound(message: Message) {
    message.reply("Sorry, I couldn't find anything... :(");
  }
}
