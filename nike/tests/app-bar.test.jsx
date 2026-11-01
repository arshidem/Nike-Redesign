import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AppBar from "../src/shared/ui/AppBar";
import { BackBar } from "../src/shared/ui/Icons";
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
const render = async (element) =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={["/wishlist"]}>
        <Routes>
          <Route path="/wishlist" element={element} />
          <Route path="/home" element={<p>Home destination</p>} />
          <Route path="/search" element={<p>Search destination</p>} />
        </Routes>
      </MemoryRouter>,
    ),
  );
const click = async (selector) =>
  act(async () => host.querySelector(selector).click());
test("legacy customer back bars use the shared brand and actions with a direct-entry fallback", async () => {
  await render(<BackBar />);
  expect(host.querySelector(".customer-appbar")).not.toBeNull();
  expect(host.querySelector('[aria-label="Nike home"] img')).not.toBeNull();
  await click(".customer-appbar-back");
  expect(host.textContent).toContain("Home destination");
});
test("bag hides its bag and search actions; checkout exposes its item count", async () => {
  await render(<AppBar hideBag hideSearch />);
  expect(host.querySelector('[aria-label="Shopping bag"]')).toBeNull();
  expect(host.querySelector('[aria-label="Search products"]')).toBeNull();
  await render(<AppBar hideSearch bagCount={3} />);
  expect(
    host.querySelector('[aria-label="Shopping bag, 3 items"]'),
  ).not.toBeNull();
  expect(host.querySelector(".customer-appbar-count").textContent).toBe("3");
});
test("page-specific back actions are preserved and default search navigates", async () => {
  const onBack = jest.fn();
  await render(<AppBar onBack={onBack} />);
  await click(".customer-appbar-back");
  expect(onBack).toHaveBeenCalledTimes(1);
  await click('[aria-label="Search products"]');
  expect(host.textContent).toContain("Search destination");
});
