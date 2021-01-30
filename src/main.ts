import {
  botID,
  startBot,
} from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import config from "./config.ts";
import { handleCommands } from "./handle_commands.ts";
import { handleDigression } from "./handle_digression.ts";
import { handlePoorSources } from "./handle_poor_sources.ts";
import { handleReactions } from "./handle_reactions.ts";
import { handleReactionReplies } from "./handle_reaction_replies.ts";
import { server } from "./http_server.ts";

try {
  await Promise.all([
    startBot({
      token: config.DISCORD_BOT_TOKEN,
      intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"],
      eventHandlers: {
        ready() {
          console.log("Successfully connected to gateway!");
          console.log(`-> botID: ${botID}`);
        },
        messageCreate(message) {
          handleCommands(message) ||
            handleReactionReplies(message) ||
            handleDigression(message) ||
            handlePoorSources(message);
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
    }),
    server.listen({ port: config.HTTP_PORT }),
  ]);
} catch (e) {
  console.error(e);
  Deno.exit(-1);
}
