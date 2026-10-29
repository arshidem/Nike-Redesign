module.exports = {
  rootDir: ".",
  setupFiles: ["<rootDir>/tests/setup.cjs"],
  testEnvironment: "jsdom",
  testMatch: ["**/tests/storefront.test.jsx", "**/tests/presentation.test.jsx", "**/tests/legal.test.jsx", "**/tests/nextMigration.test.jsx", "**/tests/uploadMedia.test.jsx"],
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
      },
    ],
  },
  moduleNameMapper: {
    "^(?!.*nextMigration).*\\/lib/navigation$": "<rootDir>/../node_modules/react-router/dist/development/index.js",
    "^react-router-dom$":
      "<rootDir>/../node_modules/react-router/dist/development/index.js",
    "\\.(css)$": "<rootDir>/tests/styleMock.cjs",
  },
};
