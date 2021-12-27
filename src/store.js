import Vue from "vue";
import Vuex from "vuex";
import { resolve } from "../build/webpack.base";

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
  // 浏览器执行时需要将服务端的最新store状态替换掉客户端的store
  if (typeof window !== "undefined" && window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__);
  }
  return store;
};
