import { discord } from "./deps.ts";
import { getScore, REACTION_SCORES, setScore } from "./scoring.ts";

export const handleReactionReplies = (message: discord.DiscordenoMessage) => {
  if (!message.referencedMessage?.author.id) return;
  if (!message.referencedMessage?.content) return;

  const userID = `${message.authorId}`;

  const messageAuthorID = message.referencedMessage?.author?.id;
  if (!messageAuthorID || messageAuthorID === userID) return;

  const [emojiName, ...rest] = message.content.split(" ");

  if (rest.length) return;

  const value = REACTION_SCORES[emojiName];
  if (!value) return;

  const [
    referencedEmojiName,
    ...rRest
  ] = message.referencedMessage.content.split(" ");
  if (REACTION_SCORES[referencedEmojiName] && !rRest.length) return;

  const lastScore = getScore(messageAuthorID);
  setScore(messageAuthorID, lastScore + value);

  console.log("handled reaction reply");

  return true;
};
