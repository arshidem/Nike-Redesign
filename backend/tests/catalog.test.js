const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

// Exercise the real controller with an in-memory model adapter so count/query
// regressions can be tested without a database or production credentials.
function controller(products, reviews = []) {
  const calls = [];
  const matches = (product, query) =>
    Object.entries(query).every(([key, value]) => {
      if (key === "$expr") {
        const price = product.finalPrice ?? product.price;
        return price >= value.$and[0].$gte[1] && price <= value.$and[1].$lte[1];
      }
      if (key === "variants")
        return product.variants?.some((variant) =>
          variant.sizes.some(
            (size) =>
              value.$elemMatch.sizes.$elemMatch.size.$in.includes(size.size) &&
              size.stock > value.$elemMatch.sizes.$elemMatch.stock.$gt,
          ),
        );
      if (value && typeof value === "object" && "$in" in value)
        return value.$in.map(String).includes(String(product[key]));
      if (value && typeof value === "object" && "$gte" in value)
        return product[key] >= value.$gte;
      return product[key] === value;
    });
  const Product = {
    countDocuments: async (query) =>
      products.filter((product) => matches(product, query)).length,
    find(query) {
      calls.push(query);
      let order = {},
        skip = 0,
        limit = Infinity;
      const chain = {
        sort(value) {
          order = value;
          return chain;
        },
        skip(value) {
          skip = value;
          return chain;
        },
        limit(value) {
          limit = value;
          return chain;
        },
        async lean() {
          return products
            .filter((product) => matches(product, query))
            .sort((a, b) => {
              for (const [key, direction] of Object.entries(order)) {
                if (a[key] < b[key]) return -direction;
                if (a[key] > b[key]) return direction;
              }
              return 0;
            })
            .slice(skip, skip + limit);
        },
      };
      return chain;
    },
  };
  const Review = {
    aggregate: async (pipeline) => {
      const averages = [
        ...new Set(reviews.map((review) => review.product)),
      ].map((id) => {
        const values = reviews
          .filter((review) => review.product === id)
          .map((review) => review.rating);
        const average =
          values.reduce((sum, rating) => sum + rating, 0) / values.length;
        return {
          _id: id,
          average,
          averageRating: average,
          numReviews: values.length,
        };
      });
      if (pipeline[0].$group)
        return averages.filter(
          (item) => item.average >= pipeline[1].$match.average.$gte,
        );
      return averages.filter((item) =>
        pipeline[0].$match.product.$in.includes(item._id),
      );
    },
  };
  const Order = {
    find: () => ({ select: () => ({ lean: async () => [{ items: [
      { product: "1", quantity: 10 }, { product: "0", quantity: 1 },
    ] }] }) }),
  };
  const sandbox = {
    exports: {},
    console: { log() {}, error() {} },
    require: (name) =>
      name === "../models/Product"
        ? Product
        : name === "../models/Review"
          ? Review
          : name === "../models/Order" ? Order : {},
  };
  vm.runInNewContext(
    fs.readFileSync(
      path.join(__dirname, "../controllers/productController.js"),
      "utf8",
    ),
    sandbox,
  );
  return {
    calls,
    async request(query) {
      let body,
        status = 200;
      const res = {
        status(code) {
          status = code;
          return res;
        },
        json(value) {
          body = value;
        },
      };
      await sandbox.exports.getAllProducts({ query }, res);
      return { body: JSON.parse(JSON.stringify(body)), status };
    },
  };
}
const products = Array.from({ length: 30 }, (_, index) => ({
  _id: String(index),
  name: `Product ${index}`,
  gender: index % 3 ? "men" : "women",
  category: index % 2 ? "shoes" : "clothing",
  price: 5000 + index * 100,
  finalPrice: 5000 + index * 100,
  createdAt: new Date(Date.now() - index * 1000),
  model: index % 2 ? "Dunk" : "Everyday",
  variants: [{ sizes: [{ size: "M", stock: 1 }] }],
}));

test("pagination reports the whole catalog total, and gender counts ignore only the gender selection", async () => {
  const { body, status } = await controller(products).request({
    gender: "women",
    page: "2",
    limit: "3",
  });
  assert.equal(status, 200);
  assert.equal(body.products.length, 3);
  assert.equal(body.pagination.totalItems, 10);
  assert.equal(body.pagination.totalPages, 4);
  assert.deepEqual(body.genderCounts, { all: 30, men: 20, women: 10, kids: 0 });
});

test("multiple categories/models, collection flags and the final in-stock size are retained", async () => {
  const { body } = await controller(products).request({
    category: ["shoes", "clothing"],
    model: ["Dunk", "Everyday"],
    newArrival: "true",
    size: ["M"],
    limit: "100",
  });
  assert.equal(body.pagination.totalItems, 30);
  assert.ok(body.products.some((item) => item.category === "clothing"));
  assert.ok(body.products.some((item) => item.category === "shoes"));
});

test("rating filtering precedes pagination so a matching item cannot disappear from later pages", async () => {
  const { body } = await controller(products, [
    { product: "25", rating: 5 },
    { product: "0", rating: 2 },
  ]).request({ minRating: "4", limit: "1" });
  assert.equal(body.pagination.totalItems, 1);
  assert.equal(body.pagination.totalPages, 1);
  assert.equal(body.products[0]._id, "25");
  assert.equal(body.products[0].rating.average, 5);
  assert.deepEqual(body.genderCounts, { all: 1, men: 1, women: 0, kids: 0 });
});

test("prices use rupees without a hidden 1000 cap and invalid ranges return 400", async () => {
  const adapter = controller(products);
  const { body } = await adapter.request({
    minPrice: "7000",
    maxPrice: "7500",
  });
  assert.equal(body.pagination.totalItems, 6);
  assert.equal(
    (await adapter.request({ minPrice: "8000", maxPrice: "5000" })).status,
    400,
  );
  assert.equal((await adapter.request({ minRating: "abc" })).status, 400);
  assert.equal(
    (await adapter.request({ maxPrice: "0" })).body.pagination.totalItems,
    0,
  );
});

test("best-seller selection retains explicit price sorting", async () => {
  const adapter = controller(products);
  const sorted = await adapter.request({ bestSellers: "true", sortBy: "priceAsc", limit: "100" });
  assert.equal(sorted.status, 200);
  assert.deepEqual(sorted.body.products.map((product) => product._id), ["0", "1"]);
  const ranked = await adapter.request({ bestSellers: "true", limit: "100" });
  assert.deepEqual(ranked.body.products.map((product) => product._id), ["1", "0"]);
});

test("best sellers are ranked before slicing pages", async () => {
  const adapter = controller(products);
  const first = await adapter.request({ bestSellers: "true", page: "1", limit: "1" });
  const second = await adapter.request({ bestSellers: "true", page: "2", limit: "1" });
  assert.equal(first.body.products[0]._id, "1");
  assert.equal(second.body.products[0]._id, "0");
  assert.equal(first.body.pagination.totalItems, 2);
  assert.equal(first.body.pagination.totalPages, 2);
});
