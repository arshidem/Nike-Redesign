import React, { useState, useEffect } from "react";
import useAddressService from "../services/addressServices";
import { EditIcon } from "../../../shared/ui/Icons";
import { ConfirmModal } from "../../../shared/ui/Icons";
import toast, { Toaster } from "react-hot-toast";
import { DeliveryAddressesSkeleton } from "../../../shared/ui/Skeleton";

const DeliveryAddresses = () => {
  const { addAddress, getAddresses, updateAddress, deleteAddress } =
    useAddressService();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isDefault: false,
  });
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      isDefault: false,
    });
    setErrors({});
    setEditId(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (
      !formData.phone.trim() ||
      !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{3,15}$/.test(formData.phone)
    )
      newErrors.phone = "Valid phone number required";
    if (!formData.street.trim()) newErrors.street = "Street is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.postalCode.trim())
      newErrors.postalCode = "Postal code is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fullName = `${formData.firstName} ${formData.lastName}`;
    setIsSaving(true);
    try {
      if (formData.isDefault) {
        await Promise.all(
          addresses.map((a) =>
            a.isDefault
              ? updateAddress(a._id, { ...a, isDefault: false })
              : Promise.resolve()
          )
        );
      }

      if (editId) {
        const updated = await updateAddress(editId, { ...formData, fullName });
        setAddresses((prev) =>
          prev.map((a) => (a._id === updated._id ? updated : a))
        );
        toast.success("Address updated successfully");
      } else {
        const newAddr = await addAddress({ ...formData, fullName });
        setAddresses((prev) => [...prev, newAddr]);
        toast.success("Address added successfully");
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      toast.error("Failed to save address");
      console.error("Address save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteAddress(deleteId);
      setAddresses((prev) => prev.filter((a) => a._id !== deleteId));
      if (editId === deleteId) {
        resetForm();
        setShowForm(false);
      }
      setDeleteId(null);
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (address) => {
    const [firstName, ...rest] = address.fullName.split(" ");
    setFormData({
      firstName,
      lastName: rest.join(" "),
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditId(address._id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAddresses();
        setAddresses(res);
      } catch (err) {
        toast.error("Failed to fetch addresses");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const autoFill = async () => {
      if (formData.postalCode.length >= 6) {
        try {
          const res = await fetch(
            `https://api.postalpincode.in/pincode/${formData.postalCode}`
          );
          const data = await res.json();
          if (data[0]?.Status === "Success") {
            const loc = data[0].PostOffice[0];
            setFormData((prev) => ({
              ...prev,
              city: loc.Block || loc.District || "",
              state: loc.State || "",
              country: loc.Country || "India",
            }));
          }
        } catch {
          toast.error("Failed to auto-fill pin data");
        }
      }
    };
    autoFill();
  }, [formData.postalCode]);

  if (loading) return <DeliveryAddressesSkeleton/>;

  return (
    <div className="p-6">
      <Toaster position="top-center" />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold mb-4">Delivery Addresses</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-black text-white px-4 py-2 rounded-full"
        >
          Add Address
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-lg relative">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Address" : "Add Address"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="absolute top-4 right-4 text-2xl"
            >
              &times;
            </button>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <input
                  name="firstName"
                  placeholder="First Name*"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="flex-1 border p-2 rounded"
                />
                <input
                  name="lastName"
                  placeholder="Last Name*"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="flex-1 border p-2 rounded"
                />
              </div>

              <input
                name="phone"
                placeholder="Phone*"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />

              <input
                name="street"
                placeholder="Street Address*"
                value={formData.street}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />

              <input
                name="postalCode"
                placeholder="Postal Code*"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />

              <input
                name="city"
                placeholder="City*"
                value={formData.city}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />

              <input
                name="state"
                placeholder="State*"
                value={formData.state}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />

              <input
                name="country"
                placeholder="Country*"
                value={formData.country}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                />
                Set as default address
              </label>

              <div className="flex justify-between gap-3 pt-2">
                {editId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDeleteId(editId)}
                      className="flex-1 border border-gray-400 py-2 rounded"
                    >
                      Delete
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-black text-white py-2 rounded"
                    >
                      {isSaving ? "Updating..." : "Update"}
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-black text-white py-2 rounded"
                  >
                    {isSaving ? "Saving..." : "Save Address"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Delivery Address"
          description="Are you sure you want to delete this address? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          loading={isDeleting}
          onConfirm={confirmDelete}
          onClose={() => setDeleteId(null)}
        />
      )}

      <div className="mt-6">
        {addresses.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-base font-medium">
              You currently don't have any saved delivery addresses.
            </p>
            <p className="text-sm">
              Add an address here to be pre-filled for quicker checkout.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div key={addr._id} className="border p-4 rounded relative">
                {addr.isDefault && (
                  <span className="absolute top-2 right-2 bg-green-100 text-xs px-2 py-1 rounded">
                    Default
                  </span>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{addr.fullName}</p>
                    <p>{addr.phone}</p>
                    <p>{addr.street}</p>
                    <p>
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p>{addr.country}</p>
                  </div>
                  <button
                    onClick={() => handleEdit(addr)}
                    className="text-gray-600 hover:text-black absolute bottom-2 right-2"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryAddresses;
