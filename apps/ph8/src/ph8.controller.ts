import { Controller, Get } from '@nestjs/common';
import { Ph8Service } from './ph8.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class Ph8Controller {
  constructor(private readonly appService: Ph8Service) {}

  @Get('health')
  getHello() {
    return this.appService.chat('health check successful message');
  }

  @MessagePattern({ cmd: 'chat' })
  async chat(message: string): Promise<string> {
    return this.appService.chat(message);
  }
}
