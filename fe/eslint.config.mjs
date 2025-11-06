// eslint.config.mjs
import js from "@eslint/js";
import next from "eslint-config-next";
import tseslint from "typescript-eslint";

/**
 * Flat Config cho:
 * - Next.js 16 / React 19
 * - ESLint 9 (flat)
 * - TypeScript 5.x
 *
 * Lưu ý:
 * - eslint-config-next xuất RA MẢNG => phải dùng spread `...next`, KHÔNG gọi next().
 * - Đặt vào biến `config` rồi export để tránh cảnh báo import/no-anonymous-default-export.
 */

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

  // Rule JS cơ bản
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "react-hooks/exhaustive-deps": "warn",
      "prefer-const": "warn",
      "no-console": "off"
    },
  },
];

export default config;
