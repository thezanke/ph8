FROM docker.pkg.github.com/thezanke/base-images/deno

COPY src src
RUN deno cache main.ts

CMD ["deno", "run", "--no-check", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "src/main.ts"]
