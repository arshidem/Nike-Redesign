import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OrderDetails from "../src/features/user/pages/OrderDetails";
const mockGet = jest.fn();
let mockToken = "token";
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({ backendUrl: "https://store.test", token: mockToken }),
}));
jest.mock("../src/features/user/services/orderServices", () => ({
  __esModule: true,
  default: () => ({ getOrderById: mockGet }),
}));
jest.mock("../src/features/user/components/Footer", () => () => null);
const order = {
  _id: "699ce2ac3523e9d227331231",
  status: "processing",
  createdAt: "2026-02-24T10:00:00Z",
  paymentMethod: "card",
  isPaid: true,
  itemsPrice: 47970,
  shippingPrice: 1250,
  taxPrice: 2399,
  totalPrice: 51619,
  shippingAddress: {
    fullName: "Arshid EM",
    street: "Chembulangad",
    city: "Ottapalam",
    state: "Kerala",
    postalCode: "679305",
    country: "India",
    phone: "8157875032",
  },
  items: [
    {
      title: "Nike Blazer Mid ’77 Vintage",
      image: "https://images.test/shoe.avif",
      size: "UK 5.5",
      color: "White",
      quantity: 6,
      price: 7995,
    },
  ],
};
let root, host, bottom;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  mockToken = "token";
  bottom = 150;
  jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function () {
      return {
        top: 0,
        bottom: this.tagName === "H1" ? bottom : 0,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
      };
    });
  global.requestAnimationFrame = jest.fn((cb) => setTimeout(() => cb(0), 16));
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  mockGet.mockReset().mockResolvedValue({ success: true, order });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  jest.restoreAllMocks();
  jest.useRealTimers();
});
const render = async () =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={["/orders/one"]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetails />} />
        </Routes>
      </MemoryRouter>,
    ),
  );
test("renders actual order data, item totals and tracking dates without invented delivery estimates", async () => {
  await render();
  expect(mockGet).toHaveBeenCalledWith("one");
  expect(host.querySelector(".od-heading").textContent).toContain(order._id);
  expect(host.querySelector(".od-grand-total").textContent).toContain("51,619");
  expect(host.querySelector(".od-products li>strong").textContent).toContain(
    "47,970",
  );
  expect(host.querySelector(".od-products img").src).toBe(order.items[0].image);
  expect(host.querySelector(".od-address").textContent).toContain("679305");
  expect(host.querySelector(".od-payment").textContent).toContain("Paid");
  expect(
    host.querySelectorAll(".od-timeline li>span:last-child")[1].textContent,
  ).toBe("—");
  expect(host.textContent).not.toContain("Estimated Delivery");
});
test("scroll swaps the logo and title and reverses on return, batching repeated events per frame", async () => {
  await render();
  expect(host.querySelector(".od-brand-collapsed")).toBeNull();
  bottom = -20;
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    jest.advanceTimersByTime(20);
  });
  expect(host.querySelector(".od-brand-collapsed")).not.toBeNull();
  expect(host.querySelector(".od-nav-logo").getAttribute("tabindex")).toBe(
    "-1",
  );
  expect(host.querySelector(".od-nav-title").getAttribute("aria-hidden")).toBe(
    "false",
  );
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  bottom = 180;
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
    jest.advanceTimersByTime(20);
  });
  expect(host.querySelector(".od-brand-collapsed")).toBeNull();
  expect(host.querySelector(".od-nav-title").getAttribute("aria-hidden")).toBe(
    "true",
  );
});
test("zero charges, discounts, cancelled and unpaid states are represented accurately", async () => {
  mockGet.mockResolvedValue({
    success: true,
    order: {
      ...order,
      status: "cancelled",
      isPaid: false,
      shippingPrice: 0,
      taxPrice: 0,
      discountPrice: 100,
      couponCode: "MOVE",
      totalPrice: 47870,
    },
  });
  await render();
  expect(host.querySelector(".od-status-banner").textContent).toContain(
    "cancelled",
  );
  expect(host.querySelector(".od-timeline")).toBeNull();
  expect(host.querySelector(".od-payment").textContent).toContain("Unpaid");
  expect(host.querySelector(".od-discount").textContent).toContain("MOVE");
  expect(host.querySelector(".od-totals").textContent).toContain("Shipping₹0");
});
test("the app bar remains available during failure and retry recovers", async () => {
  mockGet.mockResolvedValueOnce({ success: false, error: "Order not found" });
  await render();
  expect(host.querySelector(".customer-appbar")).not.toBeNull();
  expect(host.querySelector('[role="alert"]').textContent).toContain(
    "Order not found",
  );
  await act(async () => host.querySelector(".od-empty button").click());
  expect(host.querySelector(".od-products")).not.toBeNull();
});
