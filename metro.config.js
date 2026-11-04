// Metro bundler config: the default Expo config, plus:
// - `.db` files as assets, so the bundled OpenStreetMap database (assets/data/places.db) ships in the app;
// - `.wasm` files and two headers, which expo-sqlite needs to run in the web preview (no effect on phones).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('db', 'wasm');

config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  // SQLite in the browser uses SharedArrayBuffer, which browsers only allow on "cross-origin isolated" pages.
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;
