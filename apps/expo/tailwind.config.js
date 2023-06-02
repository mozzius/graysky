// TODO: Add support for TS config files in Nativewind.

// import { type Config } from "tailwindcss";

// import baseConfig from "@graysky/tailwind-config";

// export default {
//   presets: [baseConfig],
//   content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
// } satisfies Config;

// const { platformSelect, hairlineWidth } = require("nativewind");

const config = {
  content: ["./src/**/*.{ts,tsx}"],
  // theme: {
  //   extend: {
  //     borderWidth: {
  //       hairline: hairlineWidth(),
  //     },
  //     colors: {
  //       error: platformSelect({
  //         ios: "platformColor(systemRed)",
  //         android: "platformColor(?android:colorError)",
  //         default: "red",
  //       }),
  //       link: platformSelect({
  //         ios: "platformColor(link)",
  //         android: "platformColor(?android:colorAccent)",
  //         default: "blue",
  //       }),
  //     },
  //   },
  // },
};

module.exports = config;
