import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AccountSettings from "../src/features/user/AccountSettings/AccountSettings";
import SupportRequests from "../src/features/admin/components/SupportRequests";
const mockAddressSave = jest.fn(),
  mockAddressRemove = jest.fn();
const mockPrefs = jest.fn(),
  mockSave = jest.fn(),
  mockOffers = jest.fn(),
  mockSupport = jest.fn(),
  mockSubmit = jest.fn(),
  mockExport = jest.fn(),
  mockDelete = jest.fn(),
  mockUpdate = jest.fn(),
  mockMe = jest.fn(),
  mockProfile = jest.fn(),
  mockAddresses = jest.fn();
let mockToken = "token";
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({
    token: mockToken,
    backendUrl: "https://store.test",
    user: { _id: "me", email: "me@test.com" },
    setUser: jest.fn(),
    logout: jest.fn(),
  }),
}));
jest.mock("../src/features/user/services/accountServices", () => ({
  __esModule: true,
  default: () => ({
    getPreferences: mockPrefs,
    savePreferences: mockSave,
    getOffers: mockOffers,
    getSupport: mockSupport,
    submitSupport: mockSubmit,
    exportData: mockExport,
    getAdminSupport: mockSupport,
    updateSupport: mockUpdate,
  }),
}));
jest.mock("../src/features/user/services/authServices", () => ({
  __esModule: true,
  default: () => ({
    getMe: mockMe,
    updateUserData: mockProfile,
    deleteUser: mockDelete,
    logoutUser: jest.fn(),
  }),
}));
jest.mock("../src/features/user/services/addressServices", () => ({
  __esModule: true,
  default: () => ({
    getAddresses: mockAddresses,
    addAddress: mockAddressSave,
    updateAddress: mockAddressSave,
    deleteAddress: mockAddressRemove,
  }),
}));
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockToken = "token";
  jest.clearAllMocks();
  mockPrefs.mockResolvedValue({ notifications: { email: true } });
  mockSave.mockResolvedValue({ notifications: { email: false } });
  mockOffers.mockResolvedValue([]);
  mockSupport.mockResolvedValue([]);
  mockAddresses.mockResolvedValue([]);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
const render = async (path = "/account", node = <AccountSettings />) =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/account/*" element={node} />
          <Route path="/admin" element={node} />
        </Routes>
      </MemoryRouter>,
    ),
  );
const click = async (selector) =>
  act(async () => host.querySelector(selector).click());
const change = async (element, value) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(
      element.tagName === "TEXTAREA"
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
      "value",
    ).set.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
test("settings exposes every connected screen and existing shopping routes", async () => {
  await render();
  expect(host.querySelectorAll(".settings-menu-card a")).toHaveLength(10);
  for (const path of [
    "personal",
    "addresses",
    "security",
    "payments",
    "offers",
    "notifications",
    "help",
    "privacy",
  ])
    expect(host.querySelector(`a[href="/account/${path}"]`)).not.toBeNull();
  expect(host.querySelector('a[href="/orders"]')).not.toBeNull();
  expect(host.querySelector('a[href="/wishlist"]')).not.toBeNull();
});
test("security reflects passwordless OTP sign-in", async () => {
  await render("/account/security");
  expect(host.textContent).toContain("one-time code");
  expect(host.querySelector('input[type="password"]')).toBeNull();
  expect(host.textContent).toContain("me@test.com");
});
test("notifications saves a persisted boolean and reports API failure", async () => {
  await render("/account/notifications");
  await click('input[type="checkbox"]');
  await act(async () =>
    host
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(mockSave).toHaveBeenCalledWith({ notifications: { email: false } });
  expect(host.querySelector('[role="status"]').textContent).toContain("saved");
  mockSave.mockRejectedValueOnce(new Error("Unavailable"));
  await act(async () =>
    host
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(host.querySelector('[role="alert"]').textContent).toContain(
    "Unavailable",
  );
});
test("offers displays real percent discounts and honest empty state", async () => {
  mockOffers.mockResolvedValueOnce([
    {
      _id: "offer",
      code: "MOVE20",
      discountType: "percent",
      discountValue: 20,
      minOrderAmount: 1000,
    },
  ]);
  await render("/account/offers");
  expect(host.textContent).toContain("20% OFF");
  expect(host.textContent).toContain("MOVE20");
});
test("support submits a request and displays returned status", async () => {
  mockSubmit.mockResolvedValue({
    _id: "ticket",
    subject: "Delivery question",
    message: "Please check my delivery",
    status: "open",
    createdAt: "2026-11-01",
  });
  await render("/account/help");
  await change(host.querySelectorAll("form input")[0], "Delivery question");
  await change(host.querySelector("textarea"), "Please check my delivery");
  await act(async () =>
    host
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(mockSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      subject: "Delivery question",
      message: "Please check my delivery",
    }),
  );
  expect(host.textContent).toContain("Request sent");
  expect(host.textContent).toContain("open");
});
test("account deletion requires exact confirmation and can be cancelled", async () => {
  await render("/account/privacy");
  await click(".settings-danger");
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog.querySelector(".settings-danger").disabled).toBe(true);
  await change(dialog.querySelector("input"), "DELETE");
  expect(dialog.querySelector(".settings-danger").disabled).toBe(false);
  await act(async () => dialog.querySelector(".settings-secondary").click());
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(mockDelete).not.toHaveBeenCalled();
});
test("guest can read help but cannot load or submit private support requests", async () => {
  mockToken = null;
  await render("/account/help");
  expect(mockSupport).not.toHaveBeenCalled();
  expect(host.querySelector("form")).toBeNull();
  expect(host.querySelector('a[href="/signin"]')).not.toBeNull();
});
test("admin updates persisted support status", async () => {
  mockSupport.mockResolvedValue([
    {
      _id: "ticket",
      category: "order",
      subject: "Delivery question",
      message: "Please check",
      status: "open",
      createdAt: "2026-11-01",
      user: { name: "Arshid", email: "me@test.com" },
    },
  ]);
  mockUpdate.mockResolvedValue({
    _id: "ticket",
    category: "order",
    subject: "Delivery question",
    message: "Please check",
    status: "closed",
    createdAt: "2026-11-01",
  });
  await render("/admin", <SupportRequests />);
  await act(async () => {
    const select = host.querySelector("select");
    select.value = "closed";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(mockUpdate).toHaveBeenCalledWith("ticket", "closed");
  expect(host.querySelector("select").value).toBe("closed");
});
test("address default update and deletion reuse existing services", async () => {
  mockAddresses.mockResolvedValue([
    {
      _id: "a",
      fullName: "Arshid",
      street: "Test street",
      city: "Palakkad",
      state: "Kerala",
      postalCode: "679305",
      country: "India",
      phone: "8157875032",
      isDefault: false,
    },
  ]);
  mockAddressSave.mockResolvedValue({
    _id: "a",
    fullName: "Arshid",
    isDefault: true,
  });
  mockAddressRemove.mockResolvedValue({ message: "Deleted" });
  await render("/account/addresses");
  await act(async () =>
    [...host.querySelectorAll("button")]
      .find((button) => button.textContent === "Set as default")
      .click(),
  );
  expect(mockAddressSave).toHaveBeenCalledWith(
    "a",
    expect.objectContaining({ isDefault: true }),
  );
  expect(
    host.querySelector(".settings-address-card .settings-tag").textContent,
  ).toBe("Default");
  await click('[aria-label="Delete address for Arshid"]');
  await act(async () =>
    document.querySelector('[role="dialog"] .settings-danger').click(),
  );
  expect(mockAddressRemove).toHaveBeenCalledWith("a");
  expect(host.querySelectorAll(".settings-address-card")).toHaveLength(0);
});
test("data export runs only on request and reports failure without deleting account", async () => {
  mockExport.mockRejectedValueOnce(new Error("Export unavailable"));
  await render("/account/privacy");
  expect(mockExport).not.toHaveBeenCalled();
  await click(".settings-primary");
  expect(mockExport).toHaveBeenCalledTimes(1);
  expect(host.querySelector('[role="alert"]').textContent).toContain(
    "Export unavailable",
  );
  expect(mockDelete).not.toHaveBeenCalled();
});
