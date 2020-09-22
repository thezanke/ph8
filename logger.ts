import * as log from "https://deno.land/std/log/mod.ts";
import config from "./config.ts";

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler(
      config.LOG_LEVEL as log.LevelName || "DEBUG",
    ),
  },
  loggers: {
    default: { level: "DEBUG", handlers: ["console"] },
  },
});

export default log.getLogger();
