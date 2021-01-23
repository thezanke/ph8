import {
  startBot,
  MessageReactionUncachedPayload,
  ReactionPayload,
  Message,
  botID,
} from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import config from "./config.ts";
import httpServer from "./httpServer.ts";

interface ReactionHandler {
  (
    payload: MessageReactionUncachedPayload,
    emoji: ReactionPayload,
    userID: string,
    message?: Message,
    removal?: Boolean
  ): any;
}

const scores: { [userID: string]: number } = {};

const SCORE_MAP: { [emojiName: string]: number | undefined } = {
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
};

const getReactionValue = (emojiName?: string | null) =>
  emojiName && emojiName.length && SCORE_MAP[emojiName];

const handleScoreReactions: ReactionHandler = (
  _p,
  emoji,
  _u,
  message,
  remove = false
) => {
  if (!message) return;

  let value = getReactionValue(emoji.name);
  if (!value) return;

  const userID = message.author.id;
  if (!userID) return;

  if (remove) value *= -1;

  let lastScore = scores[userID] ?? 0;
  let newScore = lastScore + value;

  if (newScore < 0) newScore = 0;

  scores[userID] = lastScore + value;
  console.log(scores);
};

const handleScoreQuery = (message: Message) => {
  console.log(message);
};

const BOT_TRIGGER = "ph8, ";

const commandHandlers: {
  [command: string]: (message: Message, ...args: any[]) => void;
} = {
  help(message) {
    message.reply("hahahahaha");
  },
};

const handleCommandMessages = (message: Message) => {
  if (!message.content.startsWith(BOT_TRIGGER)) return;

  const [command, ...args] = message.content
    .slice(BOT_TRIGGER.length)
    .split(" ");

  if (!command) return;

  const handler = commandHandlers[command];
  if (handler) handler(message, args);
};

startBot({
  token: config.BOT_TOKEN,
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"],
  eventHandlers: {
    ready() {
      console.log("Successfully connected to gateway");
      console.log(`botID: ${botID}`);
    },
    messageCreate(message) {
      handleCommandMessages(message);
      // console.log(message);
      // if ([...message.mentions, ...message.mentionRoleIDs].includes(botID)) {
      //   handleScoreQuery(message)
      // }
    },
    reactionAdd(...args) {
      const [, emoji] = args;
      if (!emoji.name) return;
      handleScoreReactions(...args);
    },
    reactionRemove(...args) {
      const [, emoji] = args;
      if (!emoji.name) return;
      handleScoreReactions(...args, true);
    },
  },
});

// import { DiscordClient } from "./discord.ts";

// const discordClient = new DiscordClient();

await Promise.all([httpServer.listen({ port: config.HTTP_PORT })]);
