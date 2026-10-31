import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "../src/features/user/components/Navbar";
let mockUser = null;
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({
    user: mockUser,
    logout: jest.fn(),
    backendUrl: "https://store.test",
  }),
}));
jest.mock("../src/features/user/components/Search", () => () => null);
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  mockUser = null;
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
const render = async () =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={["/home"]}>
        <Navbar />
      </MemoryRouter>,
    ),
  );
const open = async () =>
  act(async () => host.querySelector('[aria-label="Open menu"]').click());
test("guest menu keeps all category destinations and signs in without exposing admin controls", async () => {
  await render();
  await open();
  const menu = host.querySelector("#store-mobile-nav");
  expect(menu.querySelectorAll(".store-menu-category")).toHaveLength(5);
  expect(
    menu.querySelectorAll(".store-menu-category summary strong")[0].textContent,
  ).toBe("New & Featured");
  expect(menu.querySelector('a[href="/products?gender=men"]')).not.toBeNull();
  expect(
    menu.querySelector('a[href="/products?gender=men&category=clothing"]'),
  ).not.toBeNull();
  expect(menu.querySelector('a[href="/signin"]')).not.toBeNull();
  expect(menu.querySelector('a[href="/admin"]')).toBeNull();
  expect(document.body.style.overflow).toBe("hidden");
  await act(async () =>
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
  );
  expect(host.querySelector("#store-mobile-nav")).toBeNull();
  expect(document.body.style.overflow).toBe("");
  expect(document.activeElement).toBe(
    host.querySelector('[aria-label="Open menu"]'),
  );
});
test("admin gets account and dashboard links, and choosing a destination dismisses the menu", async () => {
  mockUser = { name: "Arshid", role: "admin" };
  await render();
  await open();
  const menu = host.querySelector("#store-mobile-nav");
  expect(menu.querySelector('a[href="/admin"]')).not.toBeNull();
  expect(menu.querySelector('a[href="/account"]')).not.toBeNull();
  await act(async () => menu.querySelector('a[href="/orders"]').click());
  expect(host.querySelector("#store-mobile-nav")).toBeNull();
  expect(document.body.style.overflow).toBe("");
});
