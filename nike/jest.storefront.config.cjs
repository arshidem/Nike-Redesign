module.exports = {
  setupFiles: ["<rootDir>/tests/setup.cjs"],
  testEnvironment: "jsdom",
  testMatch: ["**/tests/storefront.test.jsx", "**/tests/presentation.test.jsx", "**/tests/catalog.test.jsx", "**/tests/product-details.test.jsx", "**/tests/bag.test.jsx", "**/tests/checkout.test.jsx", "**/tests/wishlist-loading.test.jsx"],
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
    "^react-router-dom$":
      "<rootDir>/node_modules/react-router/dist/development/index.js",
    "\\.(css)$": "<rootDir>/tests/styleMock.cjs",
  },
};
