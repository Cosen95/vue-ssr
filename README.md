最近无论是在公司还是自己研究的项目，都一直在搞 H5 页面`服务端渲染`方面的探索，因此本文来探讨一下服务端渲染的必要性以及其背后的原理。

## 先来看几个问题

### To C 的 H5 为什么适合做 SSR

`To C`的`营销H5`页面的典型特点是：

- 流量大
- 交互相对简单（尤其是由搭建平台搭建的活动页面）
- 对于页面的首屏一般都有比较高的要求

那么此时作为传统的`CSR`渲染方式为什么就不合适了呢？

看了下面一小节，也许你就有答案了

### 为什么服务端渲染就比客户端渲染快呢？

我们分别来对比一下两者的`DOM`渲染过程。

> 图片来源[The Benefits of Server Side Rendering Over Client Side Rendering](https://medium.com/walmartglobaltech/the-benefits-of-server-side-rendering-over-client-side-rendering-5d07ff2cefe8)

#### 客户端渲染

![](https://gitee.com/fengshuan/assets/raw/master/2022-1-1/1641032139842-Vue-SSR02.png)

#### 服务端渲染

![](https://gitee.com/fengshuan/assets/raw/master/2022-1-1/1641032192728-Vue-SSR03.png)

客户端渲染，需要先得到一个空的 `HTML 页面`（这个时候页面已经进入白屏）之后还需要经历：

- 请求并解析`JavaScript`和`CSS`
- 请求后端服务器获取数据
- 根据数据渲染页面

几个过程才可以看到最后的页面。

特别是在复杂应用中，由于需要加载 `JavaScript` 脚本，越是复杂的应用，需要加载的 `JavaScript` 脚本就越多、越大，这就会导致应用的`首屏加载时间`非常长，进而影响用户体验感。

相对于客户端渲染，服务端渲染在用户发出一次页面 `url` 请求之后，应用服务器返回的 `html` 字符串就是完备的计算好的，可以交给浏览器直接渲染，使得 `DOM` 的渲染不再受静态资源和 `ajax` 的限制。

### 服务端渲染限制有哪些？

但服务端渲染真的就那么好吗？

其实，也不是。

为了实现服务端渲染，应用代码中需要兼容服务端和客户端两种运行情况，对第三方库的要求比较高，如果想直接在 Node 渲染过程中调用第三方库，那这个库必须支持服务端渲染。对应的代码复杂度提升了很多。

由于服务器增加了渲染 `HTML` 的需求，使得原本只需要输出静态资源文件的 `nodejs` 服务，新增了数据获取的 `IO` 和渲染 `HTML` 的 `CPU` 占用，如果流量陡增，有可能导致服务器宕机，因此需要使用相应的缓存策略和准备相应的服务器负载。

对于构建部署也有了更高的要求，之前的`SPA应用`可以直接部署在静态文件服务器上，而服务器渲染应用，需要处于 `Node.js server` 运行环境。

## Vue SSR 原理

聊了这么多可能你对于服务端渲染的原理还不是很清楚，下面我就以`Vue`服务端渲染为例来简述一下其原理：
![](https://gitee.com/fengshuan/assets/raw/master/2022-1-3/1641211590535-Vue-SSR01.png)

这张图来自[Vue SSR 指南](https://ssr.vuejs.org/zh/)

> 原理解析参考[如何搭建一个高可用的服务端渲染工程](https://tech.youzan.com/server-side-render/)

`Source`为我们的源代码区，即工程代码。

`Universal Appliation Code`和我们平时的客户端渲染的代码组织形式完全一致，因为渲染过程是在`Node`端，所以没有`DOM`和`BOM`对象，因此不要在`beforeCreate`和`created`生命周期钩子里做涉及`DOM`和`BOM`的操作。

比客户端渲染多出来的`app.js`、`Server entry` 、`Client entry`的主要作用为：

- `app.js`分别给`Server entry` 、`Client entry`暴露出`createApp()`方法，使得每个请求进来会生成新的`app`实例
- 而`Server entry`和`Client entry`分别会被`webpack`打包成`vue-ssr-server-bundle.json`和`vue-ssr-client-manifest.json`

`Node`端会根据`webpack`打包好的`vue-ssr-server-bundle.json`，通过调用`createBundleRenderer`生成`renderer`实例，再通过调用`renderer.renderToString`生成完备的`html字符串`。

`Node`端将`render`好的`html`字符串返回给`Browser`，同时`Node`端根据`vue-ssr-client-manifest.json`生成的`js`会和`html`字符串`hydrate`，完成客户端激活`html`，使得页面可交互。

## 写一个 demo 来落地 SSR

我们知道市面上实现服务端渲染一般有这几种方法：

- 使用`next.js`/`nuxt.js`的服务端渲染方案
- 使用`node`+`vue-server-renderer`实现`vue`项目的服务端渲染(也就是上面提到的)
- 使用`node`+`React renderToStaticMarkup/renderToString`实现`react`项目的服务端渲染
- 使用模板引擎来实现`ssr`(比如`ejs`, `jade`, `pug`等)

最近要改造的项目正好是 `Vue` 开发的，目前也考虑基于`vue-server-renderer`将其改造为服务端渲染的。基于上面分析的原理，我从零一步步搭建了一个最小化的[vue-ssr](https://github.com/Cosen95/vue-ssr)，大家有需要的可直接拿去用～

![](https://gitee.com/fengshuan/assets/raw/master/2022-1-3/1641212521190-Vue-SSR04.png)

这里我贴几点需要注意的：

### 使用 `SSR` 不存在单例模式

我们知道`Node.js` 服务器是一个长期运行的进程。当我们的代码进入该进程时，它将进行一次取值并留存在内存中。这意味着如果创建一个单例对象，它将在每个传入的请求之间共享。所以每次用户请求都会创建一个新的 `Vue` 实例，这也是为了避免交叉请求状态污染的发生。

因此，我们不应该直接创建一个应用程序实例，而是应该暴露一个可以重复执行的工厂函数，为每个请求创建新的应用程序实例：

```js
// main.js
import Vue from "vue";
import App from "./App.vue";
import createRouter from "./router";
import createStore from "./store";

export default () => {
  const router = createRouter();
  const store = createStore();
  const app = new Vue({
    router,
    store,
    render: (h) => h(App),
  });
  return { app, router, store };
};
```

### 服务端代码构建

服务端代码与客户端代码构建的区别在于：

- 不需要编译`CSS`，服务器端渲染会自动将`CSS`内置
- 构建目标为`nodejs`环境
- 不需要代码切割，`nodejs` 将所有代码一次性加载到内存中更有利于运行效率

```js
// vue.config.js
// 两个插件分别负责打包客户端和服务端
const VueSSRServerPlugin = require("vue-server-renderer/server-plugin");
const VueSSRClientPlugin = require("vue-server-renderer/client-plugin");
const nodeExternals = require("webpack-node-externals");
const merge = require("lodash.merge");
// 根据传⼊环境变量决定⼊⼝⽂件和相应配置项
const TARGET_NODE = process.env.WEBPACK_TARGET === "node";
const target = TARGET_NODE ? "server" : "client";
module.exports = {
  css: {
    extract: false,
  },
  outputDir: "./dist/" + target,
  configureWebpack: () => ({
    // 将 entry 指向应⽤程序的 server / client ⽂件
    entry: `./src/${target}-entry.js`,
    // 对 bundle renderer 提供 source map ⽀持
    devtool: "source-map",
    // target设置为node使webpack以Node适⽤的⽅式处理动态导⼊，
    // 并且还会在编译Vue组件时告知`vue-loader`输出⾯向服务器代码。
    target: TARGET_NODE ? "node" : "web",
    // 是否模拟node全局变量
    node: TARGET_NODE ? undefined : false,
    output: {
      // 此处使⽤Node⻛格导出模块
      libraryTarget: TARGET_NODE ? "commonjs2" : undefined,
    },
    externals: TARGET_NODE
      ? nodeExternals({
          allowlist: [/\.css$/],
        })
      : undefined,
    optimization: {
      splitChunks: undefined,
    },
    // 这是将服务器的整个输出构建为单个 JSON ⽂件的插件。
    // 服务端默认⽂件名为 `vue-ssr-server-bundle.json`
    // 客户端默认⽂件名为 `vue-ssr-client-manifest.json`。
    plugins: [
      TARGET_NODE ? new VueSSRServerPlugin() : new VueSSRClientPlugin(),
    ],
  }),
  chainWebpack: (config) => {
    // cli4项⽬添加
    if (TARGET_NODE) {
      config.optimization.delete("splitChunks");
    }

    config.module
      .rule("vue")
      .use("vue-loader")
      .tap((options) => {
        merge(options, {
          optimizeSSR: false,
        });
      });
  },
};
```

### 处理 CSS

正常服务端路由我们可能会这样写：

```js
router.get("/", async (ctx) => {
  ctx.body = await render.renderToString();
});
```

但这样打包后，启动`server`你会发现样式没生效。这个问题我们需要通过`promise`的方式来解决：

```js
pp.use(async (ctx) => {
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
```

### 处理事件

之所以事件没有生效是因为我们没有进行`客户端激活`操作，也就是把客户端打包出来的`clientBundle.js`挂载到`HTML`上。

首先我们要在`App.vue`的根结点加上`app`的`id`：

```js
<template>
  <!-- 客户端激活 -->
  <div id="app">
    <router-link to="/">foo</router-link>
    <router-link to="/bar">bar</router-link>
    <router-view></router-view>
  </div>
</template>

<script>
import Bar from "./components/Bar.vue";
import Foo from "./components/Foo.vue";
export default {
  components: {
    Bar,
    Foo,
  },
};
</script>

```

然后通过`vue-server-renderer`中的`server-plugin`和`client-plugin`分别生成`vue-ssr-server-bundle.json`和`vue-ssr-client-manifest.json`文件，也就是服务端映射和客户端映射。

最后在`node`服务这里做下关联：

```js
const ServerBundle = require("./dist/server/vue-ssr-server-bundle.json");

const template = fs.readFileSync("./public/index.html", "utf8");
const clientManifest = require("./dist/client/vue-ssr-client-manifest.json");
const render = VueServerRender.createBundleRenderer(ServerBundle, {
  runInNewContext: false, // 推荐
  template,
  clientManifest,
});
```

这样就完成了客户端激活操作，也就支持了 `css` 和事件。

### 数据模型的共享与状态同步

在服务端渲染生成 `html` 前，我们需要预先获取并解析依赖的数据。同时，在客户端挂载（mounted）之前，需要获取和服务端完全一致的数据，否则客户端会因为数据不一致导致混入失败。

为了解决这个问题，预获取的数据要存储在状态管理器（store）中，以保证数据一致性。

首先是创建`store`实例，同时供客户端和服务端使用：

```js
// src/store.js
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default () => {
  const store = new Vuex.Store({
    state: {
      name: "",
    },
    mutations: {
      changeName(state) {
        state.name = "cosen";
      },
    },
    actions: {
      changeName({ commit }) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            commit("changeName");
            resolve();
          }, 1000);
        });
      },
    },
  });

  return store;
};
```

将`createStore`加入到`createApp`中，并将`store`注入到`vue`实例中，让所有`Vue`组件可以获取到`store`实例：

```js
import Vue from "vue";
import App from "./App.vue";
import createRouter from "./router";
+ import createStore from "./store";

export default () => {
  const router = createRouter();
+  const store = createStore();
  const app = new Vue({
    router,
+    store,
    render: (h) => h(App),
  });
+  return { app, router, store };
};

```

在页面中使用`store`：

```js
// src/components/Foo.vue
<template>
  <div>
    Foo
    <button @click="clickMe">点击</button>
    {{ this.$store.state.name }}
  </div>
</template>
<script>
export default {
  mounted() {
    this.$store.dispatch("changeName");
  },
  asyncData({ store, route }) {
    return store.dispatch("changeName");
  },
  methods: {
    clickMe() {
      alert("测试点击");
    },
  },
};
</script>

```

如果用过`nuxt`的同学肯定知道在`nuxt`中有一个钩子叫`asyncData`，我们可以在这个钩子发起一些请求，而且这些请求是在服务端发出的。

那我们来看下如何实现 `asyncData` 吧，在 `server-entry.js` 中我们通过 `const matchs = router.getMatchedComponents()`获取到匹配当前路由的所有组件，也就是我们可以拿到所有组件的 `asyncData` 方法：

```js
// src/server-entry.js
// 服务端渲染只需将渲染的实例导出即可
import createApp from "./main";
export default (context) => {
  const { url } = context;
  return new Promise((resolve, reject) => {
    console.log("url", url);
    // if (url.endsWith(".js")) {
    //   resolve(app);
    //   return;
    // }
    const { app, router, store } = createApp();
    router.push(url);
    router.onReady(() => {
      const matchComponents = router.getMatchedComponents();
      console.log("matchComponents", matchComponents);
      if (!matchComponents.length) {
        reject({ code: 404 });
      }
      // resolve(app);

      Promise.all(
        matchComponents.map((component) => {
          if (component.asyncData) {
            return component.asyncData({
              store,
              route: router.currentRoute,
            });
          }
        })
      )
        .then(() => {
          // Promise.all中方法会改变store中的state
          // 把vuex的状态挂载到上下文中
          context.state = store.state;
          resolve(app);
        })
        .catch(reject);
    }, reject);
  });
};
```

通过 `Promise.all` 我们就可以让所有匹配到的组件中的`asyncData`执行，然后修改服务端的`store`了。而且也将服务端的最新`store`同步到客户端的`store`中。

### 客户端激活状态数据

上一步将`state`存入`context`后，在服务端渲染`HTML`时，也就是渲染`template`的时候，`context.state`会被序列化到`window.__INITIAL_STATE__`中：

![](https://gitee.com/fengshuan/assets/raw/master/2022-1-5/1641382088910-vue-ssr03.png)

可以看到，状态已经被序列化到 `window.__INITIAL_STATE__`中，我们需要做的就是将这个 `window.__INITIAL_STATE__`在客户端渲染之前，同步到客户端的 `store` 中，下面修改 `client-entry.js`：

```js
// 客户端渲染手动挂载到 dom 元素上
import createApp from "./main";
const { app, router, store } = createApp();

// 浏览器执行时需要将服务端的最新store状态替换掉客户端的store
if (window.__INITIAL_STATE__) {
  // 激活状态数据
  store.replaceState(window.__INITIAL_STATE__);
}

router.onReady(() => {
  app.$mount("#app", true);
});
```

通过使用`store`的`replaceState`函数，将`window.__INITIAL_STATE__`同步到`store`内部，完成数据模型的状态同步。
