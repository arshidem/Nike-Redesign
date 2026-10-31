import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "../src/features/admin/components/Dashboard";
const mockSummary = jest.fn(),
  mockTrend = jest.fn(),
  mockStatus = jest.fn(),
  mockProducts = jest.fn();
jest.mock("../src/context/AppContext", () => ({
  useAppContext: () => ({
    user: { name: "Arshid Em" },
    backendUrl: "https://store.test",
    token: "token",
  }),
}));
jest.mock("../src/features/user/services/orderServices", () => ({
  __esModule: true,
  default: () => ({
    getOrderSummary: mockSummary,
    getOrderTrends: mockTrend,
    getOrderStatusStats: mockStatus,
  }),
}));
jest.mock("../src/features/product/services/productService", () => ({
  useProductService: () => ({ fetchProductAnalytics: mockProducts }),
}));
jest.mock("recharts", () => {
  const React = require("react");
  const wrapper = ({ children }) => <div>{children}</div>;
  const chart = () => <div data-chart="true" />;
  return {
    ResponsiveContainer: wrapper,
    AreaChart: chart,
    PieChart: chart,
    BarChart: chart,
    Area: chart,
    Bar: chart,
    XAxis: chart,
    YAxis: chart,
    CartesianGrid: chart,
    Tooltip: chart,
    Pie: chart,
    Cell: chart,
  };
});
const summary = {
  totalOrders: 67,
  totalRevenue: 912262,
  todayOrders: 2,
  todayRevenue: 100,
  weekOrders: 7,
  weekRevenue: 500,
  monthOrders: 12,
  monthRevenue: 1000,
};
const shoe = {
  _id: "p1",
  slug: "vomero",
  name: "Nike Vomero 18",
  image: "https://images.test/shoe.avif",
  views: 256,
  sold: 18,
};
const products = {
  totalProducts: 6,
  totalVariants: 14,
  totalReviews: 2,
  totalUnitsSold: { allTime: 0, thisWeek: 18 },
  totalViews: 500,
  totalWishlist: 20,
  trendingProducts: {
    thisWeek: [shoe],
    thisMonth: [{ ...shoe, name: "Monthly shoe" }],
    today: [],
    thisYear: [],
  },
  coldProducts: [],
  categoryBreakdown: [{ name: "shoes", value: 6 }],
  genderBreakdown: [{ gender: "men", count: 4 }],
};
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  mockSummary.mockReset().mockResolvedValue({ success: true, data: summary });
  mockTrend
    .mockReset()
    .mockResolvedValue({ success: true, data: [{ _id: "2026-10", count: 8 }] });
  mockStatus.mockReset().mockResolvedValue({
    success: true,
    data: [
      { _id: "delivered", count: 3 },
      { _id: "processing", count: 1 },
    ],
  });
  mockProducts.mockReset().mockResolvedValue(products);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
const render = async (props) =>
  act(async () =>
    root.render(
      <MemoryRouter>
        <Dashboard {...props} />
      </MemoryRouter>,
    ),
  );
const select = async (label, value) =>
  act(async () => {
    const input = host.querySelector(`[aria-label="${label}"]`);
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
test("uses live totals, exact period keys and real image URLs without fabricated growth", async () => {
  const onSummary = jest.fn();
  await render({ onSummary });
  expect(host.querySelector("h1").textContent).toContain("Hi, Arshid");
  expect(onSummary).toHaveBeenCalledWith(67);
  expect(host.querySelector(".admin-stats-grid").textContent).toContain(
    "9,12,262",
  );
  expect(host.querySelector(".admin-product-list img").src).toBe(shoe.image);
  expect(host.querySelector(".admin-product-list a").getAttribute("href")).toBe(
    "/admin/product/vomero",
  );
  expect(
    host.querySelector(".admin-secondary-stats .admin-stat strong").textContent,
  ).toBe("0");
  expect(host.textContent).not.toContain("+42%");
  await select("Trending products period", "month");
  expect(host.querySelector(".admin-product-list").textContent).toContain(
    "Monthly shoe",
  );
  expect(mockProducts).toHaveBeenCalledTimes(1);
});
test("status and trend selectors request the selected range independently", async () => {
  await render();
  await select("Order status period", "week");
  expect(mockStatus).toHaveBeenLastCalledWith({ range: "week" });
  await select("Order trend range", "daily");
  expect(mockTrend).toHaveBeenLastCalledWith("daily");
  expect(mockSummary).toHaveBeenCalledTimes(1);
  expect(mockProducts).toHaveBeenCalledTimes(1);
});
test("failed totals remain unavailable and retry recovers without presenting zero as a successful result", async () => {
  mockSummary.mockResolvedValueOnce({
    success: false,
    error: "Summary unavailable",
  });
  await render();
  expect(host.querySelector(".admin-stat strong").textContent).toBe("—");
  expect(host.querySelector('[role="alert"]').textContent).toContain(
    "Summary unavailable",
  );
  await act(async () => host.querySelector('[role="alert"] button').click());
  expect(host.querySelector(".admin-stat strong").textContent).toBe("67");
  expect(mockSummary).toHaveBeenCalledTimes(2);
});
