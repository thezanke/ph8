import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/validate';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService<EnvironmentVariables> = app.get(ConfigService);
  const port = configService.get('HTTP_PORT');
  await app.listen(port);
}

bootstrap();
