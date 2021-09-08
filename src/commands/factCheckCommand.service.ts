import { bold, hideLinkEmbed } from '@discordjs/builders';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/common/node_modules/axios';
import { ConfigService } from '@nestjs/config';
import { Message } from 'discord.js';
import { firstValueFrom } from 'rxjs';

import { EnvironmentVariables } from '../config/validate';
import { CommandsService } from './commands.service';
import { FactCheckResults } from './datatypes/factCheckResults';
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

    const { data: results } = await this.fetchFactCheck(queryString);
    const replyMessage = this.buildResultsReplyMessage(results);
    message.reply(replyMessage);
  }

  private buildResultsReplyMessage(results: FactCheckResults): string {
    if (!results.claims?.length) return "I couldn't find anything, sorry!";

    const lines: string[] = [];

    results.claims.slice(0, 5).forEach((claim) => {
      lines.push(claim.text);
      claim.claimReview.forEach((claimReview) => {
        if (claimReview.languageCode !== 'en') return;

        lines.push(`${bold(`${claimReview.textualRating}`)} - ${hideLinkEmbed(claimReview.url)}`, '');
      });
    });

    return lines.join('\n').trim().slice(0, 2000);
  }

  private replyWithConfusion(message: Message) {
    message.reply("I'm not sure what you want me to check...");
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
