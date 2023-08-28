import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';
import { DiscordService } from '../discord/discord.service';
import { DiscordEvent } from '../discord/types';
import { OpenAIChatService } from '../openai/openai-chat.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly discordService: DiscordService,
    private readonly openAIChatService: OpenAIChatService,
  ) {}

  @OnEvent(DiscordEvent.messageCreated)
  async handleDiscordMessageCreated(message: Message) {
    const chain = await this.discordService.fetchReplyChain(message);
    chain.push(message);

    console.log(chain.length);

    const response = await this.openAIChatService.getCompletion(
      chain.map(this.convertDiscordMessageToOpenAIInput),
    );

    await message.channel.send(response);
  }

  private convertDiscordMessageToOpenAIInput = (message: Message) => {
    return this.openAIChatService.createUserMessage(
      message.content,
      message.author.username,
    );
  };
}
