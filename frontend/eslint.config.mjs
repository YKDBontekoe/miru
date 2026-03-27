import expo from "eslint-config-expo/flat.js";
import globals from "globals";

export default [
  ...expo,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "**/*.test.tsx",
      "**/*.test.ts"
    ],
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      }
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "import/no-named-as-default-member": "off",
      "import/no-duplicates": "off"
    }
  }
];
