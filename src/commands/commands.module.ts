import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChitchatCommandService } from './chitchatCommand.service';
import { CommandsService } from './commands.service';
import { GoogleCommandService } from './googleCommand.service';
import { UnknownCommandService } from './unknownCommand.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [CommandsService, ChitchatCommandService, UnknownCommandService, GoogleCommandService],
  exports: [],
})
export class CommandsModule {}
