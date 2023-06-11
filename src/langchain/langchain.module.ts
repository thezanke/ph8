import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { langchainProvider } from './langchain.provider';
import { LangchainService } from './langchain.service';

@Module({
  imports: [ConfigModule],
  providers: [langchainProvider, LangchainService],
  exports: [LangchainService],
})
export class LangchainModule {}
