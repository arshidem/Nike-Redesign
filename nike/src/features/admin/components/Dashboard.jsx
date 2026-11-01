import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  ShoppingCartIcon,
  Square3Stack3DIcon,
  CubeIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  FireIcon,
  SparklesIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { useAppContext } from "../../../context/AppContext";
import useOrderServices from "../../user/services/orderServices";
import { useProductService } from "../../product/services/productService";

const number = (value) => Number(value || 0).toLocaleString("en-IN");
const money = (value) => `₹${number(value)}`;
const colors = [
  "#5d9b12",
  "#d8f88c",
  "#d5d7d1",
  "#555851",
  "#a8c56a",
  "#8f9a77",
];
const statusColors = {
  delivered: colors[0],
  processing: colors[1],
  shipped: colors[2],
  cancelled: colors[3],
  pending: colors[4],
};
const periods = {
  today: "Today",
  week: "This week",
  month: "This month",
  year: "This year",
};
const trendLabels = {
  daily: "Last 30 days",
  weekly: "Last 12 weeks",
  monthly: "Last 12 months",
  yearly: "Last 6 years",
};
function useResource(load, dependencies) {
  const latest = useRef(load);
  latest.current = load;
  const [retry, setRetry] = useState(0),
    [state, setState] = useState({ data: null, loading: true, error: "" });
  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: "" });
    Promise.resolve()
      .then(() => latest.current())
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (active)
          setState({
            data: null,
            loading: false,
            error: error.message || "Couldn’t load this section.",
          });
      });
    return () => {
      active = false;
    };
  }, [...dependencies, retry]);
  return { ...state, retry: () => setRetry((value) => value + 1) };
}
const unwrap = (result) => {
  if (!result?.success)
    throw new Error(result?.error || "Couldn’t load analytics.");
  return result.data;
};
function Loading({ resource, children }) {
  if (resource.loading)
    return (
      <div className="admin-chart-placeholder" role="status">
        Loading analytics…
      </div>
    );
  if (resource.error)
    return (
      <div className="admin-resource-error" role="alert">
        <p>{resource.error}</p>
        <button type="button" onClick={resource.retry}>
          Try again
        </button>
      </div>
    );
  return children;
}
function Card({ title, icon: Icon, controls, children, className = "" }) {
  return (
    <section className={`admin-panel ${className}`}>
      <header>
        <h2>
          {Icon && <Icon />}
          {title}
        </h2>
        {controls}
      </header>
      {children}
    </section>
  );
}
function Stat({ label, value, icon: Icon, featured = false, loading, detail }) {
  return (
    <div className={`admin-stat${featured ? " admin-stat-featured" : ""}`}>
      <span className="admin-stat-icon">
        <Icon />
      </span>
      <div>
        <strong>
          {loading ? (
            <span className="admin-skeleton" aria-label="Loading" />
          ) : (
            (value ?? "—")
          )}
        </strong>
        <span>{label}</span>
      </div>
      {detail && <small>{detail}</small>}
    </div>
  );
}
function Period({ value, onChange, label }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {Object.entries(periods).map(([key, text]) => (
        <option key={key} value={key}>
          {text}
        </option>
      ))}
    </select>
  );
}
const empty = (text) => <p className="admin-empty">{text}</p>;
export const Dashboard = ({ onSummary }) => {
  const { user, backendUrl, token } = useAppContext();
  const order = useOrderServices(),
    product = useProductService();
  const [statusPeriod, setStatusPeriod] = useState("month"),
    [trendRange, setTrendRange] = useState("monthly"),
    [trendingPeriod, setTrendingPeriod] = useState("week");
  const summary = useResource(
    async () => unwrap(await order.getOrderSummary()),
    [backendUrl, token],
  );
  const inventory = useResource(async () => {
    const data = await product.fetchProductAnalytics();
    if (!data) throw new Error("Couldn’t load product analytics.");
    return data;
  }, [backendUrl, token]);
  const trend = useResource(
    async () => unwrap(await order.getOrderTrends(trendRange)),
    [backendUrl, token, trendRange],
  );
  const status = useResource(
    async () =>
      unwrap(await order.getOrderStatusStats({ range: statusPeriod })),
    [backendUrl, token, statusPeriod],
  );
  const gradient = useId().replace(/:/g, "");
  useEffect(() => {
    if (summary.data) onSummary?.(Number(summary.data.totalOrders || 0));
  }, [summary.data, onSummary]);
  const data = inventory.data,
    totals = summary.data;
  const statusRows = Array.isArray(status.data)
    ? status.data.filter((row) => row.count > 0)
    : [];
  const statusTotal = statusRows.reduce(
    (sum, row) => sum + Number(row.count || 0),
    0,
  );
  const trendRows = (Array.isArray(trend.data) ? trend.data : []).map(
    (row) => ({
      ...row,
      label:
        trendRange === "monthly"
          ? new Date(`${row._id}-01T12:00:00`).toLocaleDateString("en-IN", {
              month: "short",
              year: "2-digit",
            })
          : trendRange === "daily"
            ? new Date(`${row._id}T12:00:00`).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
              })
            : String(row._id),
    }),
  );
  const periodKey = {
    today: "today",
    week: "thisWeek",
    month: "thisMonth",
    year: "thisYear",
  }[trendingPeriod];
  const trending = Array.isArray(data?.trendingProducts)
    ? data.trendingProducts
    : data?.trendingProducts?.[periodKey] || [];
  const categories = Array.isArray(data?.categoryBreakdown)
    ? data.categoryBreakdown
    : [];
  const genders = Array.isArray(data?.genderBreakdown)
    ? data.genderBreakdown
    : [];
  const image = (path) => {
    if (typeof path !== "string" || !path)
      return "/assets/editorial/image-unavailable.svg";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/\\/g, "/");
    return `${(backendUrl || "").replace(/\/$/, "")}/${normalized.includes("uploads/") ? normalized.slice(normalized.indexOf("uploads/")) : normalized.replace(/^\/+/, "")}`;
  };
  const productList = (items, cold = false) => (
    <Loading resource={inventory}>
      {items?.length ? (
        <ul className="admin-product-list">
          {items.slice(0, 5).map((item) => (
            <li key={item._id}>
              <Link to={`/admin/product/${item.slug}`}>
                <img
                  src={image(item.image)}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src =
                      "/assets/editorial/image-unavailable.svg";
                  }}
                />
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {number(item.views)} views <span>•</span>{" "}
                    {number(item.sold)} sold{cold ? " all time" : ""}
                  </small>
                </span>
                <span
                  className={
                    cold
                      ? "admin-product-badge admin-product-badge-cold"
                      : "admin-product-badge"
                  }
                >
                  {cold ? "Low sales" : `${number(item.sold)} sold`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        empty(
          cold
            ? "No low performing products this month."
            : "No trending products for this period.",
        )
      )}
    </Loading>
  );
  const ring = (rows, key, name, total) => (
    <div className="admin-donut-layout">
      <div className="admin-donut">
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={rows}
              dataKey={key}
              nameKey={name}
              innerRadius="64%"
              outerRadius="90%"
              paddingAngle={rows.length > 1 ? 1 : 0}
              stroke="none"
            >
              {rows.map((row, index) => (
                <Cell
                  key={row[name]}
                  fill={
                    name === "_id"
                      ? statusColors[row[name]] || colors[index % colors.length]
                      : colors[index % colors.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="admin-donut-center">
          <strong>{number(total)}</strong>
          <span>{name === "_id" ? "Orders" : "Products"}</span>
        </div>
      </div>
      <ul className="admin-chart-legend">
        {rows.map((row, index) => (
          <li key={row[name]}>
            <i
              style={{
                background:
                  name === "_id"
                    ? statusColors[row[name]] || colors[index % colors.length]
                    : colors[index % colors.length],
              }}
            />
            <span>
              {String(row[name]).replace(/^./, (letter) =>
                letter.toUpperCase(),
              )}
            </span>
            <strong>{total ? Math.round((row[key] / total) * 100) : 0}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="admin-overview">
      <header className="admin-overview-header">
        <div>
          <h1>
            Hi, {user?.name?.split(" ")[0] || "there"}{" "}
            <span aria-hidden="true">👋</span>
          </h1>
          <p>Here’s what’s happening with your store today.</p>
        </div>
        <div className="admin-overview-tools">
          <label className="admin-period-control">
            <CalendarDaysIcon />
            <span>
              <small>Order status period</small>
              <Period
                label="Order status period"
                value={statusPeriod}
                onChange={setStatusPeriod}
              />
            </span>
          </label>
          <Link
            to="/account"
            className="admin-avatar"
            aria-label="Your account"
          >
            {(user?.name || "A").charAt(0).toUpperCase()}
            <i />
          </Link>
        </div>
      </header>
      <div className="admin-stats-grid">
        <Stat
          label="Total Orders"
          icon={ShoppingCartIcon}
          value={totals ? number(totals.totalOrders) : null}
          featured
          loading={summary.loading}
        />
        <Stat
          label="Total Products"
          icon={Square3Stack3DIcon}
          value={data ? number(data.totalProducts) : null}
          loading={inventory.loading}
        />
        <Stat
          label="Total Variants"
          icon={CubeIcon}
          value={data ? number(data.totalVariants) : null}
          loading={inventory.loading}
        />
        <Stat
          label="Total Revenue"
          icon={CurrencyRupeeIcon}
          value={totals ? money(totals.totalRevenue) : null}
          loading={summary.loading}
        />
      </div>
      {(summary.error || inventory.error) && (
        <div className="admin-load-notices">
          {[summary, inventory]
            .filter((resource) => resource.error)
            .map((resource, index) => (
              <div role="alert" key={index}>
                <span>{resource.error}</span>
                <button type="button" onClick={resource.retry}>
                  Try again
                </button>
              </div>
            ))}
        </div>
      )}
      <div className="admin-charts-row">
        <Card
          title="Order Trend"
          icon={ArrowTrendingUpIcon}
          controls={
            <select
              aria-label="Order trend range"
              value={trendRange}
              onChange={(event) => setTrendRange(event.target.value)}
            >
              {Object.entries(trendLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          }
        >
          <Loading resource={trend}>
            {trendRows.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart
                  data={trendRows}
                  margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c9f269" stopOpacity={0.5} />
                      <stop
                        offset="100%"
                        stopColor="#e9f9c6"
                        stopOpacity={0.12}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eef0e9" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    minTickGap={20}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e6e8df",
                      boxShadow: "0 5px 15px #0001",
                    }}
                    formatter={(value) => [`${value} orders`, "Orders"]}
                  />
                  <Area
                    isAnimationActive={false}
                    dataKey="count"
                    type="monotone"
                    stroke="#69a916"
                    strokeWidth={2}
                    fill={`url(#${gradient})`}
                    dot={{ r: 3, fill: "#fff", strokeWidth: 1.5 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              empty("No order trend data for this period.")
            )}
          </Loading>
        </Card>
        <Card title="Order Status Breakdown" icon={SparklesIcon}>
          <Loading resource={status}>
            {statusRows.length
              ? ring(statusRows, "count", "_id", statusTotal)
              : empty("No orders in this period.")}
          </Loading>
        </Card>
      </div>
      <div className="admin-two-columns">
        <Card
          title="Trending Products"
          icon={FireIcon}
          controls={
            <Period
              label="Trending products period"
              value={trendingPeriod}
              onChange={setTrendingPeriod}
            />
          }
        >
          {productList(trending)}
        </Card>
        <Card
          title="Low Performing Products"
          icon={SparklesIcon}
          controls={
            <span className="admin-period-note">No sales this month</span>
          }
        >
          {productList(data?.coldProducts, true)}
        </Card>
      </div>
      <div className="admin-section-heading">
        <div>
          <h2>A closer look.</h2>
          <p>Your order and product insights, all in one place.</p>
        </div>
        <Link to="/admin#products">Manage products ↗</Link>
      </div>
      <div className="admin-period-summaries">
        {[
          ["Today", "todayOrders", "todayRevenue"],
          ["This Week", "weekOrders", "weekRevenue"],
          ["This Month", "monthOrders", "monthRevenue"],
        ].map(([label, orders, revenue]) => (
          <section className="admin-panel admin-period-summary" key={label}>
            <span>{label}</span>
            <strong>
              {summary.loading
                ? "…"
                : totals
                  ? `${number(totals[orders])} orders`
                  : "—"}
            </strong>
            <small>{totals ? money(totals[revenue]) : "—"} revenue</small>
          </section>
        ))}
      </div>
      <div className="admin-stats-grid admin-secondary-stats">
        {[
          [
            "Units Sold",
            CubeIcon,
            typeof data?.totalUnitsSold === "object"
              ? data.totalUnitsSold.allTime
              : data?.totalUnitsSold,
          ],
          ["Product Reviews", ChatBubbleLeftRightIcon, data?.totalReviews],
          ["Product Views", EyeIcon, data?.totalViews],
          ["Wishlist Saves", HeartIcon, data?.totalWishlist],
        ].map(([label, Icon, value]) => (
          <Stat
            key={label}
            label={label}
            icon={Icon}
            value={data ? number(value) : null}
            loading={inventory.loading}
          />
        ))}
      </div>
      <div className="admin-two-columns">
        <Card title="Category Breakdown" icon={Square3Stack3DIcon}>
          <Loading resource={inventory}>
            {categories.length
              ? ring(
                  categories,
                  "value",
                  "name",
                  categories.reduce(
                    (sum, row) => sum + Number(row.value || 0),
                    0,
                  ),
                )
              : empty("No category data available.")}
          </Loading>
        </Card>
        <Card title="Gender Breakdown" icon={UserGroupIcon}>
          <Loading resource={inventory}>
            {genders.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={genders}
                  margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#eef0e9" />
                  <XAxis
                    dataKey="gender"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      value.charAt(0).toUpperCase() + value.slice(1)
                    }
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ fill: "#f4f8e9" }} />
                  <Bar
                    isAnimationActive={false}
                    dataKey="count"
                    name="Products"
                    fill="#b4d66b"
                    radius={[7, 7, 0, 0]}
                    maxBarSize={65}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              empty("No gender data available.")
            )}
          </Loading>
        </Card>
      </div>
    </div>
  );
};
