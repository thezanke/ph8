import { Application, Router } from "https://deno.land/x/oak@v6.2.0/mod.ts";
import { getScores } from "./scoring.ts";

export const router = new Router();
router.get("/", (ctx) => {
  ctx.response.body = "i am ph8";
});

router.get("/scores", (ctx) => {
  const scores = getScores();
  const scoreStr = JSON.stringify(scores, null, 2);
  ctx.response.body = `${scoreStr}`;
});

export const server = new Application();
server.use(router.routes());
server.use(router.allowedMethods());
