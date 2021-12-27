// 客户端渲染手动挂载到 dom 元素上
import createApp from "./main";
const { app } = createApp();

app.$mount("#app");
