import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Coupon, { couponStatus } from "../src/features/admin/components/Coupon";
const mockFetch = jest.fn(),
  mockCreate = jest.fn(),
  mockUpdate = jest.fn(),
  mockDelete = jest.fn();
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({ backendUrl: "https://store.test", token: "admin" }),
}));
jest.mock("../src/features/product/services/couponService", () => ({
  useCouponService: () => ({
    fetchCoupons: mockFetch,
    createCoupon: mockCreate,
    updateCoupon: mockUpdate,
    deleteCoupon: mockDelete,
  }),
}));
const records = [
  {
    _id: "expired",
    code: "BBBB",
    discountType: "percent",
    discountValue: 50,
    minOrderAmount: 10000,
    expiresAt: "2025-10-16T23:59:59Z",
    isActive: true,
    usageCount: 128,
    createdAt: "2025-01-01",
  },
  {
    _id: "live",
    code: "EVERYDAY",
    discountType: "percent",
    discountValue: 20,
    minOrderAmount: 0,
    expiresAt: null,
    isActive: true,
    usageCount: 4,
    createdAt: "2026-10-01",
  },
  {
    _id: "inactive",
    code: "WELCOME",
    discountType: "fixed",
    discountValue: 2000,
    minOrderAmount: 4000,
    expiresAt: "2030-01-01",
    isActive: false,
    usageCount: 0,
    createdAt: "2026-09-01",
  },
];
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers().setSystemTime(new Date("2026-11-05T12:00:00Z"));
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({ success: true, data: records });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  jest.useRealTimers();
});
const render = () =>
  act(async () =>
    root.render(
      <MemoryRouter>
        <Coupon />
      </MemoryRouter>,
    ),
  );
const click = (element) => act(async () => element.click());
const input = (name, value) =>
  act(async () => {
    const element = host.querySelector(`[name="${name}"]`);
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
const submit = () =>
  act(async () =>
    host
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
const select = async (label, text) => {
  await click(host.querySelector(`[aria-label="${label}"]`));
  await click(
    [...host.querySelectorAll('[role="option"]')].find(
      (el) => el.textContent === text,
    ),
  );
};
test("shows real metrics, paid-order usage, discount types and no-expiry status", async () => {
  await render();
  expect(
    [...host.querySelectorAll(".coupons-metric strong")].map(
      (el) => el.textContent,
    ),
  ).toEqual(["3", "1", "1", "132"]);
  expect(couponStatus(records[1])).toBe("active");
  expect(host.querySelectorAll(".coupons-table tbody tr")).toHaveLength(3);
  expect(host.textContent).toContain("₹2,000 OFF");
  expect(host.textContent).toContain("50% OFF");
  expect(host.textContent).toContain("No expiry");
  expect(host.querySelector("select")).toBeNull();
});
test("search, status, type and sort combine and clear filters restores results", async () => {
  await render();
  await select("Filter coupon status", "Inactive");
  expect(host.querySelectorAll("tbody tr")).toHaveLength(1);
  expect(host.querySelector("tbody").textContent).toContain("WELCOME");
  await select("Filter discount type", "Percentage");
  expect(host.querySelectorAll("tbody tr")).toHaveLength(0);
  await click(
    [...host.querySelectorAll("button")].find(
      (el) => el.textContent === "Clear filters",
    ),
  );
  await select("Sort coupons", "Most Used");
  expect(host.querySelector("tbody tr").textContent).toContain("BBBB");
  const search = host.querySelector('input[type="search"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(search, "every");
    search.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(host.querySelectorAll("tbody tr")).toHaveLength(1);
  expect(host.querySelector("tbody").textContent).toContain("EVERYDAY");
});
test("creates uppercase coupon with numeric values and optional null expiry", async () => {
  mockCreate.mockResolvedValue({
    success: true,
    data: { ...records[1], _id: "new", code: "NIKE20" },
  });
  await render();
  await input("code", "nike20");
  await input("discountValue", "20");
  await input("minOrderAmount", "1000");
  await submit();
  expect(mockCreate).toHaveBeenCalledWith({
    code: "NIKE20",
    discountType: "percent",
    discountValue: 20,
    minOrderAmount: 1000,
    expiresAt: null,
    isActive: true,
  });
  expect(host.querySelector('[name="code"]').value).toBe("");
  expect(host.querySelector(".coupons-success").textContent).toContain(
    "Coupon added",
  );
});
test("rejects duplicate codes and percentages over 100 without API writes", async () => {
  await render();
  await input("code", "everyday");
  await input("discountValue", "20");
  await submit();
  expect(
    host.querySelector('.coupons-form [role="alert"]').textContent,
  ).toContain("already exists");
  await input("code", "NEW");
  await input("discountValue", "101");
  await submit();
  expect(
    host.querySelector('.coupons-form [role="alert"]').textContent,
  ).toContain("no more than 100");
  expect(mockCreate).not.toHaveBeenCalled();
});
test("edit preserves a no-expiry coupon and only resets after successful save", async () => {
  Element.prototype.scrollIntoView = jest.fn();
  mockUpdate
    .mockResolvedValueOnce({ success: false, error: "Save failed" })
    .mockResolvedValueOnce({ success: true, data: records[1] });
  await render();
  await click(host.querySelector('[aria-label="Edit EVERYDAY"]'));
  expect(host.querySelector('[name="expiresAt"]').value).toBe("");
  await input("discountValue", "25");
  await submit();
  expect(host.querySelector('[role="alert"]').textContent).toContain(
    "Save failed",
  );
  expect(host.querySelector('[name="discountValue"]').value).toBe("25");
  await submit();
  expect(mockUpdate).toHaveBeenLastCalledWith(
    "live",
    expect.objectContaining({ discountValue: 25, expiresAt: null }),
  );
  expect(host.querySelector('[aria-label="Add new coupon"]')).not.toBeNull();
});
test("delete requires confirmation and API failures keep the coupon and dialog", async () => {
  mockDelete
    .mockRejectedValueOnce(new Error("Delete failed"))
    .mockResolvedValueOnce({ success: true });
  await render();
  await click(host.querySelector('[aria-label="Delete EVERYDAY"]'));
  expect(mockDelete).not.toHaveBeenCalled();
  await click(document.querySelector(".coupons-delete-confirm"));
  expect(
    document.querySelector('[role="dialog"] [role="alert"]').textContent,
  ).toContain("Delete failed");
  expect(host.querySelector('[aria-label="Edit EVERYDAY"]')).not.toBeNull();
  await click(document.querySelector(".coupons-delete-confirm"));
  expect(mockDelete).toHaveBeenCalledWith("live");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(host.querySelector('[aria-label="Edit EVERYDAY"]')).toBeNull();
});
test("load failures show retry and unavailable metrics instead of fabricated zeros", async () => {
  mockFetch.mockRejectedValueOnce(new Error("Offline"));
  await render();
  expect(host.querySelector('[role="alert"]').textContent).toContain("Offline");
  expect(host.querySelector(".coupons-metric strong").textContent).toBe("—");
  expect(host.querySelector('[type="submit"]').disabled).toBe(true);
  await click(
    [...host.querySelectorAll("button")].find(
      (el) => el.textContent === "Try again",
    ),
  );
  expect(host.querySelectorAll("tbody tr")).toHaveLength(3);
});
