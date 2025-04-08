import { NestFactory } from '@nestjs/core';
import { DiscordModule } from './discord.module';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(DiscordModule);
  const config = app.get(ConfigService);

  app.connectMicroservice({
    transport: Transport.TCP,
    options: { port: config.get<string>('TCP_DISCORD_PORT', '2222') },
  });

  await app.startAllMicroservices();
  await app.listen(config.getOrThrow('HTTP_DISCORD_PORT'));
}

bootstrap().catch((err) => {
  console.error('Error starting the application:', err);
  process.exit(1);
});
