# Requirements

You will need [Deno](https://deno.land) installed.
You will need [Docker](https://www.docker.com/products/docker-desktop) installed, or an alternative.

# Config

Copy `.env.sample` to `.env` in the root and fill in the values.

# Running

Running the bot using the compose file, using `docker-compose` that would look like:

```sh
docker-compose up
```

# Debugging

If you are using VSCode, the project includes a configuration for attaching to a running debugger; you should simply be able to push F5 while the bot is running using the command above.
