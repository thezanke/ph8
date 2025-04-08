import { Inject, Module, OnModuleInit } from '@nestjs/common';
import {
  ClientProxy,
  ClientsModule,
  TcpStatus,
  Transport,
} from '@nestjs/microservices';
import { Ph8Controller } from './ph8.controller';
import { Ph8Service } from './ph8.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.register([
      { name: 'DISCORD_SERVICE', transport: Transport.TCP },
    ]),
  ],
  controllers: [Ph8Controller],
  providers: [Ph8Service],
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
