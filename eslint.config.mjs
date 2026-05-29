import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Compiled test output
    ".tmp-tests/**",
    // Reference assets not part of the main app
    "figma ui reference/**",
    "**/figma ui reference/**",
    // Dependencies and generated output
    "node_modules/**",
    "**/.next/types/**",
    "src/lib/types/**",
    "**/generated/**",
    // Migrations
    "supabase/migrations/**",
    "**/migrations/**",
    // Tests
    "src/__tests__/**",
    "**/__tests__/**",
    "**/*.test.*",
    "**/*.spec.*",
    // Storybook / examples / demos
    "**/*.stories.*",
    "**/storybook/**",
    "**/stories/**",
    "**/examples/**",
    "**/example/**",
    "**/demo/**",
    // Auth login components excluded from checks
    "src/app/auth/login/components/**",
  ]),
]);

export default eslintConfig;
