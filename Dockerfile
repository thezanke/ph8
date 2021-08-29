FROM ghcr.io/thezanke/base-images/deno:latest as base
COPY src src
RUN deno install --lock=deno-lock.json --lock-write src/main.ts

FROM base as development
RUN deno install --allow-read --allow-run --allow-write -f --unstable https://deno.land/x/denon/denon.ts
COPY scripts.json .
CMD ["denon", "start"]

FROM ghcr.io/thezanke/base-images/deno:latest as production
LABEL org.opencontainers.image.source https://github.com/thezanke/ph8
COPY --from=base /home/deno/deno-lock.json ./
COPY --from=base /home/deno/src src
CMD ["deno", "run", "-A", "--lock=deno-lock.json", "src/main.ts"]
