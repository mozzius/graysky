import { type Config } from "tailwindcss";

import baseConfig from "@graysky/tailwind-config";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  presets: [baseConfig, require("nativewind/preset")],
} satisfies Config;
