import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

import baseConfig from "@graysky/tailwind-config";

export default {
  content: ["./src/**/*.tsx"],
  presets: [baseConfig],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
    },
  },
} satisfies Config;
