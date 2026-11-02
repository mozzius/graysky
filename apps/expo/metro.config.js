// Learn more: https://docs.expo.dev/guides/monorepos/
// const { getDefaultConfig } = require("@expo/metro-config"); // replaced by:
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Create the default Metro config
const config = getSentryExpoConfig(projectRoot);

if (config.resolver) {
  // 1. Watch all files within the monorepo
  config.watchFolders = [workspaceRoot];
  // 2. Let Metro know where to resolve packages and in what order
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ];
  // 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
  config.resolver.disableHierarchicalLookup = true;

  // 4. expo-router vendors its own copy of react-navigation. libraries that
  // import @react-navigation/* directly (react-native-bottom-tabs, sentry)
  // would otherwise get a separate copy with separate contexts, so point them
  // at the vendored one
  const vendoredNavigation = {
    "@react-navigation/native":
      "expo-router/build/react-navigation/native/index.js",
    "@react-navigation/core":
      "expo-router/build/react-navigation/core/index.js",
    "@react-navigation/elements":
      "expo-router/build/react-navigation/elements/index.js",
    "@react-navigation/routers":
      "expo-router/build/react-navigation/routers/index.js",
  };
  const resolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const resolve = resolveRequest ?? context.resolveRequest;
    return resolve(
      context,
      vendoredNavigation[moduleName] ?? moduleName,
      platform,
    );
  };
}

// inline requires for better performance
config.transformer.getTransformOptions = async () => ({
  transform: {
    inlineRequires: true,
  },
});

module.exports = config;
