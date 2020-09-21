import config from "./config.ts";
import httpServer from "./httpServer.ts";
import { DiscordClient } from "./discord.ts";

const discordClient = new DiscordClient();

await Promise.all([
  httpServer.listen({ port: config.HTTP_PORT }),
]);
