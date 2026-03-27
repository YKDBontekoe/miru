import expo from "eslint-config-expo/flat.js";
import globals from "globals";

export default [
  ...expo,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      ".expo/**",
      "web-build/**",
      "android/**",
      "ios/**"
    ],
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      globals: {
        ...globals.browser,
      }
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "import/no-named-as-default-member": "off",
      "import/no-duplicates": "off"
    }
  },
  {
    files: ["src/core/models.ts"],
    rules: {
      "no-unused-vars": "off"
    }
  },
  {
    files: ["src/utils/haptics.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/__tests__/**", "jest.setup.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
      }
    }
  },
  {
    files: ["**/*.config.{js,mjs,cjs}", "babel.config.js", "jest.config.js", "metro.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      }
    }
  }
];
