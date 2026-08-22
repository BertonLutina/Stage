const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
const vectorIcons = path.resolve(__dirname, 'node_modules/@expo/vector-icons');

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@expo/vector-icons': vectorIcons,
};

const withNw = withNativeWind(config, {
  input: './global.css',
});

const previousResolveRequest = withNw.resolver.resolveRequest;
withNw.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@expo/vector-icons' || moduleName.startsWith('@expo/vector-icons/')) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform
    );
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNw;
