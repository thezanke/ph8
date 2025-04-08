import { Injectable } from '@nestjs/common';

@Injectable()
export class Ph8Service {
  getHello(): string {
    return 'Hello World!';
  }
}
