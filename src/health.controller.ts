import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller('/health')
export class HealthController {
  @Get()
  @HttpCode(200)
  getHealth(): string {
    return 'healthy';
  }
}
