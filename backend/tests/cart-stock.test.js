const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
function load(file, dependencies) {
  const sandbox = {
    exports: {},
    module: { exports: {} },
    console,
    require: (name) => {
      if (!(name in dependencies))
        throw new Error(`Unexpected dependency ${name}`);
      return dependencies[name];
    },
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, file), "utf8"),
    sandbox,
  );
  return { ...sandbox.module.exports, ...sandbox.exports };
}
test("bag entry refreshes exact variant/size stock in a single batch including deleted items", async () => {
  let reads = 0;
  const refresh = load("../utils/cartStock.js", {
    "../models/Product": {
      find(query) {
        reads++;
        assert.equal(query._id.$in.length, 2);
        return {
          select: () => ({
            lean: async () => [
              {
                _id: "p1",
                variants: [
                  { _id: "v1", sizes: [{ size: "UK 6", stock: 1 }] },
                  { _id: "v2", sizes: [{ size: "UK 6", stock: 4 }] },
                ],
              },
            ],
          }),
        };
      },
    },
  }).refreshCartStock;
  const items = await refresh([
    { productId: "p1", variantId: "v2", size: "UK 6", quantity: 5, stock: 20 },
    { productId: "p1", variantId: "v1", size: "UK 6", quantity: 1 },
    { productId: "deleted", variantId: "v2", size: "UK 6", quantity: 1 },
  ]);
  assert.equal(reads, 1);
  assert.equal(items[0].stock, 4);
  assert.equal(items[0].quantity, 5);
  assert.equal(items[1].stock, 1);
  assert.equal(items[2].stock, 0);
  assert.equal(items[2].stockAvailable, false);
});
test("quantity changes use cached stock, reject invalid/increased quantities, and allow reducing excess", async () => {
  const item = { _id: "line", quantity: 5, stock: 2, price: 100 };
  let saves = 0;
  const cart = {
    items: { id: () => item },
    save: async () => {
      saves++;
    },
  };
  const controller = load("../controllers/cartController.js", {
    "../models/Cart": { findOne: async () => cart },
    "../models/Product": {
      findById: () => {
        throw new Error("Quantity click must not fetch inventory");
      },
    },
    "../models/Coupon": {},
    "../utils/cartStock": {},
  });
  const change = async (quantity) => {
    let status = 200,
      body;
    const res = {
      status(value) {
        status = value;
        return res;
      },
      json(value) {
        body = value;
        return res;
      },
    };
    await controller.updateItemQuantity(
      { params: { itemId: "line" }, body: { quantity }, user: { _id: "user" } },
      res,
    );
    return { status, body };
  };
  assert.equal((await change(4)).status, 200);
  assert.equal(item.quantity, 4);
  assert.equal((await change(5)).status, 400);
  assert.equal((await change(2)).status, 200);
  assert.equal((await change(1)).status, 200);
  assert.equal((await change(2)).status, 200);
  for (const invalid of [0, -1, 1.5, "2", null])
    assert.equal((await change(invalid)).status, 400);
  assert.equal(saves, 4);
});
test("bag refresh persists stock without overwriting concurrently changed quantities", async () => {
  let writes;
  const controller = load("../controllers/cartController.js", {
    "../models/Cart": {
      findOne: () => ({
        lean: async () => ({
          _id: "cart",
          items: [{ _id: "line", quantity: 5, stock: 9 }],
        }),
      }),
      bulkWrite: async (value) => {
        writes = value;
      },
    },
    "../models/Product": {},
    "../models/Coupon": {},
    "../utils/cartStock": {
      refreshCartStock: async (items) =>
        items.map((item) => ({ ...item, stock: 2, stockAvailable: true })),
    },
  });
  let body;
  await controller.getCart(
    { user: { _id: "user" } },
    {
      status() {
        return this;
      },
      json(value) {
        body = value;
      },
    },
  );
  assert.equal(body.items[0].stock, 2);
  assert.equal(body.items[0].quantity, 5);
  assert.equal(writes[0].updateOne.update.$set["items.$.stock"], 2);
  assert.equal(
    Object.keys(writes[0].updateOne.update.$set).some((key) =>
      key.includes("quantity"),
    ),
    false,
  );
});
