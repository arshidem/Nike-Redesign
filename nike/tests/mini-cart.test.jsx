import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import MiniCart from "../src/features/user/components/MiniCart";
const mockUpdate = jest.fn(),
  mockRemove = jest.fn();
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({ token: "token", backendUrl: "https://store.test" }),
}));
jest.mock("../src/features/user/services/cartServices", () => ({
  __esModule: true,
  default: () => ({
    updateItemQuantity: mockUpdate,
    removeItemFromCart: mockRemove,
  }),
}));
jest.mock("framer-motion", () => {
  const React = require("react");
  const element = (tag) =>
    React.forwardRef(
      ({ children, initial, animate, exit, transition, ...props }, ref) =>
        React.createElement(tag, { ...props, ref }, children),
    );
  return {
    AnimatePresence: ({ children }) => children,
    motion: { div: element("div"), section: element("section") },
    useReducedMotion: () => true,
  };
});
const item = {
  _id: "line1",
  productId: "p1",
  variantId: "v1",
  name: "Nike Dunk",
  color: "Black",
  size: "UK 9.5",
  price: 4148,
  quantity: 1,
  stock: 3,
  image: "uploads/shoe.png",
};
let root, host, trigger;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();
  mockUpdate.mockReset();
  mockRemove.mockReset();
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  trigger.remove();
});
const show = async () => {
  await act(async () =>
    root.render(
      <MemoryRouter>
        <MiniCart />
      </MemoryRouter>,
    ),
  );
  await act(async () =>
    window.dispatchEvent(
      new CustomEvent("cartAdded", {
        detail: { cart: { items: [item] }, added: item },
      }),
    ),
  );
};
const click = async (selector) =>
  act(async () => document.querySelector(selector).click());
test("opens with selected details, updates shared quantities, retains state on failure and removes", async () => {
  await show();
  expect(document.querySelector('[role="dialog"]').textContent).toContain(
    "UK 9.5",
  );
  expect(
    document.querySelector('[aria-label="Decrease quantity"]').disabled,
  ).toBe(true);
  mockUpdate.mockRejectedValueOnce(new Error("Only 1 available"));
  await click('[aria-label="Increase quantity"]');
  expect(document.querySelector('[role="alert"]').textContent).toBe(
    "Only 1 available",
  );
  expect(document.querySelector("output").textContent).toBe("1");
  mockUpdate.mockResolvedValue({ items: [{ ...item, quantity: 2 }] });
  await click('[aria-label="Increase quantity"]');
  expect(mockUpdate).toHaveBeenLastCalledWith("line1", 2);
  expect(document.querySelector(".mini-cart-summary").textContent).toContain(
    "2 items",
  );
  expect(document.querySelector(".mini-cart-summary").textContent).toContain(
    "8,296",
  );
  expect(
    document.querySelector(".mini-cart-checkout").getAttribute("href"),
  ).toBe("/checkout");
  mockRemove.mockResolvedValue({ items: [] });
  await click('[aria-label="Remove item from bag"]');
  expect(mockRemove).toHaveBeenCalledWith("line1");
  expect(document.querySelector(".mini-cart-empty").textContent).toContain(
    "Your bag is empty",
  );
  expect(document.querySelector(".mini-cart-checkout")).toBeNull();
});
test.each(["escape", "outside", "close"])(
  "closes with %s and restores focus",
  async (method) => {
    await show();
    expect(document.body.style.overflow).toBe("hidden");
    if (method === "escape")
      await act(async () =>
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        ),
      );
    else
      await click(
        method === "outside"
          ? ".mini-cart-backdrop"
          : '[aria-label="Close mini cart"]',
      );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
  },
);
