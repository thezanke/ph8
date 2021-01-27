import {
  MessageReactionUncachedPayload,
  ReactionPayload,
  Message,
} from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import { getScore, REACTION_SCORES, setScore } from "./scoring.ts";

interface ReactionHandler {
  (
    payload: MessageReactionUncachedPayload,
    emoji: ReactionPayload,
    userID: string,
    message?: Message,
    removal?: Boolean
  ): any;
}

export const handleReactions: ReactionHandler = (
  _p,
  emoji,
  userID,
  message,
  remove = false
) => {
  if (!message) return;
  if (!emoji.name?.length) return;

  let value = REACTION_SCORES[emoji.name];
  if (!value) return;

  if (remove) value *= -1;

  const messageAuthorID = message.author.id;
  if (!messageAuthorID || messageAuthorID === userID) return;

  let lastScore = getScore(messageAuthorID);
  setScore(messageAuthorID, lastScore + value);
};
