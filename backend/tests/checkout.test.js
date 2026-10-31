const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const crypto = require("node:crypto");
const { quoteCart } = require("../utils/checkoutQuote");
const address = {
  fullName: "Test Customer",
  phone: "9876543210",
  street: "10 Test Street",
  city: "Palakkad",
  state: "Kerala",
  postalCode: "679305",
  country: "India",
};
const initialCart = {
  userId: "user1",
  items: [
    {
      productId: "p1",
      variantId: "v2",
      name: "Dunk",
      image: "shoe.avif",
      color: "white",
      size: "UK 6",
      price: 4148,
      quantity: 1,
      stock: 7,
    },
  ],
  shippingFee: 150,
  tax: 0,
  coupon: null,
};
const copy = (value) => JSON.parse(JSON.stringify(value));

function adapter() {
  let cart = copy(initialCart),
    checkouts = [],
    orders = [],
    products = [
      {
        _id: "p1",
        variants: [
          { _id: "v1", color: "white", sizes: [{ size: "UK 6", stock: 5 }] },
          { _id: "v2", color: "white", sizes: [{ size: "UK 6", stock: 7 }] },
        ],
      },
    ];
  const stats = {
    created: 0,
    captured: 0,
    fetched: 0,
    stockWrites: 0,
    emails: 0,
    commits: 0,
  };
  let paymentStatus = "captured",
    paymentAmount = 429800;
  const gateway = {
    orders: {
      create: async (options) => {
        stats.created++;
        return { ...options, id: "rzp_order1" };
      },
    },
    payments: {
      fetch: async () => {
        stats.fetched++;
        return {
          order_id: "rzp_order1",
          amount: paymentAmount,
          currency: "INR",
          status: paymentStatus,
        };
      },
      capture: async () => {
        stats.captured++;
        return { status: "captured" };
      },
    },
  };
  const Cart = {
    updateOne: async (_, update) => {
      Object.assign(cart, update.$set);
    },
    findOne: () => ({
      lean: async () => copy(cart),
      session: async () => {
        cart.save = async () => {
          throw new Error(
            "Cart analytics hooks must not run inside the stock transaction",
          );
        };
        return cart;
      },
    }),
  };
  const Product = {
    findById: (id) => ({
      lean: async () => copy(products.find((product) => product._id === id)),
    }),
    findOneAndUpdate: async (query, update, options) => {
      stats.stockWrites++;
      const product = products.find((product) => product._id === query._id);
      const variant = product?.variants.find(
        (variant) => variant._id === query.variants.$elemMatch._id,
      );
      const size = variant?.sizes.find(
        (size) => size.size === query.variants.$elemMatch.sizes.$elemMatch.size,
      );
      if (
        !size ||
        size.stock < query.variants.$elemMatch.sizes.$elemMatch.stock.$gte
      )
        return null;
      assert.equal(options.arrayFilters[0]["v._id"], variant._id);
      size.stock += update.$inc["variants.$[v].sizes.$[s].stock"];
      return product;
    },
  };
  const CheckoutSession = {
    create: async (data) => {
      checkouts.push({
        ...copy(data),
        _id: "session1",
        state: "pending",
        order: null,
      });
    },
    findOne: async (query) =>
      checkouts.find(
        (entry) =>
          entry.user === query.user &&
          entry.razorpayOrderId === query.razorpayOrderId,
      ),
    findOneAndUpdate: async (query, update) => {
      const entry = checkouts.find(
        (entry) =>
          entry._id === query._id &&
          entry.state === query.state &&
          entry.order === query.order,
      );
      if (!entry) return null;
      Object.assign(entry, update.$set);
      return entry;
    },
    updateOne: async (query, update) => {
      Object.assign(
        checkouts.find((entry) => entry._id === query._id),
        update.$set,
      );
    },
  };
  const Order = {
    create: async ([data]) => {
      const order = { ...copy(data), _id: "saved-order" };
      order.toObject = () => copy(order);
      orders.push(order);
      return [order];
    },
    findById: async (id) => orders.find((order) => order._id === id),
  };
  const mongoose = {
    startSession: async () => {
      let transaction = false,
        snapshot;
      return {
        startTransaction() {
          transaction = true;
          snapshot = copy({ cart, checkouts, products });
        },
        inTransaction: () => transaction,
        async commitTransaction() {
          transaction = false;
          stats.commits++;
        },
        async abortTransaction() {
          ({ cart, checkouts, products } = snapshot);
          transaction = false;
        },
        async endSession() {},
      };
    },
  };
  const dependencies = {
    "../models/Cart": Cart,
    "../models/Product": Product,
    "../models/Order": Order,
    "../models/CheckoutSession": CheckoutSession,
    "../utils/checkoutQuote": { quoteCart },
    "../utils/updateProductCartStats": async () => {},
    "../utils/email": {
      sendEmail: async () => {
        stats.emails++;
      },
    },
    crypto: crypto,
    mongoose: mongoose,
    razorpay: class {
      constructor() {
        return gateway;
      }
    },
  };
  const sandbox = {
    exports: {},
    Buffer,
    console: { log() {}, error() {} },
    process: {
      env: {
        RAZORPAY_KEY_ID: "rzp_test_public",
        RAZORPAY_KEY_SECRET: "test-secret",
      },
    },
    require: (name) => dependencies[name] || {},
  };
  vm.runInNewContext(
    fs.readFileSync(
      path.join(__dirname, "../controllers/orderController.js"),
      "utf8",
    ),
    sandbox,
  );
  return {
    stats,
    get cart() {
      return cart;
    },
    get products() {
      return products;
    },
    get orders() {
      return orders;
    },
    get checkouts() {
      return checkouts;
    },
    setPayment(status, amount = 429800) {
      paymentStatus = status;
      paymentAmount = amount;
    },
    proof: () => ({
      razorpay_order_id: "rzp_order1",
      razorpay_payment_id: "payment1",
      razorpay_signature: crypto
        .createHmac("sha256", "test-secret")
        .update("rzp_order1|payment1")
        .digest("hex"),
    }),
    async request(
      handler,
      body,
      user = { _id: "user1", email: "customer@example.test", name: "Customer" },
    ) {
      let status = 200,
        result;
      const res = {
        status(value) {
          status = value;
          return res;
        },
        json(value) {
          result = value;
        },
      };
      await sandbox.exports[handler]({ body, user }, res);
      return { status, body: copy(result) };
    },
    async initiate() {
      return this.request("createOrder", { amount: 429800, address });
    },
  };
}

test("server quote preserves zero shipping, discounts and paise precision", () => {
  const quote = quoteCart(
    {
      ...initialCart,
      shippingFee: 0,
      tax: 12.25,
      coupon: { applied: true, code: "MOVE", discountAmount: 100 },
    },
    address,
  );
  assert.equal(quote.amount, 406025);
  assert.equal(quote.total, 4060.25);
  assert.equal(quote.shipping, 0);
  assert.throws(() => quoteCart(initialCart, { ...address, city: "" }), /city/);
});

test("initiation uses the server cart and stores an owned quote; changed client amounts are rejected", async () => {
  const app = adapter();
  const invalid = await app.request("createOrder", { amount: 1, address });
  assert.equal(invalid.status, 409);
  assert.equal(app.stats.created, 0);
  const result = await app.initiate();
  assert.equal(result.status, 200);
  assert.equal(result.body.data.order.amount, 429800);
  assert.equal(result.body.data.keyId, "rzp_test_public");
  assert.equal(app.checkouts[0].user, "user1");
});

test("verification saves the paid total and updates only the exact variant despite repeated color names", async () => {
  const app = adapter();
  await app.initiate();
  const result = await app.request("verifyPayment", app.proof());
  assert.equal(result.status, 200);
  assert.equal(result.body.order.totalPrice, 4298);
  assert.equal(result.body.order.shippingPrice, 150);
  assert.equal(result.body.order.taxPrice, 0);
  assert.equal(app.products[0].variants[0].sizes[0].stock, 5);
  assert.equal(app.products[0].variants[1].sizes[0].stock, 6);
  assert.equal(app.cart.items.length, 0);
  assert.equal(app.stats.commits, 1);
});

test("repeated verification returns the existing order without decrementing stock again", async () => {
  const app = adapter();
  await app.initiate();
  await app.request("verifyPayment", app.proof());
  const second = await app.request("verifyPayment", app.proof());
  assert.equal(second.status, 200);
  assert.equal(app.orders.length, 1);
  assert.equal(app.stats.stockWrites, 1);
  assert.equal(app.stats.fetched, 1);
});

test("invalid signatures and another user cannot confirm or consume the cart", async () => {
  const app = adapter();
  await app.initiate();
  assert.equal(
    (
      await app.request("verifyPayment", {
        ...app.proof(),
        razorpay_signature: "invalid",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await app.request("verifyPayment", app.proof(), {
        _id: "other",
        email: "other@example.test",
      })
    ).status,
    404,
  );
  assert.equal(app.orders.length, 0);
  assert.equal(app.cart.items.length, 1);
  assert.equal(app.stats.fetched, 0);
});

test("uncaptured or mismatched payments cannot create an order", async () => {
  const app = adapter();
  await app.initiate();
  app.setPayment("failed");
  assert.equal((await app.request("verifyPayment", app.proof())).status, 409);
  app.setPayment("captured", 100);
  assert.equal((await app.request("verifyPayment", app.proof())).status, 400);
  assert.equal(app.orders.length, 0);
  assert.equal(app.cart.items.length, 1);
});

test("an authorized payment is captured once and newly added cart quantities are retained", async () => {
  const app = adapter();
  await app.initiate();
  app.setPayment("authorized");
  app.cart.items[0].quantity = 3;
  app.cart.items[0].total = 3 * 4148;
  const result = await app.request("verifyPayment", app.proof());
  assert.equal(result.status, 200);
  assert.equal(app.stats.captured, 1);
  assert.equal(app.cart.items[0].quantity, 2);
  assert.equal(result.body.order.items[0].quantity, 1);
});

test("stock failure rolls back confirmation and preserves the bag for recovery", async () => {
  const app = adapter();
  await app.initiate();
  app.products[0].variants[1].sizes[0].stock = 0;
  const result = await app.request("verifyPayment", app.proof());
  assert.equal(result.status, 409);
  assert.equal(app.cart.items.length, 1);
  assert.equal(app.orders.length, 0);
  assert.equal(app.checkouts[0].state, "pending");
});

function syncAdapter(stock = 7) {
  let saved, query;
  class Cart {
    constructor(data) {
      Object.assign(this, data);
    }
    static async findOne(value) {
      query = value;
      return null;
    }
    async save() {
      saved = this;
    }
  }
  const product = {
    _id: "p1",
    name: "Dunk",
    gender: "men",
    price: 8295,
    finalPrice: 4148,
    variants: [
      {
        _id: "v2",
        color: "white",
        images: ["server-image.avif"],
        sizes: [{ size: "UK 6", stock }],
      },
    ],
  };
  const sandbox = {
    exports: {},
    console: { log() {}, error() {} },
    require: (name) =>
      name === "../models/Cart"
        ? Cart
        : name === "../models/Product"
          ? { findById: async () => product }
          : {},
  };
  vm.runInNewContext(
    fs.readFileSync(
      path.join(__dirname, "../controllers/cartController.js"),
      "utf8",
    ),
    sandbox,
  );
  return {
    get saved() {
      return saved;
    },
    get query() {
      return query;
    },
    async sync() {
      let status = 200,
        body;
      const res = {
        status(value) {
          status = value;
          return res;
        },
        json(value) {
          body = value;
        },
      };
      await sandbox.exports.syncCart(
        {
          user: { _id: "user1" },
          body: {
            items: [
              {
                productId: "p1",
                variantId: "v2",
                size: "UK 6",
                quantity: 1,
                price: 1,
                name: "Untrusted label",
              },
            ],
          },
        },
        res,
      );
      return { status, body };
    },
  };
}

test("guest sync belongs to the signed-in account and uses server product prices", async () => {
  const app = syncAdapter();
  assert.equal((await app.sync()).status, 200);
  assert.equal(app.query.userId, "user1");
  assert.equal(app.saved.userId, "user1");
  assert.equal(app.saved.items[0].price, 4148);
  assert.equal(app.saved.items[0].name, "Dunk");
});

test("guest sync rejects unavailable stock without saving an invalid cart", async () => {
  const app = syncAdapter(0);
  assert.equal((await app.sync()).status, 400);
  assert.equal(app.saved, undefined);
});
