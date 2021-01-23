import {
  startBot,
  MessageReactionUncachedPayload,
  ReactionPayload,
  Message
} from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import config from "./config.ts";
import httpServer from "./httpServer.ts";

type ReactionHandler = (
  payload: MessageReactionUncachedPayload,
  emoji: ReactionPayload,
  userID: string,
  message?: Message
) => any;

const scores: { [userID: string]: number } = {};

const scoreMap: { [emojiName: string]: number | undefined } = {
  "1️⃣": 1,
  "2️⃣": 2,
  "3️⃣": 3,
  "4️⃣": 4,
  "5️⃣": 5,
  "6️⃣": 6,
  "7️⃣": 7,
  "8️⃣": 8,
  "9️⃣": 9,
  "🔟": 10,
  "💯": 100,
  "👍": 1,
  "👎": -1,
}

const handleScoreReactionAdd: ReactionHandler = (_p, emoji, _u, message) => {
  if (!message) return;
  const userID = message.author.id;
  if (!emoji.name) return;
  let value = scoreMap[emoji.name];
  if (!value) return;
  let lastScore = scores[userID] ?? 0;
  scores[userID] = lastScore + value;
  console.log(scores);
}

startBot({
  token: config.BOT_TOKEN,
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"],
  eventHandlers: {
    ready() {
      console.log("Successfully connected to gateway");
    },
    messageCreate(message) {
      console.log(message);
      if (message.content === "!ph8 ping") {
        message.reply("Pong using Discordeno!");
      }
    },
    reactionAdd(...args) {
      const [,emoji] = args;
      if (!emoji.name) return;
      handleScoreReactionAdd(...args);
    },
  },
});

// import { DiscordClient } from "./discord.ts";

// const discordClient = new DiscordClient();

await Promise.all([httpServer.listen({ port: config.HTTP_PORT })]);
