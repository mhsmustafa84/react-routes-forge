module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: [
    "dist/",
    "node_modules/",
    "docs/.vitepress/",
    ".eslintrc.cjs",
  ],
  rules: {
    // TypeScript handles both of these — they produce false positives on TS files.
    "no-undef": "off",
    // TS overloads produce duplicate function declarations.
    "no-redeclare": "off",
    // Tests intentionally cast with `as any`; TS's own checks are in charge.
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    // Keep runtime type-imports split from value imports.
    "@typescript-eslint/consistent-type-imports": "error",
  },
};
