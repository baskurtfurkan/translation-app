const webpack = require("webpack");

module.exports = {
  resolve: {
    fallback: {
      stream: false,
      crypto: false,
      http: false,
      https: false,
      os: false,
      path: false,
      querystring: false,
      util: false,
      url: false,
      assert: false,
      buffer: false,
      events: false,
      process: false,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
};
