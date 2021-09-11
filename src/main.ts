import { LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/validate';
import { parseEnvStringList } from './helpers/parseEnvStringList';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService<EnvironmentVariables> =
    app.get(ConfigService);

  const logLevels = parseEnvStringList(
    configService.get('LOG_LEVELS', ''),
  ) as LogLevel[];
  app.useLogger(logLevels);

  const port = configService.get('HTTP_PORT');
  await app.listen(port);
}

bootstrap();
