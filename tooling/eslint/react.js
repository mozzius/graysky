import pluginReact from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  {
    ...pluginReact.configs.flat.recommended,
    settings: { react: { version: "detect" } },
  },
  reactCompiler.configs.recommended,
  {
    rules: {
      "react-compiler/react-compiler": "error",
      "react/react-in-jsx-scope": "off",
    },
  },
];
