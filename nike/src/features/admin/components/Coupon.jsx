import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  TagIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import NikeSelect from "../../../shared/ui/NikeSelect";
import { SettingsDialog } from "../../user/AccountSettings/SettingsUI";
import { useCouponService } from "../../product/services/couponService";
import "../../../css/settings.css";
import "../../../css/admin-coupons.css";

const blank = () => ({
  code: "",
  discountType: "percent",
  discountValue: "",
  minOrderAmount: "",
  expiresAt: "",
  isActive: true,
});
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const errorMessage = (error) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";
export const couponStatus = (coupon, now = Date.now()) =>
  coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now
    ? "expired"
    : coupon.isActive
      ? "active"
      : "inactive";
const dateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const checkedResponse = (response) => {
  if (!response?.success)
    throw new Error(response?.error || "The request could not be completed.");
  return response.data;
};

export default function Coupon() {
  const api = useCouponService(),
    latest = useRef(api);
  latest.current = api;
  const [coupons, setCoupons] = useState([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState(blank),
    [editingId, setEditingId] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [type, setType] = useState("all"),
    [sort, setSort] = useState("newest"),
    [deleting, setDeleting] = useState(null),
    [deleteError, setDeleteError] = useState("");
  const [now, setNow] = useState(Date.now),
    lock = useRef(false),
    formRef = useRef(null),
    codeRef = useRef(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    latest.current
      .fetchCoupons()
      .then((response) => {
        const list = checkedResponse(response);
        if (!Array.isArray(list))
          throw new Error("Invalid coupon response. Please retry.");
        if (active) setCoupons(list);
      })
      .catch((err) => {
        if (active) setLoadError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const counts = useMemo(
    () => ({
      total: coupons.length,
      active: coupons.filter((c) => couponStatus(c, now) === "active").length,
      expired: coupons.filter((c) => couponStatus(c, now) === "expired").length,
      usage: coupons.every((c) => Number.isFinite(c.usageCount))
        ? coupons.reduce((sum, c) => sum + c.usageCount, 0)
        : null,
    }),
    [coupons, now],
  );
  const filtered = useMemo(
    () =>
      coupons
        .filter(
          (c) =>
            c.code.toLowerCase().includes(search.trim().toLowerCase()) &&
            (status === "all" || couponStatus(c, now) === status) &&
            (type === "all" || c.discountType === type),
        )
        .sort((a, b) =>
          sort === "code"
            ? a.code.localeCompare(b.code)
            : sort === "usage"
              ? (b.usageCount || 0) - (a.usageCount || 0)
              : sort === "oldest"
                ? new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
                : new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        ),
    [coupons, search, status, type, sort, now],
  );
  const reset = () => {
    setForm(blank());
    setEditingId(null);
    setError("");
  };
  const change = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
    setError("");
    setNotice("");
  };
  const submit = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    setNotice("");
    const value = Number(form.discountValue),
      minimum = Number(form.minOrderAmount || 0),
      code = form.code.trim().toUpperCase();
    if (!code || code.length > 64)
      return setError("Enter a coupon code of up to 64 characters.");
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      (form.discountType === "percent" && value > 100)
    )
      return setError(
        form.discountType === "percent"
          ? "Enter a percentage greater than 0 and no more than 100."
          : "Enter a discount amount greater than 0.",
      );
    if (!Number.isFinite(minimum) || minimum < 0)
      return setError("Minimum order amount cannot be negative.");
    if (
      coupons.some((c) => c._id !== editingId && c.code.toUpperCase() === code)
    )
      return setError("A coupon with this code already exists.");
    const expiresAt = form.expiresAt
      ? new Date(`${form.expiresAt}T23:59:59.999`)
      : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime()))
      return setError("Choose a valid expiry date.");
    const payload = {
      code,
      discountType: form.discountType,
      discountValue: value,
      minOrderAmount: minimum,
      expiresAt: expiresAt?.toISOString() || null,
      isActive: form.isActive,
    };
    lock.current = true;
    setBusy(true);
    try {
      const data = checkedResponse(
        editingId
          ? await api.updateCoupon(editingId, payload)
          : await api.createCoupon(payload),
      );
      if (!data?._id)
        throw new Error(
          "Coupon was not returned. Refresh the list before trying again.",
        );
      setCoupons((previous) =>
        editingId
          ? previous.map((c) => (c._id === editingId ? { ...c, ...data } : c))
          : [{ ...data, usageCount: data.usageCount ?? 0 }, ...previous],
      );
      setNotice(editingId ? "Coupon updated." : "Coupon added.");
      reset();
      setAttempt((value) => value + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const edit = (coupon) => {
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount || 0),
      expiresAt: dateValue(coupon.expiresAt),
      isActive: coupon.isActive,
    });
    setEditingId(coupon._id);
    setError("");
    setNotice("");
    formRef.current?.scrollIntoView({
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    codeRef.current?.focus({ preventScroll: true });
  };
  const remove = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setDeleteError("");
    try {
      checkedResponse(await api.deleteCoupon(deleting._id));
      setCoupons((previous) => previous.filter((c) => c._id !== deleting._id));
      if (editingId === deleting._id) reset();
      setDeleting(null);
      setNotice("Coupon deleted.");
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const metrics = [
    ["Total Coupons", counts.total, TagIcon],
    ["Active", counts.active, CheckCircleIcon],
    ["Expired", counts.expired, ClockIcon],
    ["Total Usage", counts.usage, ChartBarIcon],
  ];
  return (
    <section className="admin-coupons" aria-labelledby="coupons-title">
      <nav className="coupons-breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin#dashboard">Admin</Link>
        <span>/</span>
        <span>Coupons</span>
      </nav>
      <header className="coupons-heading">
        <div>
          <p className="coupons-eyebrow">NIKE ADMIN / PROMOTIONS</p>
          <h1 id="coupons-title">COUPONS.</h1>
          <p>Create, manage and track discount coupons for your store.</p>
        </div>
        <button
          type="button"
          className="coupons-refresh"
          aria-label="Refresh coupons"
          disabled={loading || busy}
          onClick={() => setAttempt((value) => value + 1)}
        >
          <ArrowPathIcon />
        </button>
      </header>
      <div className="coupons-metrics">
        {metrics.map(([title, value, Icon], index) => (
          <article key={title} className={`coupons-metric metric-${index}`}>
            <span>
              <Icon />
            </span>
            <div>
              <h2>{title}</h2>
              <strong className={value == null ? "is-unavailable" : undefined}>
                {loading || loadError
                  ? "—"
                  : value == null
                    ? "Unavailable"
                    : value.toLocaleString("en-IN")}
              </strong>
            </div>
          </article>
        ))}
      </div>
      <form
        className="coupons-form"
        ref={formRef}
        onSubmit={submit}
        aria-label={editingId ? "Edit coupon" : "Add new coupon"}
      >
        <h2>
          <TagIcon />
          {editingId ? "Edit Coupon" : "Add New Coupon"}
          {editingId && <span>{form.code}</span>}
        </h2>
        <fieldset disabled={busy || loading || !!loadError}>
          <legend className="sr-only">Coupon details</legend>
          <div className="coupons-form-grid">
            <label className="coupons-field">
              <span>
                Coupon Code <em>*</em>
              </span>
              <input
                ref={codeRef}
                name="code"
                required
                maxLength={64}
                placeholder="e.g. NIKE20"
                value={form.code}
                onChange={change}
              />
            </label>
            <NikeSelect
              size="sm"
              label="Discount Type *"
              ariaLabel="Discount Type"
              value={form.discountType}
              disabled={busy || loading || !!loadError}
              onChange={(value) =>
                setForm((previous) => ({ ...previous, discountType: value }))
              }
              options={[
                ["percent", "Percentage"],
                ["fixed", "Fixed Amount"],
              ]}
            />
            <label className="coupons-field coupons-with-unit">
              <span>
                Discount Value <em>*</em>
              </span>
              <input
                name="discountValue"
                type="number"
                required
                min="0.01"
                step="0.01"
                max={form.discountType === "percent" ? 100 : undefined}
                placeholder="e.g. 20"
                value={form.discountValue}
                onChange={change}
              />
              <i>{form.discountType === "percent" ? "%" : "₹"}</i>
            </label>
            <label className="coupons-field coupons-with-unit">
              <span>Min Order Amount</span>
              <input
                name="minOrderAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 4000"
                value={form.minOrderAmount}
                onChange={change}
              />
              <i>₹</i>
            </label>
            <label className="coupons-field">
              <span>
                Expiry Date <small>(optional)</small>
              </span>
              <input
                name="expiresAt"
                aria-label="Expiry Date"
                type="date"
                value={form.expiresAt}
                onChange={change}
              />
            </label>
            <NikeSelect
              size="sm"
              label="Status"
              ariaLabel="Coupon Status"
              value={String(form.isActive)}
              disabled={busy || loading || !!loadError}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  isActive: value === "true",
                }))
              }
              options={[
                ["true", "Active"],
                ["false", "Inactive"],
              ]}
            />
          </div>
        </fieldset>
        {error && (
          <p className="coupons-error" role="alert">
            {error}
          </p>
        )}
        <div className="coupons-form-footer">
          <p>
            No expiry date? Your coupon stays valid until you deactivate it.
          </p>
          <button
            type="button"
            className="coupons-clear"
            disabled={busy}
            onClick={reset}
          >
            {editingId ? "Cancel edit" : "Clear"}
          </button>
          <button
            type="submit"
            className="coupons-submit"
            disabled={busy || loading || !!loadError}
          >
            {busy ? "Saving…" : editingId ? "Save Coupon" : "Add Coupon"}
            <PlusIcon />
          </button>
        </div>
      </form>
      {notice && (
        <p className="coupons-success" role="status">
          <CheckCircleIcon />
          {notice}
        </p>
      )}
      <div className="coupons-toolbar">
        <label className="coupons-search">
          <MagnifyingGlassIcon />
          <input
            type="search"
            aria-label="Search coupons by code"
            placeholder="Search coupons by code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear coupon search"
              onClick={() => setSearch("")}
            >
              <XMarkIcon />
            </button>
          )}
        </label>
        <NikeSelect
          size="sm"
          ariaLabel="Filter coupon status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            ["all", "All"],
            ["active", "Active"],
            ["expired", "Expired"],
            ["inactive", "Inactive"],
          ]}
        />
        <NikeSelect
          size="sm"
          ariaLabel="Filter discount type"
          label="Type"
          value={type}
          onChange={setType}
          options={[
            ["all", "All"],
            ["percent", "Percentage"],
            ["fixed", "Fixed Amount"],
          ]}
        />
        <NikeSelect
          size="sm"
          ariaLabel="Sort coupons"
          label="Sort"
          value={sort}
          onChange={setSort}
          options={[
            ["newest", "Newest First"],
            ["oldest", "Oldest First"],
            ["code", "Code: A–Z"],
            ["usage", "Most Used"],
          ]}
        />
      </div>
      {loadError ? (
        <div className="coupons-state coupons-error" role="alert">
          <h2>Couldn’t load coupons.</h2>
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="coupons-state" role="status">
          Loading coupons…
        </div>
      ) : (
        <>
          <div
            className="coupons-table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Coupon table"
          >
            <table className="coupons-table">
              <caption className="sr-only">
                Store coupons, discounts and usage in paid orders
              </caption>
              <thead>
                <tr>
                  {[
                    "Code",
                    "Discount",
                    "Min Order",
                    "Expiry",
                    "Status",
                    "Usage",
                    "Actions",
                  ].map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((coupon) => {
                  const state = couponStatus(coupon, now);
                  return (
                    <tr key={coupon._id}>
                      <th scope="row">{coupon.code}</th>
                      <td>
                        <span className="coupons-discount">
                          {coupon.discountType === "percent"
                            ? `${coupon.discountValue}%`
                            : money(coupon.discountValue)}{" "}
                          OFF
                        </span>
                      </td>
                      <td>{money(coupon.minOrderAmount)}</td>
                      <td>
                        {coupon.expiresAt ? (
                          <>
                            <time dateTime={coupon.expiresAt}>
                              {new Date(coupon.expiresAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </time>
                            {state === "expired" && <small>Expired</small>}
                          </>
                        ) : (
                          <span className="coupons-no-expiry">No expiry</span>
                        )}
                      </td>
                      <td>
                        <span className={`coupons-status is-${state}`}>
                          {state}
                        </span>
                      </td>
                      <td>
                        {Number.isFinite(coupon.usageCount)
                          ? coupon.usageCount.toLocaleString("en-IN")
                          : "—"}
                      </td>
                      <td>
                        <div className="coupons-actions">
                          <button
                            type="button"
                            aria-label={`Edit ${coupon.code}`}
                            disabled={busy}
                            onClick={() => edit(coupon)}
                          >
                            <PencilSquareIcon />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${coupon.code}`}
                            disabled={busy}
                            onClick={() => {
                              setDeleteError("");
                              setDeleting(coupon);
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="coupons-state">
                <TagIcon />
                <h2>
                  {coupons.length
                    ? "No matching coupons."
                    : "Your next offer starts here."}
                </h2>
                <p>
                  {coupons.length
                    ? "Try a different code or clear your filters."
                    : "Create your first coupon using the form above."}
                </p>
                {coupons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatus("all");
                      setType("all");
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="coupons-table-note">
            {filtered.length} of {coupons.length} coupons · Usage counts paid
            orders using each code.
          </p>
        </>
      )}
      {deleting && (
        <SettingsDialog
          title={`Delete ${deleting.code}?`}
          busy={busy}
          onClose={() => setDeleting(null)}
        >
          <p className="coupons-delete-copy">
            This removes the coupon from your store. Existing orders keep their
            applied discounts.
          </p>
          {deleteError && (
            <p role="alert" className="coupons-error">
              {deleteError}
            </p>
          )}
          <div className="coupons-delete-actions">
            <button
              type="button"
              disabled={busy}
              className="coupons-clear"
              onClick={() => setDeleting(null)}
            >
              Keep coupon
            </button>
            <button
              type="button"
              disabled={busy}
              className="coupons-delete-confirm"
              onClick={remove}
            >
              {busy ? "Deleting…" : "Delete coupon"}
            </button>
          </div>
        </SettingsDialog>
      )}
    </section>
  );
}
