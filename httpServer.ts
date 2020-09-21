import { Application, Router } from "https://deno.land/x/oak@v6.2.0/mod.ts";

const router = new Router();
router.get("/", (ctx) => {
  ctx.response.body = "Hello World";
});

const httpServer = new Application();
httpServer.use(router.routes());
httpServer.use(router.allowedMethods());

export default httpServer;
