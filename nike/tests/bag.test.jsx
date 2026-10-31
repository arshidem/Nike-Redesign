import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Cart from "../src/features/user/pages/Cart";

const mockGet = jest.fn(), mockUpdate = jest.fn(), mockRemove = jest.fn(), mockToggle = jest.fn();
let mockToken = null;
jest.mock("../src/features/user/services/cartServices", () => ({ __esModule: true, default: () => ({ getCart: mockGet, updateItemQuantity: mockUpdate, removeItemFromCart: mockRemove }) }));
jest.mock("../src/features/product/services/productService", () => ({ useProductService: () => ({ fetchProducts: async () => ({ products: [{ _id: "p1", slug: "dunk", name: "Nike Dunk", gender: "men", finalPrice: 4148, variants: [{ images: ["https://images.test/dunk.avif"] }] }] }) }) }));
jest.mock("../src/context/AppContext", () => ({ useAppContext: () => ({ backendUrl: "https://store.test", token: mockToken, user: null }) }));
jest.mock("../src/hooks/useWishlist", () => ({ useWishlist: () => ({ wishlistLoading: {}, isInWishlist: () => false, handleWishlistToggle: mockToggle }) }));
jest.mock("react-hot-toast", () => ({ __esModule: true, default: { error: jest.fn() }, Toaster: () => null }));
const item = { _id: "server-line", productId: "p1", variantId: "v1", name: "Nike Dunk", gender: "men", color: "black", size: "UK 5.5", price: 4148, quantity: 1, total: 4148, stock: 2, image: "https://images.test/dunk.avif" };
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  mockToken = null;
  mockGet.mockReset().mockResolvedValue({ items: [item], total: 4148 });
  mockUpdate.mockReset().mockResolvedValue({ items: [{ ...item, quantity: 2, total: 8296 }], total: 8296 });
  mockRemove.mockReset().mockResolvedValue({ items: [], total: 0 });
  mockToggle.mockReset();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const render = async () => act(async () => root.render(<MemoryRouter initialEntries={["/bag"]}><Routes><Route path="/bag" element={<Cart />} /><Route path="/checkout" element={<p>Checkout step</p>} /></Routes></MemoryRouter>));
const click = async (element) => act(async () => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));

test("guest quantity updates use the composite ID, preserve remote images, update item counts and respect stock", async () => {
  await render();
  expect(container.querySelector(".bag-item img").src).toBe(item.image);
  expect(container.querySelector(".bag-summary").textContent).toContain("At checkout");
  await click(container.querySelector('[aria-label="Increase quantity of Nike Dunk"]'));
  expect(mockUpdate).toHaveBeenCalledWith("p1v1UK 5.5", 2);
  expect(container.querySelector("h1").textContent).toContain("(2)");
  expect(container.querySelector(".bag-summary-total").textContent).toContain("8,296");
  expect(container.querySelector('[aria-label="Increase quantity of Nike Dunk"]').disabled).toBe(true);
});

test("member cart controls use the server line ID and removal reveals the empty state", async () => {
  mockToken = "token";
  mockGet.mockResolvedValue({ items: [item], subtotal: 4148, shippingFee: 150, total: 4298 });
  await render();
  expect(container.querySelector(".bag-summary-total").textContent).toContain("4,298");
  await click(container.querySelector('[aria-label="Remove Nike Dunk from bag"]'));
  expect(mockRemove).toHaveBeenCalledWith("server-line");
  expect(container.querySelector(".bag-empty").textContent).toContain("Your bag is empty");
  expect(container.querySelector(".bag-checkout")).toBeNull();
});

test("pending quantity mutations cannot be submitted twice", async () => {
  let resolveUpdate;
  mockUpdate.mockImplementationOnce(() => new Promise((resolve) => { resolveUpdate = resolve; }));
  await render();
  const plus = container.querySelector('[aria-label="Increase quantity of Nike Dunk"]');
  await click(plus); await click(plus);
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  expect(container.querySelector(".bag-checkout").disabled).toBe(true);
  await act(async () => resolveUpdate({ items: [{ ...item, quantity: 2, total: 8296 }], total: 8296 }));
  expect(container.querySelector(".bag-checkout").disabled).toBe(false);
});

test("zero delivery fees, tax and coupons are reflected and checkout remains connected", async () => {
  mockGet.mockResolvedValue({ items: [item], subtotal: 4148, shippingFee: 0, tax: 50, coupon: { applied: true, code: "MOVE", discountAmount: 100 }, total: 4098 });
  await render();
  expect(container.querySelector(".bag-delivery-row dd").textContent).toBe("₹ 0");
  expect(container.querySelector(".bag-discount").textContent).toContain("MOVE");
  expect(container.querySelector(".bag-summary-total").textContent).toContain("4,098");
  await click(container.querySelector('[aria-label="About delivery charges"]'));
  expect(container.querySelector("#bag-delivery-note")).not.toBeNull();
  await click(container.querySelector(".bag-checkout"));
  expect(container.textContent).toContain("Checkout step");
});

test("load failures offer retry and favorites use the product ID without removing bag items", async () => {
  mockGet.mockRejectedValueOnce(new Error("offline"));
  await render();
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  await click(container.querySelector('[role="alert"] button'));
  expect(container.querySelector(".bag-item")).not.toBeNull();
  await click(container.querySelector(".bag-favorite"));
  expect(mockToggle).toHaveBeenCalledWith("p1", expect.anything());
  expect(mockRemove).not.toHaveBeenCalled();
});
