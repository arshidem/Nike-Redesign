import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAppContext } from "../../../context/AppContext.jsx";
import { NikeSwoosh } from "../../../shared/ui/Icons.jsx";
import Joi from "joi";

const CompleteRegister = () => {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
const email = localStorage.getItem("authEmail"); // Get saved email

  const { backendUrl, setUser, setToken } = useAppContext();
  const navigate = useNavigate();


  useEffect(() => {
    if (!email) {
      toast.error("Session expired. Please sign in again.");
      navigate("/signin");
    }
  }, [email, navigate]);

  const schema = Joi.object({
    name: Joi.string().min(2).max(30).required().messages({
      "string.empty": "Name is required.",
      "string.min": "Name must be at least 2 characters.",
    }),
    gender: Joi.string().valid("male", "female", "other").required().messages({
      "any.only": "Please select a valid gender.",
      "string.empty": "Gender is required.",
    }),
  });

const handleCompleteRegister = async () => {
  const { error } = schema.validate({ name, gender });

  if (error) {
    toast.error(error.details[0].message);
    return;
  }

  if (!email) {
    toast.error("Session expired. Please sign in again.");
    return navigate("/signin");
  }

  setLoading(true);
  try {
    const res = await axios.post(`${backendUrl}/api/auth/complete-registration`, {
      name,
      gender,
      email, // ✅ send email from localStorage
    });

    const token = res.data.token;
    localStorage.setItem("token", token);
    setToken(token);
    setUser(res.data.user);
    toast.success("Account created!");
    navigate("/home");
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to complete registration");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-white">
      <Toaster />
      <div className="w-full max-w-md px-6 py-8 bg-white/30 backdrop-blur-md shadow-xl rounded-xl">
        <div className="flex justify-center mb-8">
          <NikeSwoosh />
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center">
          Complete your profile
        </h2>

        <input
          type="text"
          placeholder="Full Name"
          className="w-full border px-4 py-3 rounded-md text-sm mb-4 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black bg-white/60 backdrop-blur-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full border px-4 py-3 rounded-md text-sm mb-4 text-gray-600 focus:outline-none focus:ring-2 focus:ring-black bg-white/60 backdrop-blur-sm"
        >
          <option value="" disabled hidden>Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer Not To Say</option>
        </select>

        <button
          onClick={handleCompleteRegister}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-all duration-200"
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
};

export default CompleteRegister;
