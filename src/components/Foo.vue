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
