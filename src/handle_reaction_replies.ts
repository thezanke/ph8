import { Message } from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import { getScore, REACTION_SCORES, setScore } from "./scoring.ts";

export const handleReactionReplies = (message: Message) => {
  if (!message.referencedMessageID?.author.id) return;

  const userID = message.author.id;

  const messageAuthorID = message.referencedMessageID?.author?.id;
  if (!messageAuthorID || messageAuthorID === userID) return;

  const [emojiName] = message.content.split(' ');

  let value = REACTION_SCORES[emojiName];
  if (!value) return;

  let lastScore = getScore(messageAuthorID);
  setScore(messageAuthorID, lastScore + value);

  console.log("handled reaction reply");

  return true;
}