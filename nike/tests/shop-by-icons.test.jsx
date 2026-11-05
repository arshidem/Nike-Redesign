import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import ShopByIcons from "../src/features/user/components/ShopByIcons";
const mockFetch = jest.fn(),
  mockOptions = jest.fn();
jest.mock("../src/features/product/services/productService", () => ({
  useProductService: () => ({
    fetchProducts: mockFetch,
    fetchFilterOptions: mockOptions,
  }),
}));
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({ backendUrl: "https://store.test/" }),
}));
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  mockOptions.mockResolvedValue({
    models: ["Nike Dunk", "Blazer", "Vomero 18"],
  });
  mockFetch.mockResolvedValue({ products: [], pagination: { totalPages: 1 } });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
const render = () =>
  act(async () =>
    root.render(
      <MemoryRouter>
        <ShopByIcons />
      </MemoryRouter>,
    ),
  );
const cards = () => [...host.querySelectorAll("a.store-icon-card")];
test("renders every model from filter options even when the product page has no items", async () => {
  await render();
  expect(cards()).toHaveLength(3);
  expect(cards()[0].getAttribute("href")).toBe("/products?model=Nike+Dunk");
  expect(mockFetch).toHaveBeenCalledWith(
    { page: 1, limit: 100 },
    expect.objectContaining({ throwOnError: true, signal: expect.anything() }),
  );
  expect(mockFetch.mock.calls[0][0].category).toBeUndefined();
});
test("loads model images across pages and skips blank models and empty first variants", async () => {
  mockOptions.mockResolvedValue({ models: [] });
  mockFetch
    .mockResolvedValueOnce({
      products: [
        {
          model: "Nike Dunk",
          variants: [
            { images: [] },
            { images: ["C:\\store\\uploads\\dunk.avif"] },
          ],
        },
        { model: " ", variants: [] },
      ],
      pagination: { totalPages: 2 },
    })
    .mockResolvedValueOnce({
      products: [
        {
          model: "Blazer",
          variants: [{ images: ["https://cdn.test/blazer.avif"] }],
        },
        { model: "Nike Dunk", variants: [] },
      ],
      pagination: { totalPages: 2 },
    });
  await render();
  expect(cards()).toHaveLength(2);
  expect(cards()[0].querySelector("img").src).toBe(
    "https://store.test/uploads/dunk.avif",
  );
  expect(cards()[1].querySelector("img").src).toBe(
    "https://cdn.test/blazer.avif",
  );
  expect(mockFetch.mock.calls[1][0]).toEqual({ page: 2, limit: 100 });
});
test("model cards become usable before the image request resolves", async () => {
  let resolve;
  mockFetch.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await render();
  expect(cards()).toHaveLength(3);
  expect(host.querySelector(".animate-pulse")).toBeNull();
  await act(async () =>
    resolve({
      products: [
        {
          model: "Nike Dunk",
          variants: [{ images: ["/assets/editorial/dunk.png"] }],
        },
      ],
      pagination: { totalPages: 1 },
    }),
  );
  expect(cards()[0].querySelector("img").getAttribute("src")).toBe(
    "/assets/editorial/dunk.png",
  );
});
test("product request failure still leaves real model links usable", async () => {
  mockFetch.mockRejectedValue(new Error("Offline"));
  await render();
  expect(cards()).toHaveLength(3);
  expect(host.querySelector('[role="status"]').textContent).toContain(
    "still browse",
  );
  expect(cards()[1].getAttribute("href")).toBe("/products?model=Blazer");
});
test("filter option failure falls back to product models", async () => {
  mockOptions.mockResolvedValue({});
  mockFetch.mockResolvedValue({
    products: [{ model: "Air + Zoom & 90", variants: [] }],
    pagination: { totalPages: 1 },
  });
  await render();
  expect(cards()).toHaveLength(1);
  expect(
    new URLSearchParams(cards()[0].getAttribute("href").split("?")[1]).get(
      "model",
    ),
  ).toBe("Air + Zoom & 90");
});
test("total failure offers retry and does not misreport an empty catalog", async () => {
  mockOptions.mockRejectedValueOnce(new Error("Offline"));
  mockFetch.mockRejectedValueOnce(new Error("Offline"));
  await render();
  expect(host.textContent).toContain("couldn’t load model collections");
  expect(cards()).toHaveLength(0);
  await act(async () =>
    host.querySelector(".store-inline-error button").click(),
  );
  expect(cards()).toHaveLength(3);
  expect(host.querySelector(".store-inline-error")).toBeNull();
});
test("unmount aborts an unfinished product request", async () => {
  mockFetch.mockImplementation(() => new Promise(() => {}));
  await render();
  const signal = mockFetch.mock.calls[0][1].signal;
  await act(async () => root.render(null));
  expect(signal.aborted).toBe(true);
});
