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
