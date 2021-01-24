import {
  startBot,
  MessageReactionUncachedPayload,
  ReactionPayload,
  Message,
  botID,
} from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import config from "./config.ts";
import { server } from "./httpServer.ts";
import { getScore, setScore } from "./scoring.ts";

interface ReactionHandler {
  (
    payload: MessageReactionUncachedPayload,
    emoji: ReactionPayload,
    userID: string,
    message?: Message,
    removal?: Boolean
  ): any;
}

const REACTION_SCORES: { [reaction: string]: number | undefined } = {
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
  "💯": 10,
  "🏆": 10,
  "👍": 1,
  "👎": -1,
  "⬆️": 1,
  "⬇️": -1,
  "👏": 1,
  "😂": 1,
  "🤣": 1,
  "🍆": -3,
  "💩": -5,
  "🤡": -10,
};

const getReactionValue = (emojiName?: string | null) =>
  emojiName && emojiName.length && REACTION_SCORES[emojiName];

const handleScoreReactions: ReactionHandler = (
  _p,
  emoji,
  userID,
  message,
  remove = false
) => {
  if (!message) return;

  let value = getReactionValue(emoji.name);
  if (!value) return;
  if (remove) value *= -1;

  const messageAuthorID = message.author.id;
  if (!messageAuthorID || messageAuthorID === userID) return;

  let lastScore = getScore(messageAuthorID);
  setScore(messageAuthorID, lastScore + value);
};

const BOT_TRIGGER = "ph8,";

const commandHandlers: {
  [command: string]: (
    message: Message,
    ...args: Array<string | undefined>
  ) => void;
} = {
  help(message, topic) {
    if (!topic) {
      message.reply(
        ["Topics: `scoring`.", "", `Say "${BOT_TRIGGER} help [topic]".`].join(
          "\n"
        )
      );
      return;
    }

    switch (topic) {
      case "scoring":
        message.reply(
          [
            "You can react to messages with certain emoji to add or subtract from a users score.",
            "",
            "Reactions and their values: ",
            ...Object.keys(REACTION_SCORES).map(
              (emoji) => `${emoji} == ${REACTION_SCORES[emoji]}`
            ),
            "",
            `You can retrieve your score by saying "${BOT_TRIGGER} my score".`,
            `You can retrieve other users\' scores by saying "${BOT_TRIGGER} score @username".`,
          ].join("\n")
        );
        break;
    }
  },
  my(message, subCommand) {
    if (subCommand === "score") {
      const score = getScore(message.author.id);
      message.reply(`${score || 0}`);
    }
  },

  score(message) {
    if (message.mentions) {
      message.reply(
        message.mentions
          .map((userID) => {
            const score = getScore(userID);
            return `<@${userID}> has ${score} points`;
          })
          .join("\n")
      );
    }
  },
};

const handleCommandMessages = (message: Message) => {
  if (!message.content.startsWith(BOT_TRIGGER)) return;

  const [, command, ...args] = message.content.split(" ");

  console.log({ command, args });

  if (!command) {
    message.reply("I'm not sure what that means, m8");
    return;
  }

  const handler = commandHandlers[command];
  if (handler) handler(message, ...args);
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
      handleCommandMessages(message);
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

server.listen({ port: config.HTTP_PORT });
