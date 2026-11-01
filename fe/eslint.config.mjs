import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-config-next";
import reactHooks from "eslint-plugin-react-hooks";

// ───────── Pattern dùng chung cho các luật ranh giới ─────────

const APP = {
  group: ["@/app/*", "@/app/**"],
  message:
    "Không được import từ app/ — đó là đảo tầng. Kiểu dùng chung đặt ở @/types, component dùng chung ở @/components.",
};

const SERVICES = {
  group: ["@/services/*", "@/services/**"],
  message: "types/ và utils/ là tầng trong cùng, không được gọi service.",
};

const COMPONENTS = {
  group: ["@/components/*", "@/components/**"],
  message: "Tầng này không được biết gì về component.",
};

const MOCK = {
  group: ["@/mock/*", "@/mock/**"],
  message:
    "mock chỉ nên dùng qua một interface backend, không import trực tiếp vào code chạy thật.",
};

const DEEP_RELATIVE = {
  group: ["../../../*"],
  message: "Đi lùi quá hai cấp — dùng alias @/ thay cho đường dẫn tương đối.",
};


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

      // Bật ở mức warn kèm ngân sách --max-warnings trong CI: không bắt dọn 303 chỗ
      // `any` đang có, nhưng chặn số đó TĂNG. Xem docs/architecture/04-conventions.md §7.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],

      "no-console": "off",
      "prefer-const": "warn",
      "no-unused-vars": "off",

      // Áp cho mọi file. LƯU Ý: flat config GHI ĐÈ cả rule, không gộp pattern —
      // nên mỗi nhóm file dưới đây phải tự liệt kê lại những pattern nó cần.
      "no-restricted-imports": ["warn", { patterns: [DEEP_RELATIVE, MOCK] }],
    },
  },

  // ───────────────────── Ranh giới giữa các tầng ─────────────────────
  //
  // Diễn đạt bằng no-restricted-imports sẵn có, KHÔNG thêm eslint-plugin-boundaries:
  // cấu trúc hiện tại phẳng theo kiểu file nên ràng buộc chỉ là "thư mục A không
  // được import thư mục B", luật sẵn có đủ sức. Plugin đó chỉ đáng thêm ở Phase 3,
  // khi có features/<name> và cần chặn features/a <-> features/b bằng capture
  // cùng tên — và thêm nó bây giờ sẽ đụng package.json với PR #173.
  //
  // Các nhóm dưới đây ĐANG SẠCH nên đặt "error": vi phạm mới là fail ngay.
  // app/ -> mock/ còn 60 file nên chỉ "warn", tính vào ngân sách --max-warnings.

  {
    files: ["src/services/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [APP, COMPONENTS, MOCK, DEEP_RELATIVE] },
      ],
    },
  },

  {
    files: ["src/types/**/*.ts", "src/utils/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [APP, SERVICES, COMPONENTS, MOCK, DEEP_RELATIVE] },
      ],
    },
  },

  {
    files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [APP, MOCK, DEEP_RELATIVE] }],
    },
  },
];

export default config;
