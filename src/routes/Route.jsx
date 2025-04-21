// src/routes/Route.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Homepage from "../pages/shared/HomePage.jsx";
import Login from "../pages/shared/auth/Login.jsx";
import ForgotPassword from "../pages/shared/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/shared/auth/ResetPassword.jsx";
import SchoolDashboard from "../pages/school/SchoolDashboard.jsx";
import ProfilePage from "../pages/school/ProfilePage.jsx";

// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!localStorage.getItem('token');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length === 0 || (user.role && allowedRoles.includes(user.role))) {
    return children;
  }
  
  return <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<ProfilePage />} />

      
      {/* Protected routes */}
      <Route 
        path="/school/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['school', 'admin']}>
            <SchoolDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirect unknown paths to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;