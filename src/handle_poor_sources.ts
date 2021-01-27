import { Message } from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import config from "./config.ts";
import { pickRandom } from "./utils.ts";

const REPLIES = ["uhhhh....", "yikeees.", "hahhahhahahahaha", "oh boy", "🍿🤡"];

export const handlePoorSources = (message: Message) => {
  if (!config.POOR_SOURCES?.length) return;

  const poorSources = config.POOR_SOURCES.join("|");
  const re = new RegExp(`https?://(?:[a-z]+.)+(?:${poorSources})`, "gi");

  if (!re.test(message.content)) return;
  
  message.reply(pickRandom(REPLIES));

  return true;
};
