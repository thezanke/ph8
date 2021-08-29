import { discord } from "./deps.ts";
import config from "./config.ts";
import { handleCommands } from "./handle_commands.ts";
import { handleDigression } from "./handle_digression.ts";
import { handlePoorSources } from "./handle_poor_sources.ts";
import { handleReactions } from "./handle_reactions.ts";
import { handleReactionReplies } from "./handle_reaction_replies.ts";
import { server } from "./http_server.ts";

try {
  await Promise.all([
    discord.startBot({
      token: config.DISCORD_BOT_TOKEN,
      intents: ["Guilds", "GuildMessages", "GuildMessageReactions"],
      eventHandlers: {
        ready() {
          console.log("Successfully connected to gateway!");
          console.log(`-> botID: ${discord.botId}`);
        },
        messageCreate(message) {
          handleCommands(message) ||
            handleReactionReplies(message) ||
            handleDigression(message) ||
            handlePoorSources(message);
        },
        reactionAdd(data, message) {
          handleReactions(data, message);
        },
        reactionRemove(data, message) {
          handleReactions(data, message, true);
        },
      },
    }),
    server.listen({ port: config.HTTP_PORT }),
  ]);
} catch (e) {
  console.error(e);
  Deno.exit(-1);
}
