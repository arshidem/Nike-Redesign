const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  path = require("node:path");
function controller(Coupon, Order) {
  const exports = {};
  vm.runInNewContext(
    fs.readFileSync(
      path.join(__dirname, "../controllers/couponController.js"),
      "utf8",
    ),
    {
      exports,
      require: (name) => (name === "../models/Coupon" ? Coupon : Order),
      Map,
      Date,
    },
  );
  return exports;
}
function response() {
  return {
    code: 200,
    status(n) {
      this.code = n;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}
test("admin coupon usage aggregates paid orders for returned codes and fills unused coupons with zero", async () => {
  let pipeline;
  const ctrl = controller(
    {
      find: () => ({
        sort: () => ({
          lean: async () => [
            { _id: "a", code: "NIKE20" },
            { _id: "b", code: "WELCOME" },
          ],
        }),
      }),
    },
    {
      aggregate: async (value) => {
        pipeline = value;
        return [{ _id: "NIKE20", count: 12 }];
      },
    },
  );
  const res = response();
  await ctrl.getCoupons({ query: {} }, res);
  assert.equal(pipeline[0].$match.isPaid, true);
  assert.equal(
    JSON.stringify(pipeline[0].$match.couponCode.$in),
    JSON.stringify(["NIKE20", "WELCOME"]),
  );
  assert.equal(pipeline[1].$group._id, "$couponCode");
  assert.equal(res.body.data[0].usageCount, 12);
  assert.equal(res.body.data[1].usageCount, 0);
});
test("empty coupon lists do not aggregate unrelated orders", async () => {
  let called = false;
  const ctrl = controller(
    { find: () => ({ sort: () => ({ lean: async () => [] }) }) },
    {
      aggregate: async () => {
        called = true;
      },
    },
  );
  const res = response();
  await ctrl.getCoupons({ query: {} }, res);
  assert.equal(called, false);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.length, 0);
});
test("usage failures report load failure instead of showing invented counts", async () => {
  const ctrl = controller(
    {
      find: () => ({
        sort: () => ({ lean: async () => [{ code: "NIKE20" }] }),
      }),
    },
    {
      aggregate: async () => {
        throw Error("Unavailable");
      },
    },
  );
  const res = response();
  await ctrl.getCoupons({ query: {} }, res);
  assert.equal(res.code, 500);
  assert.equal(res.body.success, false);
});
test("coupon edits run existing schema validation and handle missing records", async () => {
  let options;
  const ctrl = controller(
    {
      findByIdAndUpdate: async (id, body, config) => {
        options = config;
        return null;
      },
    },
    {},
  );
  const res = response();
  await ctrl.updateCoupon({ params: { id: "missing" }, body: {} }, res);
  assert.equal(options.runValidators, true);
  assert.equal(res.code, 404);
});
