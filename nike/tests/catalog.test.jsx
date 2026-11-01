import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import ProductListPage from "../src/features/user/pages/ProductListPage";

const mockFetch = jest.fn();
const mockWishlist = jest.fn();
jest.mock("../src/features/product/services/productService", () => ({
  useProductService: () => ({
    fetchProducts: mockFetch,
    fetchFilterOptions: async () => ({
      categories: ["shoes", "clothing"],
      models: ["Nike Dunk", "Blazer"],
      sizes: ["UK 5", "M"],
      colors: ["black", "white"],
      sportTypes: ["running", "basketball"],
      activityTypes: ["casual", "training"],
    }),
  }),
}));
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({ backendUrl: "https://store.test", user: null }),
}));
jest.mock("../src/hooks/useWishlist", () => ({
  useWishlist: () => ({
    wishlistLoading: {},
    isInWishlist: () => false,
    handleWishlistToggle: mockWishlist,
  }),
}));
jest.mock("../src/features/user/components/Search", () => () => (
  <div role="search">Search</div>
));
const shoe = {
  _id: "shoe",
  slug: "shoe",
  name: "Dunk",
  gender: "men",
  price: 10000,
  category: "shoes",
  isTrending: true,
  variants: [{ images: ["C:\\catalog\\uploads\\shoe.avif"] }],
};
const apparel = {
  _id: "tee",
  slug: "tee",
  name: "Everyday T-shirt",
  gender: "women",
  price: 2000,
  category: "clothing",
};
function Location() {
  const location = useLocation();
  return (
    <output data-location>
      {location.pathname}
      {location.search}
    </output>
  );
}
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mockFetch.mockReset();
  mockWishlist.mockReset();
  mockFetch.mockImplementation(async (query) => ({
    products: query.newArrival || query.category ? [shoe] : [shoe, apparel],
    pagination: {
      totalItems: query.newArrival || query.category ? 1 : 2,
      totalPages: 1,
    },
    genderCounts: { all: 2, men: 1, women: 1, kids: 0 },
  }));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
const render = async (url = "/products?newArrival=true") =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <Location />
        <ProductListPage />
      </MemoryRouter>,
    ),
  );
const click = async (element) =>
  act(async () =>
    element.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
const change = async (element, value) =>
  act(async () => {
    const prototype =
      element.tagName === "SELECT"
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(
      element,
      value,
    );
    element.dispatchEvent(
      new Event(element.tagName === "SELECT" ? "change" : "input", {
        bubbles: true,
      }),
    );
  });
const location = () => container.querySelector("[data-location]").textContent;

test("legacy collection entry uses the URL for its header; clear all removes every filter and shows apparel", async () => {
  await render("/new/arrivals?newArrival=true&gender=men&category=shoes");
  expect(container.querySelector("h1").textContent).toContain("NewArrivals");
  expect(mockFetch.mock.calls.at(-1)[0]).toMatchObject({
    newArrival: "true",
    gender: "men",
    category: ["shoes"],
  });
  await click(container.querySelector(".catalog-clear"));
  expect(location()).toBe("/products");
  expect(container.querySelector("h1").textContent).toContain("AllProducts");
  expect(container.textContent).toContain("Everyday T-shirt");
  expect(mockFetch.mock.calls.at(-1)[0]).toEqual({ page: 1, limit: 24 });
});

test("gender and sort retain collection and repeated category filters; removing a chip removes only that filter", async () => {
  await render("/products?isTrending=true&category=shoes&category=clothing");
  await click(container.querySelectorAll(".catalog-gender-pills button")[2]);
  await change(container.querySelector('[aria-label="Sort by"]'), "priceAsc");
  expect(mockFetch.mock.calls.at(-1)[0]).toMatchObject({
    isTrending: "true",
    gender: "women",
    sortBy: "priceAsc",
    category: ["shoes", "clothing"],
  });
  await click(container.querySelector('[aria-label="Remove Shoes filter"]'));
  expect(mockFetch.mock.calls.at(-1)[0].category).toEqual(["clothing"]);
  expect(location()).toContain("isTrending=true");
  expect(container.querySelector("h1").textContent).toContain("TrendingNow");
});

test("drawer applies multiple categories and real rupee prices; Escape restores focus and scrolling", async () => {
  await render("/products?newArrival=true");
  const open = container.querySelector('[aria-controls="catalog-filters"]');
  await click(open);
  const drawer = container.querySelector('[role="dialog"]');
  expect(document.body.style.overflow).toBe("hidden");
  const labels = [...drawer.querySelectorAll("label")];
  await click(
    labels
      .find((element) => element.textContent === "Shoes")
      .querySelector("input"),
  );
  await click(
    labels
      .find((element) => element.textContent === "Clothing")
      .querySelector("input"),
  );
  await change(drawer.querySelector('input[type="number"]'), "5000");
  await click(drawer.querySelector("footer .store-button"));
  expect(mockFetch.mock.calls.at(-1)[0]).toMatchObject({
    newArrival: "true",
    category: ["shoes", "clothing"],
    minPrice: "5000",
  });
  expect(mockFetch.mock.calls.at(-1)[0].maxPrice).toBeUndefined();
  await click(open);
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    ),
  );
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(document.body.style.overflow).not.toBe("hidden");
  expect(document.activeElement).toBe(open);
});

test("API failures show retry; image paths, list view and wishlist controls work independently", async () => {
  mockFetch.mockRejectedValueOnce(new Error("unavailable"));
  await render();
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  await click(container.querySelector('[role="alert"] button'));
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.querySelector(".catalog-card img").src).toBe(
    "https://store.test/uploads/shoe.avif",
  );
  await click(container.querySelector('[aria-label="List view"]'));
  expect(container.querySelector(".catalog-results-list")).not.toBeNull();
  await click(container.querySelector(".catalog-wishlist"));
  expect(mockWishlist).toHaveBeenCalledWith("shoe", expect.anything());
  expect(location()).toBe("/products?newArrival=true");
});

test("an older request cannot overwrite results after the filters change", async () => {
  let resolveOld;
  mockFetch.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  );
  await render();
  await click(container.querySelector(".catalog-clear"));
  expect(container.textContent).toContain("Everyday T-shirt");
  await act(async () =>
    resolveOld({
      products: [shoe],
      pagination: { totalItems: 1 },
      genderCounts: {},
    }),
  );
  expect(container.textContent).toContain("Everyday T-shirt");
  expect(container.querySelector("h1").textContent).toContain("AllProducts");
});

test("reference-style groups retain every current filter, including selections in collapsed groups", async () => {
  await render("/products?newArrival=true&gender=men&category=shoes&model=Nike%20Dunk&sportType=running&activityType=casual&size=UK%205&color=black&minPrice=5000&maxPrice=15000&minRating=4&minDiscount=10");
  await click(container.querySelector('[aria-controls="catalog-filters"]'));
  const dialog = container.querySelector('[role="dialog"]');
  expect([...dialog.querySelectorAll("legend button")].map((button) => button.textContent)).toEqual(["Collections", "Gender", "Category", "Model", "Sport", "Activity", "Size", "Color", "Price (₹)", "Rating", "Discount"]);
  const modelGroup = dialog.querySelector(".catalog-model-group");
  await click(modelGroup.querySelector("legend button"));
  expect(modelGroup.querySelector(".catalog-filter-group-body").hidden).toBe(true);
  expect(modelGroup.querySelector("input").checked).toBe(true);
  const white = [...dialog.querySelectorAll(".catalog-color-option")].find((option) => option.textContent === "White");
  await click(white.querySelector("input"));
  await click(dialog.querySelector("footer .store-button"));
  expect(mockFetch.mock.calls.at(-1)[0]).toMatchObject({ newArrival: "true", gender: "men", category: ["shoes"], model: ["Nike Dunk"], sportType: ["running"], activityType: ["casual"], size: ["UK 5"], color: "white", minPrice: "5000", maxPrice: "15000", minRating: "4", minDiscount: "10" });
});
