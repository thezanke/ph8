import { Message } from "https://deno.land/x/discordeno@10.1.0/mod.ts";

export const handleDigression = (message: Message) => {
  if (!/but I digress/gi.test(message.content)) return;

  message.reply(
    "You've digressed? Are you sure?\nhttps://www.google.com/search?q=digress"
  );

  return true;
};
