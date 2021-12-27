import Vue from "vue";
import VueRouter from "vue-router";
import Foo from "./components/Foo.vue";
Vue.use(VueRouter);

export default () => {
  const router = new VueRouter({
    mode: "history",
    routes: [
      { path: "/", component: Foo },
      { path: "/bar", component: () => import("./components/Bar.vue") },
    ],
  });
  return router;
};
