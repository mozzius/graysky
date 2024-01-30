const path = require("path");
const loadConfig = require("tailwindcss/loadConfig");

/** @type {import("tailwindcss").Config | null} */
let _tailwindConfig = null;
/**
 * Transpiles tailwind.config.ts for babel
 * Fix until nativewind babel plugin supports tailwind.config.ts files
 */
function lazyLoadConfig() {
  return (
    _tailwindConfig ?? loadConfig(path.join(__dirname, "tailwind.config.ts"))
  );
}

/** @type {import("@babel/core").ConfigFunction} */
module.exports = function (api) {
  api.cache.forever();

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          lazyImports: true,
        },
      ],
    ],
    plugins: [
      ["nativewind/babel", { tailwindConfig: lazyLoadConfig() }],
      "react-native-reanimated/plugin",
    ],
  };
};
