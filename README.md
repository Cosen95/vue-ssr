## 现状

目前营销活动页面整体评分在 40 分左右，目前进一步提升已有的计划：

- 对所有楼层进行图片优化和懒加载（计划采用 vue-lazyload，预计提升 10-20 分）
- 首页加载资源优先级调度，非首屏必需资源可延迟加载（defer）。目前已发现 ubt 加载耗时较久，改为延迟加载后，评分提升了 20 分左右

除了这些，目前一个很重要的问题就是首屏时间太久。考虑到服务端渲染会对首屏的内容到达时间有一个较大的提升，因此做了一下调研

## 思考

- 是否一定需要引入这种技术呢？他能解决什么问题，或者能带来什么收益？
- 为什么要采用这种技术选型而不是其他的？
- 引入了这种技术后，会带来什么问题吗（比如额外的开发成本等）？

### 方案及成本

现在营销项目是 Vue 技术栈，如果对接服务端渲染，有两条路可走：

- 保持原 Vue 技术栈，手动接入 ssr（[Vue.js 服务器端渲染指南](https://ssr.vuejs.org/zh/)）
- 接入 NFES（业务代码要转为 react 技术栈，但 NFES 天生支持 SSR）

两种方案各有利弊，但改造成本都不低

### 为什么服务端渲染就比客户端渲染快呢？

首先我们明确一点，服务端渲染比客户端渲染快的是首屏的内容到达时间（而非首屏可交互时间）。至于为什么会更快，我们可以从两者的`DOM渲染过程`来对比:

客户端渲染：浏览器发送请求 -> CDN / 应用服务器返回空 html 文件 -> 浏览器接收到空 html 文件，加载的 css 和 js 资源 -> 浏览器发送 css 和 js 资源请求 -> CDN / 应用服务器返回 css 和 js 文件 -> 浏览器解析 css 和 js -> js 中发送 ajax 请求到 Node 应用服务器 -> Node 服务器调用底层服务后返回结果 -> 前端拿到结果 setData 触发 vue 组件渲染 -> 组件渲染完成

![](https://gitee.com/fengshuan/assets/raw/master/2021-12-31/1640929564033-vue-ssr01.png)

服务端渲染：浏览器发送请求 -> Node 应用服务器匹配路由 -> 数据预取：Node 服务器调用底层服务拿到 asyncData 存入 store -> Node 端根据 store 生成 html 字符串返回给浏览器 -> 浏览器接收到 html 字符串将其激活

![](https://gitee.com/fengshuan/assets/raw/master/2021-12-31/1640929575664-vue-ssr02.png)

可以很明显地看出，客户端渲染的组件渲染强依赖 js 静态资源的加载以及 ajax 接口的返回时间，很大程度上制约了 DOM 生成的时间。而服务端渲染从用户发出一次页面 url 请求之后，应用服务器返回的 html 字符串就是完备的计算好的，可以交给浏览器直接渲染，使得 DOM 的渲染不再受静态资源和 ajax 的限制。

### 服务端渲染限制有哪些？

- 因为渲染过程是在 Node 端，所以没有 DOM 和 BOM 对象，因此不要在常见的 Vue 的 beforeCreate 和 created 生命周期钩子里做涉及 DOM 和 BOM 的操作
- 对第三方库的要求比较高，如果想直接在 Node 渲染过程中调用第三方库，那这个库必须支持服务端渲染

## Vue SSR 实现

![](https://gitee.com/fengshuan/assets/raw/master/2021-12-26/1640517408726-Vue-SSR01.png)

从官网给出的原理图，我们可以清晰地看出：

`Source` 为我们的源代码区，即工程代码

`Universal Appliation Code` 和我们平时的客户端渲染的代码组织形式完全一致，只是需要注意这些代码在 `Node` 端执行过程触发的生命周期钩子不要涉及 `DOM` 和 `BOM` 对象即可。

比客户端渲染多出来的 `app.js`、`Server entry` 、`Client entry` 的主要作用为：`app.js` 分别给 `Server entry` 、`Client entry` 暴露出 `createApp()`方法，使得每个请求进来会生成新的 `app 实例`。而 `Server entry` 和 `Client entry` 分别会被 `webpack` 打包成 `vue-ssr-server-bundle.json` 和 `vue-ssr-client-manifest.json`（这两个 json 文件才是有用的，app.js、Server entry 、Client entry 可以抽离，开发者不感知）

`Node` 端会根据 `webpack` 打包好的 `vue-ssr-server-bundle.json`，通过调用 `createBundleRenderer` 生成 `renderer` 实例，再通过调用 `renderer.renderToString` 生成完备的 `html 字符串`。

`Node` 端将`render` 好的`html 字符串`返回给 `Browser`，同时 `Node` 端根据 `vue-ssr-client-manifest.json` 生成的 `js` 会和 `html` 字符串 `hydrate`，完成`客户端激活 html`，使得页面可交互。

目前结合官方文档，写了一个 demo：https://github.com/Cosen95/vue-ssr

## 下一步计划

后面还是要探讨一下接入服务端渲染的收益比
