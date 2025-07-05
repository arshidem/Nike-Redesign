import axios from "axios";
import { useAppContext } from "../../../context/AppContext";

const useAuthService = () => {
  const { backendUrl, token, setUser, setToken } = useAppContext();

  // Axios config with auth header
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // Request OTP (login/register)
  const requestOTP = async (email) => {
    const res = await axios.post(`${backendUrl}/api/auth/request-otp`, { email });
    return res.data;
  };

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    const res = await axios.post(`${backendUrl}/api/auth/verify-otp`, { email, otp });
    return res.data;
  };

  // Complete Registration
  const completeRegistration = async (name, gender, email) => {
    const res = await axios.post(`${backendUrl}/api/auth/complete-registration`, {
      name,
      gender,
      email,
    });
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser({ ...res.data.user, isAuthenticated: true });
    }
    return res.data;
  };

  // Get Logged In User
  const getMe = async () => {
    const res = await axios.get(`${backendUrl}/api/auth/me`, authHeaders);
    return res.data;
  };

  // Update user info (name, dob, phone, location etc.)
  const updateUserData = async (payload) => {
    const res = await axios.put(`${backendUrl}/api/auth/me`, payload, authHeaders);
    setUser({ ...res.data.user, isAuthenticated: true });
    return res.data;
  };

  // Delete User Account
  const deleteUser = async () => {
    const res = await axios.delete(`${backendUrl}/api/auth/me`, authHeaders);
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    return res.data;
  };

  // Logout
  const logoutUser = async () => {
    await axios.post(`${backendUrl}/api/auth/logout`, {}, authHeaders);
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return {
    requestOTP,
    verifyOTP,
    completeRegistration,
    getMe,
    updateUserData,
    deleteUser,
    logoutUser,
  };
};

export default useAuthService;
