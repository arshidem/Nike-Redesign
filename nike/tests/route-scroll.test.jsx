import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";
import RouteScrollReset from "../src/shared/ui/RouteScrollReset";
function Harness() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  return (
    <>
      <RouteScrollReset />
      <button id="product" onClick={() => navigate("/product/shoe")}>
        Product
      </button>
      <button id="query" onClick={() => navigate("/products?gender=men")}>
        Query
      </button>
      <button id="admin" onClick={() => navigate("/admin#products")}>
        Admin
      </button>
      <button id="anchor" onClick={() => navigate("/home#main-content")}>
        Anchor
      </button>
      <button id="back" onClick={() => navigate(-1)}>
        Back
      </button>
      <button id="local" onClick={() => setCount((value) => value + 1)}>
        {count}
      </button>
    </>
  );
}
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.scrollTo = jest.fn();
  history.scrollRestoration = "auto";
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
const render = async () =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={["/home"]}>
        <Harness />
      </MemoryRouter>,
    ),
  );
const click = async (id) =>
  act(async () => host.querySelector("#" + id).click());
test("resets instantly on initial load, page/query navigation and browser Back", async () => {
  await render();
  expect(history.scrollRestoration).toBe("manual");
  expect(window.scrollTo).toHaveBeenLastCalledWith({
    top: 0,
    left: 0,
    behavior: "instant",
  });
  await click("product");
  await click("query");
  await click("back");
  expect(window.scrollTo).toHaveBeenCalledTimes(4);
  expect(
    window.scrollTo.mock.calls.every(
      ([options]) => options.top === 0 && options.behavior === "instant",
    ),
  ).toBe(true);
});
test("local UI changes retain scroll and real content anchors retain native behavior", async () => {
  await render();
  window.scrollTo.mockClear();
  await click("local");
  expect(window.scrollTo).not.toHaveBeenCalled();
  await click("anchor");
  expect(window.scrollTo).not.toHaveBeenCalled();
  await click("admin");
  expect(window.scrollTo).toHaveBeenCalledWith({
    top: 0,
    left: 0,
    behavior: "instant",
  });
});
