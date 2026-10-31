import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import Search from "../src/features/user/components/Search";
jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({ backendUrl: "https://store.test" }),
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
const product = {
  _id: "p1",
  slug: "dunk",
  name: "Nike Dunk Low Retro",
  price: 8295,
  finalPrice: 4148,
  image: "https://images.test/shoe.avif",
};
let root, host, close;
const Destination = () => {
  const location = useLocation();
  return <p id="destination">{location.pathname + location.search}</p>;
};
beforeEach(() => {
  jest.useFakeTimers();
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  close = jest.fn();
  axios.get
    .mockReset()
    .mockResolvedValue({ data: { count: 1, results: [product] } });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  jest.useRealTimers();
});
const render = async () =>
  act(async () =>
    root.render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Search isOpen onClose={close} />} />
          <Route path="*" element={<Destination />} />
        </Routes>
      </MemoryRouter>,
    ),
  );
const type = async (value) =>
  act(async () => {
    const input = document.querySelector("input");
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const settle = async () =>
  act(async () => {
    jest.advanceTimersByTime(300);
  });
const click = async (selector) =>
  act(async () => document.querySelector(selector).click());
test("debounces requests, renders reference-style prices, and View all keeps the query", async () => {
  await render();
  await type("Nike");
  expect(axios.get).not.toHaveBeenCalled();
  await settle();
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(document.querySelector(".nike-search-product").textContent).toContain(
    "50% OFF",
  );
  expect(document.querySelector(".nike-search-product img").src).toBe(
    product.image,
  );
  expect(
    document.querySelector(".nike-search-product").getAttribute("href"),
  ).toBe("/product/dunk");
  await click(".nike-search-results-heading a");
  expect(host.textContent).toContain("/products?search=Nike");
});
test("clearing aborts pending work and stale results cannot return", async () => {
  let resolve;
  axios.get.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await render();
  await type("Nike");
  await settle();
  const signal = axios.get.mock.calls[0][1].signal;
  await click('[aria-label="Clear search"]');
  expect(signal.aborted).toBe(true);
  await act(async () => resolve({ data: { results: [product] } }));
  expect(document.querySelector(".nike-search-product")).toBeNull();
  expect(document.querySelector("input").value).toBe("");
});
test("failed search can retry, and empty results are explained", async () => {
  axios.get.mockRejectedValueOnce(new Error("offline"));
  await render();
  await type("Dunk");
  await settle();
  expect(document.querySelector('[role="alert"]').textContent).toContain(
    "couldn’t search",
  );
  axios.get.mockResolvedValue({ data: { count: 0, results: [] } });
  await click(".nike-search-empty button");
  await settle();
  expect(document.querySelector(".nike-search-empty").textContent).toContain(
    "No products found",
  );
});
test.each(["escape", "outside", "cancel"])(
  "closes on %s and releases scroll lock",
  async (method) => {
    await render();
    expect(document.body.style.overflow).toBe("hidden");
    if (method === "escape")
      await act(async () =>
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        ),
      );
    else
      await click(
        method === "outside" ? ".nike-search-backdrop" : ".nike-search-cancel",
      );
    await act(async () => jest.runOnlyPendingTimers());
    expect(close).toHaveBeenCalledTimes(1);
    expect(document.body.style.overflow).toBe("");
  },
);
