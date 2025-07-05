import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import Loader from "../shared/ui/Loader";
// 1. Create the context
const AppContext = createContext();

// 2. Create the provider component
export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authReady, setAuthReady] = useState(false);
const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // Derive authentication state
  const isAuthenticated = !!user && !!token;

  const fetchUserData = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser({ ...res.data, isAuthenticated: true });
    } catch (err) {
      console.error("Auth error:", err);
      logout();
    } finally {
      setAuthReady(true);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  // Initialize auth state
useEffect(() => {
  if (token) fetchUserData();
  else {
    setUser(null);
    setAuthReady(true);
  }
}, [token]);



  return (
    <AppContext.Provider
      value={{
        backendUrl,
        user,
        setUser,
        token,
        setToken,
        isAuthenticated,
        authReady,
        logout
      }}
    >
      {authReady ? children : <Loader/>}
    </AppContext.Provider>
  );
};

// 3. Create and export the custom hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

// 4. Export the context itself (optional)
export default AppContext;