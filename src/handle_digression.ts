import { Message } from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import { randomInt } from "./utils.ts";

export const handleDigression = (message: Message) => {
  if (!/but I digress/gi.test(message.content)) return;

  setTimeout(() => {
    message.reply(
      "You've digressed? Are you sure?\nhttps://www.google.com/search?q=digress"
    );
  }, randomInt(300, 1500));

  return true;
};
