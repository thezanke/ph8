import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';
import { DiscordEvent } from '../discord/types';
import { OpenAIService } from '../openai/openai.service';

@Injectable()
export class ChatService {
  constructor(private readonly openAIService: OpenAIService) {}

  @OnEvent(DiscordEvent.messageCreated)
  async handleDiscordMessageCreated(message: Message) {
    console.log('Discord message created', message);

    // request a response from OpenAI
    const response = await this.openAIService.requestChatResponse([
      // TODO: send message chain based on conversation
      message.content,
    ]);

    // send the response to Discord
    await message.channel.send(response);
  }
}
