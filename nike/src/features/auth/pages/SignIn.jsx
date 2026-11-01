import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext.jsx";
import toast, { Toaster } from "react-hot-toast";
import Joi from "joi";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  const { backendUrl, setToken, setUser } = useAppContext();
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      toast.error("Google sign-in was canceled or failed.");
      return;
    }

    setGoogleLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/auth/google`, {
        credential: response.credential,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        if (setToken) setToken(res.data.token);
        if (setUser && res.data.user) setUser(res.data.user);
        toast.success(res.data.message || "Signed in successfully with Google!");
        navigate("/home");
      } else {
        toast.error("Failed to authenticate with Google.");
      }
    } catch (err) {
      console.error("Google auth error:", err);
      toast.error(err.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "outline",
              size: "large",
              type: "standard",
              shape: "rectangular",
              text: "continue_with",
              logo_alignment: "left",
              width: 340,
            });
          }
        } catch (e) {
          console.error("Error initializing Google Identity Services:", e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGoogle();
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, [googleClientId]);

  const handleCustomGoogleClick = () => {
    if (!googleClientId) {
      toast.error("Google Client ID is not configured yet. Please check VITE_GOOGLE_CLIENT_ID.");
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      toast.error("Google Sign-In is still loading. Please try again in a moment.");
    }
  };

  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        "string.empty": "Please enter your email.",
        "string.email": "Please enter a valid email address.",
      }),
  });

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    const { error } = schema.validate({ email });

    if (error) {
      toast.error(error.details[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/auth/request-otp`, { email });

      localStorage.setItem("authEmail", email);
      localStorage.setItem("authFlow", res.data?.type || "signin");

      toast.success("OTP sent to your email.");
      navigate("/verify-otp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong sending OTP");
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
            <Link to="/home" className="auth-nav-back" aria-label="Back to storefront">
              <span>?</span>
              <span>Back</span>
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
            <h2 className="auth-member-heading">Member Access</h2>
            <p className="auth-member-desc">
              Sign in with Google or use a one-time
              <br className="hidden sm:inline" /> code (OTP) via email.
            </p>

            {/* Google Continue Button */}
            <div className="auth-google-wrapper">
              <button
                type="button"
                onClick={handleCustomGoogleClick}
                disabled={googleLoading}
                className="auth-google-button"
              >
                <svg className="auth-google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
              </button>

              {/* Hidden Google GIS standard button for fallback / direct GIS trigger */}
              <div ref={googleBtnRef} style={{ display: "none" }} />
            </div>

            {/* Divider */}
            <div className="auth-or-divider">
              <span className="auth-or-line"></span>
              <span className="auth-or-text">OR</span>
              <span className="auth-or-line"></span>
            </div>

            {/* Email OTP Form */}
            <form onSubmit={handleSendOTP} className="auth-email-form">
              <div className="auth-input-container">
                <svg
                  className="auth-input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="auth-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-otp-submit-btn"
              >
                <span>{loading ? "Sending OTP..." : "Continue with OTP"}</span>
                <span className="auth-arrow">→</span>
              </button>
            </form>

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

      {/* Bottom Benefit Strip (matching reference image) */}
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

export default SignIn;
