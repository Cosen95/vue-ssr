// 服务端渲染只需将渲染的实例导出即可
import { ContextExclusionPlugin } from "webpack";
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
      if (matchComponents.length == 0) {
        reject({ code: 404 });
      }
        // resolve(app);


      Promise.all(
        matchComponents.map((component) => {
          if (component.asyncData) {
            return component.asyncData(store);
          }
        })
      ).then(() => {
        // Promise.all中方法会改变store中的state
        // 把vuex的状态挂载到上下文中
        context.state = store.state;
        resolve(app);
      });
    }, reject);
  });
};
