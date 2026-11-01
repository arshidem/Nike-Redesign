import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
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
    <div className="auth-membership-page">
      <Toaster position="top-center" />

      {/* Top Main Section */}
      <div className="auth-membership-main">
        {/* Left Editorial Branding */}
        <div className="auth-membership-left">
          <div className="auth-header-bar">
            <Link to="/signin" className="auth-nav-back" aria-label="Back to sign in">
              <span>?</span>
              <span>Change email</span>
            </Link>
            <Link to="/home" className="auth-brand-badge" aria-label="Return to Nike home">
              <img src="/assets/logo/nikeLogo.png" alt="Nike" />
            </Link>
          </div>

          <div className="auth-membership-copy">
            <div className="auth-editorial-kicker">Nike Membership</div>
            <h1 className="auth-membership-title">
              YOUR
              <br />
              NEXT
              <br />
              <span>MOVE.</span>
            </h1>
            <p className="auth-membership-sub">
              A space for your favourites,
              <br />
              your next pair, and everything
              <br />
              that moves you.
            </p>
            <div className="auth-editorial-points">
              <div className="auth-point-item">
                <svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Members-only drops & priority delivery</span>
              </div>
              <div className="auth-point-item">
                <svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Personalized styles, wishlist & order tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-membership-right">
          <div className="auth-member-card">
            <h2 className="auth-member-heading">Verify OTP</h2>
            <p className="auth-member-desc">
              Enter the 6-digit code sent to{" "}
              <strong className="text-black">{email}</strong>.
            </p>

            {/* 6-Digit Code Inputs */}
            <div className="auth-otp-inputs">
              {otpValues.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="auth-otp-digit"
                  autoFocus={idx === 0}
                  inputMode="numeric"
                />
              ))}
            </div>

            {/* Resend and Edit Email Row */}
            <div className="auth-resend-row">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="auth-resend-btn"
                >
                  Resend OTP
                </button>
              ) : (
                <span className="auth-resend-timer">Resend in {timer}s</span>
              )}
              <Link to="/signin" className="auth-change-email">
                Edit email
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleVerifyOTP}
              disabled={loading}
              className="auth-otp-submit-btn"
            >
              <span>{loading ? "Verifying..." : "Verify & Continue"}</span>
              <span className="auth-arrow">→</span>
            </button>

            {/* Legal text */}
            <p className="auth-legal-text">
              By continuing, I agree to Nike&apos;s{" "}
              <Link to="/privacy-policy" className="auth-legal-link">
                Privacy Policy
              </Link>
              <br />
              and{" "}
              <Link to="/terms-of-service" className="auth-legal-link">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Benefit Strip */}
      <footer className="auth-membership-footer">
        <div className="auth-benefit-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>FASTER CHECKOUT</span>
        </div>
        <div className="auth-benefit-divider"></div>
        <div className="auth-benefit-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span>ORDER TRACKING</span>
        </div>
        <div className="auth-benefit-divider"></div>
        <div className="auth-benefit-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>WISHLIST</span>
        </div>
        <div className="auth-benefit-divider"></div>
        <div className="auth-benefit-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>MEMBER BENEFITS</span>
        </div>
      </footer>
    </div>
  );
};

export default VerifyOtp;
