const webpack = require("webpack");

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    os: require.resolve("os-browserify/browser"),
    domain: require.resolve("domain-browser"),
    assert: require.resolve("assert/"),
    buffer: require.resolve("buffer/"),
    console: require.resolve("console-browserify"),
    constants: require.resolve("constants-browserify"),
    crypto: require.resolve("crypto-browserify"),
    events: require.resolve("events/"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    path: require.resolve("path-browserify"),
    punycode: require.resolve("punycode/"),
    process: require.resolve("process/browser"),
    querystring: require.resolve("querystring-es3"),
    stream: require.resolve("stream-browserify"),
    string_decoder: require.resolve("string_decoder/"),
    sys: require.resolve("util/"),
    timers: require.resolve("timers-browserify"),
    tty: require.resolve("tty-browserify"),
    url: require.resolve("url/"),
    util: require.resolve("util/"),
    vm: require.resolve("vm-browserify"),
    zlib: require.resolve("browserify-zlib"),
    fs: false,
    net: false,
    tls: false,
    child_process: false,
    http: false,
    https: false,
    async_hooks: false,
    perf_hooks: false,
  };
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
  ]);
  config.resolve.alias = {
    ...config.resolve.alias,
    "node:util": "util",
    "node:stream": "stream",
    "node:events": "events",
    "ethereum-cryptography/secp256k1": require.resolve(
        "ethereum-cryptography/secp256k1.js"),
  };
  config.module.rules.push({
    test: /\.js$/,
    loader: require.resolve("babel-loader"),
    options: {
      presets: ["@babel/preset-env", "@babel/preset-react"],
      plugins: ["@babel/plugin-syntax-dynamic-import"],
    },
  });
  config.module.rules.forEach((rule) => {
    if (rule.use) {
      rule.use.forEach((use) => {
        if (use.loader && use.loader.includes("source-map-loader")) {
          use.options = {
            ...use.options,
            enforce: "pre",
            skipSourceMapComment: true,
          };
        }
      });
    }
  });
  return config;
};
