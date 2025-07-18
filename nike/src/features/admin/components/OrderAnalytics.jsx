import React, { useEffect, useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import useOrderServices from "../../user/services/orderServices";
import { useAppContext } from "../../../context/AppContext";
import { formatCurrency } from "../../../utils/dateUtils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const COLORS = ["#f87171", "#facc15", "#34d399", "#9ca3af"];

export const OrderAnalytics = () => {
  const {
    getOrderSummary,
    getOrderTrends,
    getOrderStatusStats,
  } = useOrderServices();

  const { backendUrl } = useAppContext();

  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [orderRange, setOrderRange] = useState("daily");
  const [statusRange, setStatusRange] = useState("month");

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const res = await getOrderSummary();
      if (res.success) setSummary(res.data);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      setTrendLoading(true);
      const res = await getOrderTrends(orderRange);
      if (res.success) setDailyData(res.data);
    } finally {
      setTrendLoading(false);
    }
  };

  const fetchStatusStats = async () => {
    try {
      setStatusLoading(true);
      const res = await getOrderStatusStats({ range: statusRange });
      if (res.success) setStatusData(res.data);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [orderRange]);

  useEffect(() => {
    fetchStatusStats();
  }, [statusRange]);
if (summaryLoading) {
  return (
    <div className="p-4 space-y-6">
      {/* Summary Title Skeleton */}
      <Skeleton height={32} width={200} />

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height={80} />
        ))}
      </div>

      {/* Order Status Chart Skeleton */}
      {statusLoading ? (
        <Skeleton height={250} />
      ) : statusData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          {/* ...Your Status Chart Component... */}
        </ResponsiveContainer>
      ) : (
        <div>No status data available.</div>
      )}

      {/* Trend Chart Skeleton */}
      {trendLoading ? (
        <Skeleton height={250} />
      ) : dailyData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          {/* ...Your Trend Chart Component... */}
        </ResponsiveContainer>
      ) : (
        <div>No trend data available.</div>
      )}
    </div>
  );
}

  return (
    <div className="p-4 space-y-6 bg-white text-black">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Analytics</h2>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={80} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Today" value={`${summary.todayOrders} Orders`} subValue={formatCurrency(summary.todayRevenue)} />
          <SummaryCard label="This Week" value={`${summary.weekOrders} Orders`} subValue={formatCurrency(summary.weekRevenue)} />
          <SummaryCard label="This Month" value={`${summary.monthOrders} Orders`} subValue={formatCurrency(summary.monthRevenue)} />
          <SummaryCard label="Total Revenue" value={`${summary.totalOrders} Orders`} subValue={formatCurrency(summary.totalRevenue)} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="📈 Order Trend">
          <div className="flex justify-end mb-3">
            <select
              value={orderRange}
              onChange={(e) => setOrderRange(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {trendLoading ? (
            <Skeleton height={250} />
          ) : dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="_id"
                  tickFormatter={(str) => {
                    try {
                      if (orderRange === "yearly") return str;
                      if (orderRange === "monthly") return format(new Date(`${str}-01`), "MMM yyyy");
                      if (orderRange === "weekly") return `Wk ${str}`;
                      return format(new Date(str), "MMM d");
                    } catch {
                      return str;
                    }
                  }}
                />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#111" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 mt-16">No trend data available.</div>
          )}
        </ChartCard>

        <ChartCard title="🧾 Order Status Breakdown">
          <div className="flex justify-end mb-3">
            <select
              value={statusRange}
              onChange={(e) => setStatusRange(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {statusLoading ? (
            <Skeleton height={250} />
          ) : statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 mt-16">No status data available.</div>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, subValue }) => (
  <div className="bg-white shadow-md rounded-lg p-4">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <h3 className="text-xl font-semibold text-gray-800">{value}</h3>
    <p className="text-sm text-gray-400">{subValue}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white shadow-md rounded-lg p-4">
    <h4 className="font-medium text-gray-700 mb-4">{title}</h4>
    {children}
  </div>
);

export default OrderAnalytics;
