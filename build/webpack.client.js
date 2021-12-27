const { merge } = require("webpack-merge");
const base = require("./webpack.base");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const ClientRenderPlugin = require("vue-server-renderer/client-plugin");
const resolve = (dir) => {
  return path.resolve(__dirname, dir);
};

module.exports = merge(base, {
  entry: {
    client: resolve("../src/client-entry.js"),
  },
  plugins: [
    new ClientRenderPlugin(),
    new HtmlWebpackPlugin({
      filename: "client.html",
      template: resolve("../public/client.html"),
    }),
  ],
});
