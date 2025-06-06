import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  ClientsModule,
  TcpStatus,
  Transport,
} from '@nestjs/microservices';
import { OpenAIService } from './openai/openai.service';
import { Ph8Controller } from './ph8.controller';
import { Ph8Service } from './ph8.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: 'DISCORD_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            port: config.get<number>('DISCORD_PORT', 9999),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [Ph8Controller],
  providers: [Ph8Service, OpenAIService],
})
export class Ph8Module implements OnModuleInit {
  constructor(
    @Inject('DISCORD_SERVICE') private readonly discordClient: ClientProxy,
  ) {}

  onModuleInit() {
    this.discordClient.status.subscribe((status: TcpStatus) => {
      console.log(status);
    });
  }
}
