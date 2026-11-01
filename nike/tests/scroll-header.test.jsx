import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { useScrollHeader } from "../src/hooks/useScrollHeader";
function Harness() {
  const { ref, hidden } = useScrollHeader();
  const navigate = useNavigate();
  return (
    <>
      <header ref={ref} data-hidden={hidden}>
        Header
      </header>
      <button id="navigate" onClick={() => navigate("/bag")}>
        Bag
      </button>
    </>
  );
}
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  Object.defineProperty(window, "scrollY", {
    value: 0,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: 2400,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: 800,
    writable: true,
    configurable: true,
  });
  window.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  document.body.style.overflow = "";
  jest.useRealTimers();
});
const render = async () =>
  act(async () =>
    root.render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    ),
  );
const scroll = async (y) =>
  act(async () => {
    window.scrollY = y;
    window.dispatchEvent(new Event("scroll"));
    jest.advanceTimersByTime(20);
  });
const hidden = () => host.querySelector("header").getAttribute("data-hidden");
test("hides after downward travel, ignores tiny direction changes and reveals on upward travel or at the top", async () => {
  await render();
  await scroll(200);
  expect(hidden()).toBe("true");
  await scroll(197);
  expect(hidden()).toBe("true");
  await scroll(194);
  expect(hidden()).toBe("true");
  await scroll(180);
  expect(hidden()).toBe("false");
  await scroll(240);
  expect(hidden()).toBe("true");
  await scroll(0);
  expect(hidden()).toBe("false");
});
test("dialog scroll lock, keyboard navigation and route changes reveal the header", async () => {
  await render();
  await scroll(200);
  await act(async () => {
    document.body.style.overflow = "hidden";
  });
  expect(hidden()).toBe("false");
  await scroll(400);
  expect(hidden()).toBe("false");
  await act(async () => {
    document.body.style.overflow = "";
  });
  await scroll(430);
  expect(hidden()).toBe("true");
  await act(async () =>
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" })),
  );
  expect(hidden()).toBe("false");
  await scroll(460);
  expect(hidden()).toBe("true");
  await act(async () => host.querySelector("#navigate").click());
  expect(hidden()).toBe("false");
});
test("clamps bottom overscroll and batches rapid scroll events into one animation frame", async () => {
  await render();
  await scroll(1600);
  expect(hidden()).toBe("true");
  await scroll(1800);
  await scroll(1700);
  expect(hidden()).toBe("true");
  requestAnimationFrame.mockClear();
  await act(async () => {
    window.scrollY = 1550;
    for (let i = 0; i < 5; i++) window.dispatchEvent(new Event("scroll"));
    jest.advanceTimersByTime(20);
  });
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  expect(hidden()).toBe("false");
});
