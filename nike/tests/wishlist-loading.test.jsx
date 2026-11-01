import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { useWishlist } from "../src/hooks/useWishlist";
import WishlistSpinner from "../src/shared/ui/WishlistSpinner";
import { toast } from "react-hot-toast";
const mockToggle = jest.fn();
jest.mock("../src/features/user/services/wishlistServices", () => ({
  useWishlistService: () => ({
    getWishlist: async () => ({ data: [] }),
    toggleWishlist: mockToggle,
  }),
}));
jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
const user = { _id: "user1" };
let trigger;
function Cards() {
  const { wishlistLoading, handleWishlistToggle, isInWishlist } =
    useWishlist(user);
  trigger = handleWishlistToggle;
  return (
    <>
      {["p1", "p2", "p1"].map((id, index) => (
        <button
          key={index}
          data-card={`${id}-${index}`}
          disabled={wishlistLoading[id]}
          aria-busy={Boolean(wishlistLoading[id])}
          aria-pressed={isInWishlist(id)}
          onClick={(event) => handleWishlistToggle(id, event)}
        >
          {wishlistLoading[id] ? <WishlistSpinner /> : "Heart"}
        </button>
      ))}
    </>
  );
}
let root, container, errorLog;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mockToggle.mockReset();
  jest.clearAllMocks();
  errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  errorLog.mockRestore();
});
const render = async () =>
  act(async () =>
    root.render(
      <MemoryRouter>
        <Cards />
      </MemoryRouter>,
    ),
  );
const click = async (element) =>
  act(async () =>
    element.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );

test("only the pending product shows rings, including its duplicate card, and duplicate requests are blocked", async () => {
  let resolve;
  mockToggle.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await render();
  await click(container.querySelector('[data-card="p1-0"]'));
  expect(container.querySelectorAll(".wishlist-spinner")).toHaveLength(2);
  expect(
    container.querySelector('[data-card="p1-0"]').getAttribute("aria-busy"),
  ).toBe("true");
  expect(container.querySelector('[data-card="p2-1"]').disabled).toBe(false);
  await act(async () => {
    trigger("p1");
  });
  expect(mockToggle).toHaveBeenCalledTimes(1);
  await act(async () =>
    resolve({ wishlist: [{ _id: "p1" }], action: "added" }),
  );
  expect(container.querySelectorAll(".wishlist-spinner")).toHaveLength(0);
  expect(container.querySelector('[data-card="p1-0"]').disabled).toBe(false);
  expect(
    container.querySelector('[data-card="p1-0"]').getAttribute("aria-pressed"),
  ).toBe("true");
});

test("failed wishlist requests clear the loading state and allow a retry", async () => {
  let reject;
  mockToggle
    .mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    )
    .mockResolvedValue({ wishlist: [{ _id: "p1" }], action: "added" });
  await render();
  const button = container.querySelector('[data-card="p1-0"]');
  await click(button);
  await act(async () => reject(new Error("Temporarily offline")));
  expect(container.querySelectorAll(".wishlist-spinner")).toHaveLength(0);
  expect(button.disabled).toBe(false);
  expect(toast.error).toHaveBeenCalledWith("Temporarily offline");
  await click(button);
  expect(mockToggle).toHaveBeenCalledTimes(2);
  expect(button.getAttribute("aria-pressed")).toBe("true");
});
