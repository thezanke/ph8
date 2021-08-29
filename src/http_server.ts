import { oak } from "./deps.ts";

export const router = new oak.Router();
router.get("/", (ctx) => {
  ctx.response.body = "i am ph8, hello world";
});

router.get("/scores.json", async (ctx) => {
  await ctx.send({ root: `${Deno.cwd()}/data`, path: "scores.json" });
});

export const server = new oak.Application();
server.use(router.routes());
server.use(router.allowedMethods());
