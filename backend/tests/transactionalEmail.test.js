const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
function load(relative, stubs, env = {}) {
  const module = { exports: {} };
  const requireStub = (name) => {
    if (name in stubs) return stubs[name];
    if (name === "crypto") return crypto;
    throw Error(`Unexpected dependency: ${name}`);
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, relative), "utf8"), {
    module,
    exports: module.exports,
    require: requireStub,
    process: { env },
    console: { log() {}, error() {} },
    Buffer,
    Date,
    Math,
  });
  return module.exports;
}
const response = () => ({
  code: 0,
  payload: null,
  status(code) {
    this.code = code;
    return this;
  },
  json(payload) {
    this.payload = payload;
    return this;
  },
});

test("OTP template uses the shared service and never exposes code in subject", async () => {
  let sent;
  const mail = load("../services/transactionalEmail.js", {
    "./emailService": {
      sendEmail: async (message) => {
        sent = message;
        return { id: "otp-id" };
      },
    },
  });
  await mail.sendOTP("member@example.test", "123456");
  assert.equal(sent.to, "member@example.test");
  assert.equal(sent.kind, "otp");
  assert.ok(sent.html.includes("123456"));
  assert.ok(sent.text.includes("5 minutes"));
  assert.ok(!sent.subject.includes("123456"));
});
test("order template uses actual totals, escapes product markup, and identifies the order", async () => {
  let sent;
  const mail = load("../services/transactionalEmail.js", {
    "./emailService": {
      sendEmail: async (message) => {
        sent = message;
      },
    },
  });
  await mail.sendOrderConfirmation("member@example.test", {
    _id: "order-1",
    customerName: "<Customer>",
    totalPrice: 1234,
    items: [
      {
        title: "<img src=x>",
        quantity: 2,
        price: 500,
        size: "8",
        color: "black",
      },
    ],
  });
  assert.equal(sent.kind, "order_confirmation");
  assert.equal(sent.idempotencyKey, "order-confirmation-order-1");
  assert.ok(sent.text.includes("₹1,234.00"));
  assert.ok(sent.html.includes("&lt;img src=x&gt;"));
  assert.ok(!sent.html.includes("<img src=x>"));
  assert.ok(!sent.html.includes("Expected Delivery"));
});
test("existing OTP endpoint keeps its request and response flow through the shared sender", async () => {
  let saved = 0,
    sent;
  const user = { save: async () => saved++ };
  const controller = load("../controllers/authController.js", {
    "../models/User": { findOne: async () => user },
    jsonwebtoken: {},
    "../services/transactionalEmail": {
      sendOTP: async (email, otp) => {
        sent = { email, otp };
      },
    },
  });
  const res = response();
  await controller.requestOTP({ body: { email: "member@example.test" } }, res);
  assert.equal(saved, 1);
  assert.equal(sent.email, "member@example.test");
  assert.match(sent.otp, /^\d{6}$/);
  assert.equal(user.otp, sent.otp);
  assert.equal(res.code, 200);
  assert.equal(res.payload.type, "signin");
});
test("OTP provider failure does not return a successful OTP response", async () => {
  const controller = load("../controllers/authController.js", {
    "../models/User": { findOne: async () => null },
    jsonwebtoken: {},
    "../services/transactionalEmail": {
      sendOTP: async () => {
        throw Error("provider rejected");
      },
    },
  });
  const res = response();
  await assert.rejects(
    controller.requestOTP({ body: { email: "member@example.test" } }, res),
    /provider rejected/,
  );
  assert.equal(res.payload, null);
});
test("order email is attempted after commit and delivery failure does not undo a paid order", async () => {
  const events = [];
  const session = {
    startTransaction() {
      events.push("start");
    },
    async commitTransaction() {
      events.push("commit");
    },
    async abortTransaction() {
      events.push("abort");
    },
    endSession() {
      events.push("end");
    },
  };
  const variants = [{ color: "black", sizes: [{ size: "8", stock: 5 }] }];
  const controller = load(
    "../controllers/orderController.js",
    {
      "express-async-handler": (fn) => fn,
      razorpay: class {
        constructor() {
          this.orders = {};
        }
      },
      "../models/Order": {
        create: async () => [
          { toObject: () => ({ _id: "order-1", items: [] }) },
        ],
      },
      "../models/User": {},
      mongoose: { startSession: async () => session },
      "../models/Product": {
        findById: () => ({
          session: () => ({ lean: async () => ({ variants }) }),
        }),
        findOneAndUpdate: async () => ({ variants }),
      },
      "moment-timezone": {},
      "../services/transactionalEmail": {
        sendOrderConfirmation: async () => {
          events.push("email");
          throw Error("provider failed");
        },
      },
    },
    { RAZORPAY_KEY_ID: "test-id", RAZORPAY_KEY_SECRET: "test-secret" },
  );
  const body = {
    razorpay_order_id: "rp-order",
    razorpay_payment_id: "rp-payment",
    email: "member@example.test",
    items: [
      {
        product: "p1",
        title: "Shoe",
        quantity: 1,
        price: 100,
        color: "black",
        size: "8",
      },
    ],
    address: {},
  };
  body.razorpay_signature = crypto
    .createHmac("sha256", "test-secret")
    .update("rp-order|rp-payment")
    .digest("hex");
  const res = response();
  await controller.verifyPayment(
    { body, user: { _id: "user-1", name: "Customer" } },
    res,
  );
  assert.equal(res.code, 200);
  assert.equal(res.payload.success, true);
  assert.ok(events.indexOf("commit") < events.indexOf("email"));
  assert.ok(!events.includes("abort"));
  assert.equal(events.at(-1), "end");
});
