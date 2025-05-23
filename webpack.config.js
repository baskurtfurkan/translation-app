const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "https": require.resolve("https-browserify"),
      "http": require.resolve("stream-http"),
      "querystring": require.resolve("querystring-es3"),
      "assert": require.resolve("assert/"),
      "buffer": require.resolve("buffer/"),
      "url": require.resolve("url/"),
      "os": require.resolve("os-browserify/browser"),
      "util": require.resolve("util/"),
      "net": false,
      "tls": false,
      "fs": false,
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
}; 