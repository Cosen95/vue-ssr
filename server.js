const Koa = require("koa");
const Router = require("koa-router");
const static = require("koa-static");
const fs = require("fs");
const app = new Koa();
const router = new Router();
const path = require("path");
const VueServerRender = require("vue-server-renderer");

// const ServerBundle = fs.readFileSync("./dist/server.bundle.js", "utf8");
const ServerBundle = require("./dist/vue-ssr-server-bundle.json");

const template = fs.readFileSync("./dist/server.html", "utf8");
const clientManifest = require("./dist/vue-ssr-client-manifest.json");
const render = VueServerRender.createBundleRenderer(ServerBundle, {
  template,
  clientManifest,
});

router.get("/", async (ctx) => {
  ctx.body = await new Promise((resolve, reject) => {
    render.renderToString({ url: "/" }, (err, data) => {
      console.log("data", data);
      if (err) reject(err);
      resolve(data);
    });
  });
});

app.use(router.routes());
// 当客户端发送请求时会先去dist目录下查找
app.use(static(path.resolve(__dirname, "dist")));
app.use(async (ctx) => {
  try {
    ctx.body = await new Promise((resolve, reject) => {
      render.renderToString({ url: ctx.url }, (err, data) => {
        console.log("data", data);
        if (err) reject(err);
        resolve(data);
      });
    });
  } catch (error) {
    ctx.body = "404";
  }
});
app.listen(3000);
