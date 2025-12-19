import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-config-next";
import reactHooks from "eslint-plugin-react-hooks";

const config = [
  {
    ignores: [
      "node_modules/",
      ".next/",
      "dist/",
      "out/",
      "coverage/",
      "public/",
      "**/*.{css,scss,sass}"
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-sync-scripts": "off",

      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],

      "no-console": "off",
      "prefer-const": "warn",
      "no-unused-vars": "off",
    },
  },
];

export default config;
