import { discord } from "./deps.ts";
import { addScore } from "./scoring.ts";
import { randomInt } from "./utils.ts";

export const handleDigression = (message: discord.DiscordenoMessage) => {
  if (!/but I digress/gi.test(message.content)) return;

  addScore(message.authorId, -1);

  setTimeout(() => {
    message.reply(
      "You've digressed? Are you sure?\nhttps://www.google.com/search?q=digress",
    );
  }, randomInt(300, 1500));

  return true;
};
