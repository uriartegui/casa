const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro doesn't understand Sentry's "development"/"production" export conditions,
// causing @sentry/browser resolution to fail. Disabling packageExports makes Metro
// fall back to the "main" field which resolves correctly.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
