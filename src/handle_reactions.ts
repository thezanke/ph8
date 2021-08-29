import { discord } from "./deps.ts";
import { getScore, REACTION_SCORES, setScore } from "./scoring.ts";

export const handleReactions = (
  data: discord.MessageReactionAdd|discord.MessageReactionRemove,
  message?: discord.DiscordenoMessage,
  isRemove = false
) => {
  if (!data || !message) return;
  if (!data.emoji.name) return;
  if (!data.emoji.name.length) return;

  let value = REACTION_SCORES[data.emoji.name];
  if (!value) return;

  if (isRemove) value *= -1;

  const messageAuthorID = message.authorId;
  if (!messageAuthorID || `${messageAuthorID}` === data.userId) return;

  const lastScore = getScore(messageAuthorID);
  setScore(messageAuthorID, lastScore + value);
};
