FROM ghcr.io/thezanke/base-images/deno:latest

LABEL org.opencontainers.image.source https://github.com/thezanke/ph8

COPY src src
RUN deno cache main.ts

CMD ["deno", "run", "--no-check", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "src/main.ts"]
