const config: { [name: string]: any } = {
  LOG_LEVEL: Deno.env.get("LOG_LEVEL") ?? "INFO",
};

let httpPort = Deno.env.get("HTTP_PORT");
config.HTTP_PORT = httpPort ? Number(httpPort) : 3333;

const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
if (!discordBotToken) throw Error("missing discord token");
config.DISCORD_BOT_TOKEN = discordBotToken;

export default config;
