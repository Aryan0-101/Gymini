const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'db' to the list of asset extensions so that metro bundles gymx.db
config.resolver.assetExts.push('db');

module.exports = config;
