import { discord } from "./deps.ts";
import config from "./config.ts";
import { addScore } from "./scoring.ts";
import { pickRandom, randomInt } from "./utils.ts";

const REPLIES = [
  "uhhhh....",
  "yikeees.",
  "hahhahhahahahaha",
  "oh boy",
  "🍿🤡",
  "💩 links are 💩",
  "🤡🖌",
];

export const handlePoorSources = (message: discord.DiscordenoMessage) => {
  if (!config.POOR_SOURCES?.length) return;

  const poorSources = config.POOR_SOURCES.join("|");
  const re = new RegExp(`https?://(?:[a-z]+.)*(?:${poorSources})`, "gi");

  if (!re.test(message.content)) return;

  addScore(message.authorId, -3);

  setTimeout(() => {
    message.reply(pickRandom(REPLIES));
  }, randomInt(300, 3000));

  return true;
};
