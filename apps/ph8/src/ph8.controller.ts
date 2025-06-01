import { Controller, Get } from '@nestjs/common';
import { Ph8Service } from './ph8.service';

@Controller()
export class Ph8Controller {
  constructor(private readonly appService: Ph8Service) {}

  @Get('hello')
  getHello() {
    return this.appService.getHello();
  }
}
