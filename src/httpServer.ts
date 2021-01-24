import { Application, Router } from "https://deno.land/x/oak@v6.2.0/mod.ts";

export const router = new Router();
router.get("/", (ctx) => {
  ctx.response.body = "i am ph8";
});

router.get("/scores.json", async (ctx) => {
  await ctx.send({ root: `${Deno.cwd()}/data`, path: "scores.json" });
});

export const server = new Application();
server.use(router.routes());
server.use(router.allowedMethods());
