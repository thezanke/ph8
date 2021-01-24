FROM docker.pkg.github.com/thezanke/base-images/deno

COPY . .
RUN deno cache main.ts

CMD ["deno", "run", "--no-check", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "main.ts"]
