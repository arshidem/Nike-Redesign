import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProductDetails from "../src/features/user/pages/ProductDetails";

const mockFetch = jest.fn();
const mockAdd = jest.fn();
const mockGetCart = jest.fn();
const mockToggle = jest.fn();
jest.mock("../src/features/product/services/productService", () => ({ useProductService: () => ({ fetchProductBySlug: mockFetch }) }));
jest.mock("../src/context/AppContext", () => ({ useAppContext: () => ({ backendUrl: "https://store.test", token: "test-token" }) }));
jest.mock("../src/features/user/services/cartServices", () => ({ __esModule: true, default: () => ({ getCart: mockGetCart, addToCart: mockAdd, updateItemQuantity: jest.fn(), removeItemFromCart: jest.fn() }) }));
jest.mock("../src/features/user/services/wishlistServices", () => ({ useWishlistService: () => ({ getWishlist: async () => ({ data: [] }), toggleWishlist: mockToggle }) }));
jest.mock("../src/features/user/components/ProductSuggestions", () => () => <div>Suggestions</div>);
jest.mock("../src/features/user/components/ProductReviewSection", () => () => <div>Customer reviews</div>);
jest.mock("../src/features/user/components/Search", () => () => <div role="search">Search</div>);
jest.mock("react-hot-toast", () => ({ __esModule: true, default: { error: jest.fn(), success: jest.fn(), custom: jest.fn() }, Toaster: () => null }));
// Motion itself is checked in the real browser; keep these component tests
// focused on stock, selection and focus management.
jest.mock("framer-motion", () => {
  const React = require("react");
  const element = (tag) => React.forwardRef(({ children, initial, animate, exit, transition, drag, dragControls, dragListener, dragConstraints, dragElastic, onDragEnd, ...props }, ref) => React.createElement(tag, { ...props, ref }, children));
  return { AnimatePresence: ({ children }) => children, motion: { div: element("div"), section: element("section") }, useReducedMotion: () => true, useDragControls: () => ({ start() {} }) };
});
const product = { _id: "p1", slug: "shoe", name: "Nike Blazer Low Platform", category: "shoes", gender: "women", price: 8199, finalPrice: 8199, description: "Everyday comfort and classic style.", rating: { average: 4.5, total: 2 }, variants: [
  { _id: "pink", color: "pink", images: ["uploads/front.avif", "uploads/back.avif"], sizes: [{ size: "UK 5.5", stock: 2 }, { size: "UK 6", stock: 0 }] },
  { _id: "black", color: "black", images: ["uploads/black.avif"], sizes: [{ size: "UK 6", stock: 5 }] },
] };
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  mockFetch.mockReset().mockResolvedValue(product);
  mockGetCart.mockReset().mockResolvedValue({ items: [] });
  mockAdd.mockReset().mockImplementation(async (item) => ({ items: [item] }));
  mockToggle.mockReset().mockResolvedValue({ wishlist: [{ _id: "p1" }], action: "added" });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const render = async () => act(async () => root.render(<MemoryRouter initialEntries={["/product/shoe"]}><Routes><Route path="/product/:productSlug" element={<ProductDetails />} /></Routes></MemoryRouter>));
const click = async (element) => act(async () => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));

test("gallery cycles through images without a preview heart; color changes reset size selection", async () => {
  await render();
  expect(container.querySelector('.pdp-gallery [aria-label*="wishlist"]')).toBeNull();
  await click(container.querySelector('[aria-label="Next product image"]'));
  expect(container.querySelector(".pdp-main-image").src).toBe("https://store.test/uploads/back.avif");
  await click(container.querySelectorAll(".pdp-sizes button")[0]);
  expect(container.querySelector(".pdp-add-to-bag").disabled).toBe(false);
  await click(container.querySelector('[aria-label="Select black color"]'));
  expect(container.querySelector(".pdp-add-to-bag").disabled).toBe(true);
  expect(container.querySelectorAll(".pdp-sizes button")).toHaveLength(1);
});

test("size guide uses actual stock, changes selection, closes on Escape and restores focus", async () => {
  await render();
  const open = container.querySelector('[aria-haspopup="dialog"]');
  await click(open);
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog).not.toBeNull();
  expect(document.body.style.overflow).toBe("hidden");
  const sizes = dialog.querySelectorAll(".pdp-guide-sizes button");
  expect(sizes[1].disabled).toBe(true);
  await click(sizes[0]);
  expect(dialog.querySelector("footer p").textContent).toContain("UK 5.5");
  await click(dialog.querySelectorAll(".pdp-guide-tabs button")[1]);
  expect(dialog.textContent).toContain("Start from the ground up");
  await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(open);
  expect(document.body.style.overflow).not.toBe("hidden");
  expect(container.querySelector(".pdp-add-to-bag").disabled).toBe(false);
});

test("selected variant and size are sent to cart; the remaining favorite control still updates wishlist", async () => {
  await render();
  await click(container.querySelectorAll(".pdp-sizes button")[0]);
  await click(container.querySelector(".pdp-add-to-bag"));
  expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ productId: "p1", variantId: "pink", size: "UK 5.5", quantity: 1, stock: 2, price: 8199 }));
  expect(container.querySelector(".pdp-quantity").textContent).toContain("1 in bag");
  await click(container.querySelector(".pdp-favorite"));
  expect(mockToggle).toHaveBeenCalledWith("p1");
  expect(container.querySelector(".pdp-favorite").getAttribute("aria-pressed")).toBe("true");
});

test("failed product load offers retry; cart errors do not hide a loaded product", async () => {
  mockFetch.mockResolvedValueOnce(null);
  mockGetCart.mockRejectedValue(new Error("offline"));
  await render();
  expect(container.querySelector("h1").textContent).toContain("unavailable");
  await click(container.querySelector(".pdp-unavailable button"));
  expect(container.querySelector("#product-title").textContent).toBe(product.name);
});
