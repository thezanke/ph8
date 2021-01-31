interface Config {
  LOG_LEVEL: string;
  HTTP_PORT: number;
  DISCORD_BOT_TOKEN: string;
  POOR_SOURCES?: string[];
}

const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
if (!discordBotToken) throw Error("missing discord token");

const logLevel = Deno.env.get("LOG_LEVEL");
const httpPort = Deno.env.get("HTTP_PORT");
const poorSources = Deno.env.get("POOR_SOURCES");

const config: Config = {
  LOG_LEVEL: logLevel ?? "INFO",
  HTTP_PORT: httpPort ? Number(httpPort) : 3333,
  DISCORD_BOT_TOKEN: discordBotToken,
  POOR_SOURCES: poorSources?.split(/\r?\n/),
};

export default config;
