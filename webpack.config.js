const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const fs = require("fs");

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    fallback: {
      stream: require.resolve("stream-browserify"),
      https: require.resolve("https-browserify"),
      http: require.resolve("stream-http"),
      querystring: require.resolve("querystring-es3"),
      assert: require.resolve("assert/"),
      buffer: require.resolve("buffer/"),
      url: require.resolve("url/"),
      os: require.resolve("os-browserify/browser"),
      util: require.resolve("util/"),
      net: false,
      tls: false,
      fs: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
  ],
  devServer: {
    historyApiFallback: true,
    port: 8081,
    host: "0.0.0.0",
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    static: {
      directory: path.join(__dirname, "public"),
    },
    client: {
      webSocketURL: "auto://0.0.0.0:0/ws",
    },
    server: {
      type: 'https',
      options: {
        cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
        key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
      },
    },
  },
};
