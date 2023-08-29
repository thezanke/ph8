import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';
import { CreateChatCompletionRequestMessage } from 'openai/resources/chat';
import { DiscordService } from '../discord/discord.service';
import { DiscordEvent } from '../discord/types';
import { createUserMessage } from '../openai/helpers/createUserMessage';
import { OpenAIChatService } from '../openai/openai-chat.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly discordService: DiscordService,
    private readonly openAIChatService: OpenAIChatService,
  ) {}

  @OnEvent(DiscordEvent.messageCreated)
  async handleDiscordMessageCreated(message: Message) {
    if (!this.discordService.determineIfMentioned(message)) return;
    await this.handleMention(message);
  }

  private async handleMention(initialMessage: Message) {
    const messages: CreateChatCompletionRequestMessage[] = [];
    const chain = this.discordService.messageChainGenerator(initialMessage);

    for await (const message of chain) {
      messages.push(
        createUserMessage(message.content, message.author.username),
      );
    }

    messages.reverse();

    const response = await this.openAIChatService.getCompletion(messages);

    await initialMessage.reply(response);
  }
}
