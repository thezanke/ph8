import { Message } from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import config from "./config.ts";
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

export const handlePoorSources = (message: Message) => {
  if (!config.POOR_SOURCES?.length) return;

  const poorSources = config.POOR_SOURCES.join("|");
  const re = new RegExp(`https?://(?:[a-z]+.)*(?:${poorSources})`, "gi");

  if (!re.test(message.content)) return;

  setTimeout(() => {
    message.reply(pickRandom(REPLIES));
  }, randomInt(300, 3000));

  return true;
};
