const { merge } = require("webpack-merge");
const base = require("./webpack.base");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const ServerRenderPlugin = require("vue-server-renderer/server-plugin");
const resolve = (dir) => {
  return path.resolve(__dirname, dir);
};

module.exports = merge(base, {
  target: "node",
  entry: {
    server: resolve("../src/server-entry.js"),
  },
  output: {
    libraryTarget: "commonjs2", // module.exports 导出
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "server.html",
      template: resolve("../public/server.html"),
      excludeChunks: ["server"], //忽略server.js
      minify: false, //不压缩
      // client: "/client.bundle.js",
    }),
    new ServerRenderPlugin(),
  ],
});
