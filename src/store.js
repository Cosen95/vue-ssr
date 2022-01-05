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
