import {
  startBot,
  Message,
  botID,
} from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import config from "./config.ts";
import { handleCommands } from "./handle_commands.ts";
import { handleDigression } from "./handle_digression.ts";
import { handlePoorSources } from "./handle_poor_sources.ts";
import { handleReactions } from "./handle_reactions.ts";
import { server } from "./http_server.ts";

const handleFunnyReplies = (message: Message) => {
  return handleDigression(message) || handlePoorSources(message);
};

startBot({
  token: config.DISCORD_BOT_TOKEN,
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"],
  eventHandlers: {
    ready() {
      console.log("Successfully connected to gateway!");
      console.log(`-> botID: ${botID}`);
    },
    messageCreate(message) {
      handleCommands(message) || handleFunnyReplies(message);
    },
    reactionAdd(...args) {
      const [, emoji] = args;
      if (!emoji.name) return;
      handleReactions(...args);
    },
    reactionRemove(...args) {
      const [, emoji] = args;
      if (!emoji.name) return;
      handleReactions(...args, true);
    },
  },
});

server.listen({ port: config.HTTP_PORT });
