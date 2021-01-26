import { Message } from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import config from "./config.ts";

export const handlePoorSources = (message: Message) => {
  if (!config.POOR_SOURCES) return;

  const poorSources = config.POOR_SOURCES.join("|");
  const re = new RegExp(`https?:\/\/(?: ${poorSources})`, "gi");

  if (!re.test(message.content)) return;

  message.reply('uhh.... :grimace:');

  return true;
};
