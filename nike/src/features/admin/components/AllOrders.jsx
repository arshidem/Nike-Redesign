import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useContext,
} from "react";
import { io } from 'socket.io-client';
import { Link } from "react-router-dom";
import useOrderServices from "../../user/services/orderServices";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import toast from "react-hot-toast";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  BackBar,
  FilterIcon,
  XIcon,
  SortAscIcon,
  SortDescIcon,
  SearchIcon,
  RefreshIcon,
  PrinterIcon,
  ExportIcon,
} from "../../../shared/ui/Icons";
import AppContext, { useAppContext } from "../../../context/AppContext";
import { formatDate, formatCurrency } from "../../../utils/dateUtils";

import { format } from "date-fns";
import EmptyState from "../../../shared/ui/EmptyState";

export const AllOrders = () => {
  const {
    getAllOrders,

    updateOrderStatus,
    bulkUpdateOrders,
  } = useOrderServices();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortBy, setSortBy] = useState("-createdAt");
  const [showFilters, setShowFilters] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("processing");
  const [selectedExportType, setSelectedExportType] = useState("csv");
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    minTotalPrice: "",
    maxTotalPrice: "",
  });
  const { backendUrl,user } = useAppContext(AppContext);
  const [appliedFilters, setAppliedFilters] = useState({});
  // Bulk selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const statusColors = {
    processing: "bg-red-100 text-red-600",
    shipped: "bg-orange-100 text-orange-600",
    delivered: "bg-green-100 text-green-600",
    cancelled: "bg-gray-200 text-gray-600",
  };


  const formatImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|png|webp|avif)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return `${backendUrl}/${relativePath}`;
  };
  const handleStatusUpdate = async (newStatus) => {
    if (!selectedOrder?._id) return;

    const prevStatus = selectedOrder.status;
    const updatedOrder = { ...selectedOrder, status: newStatus };

    setSelectedOrder(updatedOrder); // update UI immediately (optimistic)

    const res = await updateOrderStatus(selectedOrder._id, newStatus);

    if (res.success) {
      toast.success("Order status updated");
      fetchOrders(); // refetch orders
      fetchDashboard();
    } else {
      setSelectedOrder({ ...selectedOrder, status: prevStatus }); // rollback
      toast.error(res.error || "Failed to update order status");
    }
  };
  // Bulk action handler
  const handleBulkAction = async (action) => {
    if (!selectedIds.length) {
      toast.error("No orders selected");
      return;
    }
    const reason = action === "cancelled" ? prompt("Cancel reason:") || "" : "";
    const res = await bulkUpdateOrders(selectedIds, action, reason);
    if (res.success) {
      toast.success(
        res.data.message || `${res.data.modifiedCount} orders updated`
      );
      setSelectMode(false);
      setSelectedIds([]);
      fetchOrders();
      fetchDashboard();
    } else {
      toast.error(res.error || "Bulk action failed");
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) setSelectedIds([]);
    else setSelectedIds(orders.map((o) => o._id));
  };
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 10,
        ...(appliedSearch && { search: appliedSearch }),
        sort: sortBy,
        ...Object.fromEntries(
          Object.entries(appliedFilters).filter(([_, v]) => v)
        ),
      };

      const res = await getAllOrders(params);

      if (res.success) {
        setOrders(res.orders || []);
        setPagination(res.pagination || {});
      } else {
        setError(res.error || "Failed to fetch orders");
        toast.error(res.error || "Failed to fetch orders");
      }
    } catch (err) {
      setError("Unexpected error occurred");
      toast.error("Unexpected error occurred");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, sortBy, appliedFilters]);

  useEffect(() => {
    fetchOrders();
  }, [page, sortBy, appliedSearch, appliedFilters]);

  const handleSearch = useCallback(() => {
    setAppliedSearch(searchTerm.trim());
    setPage(1);
  }, [searchTerm]);

  const handleSort = useCallback((field) => {
    setSortBy((prev) => {
      const desc = prev.startsWith("-");
      const curr = desc ? prev.slice(1) : prev;
      if (curr !== field) return `-${field}`;
      return desc ? field : `-${field}`;
    });
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value };

      if (key === "status" && value) {
        updated.isDelivered = ""; // Clear isDelivered when status is selected
      }

      if (key === "isDelivered" && value) {
        updated.status = ""; // Clear status when isDelivered is selected
      }

      return updated;
    });
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters); // ✅ Apply only here
    setPage(1);
    setShowFilters(false);
  }, [filters]);

  const resetFilters = useCallback(() => {
    const initial = {
      status: "",
      startDate: "",
      endDate: "",
      minTotalPrice: "",
      maxTotalPrice: "",
    };
    setFilters(initial);
    setShowFilters(false); // ✅ Hide filter modal after reset

    setAppliedFilters({});
    setPage(1);
  }, []);

  const sortConfig = useMemo(() => {
    const field = sortBy.startsWith("-") ? sortBy.substring(1) : sortBy;
    const direction = sortBy.startsWith("-") ? "desc" : "asc";
    return { field, direction };
  }, [sortBy]);

  const exportHandler = async (type) => {
    setExporting(true);
    try {
      if (type === "csv") await exportToCSV();
      else if (type === "pdf") await exportToPDF();
      else await exportToWord();
    } catch (error) {
      toast.error("Export failed: " + error.message);
    } finally {
      setExporting(false);
    }
  };
  const prepareExportData = () => {
    return orders
      .filter((order) => selectedIds.includes(order._id))
      .map((order) => {
        // Format items data properly
        const itemsText = order.items
          .map(
            (item) =>
              `${item.title || "N/A"}, Qty: ${item.quantity}, Price: ₹${
                item.price
              }, Total: ₹${(item.price * item.quantity).toFixed(2)}`
          )
          .join("\n");

        // Format shipping address
        const shippingText = [
          order.shippingAddress?.fullName || "",
          order.shippingAddress?.street || "",
          `${order.shippingAddress?.city || ""}, ${
            order.shippingAddress?.state || ""
          } ${order.shippingAddress?.postalCode || ""}`,
          order.shippingAddress?.country || "",
          order.shippingAddress?.phone ? ` ${order.shippingAddress.phone}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        return {
          orderId: order._id?.slice(-6).toUpperCase() || "N/A",
          customer: order.user?.name || "Guest",
          email: order.user?.email || "N/A",
          date: formatDate(order.createdAt),
          status:
            order.status?.charAt(0).toUpperCase() + order.status?.slice(1) ||
            "Unknown",
          total: `₹${order.totalPrice?.toFixed(2) || "0.00"}`,
          paymentStatus: order.isPaid ? "Paid" : "Unpaid",
          items: itemsText,
          shippingAddress: shippingText,
          // Add raw items array for PDF/Word exports
          itemsArray: order.items.map((item) => ({
            name: item.title || "N/A",
            quantity: item.quantity || 0,
            price: item.price ? `₹${item.price}` : "₹0.00",
            total:
              item.price && item.quantity
                ? `₹${(item.price * item.quantity).toFixed(2)}`
                : "₹0.00",
          })),
        };
      });
  };

  // Updated exportToPDF function

  const exportToPDF = async () => {
    try {
      const data = prepareExportData();
      if (!data.length) {
        toast.error("No orders selected for export");
        return;
      }

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Register fontkit for custom fonts
      pdfDoc.registerFontkit(fontkit);

      // Load a custom font that supports ₹ symbol (like Noto Sans)
      const fontUrl =
        "https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNr5TRASf6M7Q.woff2";
      const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
      const customFont = await pdfDoc.embedFont(fontBytes);

      // Also embed standard fonts for fallback
      const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const standardFontBold = await pdfDoc.embedFont(
        StandardFonts.HelveticaBold
      );

      // Helper function to add a new page when needed
      const addNewPage = () => {
        const page = pdfDoc.addPage([595, 842]); // A4 size in points
        page.setFont(customFont); // Use custom font by default
        return { page, y: 800 };
      };

      let { page, y } = addNewPage();

      // Add title
      page.setFont(standardFontBold); // Use standard bold for title
      page.drawText("Order Details", {
        x: 50,
        y,
        size: 18,
        color: rgb(0, 0, 0),
      });
      y -= 30;

      // Add generation date
      page.setFont(standardFont);
      page.drawText(`Generated: ${new Date().toLocaleString()}`, {
        x: 50,
        y,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 20;

      // Process each order
      for (const order of data) {
        // Check if we need a new page
        if (y < 100) {
          ({ page, y } = addNewPage());
        }

        // Order header - use custom font for ₹ symbol
        page.setFont(customFont);
        page.drawText(`Order #${order.orderId}`, {
          x: 50,
          y,
          size: 14,
        });
        y -= 20;

        // Customer info
        page.drawText(`Customer: ${order.customer}`, {
          x: 50,
          y,
          size: 12,
        });
        y -= 15;

        page.drawText(`Email: ${order.email}`, {
          x: 50,
          y,
          size: 12,
        });
        y -= 15;

        page.drawText(`Date: ${order.date}`, {
          x: 50,
          y,
          size: 12,
        });
        y -= 15;

        page.drawText(`Status: ${order.status}`, {
          x: 50,
          y,
          size: 12,
        });
        y -= 15;

        // Use custom font for amounts to ensure ₹ displays correctly
        page.drawText(`Total: ${order.total}`, {
          x: 50,
          y,
          size: 12,
        });
        y -= 15;

        page.drawText(`Payment: ${order.paymentStatus}`, {
          x: 50,
          y,
          size: 12,
        });
        y -= 20;

        // Items table header
        page.setFont(standardFontBold);
        page.drawText("Order Items:", {
          x: 50,
          y,
          size: 12,
        });
        y -= 15;

        // Draw table headers
        page.drawText("Product", {
          x: 50,
          y,
          size: 10,
        });
        page.drawText("Qty", {
          x: 350,
          y,
          size: 10,
        });
        page.drawText("Price", {
          x: 400,
          y,
          size: 10,
        });
        page.drawText("Total", {
          x: 500,
          y,
          size: 10,
        });
        y -= 15;

        // Draw line under headers
        page.drawLine({
          start: { x: 50, y },
          end: { x: 550, y },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        y -= 10;

        // Items list - use custom font for amounts
        page.setFont(customFont);
        for (const item of order.itemsArray) {
          if (y < 50) {
            ({ page, y } = addNewPage());
          }

          page.drawText(item.name, {
            x: 50,
            y,
            size: 10,
            maxWidth: 280,
          });
          page.drawText(item.quantity.toString(), {
            x: 350,
            y,
            size: 10,
          });
          page.drawText(item.price, {
            x: 400,
            y,
            size: 10,
          });
          page.drawText(item.total, {
            x: 500,
            y,
            size: 10,
          });
          y -= 15;
        }

        // Shipping address
        y -= 10;
        page.setFont(standardFontBold);
        page.drawText("Shipping Address:", {
          x: 50,
          y,
          size: 12,
        });
        y -= 15;

        page.setFont(standardFont);
        const addressLines = order.shippingAddress.split("\n");
        for (const line of addressLines) {
          if (y < 50) {
            ({ page, y } = addNewPage());
          }
          page.drawText(line, {
            x: 50,
            y,
            size: 10,
          });
          y -= 15;
        }

        // Add space between orders
        y -= 20;
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders_export_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };
  // Updated exportToWord function
  const exportToWord = () => {
    const data = prepareExportData();
    if (!data.length) {
      toast.error("No orders selected for export");
      return;
    }

    let content = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <title>Order Details Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        h2 { color: #444; margin-top: 30px; }
        h3 { color: #555; margin-top: 20px; }
        .order { margin-bottom: 40px; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th { background-color: #000; color: white; text-align: left; padding: 8px; }
        td { border: 1px solid #ddd; padding: 8px; }
        .address { white-space: pre-line; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>Order Details Export</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <h2>Summary</h2>
      <table>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Status</th>
          <th>Total</th>
          <th>Payment</th>
        </tr>
        ${data
          .map(
            (order) => `
          <tr>
            <td>${order.orderId}</td>
            <td>${order.customer}</td>
            <td>${order.status}</td>
            <td>${order.total}</td>
            <td>${order.paymentStatus}</td>
          </tr>
        `
          )
          .join("")}
      </table>
  `;

    // Detailed orders
    data.forEach((order) => {
      content += `
      <div class="order">
        <h2>Order #${order.orderId}</h2>
        <p><strong>Customer:</strong> ${order.customer}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Date:</strong> ${order.date}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Total:</strong> ${order.total}</p>
        <p><strong>Payment:</strong> ${order.paymentStatus}</p>
        
        <h3>Order Items</h3>
        <table>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
          ${order.itemsArray
            .map(
              (item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.price}</td>
              <td>${item.total}</td>
            </tr>
          `
            )
            .join("")}
        </table>
        
        <h3>Shipping Address</h3>
        <div class="address">${order.shippingAddress.replace(
          /\n/g,
          "<br>"
        )}</div>
      </div>
    `;
    });

    content += `</body></html>`;

    const blob = new Blob(["\ufeff", content], {
      type: "application/msword",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_export_${new Date()
      .toISOString()
      .slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCSV = () => {
    const data = prepareExportData();
    if (!data.length) return;

    const headers = [
      "Order ID",
      "Customer",
      "Email",
      "Date",
      "Status",
      "Total",
      "Payment Status",
      "Items",
      "Shipping Address",
    ];

    const rows = data.map((order) => [
      order.orderId,
      order.customer,
      order.email,
      order.date,
      order.status,
      order.total,
      order.paymentStatus,
      order.items,
      order.shippingAddress,
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows
        .map((row) =>
          row.map((field) => `"${field.replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `orders_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && page === 1) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-white border rounded-lg shadow-sm h-24"
            >
              <Skeleton height={20} width="40%" className="mb-2" />
              <Skeleton height={24} width="60%" className="mb-1" />
              <Skeleton height={16} width="50%" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-white border rounded-lg p-4 shadow-sm h-80"
            >
              <div className="flex justify-between items-center mb-4">
                <Skeleton height={20} width="30%" />
                <Skeleton height={32} width="25%" />
              </div>
              <Skeleton height={240} />
            </div>
          ))}
        </div>

        {/* Header and Toolbar Skeleton */}
        <div className="mb-6">
          <Skeleton height={32} width="40%" className="mb-4" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton height={40} width="100%" className="sm:flex-1" />
            <div className="flex space-x-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height={40} width={40} />
              ))}
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[...Array(6)].map((_, i) => (
                  <th key={i} className="px-6 py-3">
                    <Skeleton height={20} width="80%" className="mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <Skeleton
                        height={20}
                        width={j === 3 ? "60%" : "80%"}
                        className="mx-auto"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Skeleton */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="hidden sm:flex sm:items-center sm:justify-between">
              <Skeleton height={20} width="30%" />
              <div className="flex space-x-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} height={36} width={36} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {exporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <p>Preparing export...</p>
            <Skeleton fullScreen />
          </div>
        </div>
      )}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 pt-16 space-y-6 max-h-[90vh] overflow-y-auto relative">
            {/* Absolute Header with Title & Close Button */}
            <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 border-b bg-white rounded-t-lg z-10">
              <h2 className="text-xl font-semibold">
                Order #{selectedOrder._id.slice(-6).toUpperCase()}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600 hover:text-black"
                aria-label="Close modal"
              >
                <XIcon />
              </button>
            </div>

            {/* User & Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <strong>Customer:</strong> {selectedOrder.user?.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedOrder.user?.email}
                </p>
                <p>
                  <strong>Status:</strong> {selectedOrder.status}
                </p>
              </div>
              <div>
                <p>
                  <strong>Total:</strong> ₹{selectedOrder.totalPrice}
                </p>
                <p>
                  <strong>Payment:</strong>{" "}
                  {selectedOrder.isPaid ? "Paid" : "Unpaid"}
                </p>
                {selectedOrder.paidAt && (
                  <p>
                    <strong>Paid At:</strong>{" "}
                    {new Date(selectedOrder.paidAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 border rounded p-2"
                  >
                    <img
                      src={formatImageUrl(item.image)}
                      alt={item.title}
                      className="w-14 h-14 object-cover rounded"
                    />
                    <div className="text-sm">
                      <p className="font-medium">{item.title}</p>
                      <p>
                        Qty: {item.quantity} | Size: {item.size} | Color:{" "}
                        {item.color}
                      </p>
                      <p>₹{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold mb-1">Shipping Address</h3>
              <p>{selectedOrder.shippingAddress.fullName}</p>
              <p>
                {selectedOrder.shippingAddress.street},{" "}
                {selectedOrder.shippingAddress.city},{" "}
                {selectedOrder.shippingAddress.state} -{" "}
                {selectedOrder.shippingAddress.postalCode}
              </p>
              <p>{selectedOrder.shippingAddress.country}</p>
              <p>📞 {selectedOrder.shippingAddress.phone}</p>
            </div>

            {/* Update Status */}
            <div>
              <label className="font-medium text-sm">Update Order Status</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className="block w-full mt-1 border rounded px-3 py-2 bg-white"
              >
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            {/* Status Pills */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {["processing", "shipped", "delivered", "cancelled"].map(
                (status) => (
                  <span
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`text-center py-2 rounded-xl cursor-pointer border font-medium capitalize transition
              ${
                selectedStatus === status
                  ? "bg-black text-white"
                  : "bg-white text-black border-black"
              }`}
                  >
                    {status}
                  </span>
                )
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2 border border-black text-black rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleBulkAction(selectedStatus);
                  setShowStatusModal(false);
                }}
                className="flex-1 py-2 bg-black text-white rounded-md"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            {/* Export Pills */}
            <div className="flex flex-col gap-3 mb-6">
              {["csv", "word", "pdf"].map((type) => (
                <span
                  key={type}
                  onClick={() => setSelectedExportType(type)}
                  className={`text-center py-2 rounded-xl cursor-pointer border font-medium uppercase transition
              ${
                selectedExportType === type
                  ? "bg-black text-white"
                  : "bg-white text-black border-black"
              }`}
                >
                  {type}
                </span>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-2 border border-black text-black rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedExportType === "csv") exportToCSV();
                  else if (selectedExportType === "pdf") exportToPDF();
                  else exportToWord();
                  setShowExportModal(false);
                }}
                className="flex-1 py-2 bg-black text-white rounded-md"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Filter Orders</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                >
                  <option value="">All Statuses</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Total Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={filters.minTotalPrice}
                    onChange={(e) =>
                      handleFilterChange("minTotalPrice", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Total Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={filters.maxTotalPrice}
                    onChange={(e) =>
                      handleFilterChange("maxTotalPrice", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <XIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header / Toolbar */}
      <h1 className="text-2xl font-bold mb-4">Order Management</h1>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* -- Search Bar -- */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-10 pl-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
          />
          <button
            onClick={handleSearch}
            aria-label="Search orders"
            className="absolute top-1/2 right-3 -translate-y-1/2"
          >
            <SearchIcon className="w-5 h-5 text-gray-500 hover:text-black" />
          </button>
        </div>

        {/* -- Filter, Refresh & Select Toggle -- */}
        <div className="flex items-center space-x-3">
          {/* Filter */}
          <button
            onClick={() => setShowFilters(true)}
            aria-label="Open filters"
            className="w-10 h-10 flex items-center justify-center  rounded-lg hover:bg-gray-100 transition"
          >
            <FilterIcon className="w-5 h-5 text-gray-600" />
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              fetchOrders();
              fetchDashboard();
            }}
            aria-label="Refresh data"
            className="w-10 h-10 flex items-center justify-center  rounded-lg hover:bg-gray-100 transition"
          >
            <RefreshIcon className="w-5 h-5 text-gray-600" />
          </button>

          {/* Select Mode Toggle */}
          <button
            onClick={() => setSelectMode((m) => !m)}
            className="h-10 px-4 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
          >
            {selectMode ? "Cancel Select" : "Select Orders"}
          </button>
        </div>
      </div>

      {selectMode && (
        <div className="flex  items-center gap-2 mb-4 justify-between">
          <div>
     <button
            onClick={toggleSelectAll}
            className="px-3 py-1 border rounded"
          >
            {selectedIds.length === orders.length
              ? "Deselect All"
              : "Select All"}
          </button>
          </div>
          <div className="flex items-center gap-2">
 {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-3 py-1  rounded bg-white hover:bg-gray-200 flex items-center gap-1"
              >
                Change Status
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1  rounded bg-white hover:bg-gray-200 flex items-center gap-1"
              >
                <span>Export</span>
              </button>
            </>
          )}
          </div>
     

         
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {orders.length === 0 && !loading ? (
          <EmptyState
            title="No orders found"
            description="Try adjusting your search or filters"
            actionText="Reset Filters"
            onAction={resetFilters}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectMode && (
                      <th className="px-6 py-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === orders.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-center align-middle">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-center align-middle">
                      Customer
                    </th>
                    <th
                      className="px-6 py-3 text-center align-middle cursor-pointer"
                      onClick={() => handleSort("createdAt")}
                    >
                      Date
                    </th>
                    <th
                      className="px-6 py-3 text-center align-middle cursor-pointer"
                      onClick={() => handleSort("totalPrice")}
                    >
                      Total
                    </th>
                    <th className="px-6 py-3 text-center align-middle">
                      Status
                    </th>
                    {/* <th className="px-6 py-3 text-center align-middle">View</th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => {
                    const isSelected = selectedIds.includes(order._id);

                    return (
                      <tr
                        key={order._id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectMode && isSelected ? "bg-gray-100" : ""
                        }`}
                        onClick={() => {
                          if (selectMode) {
                            toggleSelect(order._id);
                          } else {
                            setSelectedOrder(order);
                            setShowModal(true);
                          }
                        }}
                      >
                        {selectMode && (
                          <td
                            className="px-6 py-4 text-center align-middle"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(order._id)}
                            />
                          </td>
                        )}

                        <td className="px-6 py-4 text-center align-middle text-sm font-medium">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-center align-middle text-sm text-gray-500">
                          {order.user?.name || "Guest"}
                        </td>
                        <td className="px-6 py-4 text-center align-middle text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-center align-middle text-sm font-medium">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              statusColors[order.status]
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {loading && page > 1 && (
              <div className="flex justify-center p-4">
                <Skeleton size="small" />
              </div>
            )}

            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
              {/* Mobile Pagination */}
              <div className="flex items-center justify-between sm:hidden">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page >= pagination.totalPages}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{(page - 1) * 10 + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(page * 10, pagination.totalItems)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{pagination.totalItems}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>‹
                    </button>
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pageNum
                                ? "z-10 bg-black border-black text-white"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                      disabled={page >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>›
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
