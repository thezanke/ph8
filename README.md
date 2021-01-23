# Requirements

You will need [Deno](https://deno.land) Installed.

# Config

Copy the following to a `config.ts` file to the repository root and fill in the values.

```ts
export default {
  SLACK_CLIENT_ID: "", // not used yet
  SLACK_CLIENT_SECRET: "", // not used yet
  DISCORD_BOT_TOKEN: "",
  HTTP_PORT: 3333,
  LOG_LEVEL: 'INFO',
};
```

# Running

Running the bot is simple, execute the following:

```sh
deno run --allow-net --inspect main.ts
```

# Debugging

If you are using VSCode the project includes a configuration for attaching to a running debugger; you should simply be able to push F5 while the bot is running using the command above.
