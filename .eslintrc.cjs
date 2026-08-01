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
  extends: ["eslint:recommended"],
  ignorePatterns: [
    "dist/",
    "node_modules/",
    "docs/.vitepress/",
    ".eslintrc.cjs",
  ],
  rules: {
    // TypeScript handles both of these — they produce false positives on TS files.
    "no-undef": "off",
    "no-unused-vars": "off",
    // TS overloads produce duplicate function declarations.
    "no-redeclare": "off",
  },
};
