import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Checkout from "../src/features/user/pages/Checkout";
import { loadScript } from "../src/utils/loadRazorpayScript";
const mockGetCart = jest.fn(),
  mockGetAddresses = jest.fn(),
  mockInit = jest.fn(),
  mockVerify = jest.fn(),
  mockAdd = jest.fn(),
  mockUpdateAddress = jest.fn(),
  mockUpdateCart = jest.fn(),
  mockCoupon = jest.fn(),
  mockClear = jest.fn();
let mockToken = "token",
  mockGatewayOptions,
  mockOpen;
const mockUser = { _id: "user1", email: "customer@example.test" };
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({
    user: mockUser,
    token: mockToken,
    backendUrl: "https://store.test",
  }),
}));
jest.mock("../src/features/user/services/addressServices", () => ({
  __esModule: true,
  default: () => ({
    getAddresses: mockGetAddresses,
    addAddress: mockAdd,
    updateAddress: mockUpdateAddress,
  }),
}));
jest.mock("../src/features/user/services/orderServices", () => ({
  __esModule: true,
  default: () => ({ initiatePayment: mockInit, verifyPayment: mockVerify }),
}));
jest.mock("../src/features/user/services/cartServices", () => ({
  __esModule: true,
  default: () => ({
    getCart: mockGetCart,
    updateItemQuantity: mockUpdateCart,
    removeItemFromCart: jest.fn(),
    applyCoupon: mockCoupon,
    removeCoupon: jest.fn(),
    clearCart: mockClear,
  }),
}));
jest.mock("../src/utils/loadRazorpayScript", () => ({ loadScript: jest.fn() }));
jest.mock("country-state-city", () => ({
  Country: { getAllCountries: () => [{ name: "India", isoCode: "IN" }] },
  State: { getStatesOfCountry: () => [{ name: "Kerala", isoCode: "KL" }] },
}));
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));
const address = {
  _id: "addr1",
  isDefault: true,
  fullName: "Test Customer",
  phone: "9876543210",
  street: "10 Test Street",
  city: "Palakkad",
  state: "Kerala",
  postalCode: "679305",
  country: "India",
};
const item = {
  _id: "line1",
  productId: "p1",
  variantId: "v1",
  name: "Nike Dunk",
  price: 4148,
  quantity: 1,
  stock: 10,
  size: "UK 5.5",
  color: "black",
  image: "https://images.test/shoe.avif",
};
const proof = {
  razorpay_order_id: "order_test",
  razorpay_payment_id: "payment_test",
  razorpay_signature: "test-signature",
};
const confirmed = {
  success: true,
  data: { success: true, order: { _id: "confirmed-order" } },
};
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  if (!global.requestAnimationFrame)
    global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  sessionStorage.clear();
  mockToken = "token";
  mockGatewayOptions = null;
  mockOpen = jest.fn();
  mockGetCart
    .mockReset()
    .mockResolvedValue({
      items: [item],
      subtotal: 4148,
      shippingFee: 150,
      total: 4298,
    });
  mockGetAddresses.mockReset().mockResolvedValue([address]);
  mockInit
    .mockReset()
    .mockResolvedValue({
      success: true,
      data: {
        success: true,
        data: {
          keyId: "rzp_test_public",
          order: { id: "order_test", amount: 429800, currency: "INR" },
        },
      },
    });
  mockVerify.mockReset().mockResolvedValue(confirmed);
  mockAdd.mockReset().mockResolvedValue(address);
  mockUpdateAddress.mockReset().mockResolvedValue(address);
  mockUpdateCart.mockReset();
  mockCoupon.mockReset();
  mockClear.mockReset();
  loadScript.mockReset().mockResolvedValue(true);
  window.Razorpay = jest.fn(function (options) {
    mockGatewayOptions = options;
    this.open = mockOpen;
    this.on = jest.fn();
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  delete window.Razorpay;
});
const render = async () =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<p>Confirmed orders</p>} />
        </Routes>
      </MemoryRouter>,
    ),
  );
const click = async (element) =>
  act(async () =>
    element.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
const input = async (name, value) =>
  act(async () => {
    const element = container.querySelector(`[name="${name}"]`);
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });

test("loading stays stable while editing, and zero shipping is honored", async () => {
  mockGetCart.mockResolvedValue({ items: [item], shippingFee: 0 });
  await render();
  await input("phone", "9876543211");
  expect(mockGetCart).toHaveBeenCalledTimes(1);
  expect(mockGetAddresses).toHaveBeenCalledTimes(1);
  expect(container.querySelector(".checkout-total").textContent).toContain(
    "4,148",
  );
  expect(container.querySelector(".checkout-items img").src).toBe(item.image);
});

test("invalid delivery details block gateway initialization", async () => {
  mockGetAddresses.mockResolvedValue([]);
  await render();
  await click(container.querySelector(".checkout-pay"));
  expect(
    container.querySelector('[name="fullName"]').getAttribute("aria-invalid"),
  ).toBe("true");
  expect(mockInit).not.toHaveBeenCalled();
  expect(loadScript).not.toHaveBeenCalled();
});

test("SDK load failure leaves the bag intact and allows retry", async () => {
  loadScript.mockResolvedValue(false);
  await render();
  await click(container.querySelector(".checkout-pay"));
  expect(container.querySelector('[role="alert"]').textContent).toContain(
    "couldn’t load",
  );
  expect(mockInit).not.toHaveBeenCalled();
  expect(mockClear).not.toHaveBeenCalled();
  expect(container.querySelector(".checkout-pay").disabled).toBe(false);
});

test("payment opens with the server key and paise amount; double clicks and cancellation are handled", async () => {
  await render();
  const button = container.querySelector(".checkout-pay");
  await click(button);
  await click(button);
  expect(mockInit).toHaveBeenCalledTimes(1);
  expect(mockInit).toHaveBeenCalledWith(429800, expect.any(String), {
    address: expect.objectContaining({
      city: "Palakkad",
      postalCode: "679305",
    }),
  });
  expect(mockGatewayOptions.key).toBe("rzp_test_public");
  expect(mockGatewayOptions.amount).toBe(429800);
  expect(mockOpen).toHaveBeenCalledTimes(1);
  await act(async () => mockGatewayOptions.modal.ondismiss());
  expect(button.disabled).toBe(false);
  expect(mockClear).not.toHaveBeenCalled();
});

test("verification failure preserves the bag; retry confirms the same payment without another charge", async () => {
  mockVerify
    .mockResolvedValueOnce({
      success: false,
      error: "Verification unavailable",
    })
    .mockResolvedValueOnce(confirmed);
  await render();
  await click(container.querySelector(".checkout-pay"));
  await act(async () => mockGatewayOptions.handler(proof));
  expect(container.querySelectorAll(".checkout-items li")).toHaveLength(1);
  expect(container.querySelector(".checkout-pay").textContent).toContain(
    "Retry confirmation",
  );
  expect(sessionStorage.getItem("nike_pending_payment_user1")).not.toBeNull();
  expect(mockClear).not.toHaveBeenCalled();
  await act(async () => mockGatewayOptions.handler(proof));
  expect(mockVerify).toHaveBeenCalledTimes(1);
  await click(container.querySelector(".checkout-pay"));
  expect(mockInit).toHaveBeenCalledTimes(1);
  expect(mockVerify).toHaveBeenCalledTimes(2);
  expect(mockVerify).toHaveBeenLastCalledWith(proof);
  expect(container.textContent).toContain("Confirmed orders");
  expect(sessionStorage.getItem("nike_pending_payment_user1")).toBeNull();
});

test("pending confirmation survives reload and does not create another provider order", async () => {
  sessionStorage.setItem("nike_pending_payment_user1", JSON.stringify(proof));
  mockGetCart.mockResolvedValue({ items: [], shippingFee: 0 });
  await render();
  await click(container.querySelector(".checkout-pay"));
  expect(mockInit).not.toHaveBeenCalled();
  expect(loadScript).not.toHaveBeenCalled();
  expect(mockVerify).toHaveBeenCalledWith(proof);
  expect(container.textContent).toContain("Confirmed orders");
});

test("address-save toggle and quantity edits retain the entered delivery details", async () => {
  mockUpdateCart.mockResolvedValue({
    items: [{ ...item, quantity: 2 }],
    shippingFee: 150,
  });
  await render();
  await input("street", "20 New Street");
  await click(container.querySelector(".checkout-save input"));
  await click(
    container.querySelector('[aria-label="Increase quantity of Nike Dunk"]'),
  );
  expect(mockUpdateCart).toHaveBeenCalledWith("line1", 2);
  expect(container.querySelector('[name="street"]').value).toBe(
    "20 New Street",
  );
  expect(mockGetCart).toHaveBeenCalledTimes(1);
  mockInit.mockResolvedValue({
    success: true,
    data: {
      success: true,
      data: {
        keyId: "rzp_test_public",
        order: { id: "order_test", amount: 844600, currency: "INR" },
      },
    },
  });
  await click(container.querySelector(".checkout-pay"));
  expect(mockUpdateAddress).not.toHaveBeenCalled();
  expect(mockAdd).not.toHaveBeenCalled();
});

test("pay refreshes live stock and blocks the gateway when inventory fell since entry", async () => {
  await render();
  mockGetCart.mockResolvedValue({items:[{...item,stock:0,stockAvailable:false}],shippingFee:150});
  await click(container.querySelector('.checkout-pay'));
  expect(mockGetCart).toHaveBeenCalledTimes(2);
  expect(container.querySelector('.checkout-payment-error').textContent).toContain('Stock changed');
  expect(mockInit).not.toHaveBeenCalled();
  expect(loadScript).not.toHaveBeenCalled();
  expect(container.querySelector('.checkout-pay').disabled).toBe(true);
});
