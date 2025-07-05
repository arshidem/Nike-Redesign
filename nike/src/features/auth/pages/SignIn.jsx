import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext.jsx";
import toast, { Toaster } from "react-hot-toast";
import { NikeSwoosh } from "../../../shared/ui/Icons.jsx";
import Joi from "joi";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { backendUrl } = useAppContext();
  const navigate = useNavigate();

  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        "string.empty": "Please enter your email.",
        "string.email": "Please enter a valid email address.",
      }),
  });

  const handleSendOTP = async () => {
    const { error } = schema.validate({ email });

    if (error) {
      toast.error(error.details[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/auth/request-otp`, { email });

      // Store email and flow type for OTP verification
      localStorage.setItem("authEmail", email);
      localStorage.setItem("authFlow", res.data.type); // "signin" or "register"

      toast.success("OTP sent to your email.");
      navigate("/verify-otp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-white">
      <Toaster />
      <div className="w-full max-w-md px-6 py-8 bg-white/30 backdrop-blur-md shadow-xl rounded-xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <NikeSwoosh />
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-semibold mb-6">
          Enter your Email to Continue
        </h1>

        {/* Email Input */}
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border px-4 py-3 rounded-md text-sm mb-4 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black bg-white/60 backdrop-blur-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Submit Button */}
        <button
          onClick={handleSendOTP}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-all duration-200"
        >
          {loading ? "Sending OTP..." : "Continue"}
        </button>

        {/* Terms and Privacy */}
        <p className="text-center text-xs text-gray-600 mt-6">
          By continuing, I agree to Nike's{" "}
          <span className="underline cursor-pointer">Privacy Policy</span> and{" "}
          <span className="underline cursor-pointer">Terms of Use</span>.
        </p>

      
      </div>
    </div>
  );
};

export default SignIn;
