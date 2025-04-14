// src/routes/Route.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Homepage from "../pages/shared/HomePage.jsx";
import Login from "../pages/shared/auth/Login.jsx";
import ForgotPassword from "../pages/shared/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/shared/auth/ResetPassword.jsx";
import SchoolDashboard from "../pages/school/SchoolDashboard.jsx";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/school/dashboard" element={<SchoolDashboard />} />
        {/* Redirect unknown paths to homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;