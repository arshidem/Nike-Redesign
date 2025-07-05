// src/features/admin/routes/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";

export const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, authReady } = useAppContext();

  if (!authReady) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;

  return children;
};
