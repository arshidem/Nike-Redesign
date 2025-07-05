import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../../../context/AppContext.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { syncGuestCartToServer } from "../../../utils/cartSync"; // ✅ Import sync function

const VerifyRegisterOtp = () => {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);

  const { backendUrl, setUser, setToken } = useAppContext();
  const navigate = useNavigate();

  const registerData = JSON.parse(localStorage.getItem("pendingRegisterData"));

  useEffect(() => {
    if (!registerData) {
      toast.error("Session expired. Please register again.");
      navigate("/register");
    }
  }, [navigate, registerData]);

  useEffect(() => {
    let countdown;
    if (timer > 0) {
      countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(countdown);
  }, [timer]);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/auth/register/verify-otp`, {
        ...registerData,
        otp,
      });

      const { token, user } = res.data;

      localStorage.removeItem("pendingRegisterData");
      localStorage.setItem("token", token);
      if (setToken) setToken(token);
      if (setUser) setUser(user);

      toast.success("Registered successfully!");

      // ✅ Sync guest cart to server after successful registration
      await syncGuestCartToServer(token, backendUrl);

      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/auth/register/request-otp`, registerData);
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
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Verify Registration OTP</h2>

        <p className="text-sm text-gray-600 mb-2">
          OTP sent to <span className="font-medium">{registerData?.email}</span>
        </p>

        <div className="flex justify-between items-center mb-2">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-blue-600 underline text-sm"
              disabled={loading}
            >
              Resend OTP
            </button>
          ) : (
            <span className="text-gray-500 text-sm">Resend in {timer}s</span>
          )}
        </div>

        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full border px-4 py-2 rounded mb-4"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          {loading ? "Verifying..." : "Verify & Register"}
        </button>
      </div>
    </div>
  );
};

export default VerifyRegisterOtp;
