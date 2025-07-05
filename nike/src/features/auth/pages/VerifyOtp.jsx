// src/features/auth/components/VerifyOtp.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext.jsx";
import toast, { Toaster } from "react-hot-toast";
import { syncGuestCartToServer } from "../../../utils/cartSync.js";

const VerifyOtp = () => {
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const { backendUrl, setUser, setToken } = useAppContext();
  const navigate = useNavigate();
  const email = localStorage.getItem("authEmail");

  useEffect(() => {
    if (!email) {
      toast.error("Session expired. Please sign in again.");
      navigate("/signin");
    }
  }, [email, navigate]);

  useEffect(() => {
    let countdown;
    if (timer > 0) {
      countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(countdown);
  }, [timer]);

  useEffect(() => {
    const allFilled = otpValues.every((digit) => digit.length === 1);
    if (allFilled) {
      handleVerifyOTP();
    }
  }, [otpValues]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otp = otpValues.join("");
    if (otp.length !== 6) {
      toast.error("Enter full 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/auth/verify-otp`, {
        email,
        otp,
      });

      if (res.data.newUser) {
        localStorage.setItem("authEmail", email);
        toast.success("OTP verified. Please complete your registration.");
        return navigate("/complete-register");
      }

      const token = res.data.token;
      localStorage.setItem("token", token);
      setToken(token);

      if (res.data.user) {
        setUser(res.data.user);
        await syncGuestCartToServer(token, backendUrl);
      }

      toast.success("Login successful!");
      navigate("/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/auth/request-otp`, { email });
      setOtpValues(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setTimer(60);
      setCanResend(false);
      toast.success("OTP resent successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 px-4">
      <Toaster />
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center">Verify OTP</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          OTP sent to <span className="font-medium">{email}</span>
        </p>

        <div className="flex justify-center gap-2 mb-4">
          {otpValues.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-10 h-10 sm:w-12 sm:h-12 border text-center text-base sm:text-lg rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          {canResend ? (
            <button
              onClick={handleResendOTP}
              className="text-blue-600 underline text-sm"
              disabled={loading}
            >
              Resend OTP
            </button>
          ) : (
            <span className="text-gray-500 text-sm">Resend in {timer}s</span>
          )}
        </div>

        <button
          onClick={handleVerifyOTP}
          disabled={loading}
          className="w-full bg-black text-white py-2 sm:py-3 text-sm sm:text-base rounded hover:bg-gray-800 transition"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;
