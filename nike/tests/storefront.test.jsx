import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { Navbar } from "../src/features/user/components/Navbar";
import Featured from "../src/features/user/components/Featured";

jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({
    user: null,
    backendUrl: "https://example.test",
    logout: jest.fn(),
  }),
}));
jest.mock("../src/features/user/components/Search", () => () => (
  <div role="search">Product search</div>
));
jest.mock("axios", () => ({ get: jest.fn(), isCancel: jest.fn(() => false) }));

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  localStorage.clear();
  jest.clearAllMocks();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
const render = async (component) =>
  act(async () => root.render(<MemoryRouter>{component}</MemoryRouter>));
const click = async (element) =>
  act(async () =>
    element.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );

test("mobile navigation opens, exposes real category links, and Escape restores scrolling and focus", async () => {
  document.body.style.overflow = "auto";
  await render(<Navbar />);
  const toggle = container.querySelector('[aria-controls="store-mobile-nav"]');
  await click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(
    container.querySelector(
      '#store-mobile-nav a[href="/women/shoes?gender=women&category=shoes"]',
    ),
  ).not.toBeNull();
  expect(document.body.style.overflow).toBe("hidden");
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    ),
  );
  expect(container.querySelector("#store-mobile-nav")).toBeNull();
  expect(document.body.style.overflow).toBe("auto");
  expect(document.activeElement).toBe(toggle);
});

test("navigation tolerates corrupt local bag storage and opens search", async () => {
  localStorage.setItem("bagItems", "{invalid");
  await render(<Navbar />);
  expect(container.querySelector('a[href="/bag"]')).not.toBeNull();
  await click(container.querySelector('[aria-label="Search products"]'));
  expect(container.querySelector('[role="search"]')).not.toBeNull();
});

test("featured edit uses live product routes, remote image URLs, and zero prices", async () => {
  axios.get.mockResolvedValue({
    data: [
      {
        _id: "1",
        slug: "test-shoe",
        name: "Test shoe",
        featuredImg: "https://images.example.test/shoe.jpg",
        finalPrice: 0,
      },
    ],
  });
  await render(<Featured />);
  expect(container.querySelector('a[href="/product/test-shoe"] img').src).toBe(
    "https://images.example.test/shoe.jpg",
  );
  expect(container.textContent).toContain("₹0");
  expect(container.querySelector('[role="status"]')).toBeNull();
});

test("featured API failure offers a retry and recovers to a real empty state", async () => {
  axios.get
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ data: [] });
  await render(<Featured />);
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  await click(container.querySelector('[role="alert"] button'));
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.textContent).toContain(
    "The next featured edit is on its way",
  );
  expect(
    container.querySelector('a[href="/new/arrivals?newArrival=true"]'),
  ).not.toBeNull();
});
