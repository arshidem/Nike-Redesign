import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import SignIn from "../src/features/auth/pages/SignIn";
import FilterSection from "../src/features/user/pages/FilterSection";

jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({ backendUrl: "https://example.test" }),
}));
jest.mock("axios", () => ({ post: jest.fn() }));
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
  Toaster: () => null,
}));
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
const click = async (element) =>
  act(async () =>
    element.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
const renderSignIn = async () =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={["/signin"]}>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify-otp" element={<p>Verification step</p>} />
        </Routes>
      </MemoryRouter>,
    ),
  );

test("redesigned sign-in retains email validation without making an invalid API call", async () => {
  await renderSignIn();
  expect(container.querySelector(".auth-frame")).not.toBeNull();
  await click(container.querySelector(".design-sign-in button"));
  expect(toast.error).toHaveBeenCalledWith("Please enter your email.");
  expect(axios.post).not.toHaveBeenCalled();
});

test("redesigned sign-in retains the exact OTP request and next-step navigation", async () => {
  axios.post.mockResolvedValue({ data: { type: "signin" } });
  await renderSignIn();
  const input = container.querySelector('input[type="email"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(input, "member@example.test");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await click(container.querySelector(".design-sign-in button"));
  expect(axios.post).toHaveBeenCalledWith(
    "https://example.test/api/auth/request-otp",
    { email: "member@example.test" },
  );
  expect(localStorage.getItem("authEmail")).toBe("member@example.test");
  expect(localStorage.getItem("authFlow")).toBe("signin");
  expect(container.textContent).toContain("Verification step");
});

test("restyled reusable filter retains its selection callback and stays a component surface", async () => {
  const onChange = jest.fn();
  await act(async () =>
    root.render(
      <FilterSection
        title="Gender"
        options={["men", "women"]}
        selectedValues={[]}
        onChange={onChange}
      />,
    ),
  );
  expect(
    container.querySelector(".design-filter-section.design-page"),
  ).toBeNull();
  await click(container.querySelector("input"));
  expect(onChange).toHaveBeenCalledWith(["men"]);
});
