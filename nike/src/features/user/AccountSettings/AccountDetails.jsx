import React, { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import useAuthService from "../services/authServices";
import toast, { Toaster } from "react-hot-toast";
import { ConfirmModal, EditIcon } from "../../../shared/ui/Icons";
import { Country, State } from "country-state-city";
import { AccountDetailsSkeleton } from "../../../shared/ui/Skeleton";

const AccountDetails = () => {
  const { logout, setUser } = useAppContext();
  const { getMe, updateUserData, deleteUser } = useAuthService();

  const [initialFormData, setInitialFormData] = useState({
    name: "",
    phoneNumber: "",
    dob: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
  });

  const [formData, setFormData] = useState({ ...initialFormData });
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const countryList = Country.getAllCountries().map((c) => ({
      name: c.name,
      code: c.isoCode,
    }));
    setCountries(countryList);
  }, []);

  useEffect(() => {
    const selected = countries.find((c) => c.name === formData.country);
    if (selected) {
      const stateList = State.getStatesOfCountry(selected.code).map((s) => s.name);
      setStates(stateList);
    } else {
      setStates([]);
    }
  }, [formData.country, countries]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await getMe();
        const userData = {
          name: data.name || "",
          phone: data.phone || "",
          dob: data.dob || "",
          country: data.country || "",
          state: data.state || "",
          city: data.city || "",
          postalCode: data.postalCode || "",
        };
        setInitialFormData(userData);
        setFormData(userData);
        setEmail(data.email);
        setUser({ ...data, isAuthenticated: true });
      } catch (err) {
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    setFormData((prev) => ({ ...prev, country: countryName, state: "" }));
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleUpdate = async () => {
    try {
      const res = await updateUserData(formData);
      toast.success("Profile updated successfully");
      const updated = {
        name: res.user.name || "",
        phone: res.user.phone || "",
        dob: res.user.dob || "",
        country: res.user.country || "",
        state: res.user.state || "",
        city: res.user.city || "",
        postalCode: res.user.postalCode || "",
      };
      setInitialFormData(updated);
      setFormData(updated);
      setUser({ ...res.user, isAuthenticated: true });
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUser();
      toast.success("Account deleted successfully");
      logout();
      Navigate("/home")
    } catch (err) {
      toast.error("Failed to delete account");
    }
  };

  const hasChanges = () =>
    Object.keys(formData).some((key) => formData[key] !== initialFormData[key]);

  const renderField = (label, name, type = "text") => (
    <div>
      <label className="block text-sm font-medium">{label}*</label>
      <input
        name={name}
        type={type}
        value={
          name === "dob"
            ? formData.dob
              ? new Date(formData.dob).toISOString().slice(0, 10)
              : ""
            : formData[name]
        }
        onChange={handleChange}
        readOnly={!isEditing}
        className={`w-full mt-1 border rounded p-2 ${
          !isEditing ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );

  const renderSelectField = (label, name, options) => (
    <div>
      <label className="block text-sm font-medium">{label}*</label>
      <select
        name={name}
        value={formData[name]}
        onChange={name === "country" ? handleCountryChange : handleChange}
        disabled={!isEditing}
        className={`w-full mt-1 border rounded p-2 ${
          !isEditing ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) return <AccountDetailsSkeleton/>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Toaster position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Account Details</h1>
        <button
          onClick={toggleEditing}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <EditIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-5">
        {renderField("Name", "name")}
        <div>
          <label className="block text-sm font-medium">Email*</label>
          <input
            value={email}
            disabled
            className="w-full mt-1 border rounded p-2 bg-gray-100"
          />
        </div>
        {renderField("Phone", "phone")}
        {renderField("Date of Birth", "dob", "date")}

        <div className="mt-6">
          <h3 className="font-medium">Location</h3>
          <div className="mt-4 space-y-4">
            {renderSelectField("Country/Region", "country", countries.map((c) => c.name))}
            {renderSelectField("State/Province", "state", states)}
            {renderField("Town/City", "city")}
            {renderField("Postcode", "postalCode")}
          </div>
        </div>

        <div className="border-t pt-6 mt-6">
          <div className="flex justify-between items-center">
            <p className="font-medium">Delete Account</p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="border px-4 py-1 rounded-full hover:bg-gray-100"
            >
              Delete
            </button>
          </div>
        </div>

        {isEditing && (
          <button
            className={`w-full py-2 mt-4 rounded-full transition ${
              hasChanges()
                ? "bg-black text-white hover:bg-opacity-90"
                : "bg-white text-black border border-black hover:bg-gray-100"
            }`}
            onClick={handleUpdate}
            disabled={!hasChanges()}
          >
            Save Changes
          </button>
        )}
      </div>

      {showDeleteModal && (
        <ConfirmModal
          title="Delete Account"
          description="Are you sure you want to delete your account? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
};

export default AccountDetails;
