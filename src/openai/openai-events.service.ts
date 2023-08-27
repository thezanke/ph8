import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Message } from 'discord.js';
import { DiscordEvent } from '../discord/types';

@Injectable()
export class OpenAIEventsService {
  @OnEvent(DiscordEvent.messageCreated)
  handleMessageCreated(payload: Message) {
    console.log('OpenaiEventsService: handleMessageCreated', payload);
  }
}
