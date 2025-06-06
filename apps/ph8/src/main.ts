import { NestFactory } from '@nestjs/core';
import { Ph8Module } from './ph8.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(Ph8Module);
  const config = app.get(ConfigService);

  app.connectMicroservice({
    transport: Transport.TCP,
    options: { port: config.get<number>('TCP_PH8_PORT', 1111) },
  });

  await app.startAllMicroservices();
  await app.listen(config.getOrThrow('HTTP_PH8_PORT'));
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
