import React, { useEffect, useState } from "react";
import { useCouponService } from "../../product/services/couponService";
import toast, { Toaster } from "react-hot-toast";
import {
  formatDate,
  formatRelativeTime,
  formatISODate,
} from "../../../utils/dateUtils";
import { DeleteIcon, EditIcon } from "../../../shared/ui/Icons";

const Coupon = () => {
  const { fetchCoupons, createCoupon, deleteCoupon, updateCoupon } =
    useCouponService();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    discountValue: "",
    discountType: "fixed",
    minOrderAmount: "",
    expiresAt: "",
    isActive: true,
  });
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [search, setSearch] = useState("");

  const loadCoupons = async () => {
    setLoading(true);
    const res = await fetchCoupons();
    if (res?.success) setCoupons(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

 const handleSubmit = async (e) => {
  e.preventDefault();
  const payload = {
    code: form.code,
    discountValue: parseFloat(form.discountValue),
    discountType: form.discountType || "fixed",
    minOrderAmount: parseFloat(form.minOrderAmount) || 0,
    expiresAt: form.expiresAt || null,
    isActive: form.isActive,
  };

  try {
    if (editingCoupon) {
      await updateCoupon(editingCoupon._id, payload);
      toast.success("Coupon updated successfully");
    } else {
      await createCoupon(payload);
      toast.success("Coupon created successfully");
    }
    setForm({
      code: "",
      discountValue: "",
      discountType: "fixed",
      minOrderAmount: "",
      expiresAt: "",
      isActive: true,
    });
    setEditingCoupon(null);
    loadCoupons();
  } catch (err) {
    toast.error(err?.response?.data?.error || "Something went wrong");
  }
};

const handleDelete = (id) => {
  toast.custom((t) => (
    <div className="bg-white shadow-lg rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-sm border border-gray-200">
      <span className="text-black text-sm">
        Are you sure you want to delete this coupon?
      </span>
      <div className="flex gap-2 ml-auto mt-2 sm:mt-0">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 text-sm rounded"
        >
          No
        </button>
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await deleteCoupon(id);
              toast.success("Coupon deleted successfully");
              loadCoupons(); // 🔁 refresh list
            } catch {
              toast.error("Failed to delete coupon");
            }
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded"
        >
          Yes
        </button>
      </div>
    </div>
  ));
};


  const handleEdit = (coupon) => {
    setForm({
      ...coupon,
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount.toString(),
      expiresAt: formatISODate(coupon.expiresAt),
    });
    setEditingCoupon(coupon);
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
        <Toaster/>
      <h2 className="text-2xl font-bold mb-4">Coupons</h2>

      {/* Form */}
  <form
  onSubmit={handleSubmit}
  className="grid grid-cols-2 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded mb-6 text-xs sm:text-sm md:text-base"
>
  <input
    type="text"
    placeholder="Coupon Code"
    required
    value={form.code}
    onChange={(e) => setForm({ ...form, code: e.target.value })}
    className="p-2 border rounded text-xs sm:text-sm"
  />
  <input
    type="number"
    placeholder="Discount Value"
    required
    value={form.discountValue || ""}
    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
    className="p-2 border rounded text-xs sm:text-sm"
  />
  <select
    value={form.discountType}
    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
    className="p-2 border rounded text-xs sm:text-sm"
  >
    <option value="fixed">Fixed</option>
    <option value="percent">Percent</option>
  </select>
  <input
    type="number"
    placeholder="Min Order Amount"
    value={form.minOrderAmount || ""}
    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
    className="p-2 border rounded text-xs sm:text-sm"
  />
  <input
    type="date"
    value={form.expiresAt || ""}
    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
    className="p-2 border rounded text-xs sm:text-sm"
  />
  <select
    value={form.isActive.toString()}
    onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}
    className="p-2 border rounded text-xs sm:text-sm"
  >
    <option value="true">Active</option>
    <option value="false">Inactive</option>
  </select>

  <button
    type="submit"
    className="w-full sm:w-auto col-span-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-xs sm:text-sm"
  >
    {editingCoupon ? "Update Coupon" : "Add Coupon"}
  </button>
</form>

{/* Search input */}
<input
  type="text"
  placeholder="Search coupons by code..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="mb-4 p-2 border rounded w-full text-xs sm:text-sm"
/>


      {/* List */}
      {loading ? (
        <p>Loading coupons...</p>
      ) : (
        <div className="overflow-x-auto">
<table className="min-w-full border text-xs sm:text-base">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Discount</th>
                <th className="px-4 py-2 text-left">Min Order</th>
                <th className="px-4 py-2 text-left">Expiry</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((c) => {
                const isExpired = new Date(c.expiresAt) < new Date();
                return (
                  <tr key={c._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{c.code}</td>
                    <td className="px-4 py-2">
                      {c.discountType === "percent"
                        ? `${c.discountValue}%`
                        : `₹${c.discountValue}`}
                    </td>
                    <td className="px-4 py-2">₹{c.minOrderAmount}</td>
                    <td className="px-4 py-2">
                      {c.expiresAt ? formatDate(c.expiresAt) : "—"}
                      <div className="text-xs text-gray-500">
                        {isExpired ? "Expired" : formatRelativeTime(c.expiresAt)}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium inline-block ${
                          isExpired
                            ? "bg-red-100 text-red-800"
                            : c.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {isExpired ? "Expired" : c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 flex gap-4">
                      <button
                        onClick={() => handleEdit(c)}
                        className=" hover:underline text-sm"
                      >
                        <EditIcon className="w-4 h-4"/>
                      </button>
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        <DeleteIcon size={20}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Coupon;
