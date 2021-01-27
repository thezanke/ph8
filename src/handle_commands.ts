import { Message } from "https://deno.land/x/discordeno@10.1.0/mod.ts";
import { getScore, REACTION_SCORES } from "./scoring.ts";

const COMMAND_TRIGGER = "ph8";

const commandHandlers: {
  [command: string]: (
    message: Message,
    ...args: Array<string | undefined>
  ) => void;
} = {
  help(message, topic) {
    if (!topic) {
      message.reply(
        [
          "Topics: `scoring`.",
          "",
          `Say "${COMMAND_TRIGGER} help [topic]".`,
        ].join("\n")
      );
      return;
    }

    switch (topic) {
      case "scoring":
        message.reply(
          [
            "You can react to messages with certain emoji to add or subtract from a users score.",
            "",
            "Reactions and their values: ",
            ...Object.keys(REACTION_SCORES).map(
              (emoji) => `${emoji} == ${REACTION_SCORES[emoji]}`
            ),
            "",
            `You can retrieve your score by saying "${COMMAND_TRIGGER} my score".`,
            `You can retrieve other users\' scores by saying "${COMMAND_TRIGGER} score @username".`,
          ].join("\n")
        );
        break;
    }
  },
  my(message, subCommand) {
    if (subCommand === "score") {
      const score = getScore(message.author.id);
      message.reply(`${score || 0}`);
    }
  },

  score(message) {
    if (message.mentions.length) {
      message.reply(
        message.mentions
          .map((userID) => {
            const score = getScore(userID);
            return `<@${userID}> has ${score} points`;
          })
          .join("\n")
      );
    }
  },
};

export const handleCommands = (message: Message) => {
  if (!message.content.toLowerCase().startsWith(COMMAND_TRIGGER)) return;

  const [, command, ...args] = message.content.split(" ");

  console.log({ command, args });

  if (!command) {
    message.reply("Yeah, bud?");
    return true;
  }

  const handler = commandHandlers[command];
  if (handler) {
    handler(message, ...args);
    return true;
  }

  message.reply("I'm not sure what that means, m8.");
  return true;
};
