const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    {
      exports,
      require: (key) => {
        if (key in mocks) return mocks[key];
        throw Error(key);
      },
      Date,
    },
  );
  return exports;
}
function response() {
  return {
    code: 200,
    status(value) {
      this.code = value;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}
const profile = require("../utils/customerProfile");
test("public profile excludes OTP and preserves identity and preferences", () => {
  const result = profile({
    _id: "me",
    role: "admin",
    email: "me@test.com",
    otp: "secret",
    otpExpires: 123,
    preferences: { notifications: { email: false } },
  });
  assert.equal(result._id, "me");
  assert.equal(result.role, "admin");
  assert.equal(result.preferences.notifications.email, false);
  assert.equal("otp" in result, false);
  assert.equal("otpExpires" in result, false);
});
test("preferences validate boolean and only update whitelisted owner field", async () => {
  let saved;
  const controller = load("controllers/accountController.js", {
    "../models/User": {
      findByIdAndUpdate: async (...args) => {
        saved = args;
        return { _id: "me", preferences: { notifications: { email: false } } };
      },
    },
    "../models/Address": {},
    "../models/Order": {},
    "../models/Wishlist": {},
    "../utils/customerProfile": profile,
  });
  let res = response();
  await controller.updatePreferences(
    { user: { _id: "me" }, body: { notifications: { email: "false" } } },
    res,
  );
  assert.equal(res.code, 400);
  assert.equal(saved, undefined);
  res = response();
  await controller.updatePreferences(
    {
      user: { _id: "me" },
      body: { notifications: { email: false }, role: "admin" },
    },
    res,
  );
  assert.equal(saved[0], "me");
  assert.equal(
    JSON.stringify(saved[1]),
    JSON.stringify({ $set: { "preferences.notifications.email": false } }),
  );
  assert.equal(res.body.notifications.email, false);
});
test("data export scopes every collection to signed-in owner", async () => {
  const calls = [];
  const model = (key) => ({
    [key]: (query) => {
      calls.push(query);
      const chain = {
        select: () => chain,
        sort: () => chain,
        lean: async () => (key === "findOne" ? { products: ["shoe"] } : []),
      };
      return chain;
    },
  });
  const controller = load("controllers/accountController.js", {
    "../models/User": {},
    "../models/Address": model("find"),
    "../models/Order": model("find"),
    "../models/Wishlist": model("findOne"),
    "../utils/customerProfile": profile,
  });
  const res = response();
  await controller.exportData({ user: { _id: "me", otp: "secret" } }, res);
  assert.equal(calls.length, 3);
  for (const query of calls) assert.equal(query.user, "me");
  assert.equal(res.body.wishlist[0], "shoe");
  assert.equal("otp" in res.body.profile, false);
});
test("support create ignores supplied owner/status and validates message", async () => {
  let created;
  const controller = load("controllers/supportController.js", {
    "../models/SupportTicket": {
      create: async (data) => {
        created = data;
        return data;
      },
    },
  });
  let res = response();
  await controller.create(
    {
      user: { _id: "me" },
      body: { category: "order", subject: "Question", message: "short" },
    },
    res,
  );
  assert.equal(res.code, 400);
  assert.equal(created, undefined);
  res = response();
  await controller.create(
    {
      user: { _id: "me" },
      body: {
        category: "order",
        subject: " Question ",
        message: "Please check my order",
        user: "other",
        status: "closed",
      },
    },
    res,
  );
  assert.equal(res.code, 201);
  assert.equal(created.user, "me");
  assert.equal(created.subject, "Question");
  assert.equal("status" in created, false);
});
test("support list uses authenticated owner and status whitelist rejects invalid updates", async () => {
  let query;
  const chain = {
    select: () => chain,
    sort: () => chain,
    limit: () => chain,
    lean: async () => [],
  };
  const controller = load("controllers/supportController.js", {
    "../models/SupportTicket": {
      find: (value) => {
        query = value;
        return chain;
      },
    },
  });
  await controller.mine({ user: { _id: "me" } }, response());
  assert.equal(query.user, "me");
  const res = response();
  await controller.update({ body: { status: "anything" } }, res);
  assert.equal(res.code, 400);
});
test("support routes protect admin inbox separately from customer requests", () => {
  const routes = [];
  const router = {
    get: (...args) => routes.push(args),
    post: (...args) => routes.push(args),
    patch: (...args) => routes.push(args),
  };
  const protect = () => {},
    verifyAdmin = () => {};
  const context = {
    module: { exports: {} },
    require: (key) =>
      key === "express"
        ? { Router: () => router }
        : key.includes("authMiddleware")
          ? { protect, verifyAdmin }
          : {
              all: () => {},
              mine: () => {},
              create: () => {},
              update: () => {},
            },
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "../routes/supportRoutes.js"), "utf8"),
    context,
  );
  assert.equal(routes.find((row) => row[0] === "/admin")[1], verifyAdmin);
  assert.equal(routes.find((row) => row[0] === "/:id/status")[1], verifyAdmin);
  for (const row of routes.filter((row) => row[0] === "/"))
    assert.equal(row[1], protect);
});
test("available coupons require active, unexpired offers and expose only customer fields", async () => {
  let filter, fields;
  const chain = {
    select: (value) => {
      fields = value;
      return chain;
    },
    sort: () => chain,
    lean: async () => [{ code: "MOVE20" }],
  };
  const controller = load("controllers/couponController.js", {
    "../models/Order": {},
    "../models/Coupon": {
      find: (value) => {
        filter = value;
        return chain;
      },
    },
  });
  const res = response();
  await controller.getAvailable({}, res);
  assert.equal(filter.isActive, true);
  assert.equal(filter.$or[0].expiresAt, null);
  assert.ok(filter.$or[1].expiresAt.$gt instanceof Date);
  assert.equal(
    fields,
    "code discountType discountValue minOrderAmount expiresAt",
  );
  assert.equal(res.body[0].code, "MOVE20");
});
