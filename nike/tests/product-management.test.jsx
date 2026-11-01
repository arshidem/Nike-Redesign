import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { AllProducts } from "../src/features/admin/components/AllProducts";
const mockFetch = jest.fn(),
  mockAnalytics = jest.fn(),
  mockDelete = jest.fn();
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({ backendUrl: "https://store.test", token: "token" }),
}));
jest.mock("../src/features/product/services/productService", () => ({
  useProductService: () => ({
    fetchProducts: mockFetch,
    fetchProductAnalytics: mockAnalytics,
    bulkDeleteProducts: mockDelete,
    fetchFilterOptions: async () => ({
      categories: ["shoes", "clothing"],
      genders: ["men", "women"],
      models: ["Dunk"],
      activityTypes: ["running"],
      sportTypes: ["basketball"],
      colors: ["black"],
      sizesByCategory: { shoes: ["UK 6"] },
    }),
  }),
}));
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));
const product = {
  _id: "p1",
  slug: "dunk",
  name: "Nike Dunk",
  model: "Dunk",
  gender: "women",
  price: 10000,
  finalPrice: 5000,
  sold: 4,
  rating: { average: 4.5, total: 2 },
  variants: [
    {
      _id: "v1",
      color: "black",
      images: ["https://images.test/shoe.avif"],
      sizes: [{ size: "UK 6", stock: 5 }],
    },
  ],
};
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  mockFetch
    .mockReset()
    .mockResolvedValue({
      products: [product],
      pagination: { currentPage: 1, totalPages: 2, totalItems: 11 },
    });
  mockAnalytics
    .mockReset()
    .mockResolvedValue({
      totalProducts: 11,
      totalVariants: 22,
      totalUnitsSold: { allTime: 4 },
      averageRating: 4.5,
    });
  mockDelete.mockReset().mockResolvedValue({ deletedCount: 1 });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
const render = async () =>
  act(async () =>
    root.render(
      <MemoryRouter>
        <AllProducts />
      </MemoryRouter>,
    ),
  );
const click = async (selector) =>
  act(async () => document.querySelector(selector).click());
const change = async (label, value) =>
  act(async () => {
    const element = document.querySelector(`[aria-label="${label}"]`);
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
test("shows real metrics, variant previews, stock status and edit destinations in table and grid", async () => {
  await render();
  expect(host.querySelector(".pm-summary").textContent).toContain("4.5");
  expect(host.querySelector(".pm-product-link img").src).toBe(
    product.variants[0].images[0],
  );
  expect(host.querySelector(".pm-final-price").textContent).toContain(
    "50% OFF",
  );
  expect(host.querySelector(".pm-stock-badge").textContent).toBe("In stock");
  expect(
    host.querySelector('[aria-label="Edit Nike Dunk"]').getAttribute("href"),
  ).toBe("/admin/product/update/dunk");
  await click('[aria-label="Grid view"]');
  expect(host.querySelector(".pm-grid-card")).not.toBeNull();
});
test("sort and filters reach the API, and clear resets page one and all filters", async () => {
  await render();
  await change("Sort products", "priceDesc");
  expect(mockFetch.mock.calls.at(-1)[0].sortBy).toBe("priceDesc");
  await click(".pm-toolbar-actions>button");
  const form = document.querySelector(".pm-dialog form");
  await act(async () => {
    const select = [...form.querySelectorAll("label")]
      .find((label) => label.textContent.startsWith("Gender"))
      .querySelector("select");
    select.value = "women";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await act(async () =>
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    ),
  );
  expect(mockFetch.mock.calls.at(-1)[0].gender).toBe("women");
  await click(".pm-pagination button:last-child");
  expect(mockFetch.mock.calls.at(-1)[0].page).toBe(2);
  await click(".pm-applied button");
  const last = mockFetch.mock.calls.at(-1)[0];
  expect(last.page).toBe(1);
  expect(last.gender).toBe("");
  expect(last.sortBy).toBe("");
});
test("delete requires confirmation, failure preserves rows and selection, and retry succeeds", async () => {
  await render();
  await click('[aria-label="Select Nike Dunk"]');
  await click(".pm-delete");
  expect(mockDelete).not.toHaveBeenCalled();
  mockDelete.mockRejectedValueOnce(new Error("offline"));
  await click(".pm-danger");
  expect(host.querySelector(".pm-product-link").textContent).toContain(
    product.name,
  );
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="Select Nike Dunk"]').checked).toBe(
    true,
  );
  mockFetch.mockResolvedValue({
    products: [],
    pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
  });
  await click(".pm-danger");
  expect(mockDelete).toHaveBeenLastCalledWith(["p1"]);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(host.textContent).toContain("No products found");
});
test("request failures show retry instead of an empty catalog", async () => {
  mockFetch.mockRejectedValueOnce(new Error("Connection failed"));
  await render();
  expect(host.querySelector('[role="alert"]').textContent).toContain(
    "Connection failed",
  );
  await click(".pm-empty button");
  expect(host.querySelector(".pm-product-link")).not.toBeNull();
});
