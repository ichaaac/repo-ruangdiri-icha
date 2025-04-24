import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Homepage from "../pages/shared/HomePage.jsx";
import Login from "../pages/shared/auth/Login.jsx";
import ForgotPassword from "../pages/shared/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/shared/auth/ResetPassword.jsx";
import SchoolDashboard from "../pages/school/SchoolDashboard.jsx";
import ProfilePage from "../pages/school/ProfilePage.jsx";
import SettingsPage from "../pages/school/SettingsPage.jsx";
import EmployeeListPage from "../pages/organization/EmployeeListPage.jsx";
import StudentListPage from "../pages/school/StudentListPage.jsx";
import SchoolLayout from "../components/school/layout/SchoolLayout.jsx";

const AppRoutes = () => {
	return (
		<Routes>
			{/* Public routes */}
			<Route path="/" element={<Homepage />} />
			<Route path="/login" element={<Login />} />
			<Route path="/forgot-password" element={<ForgotPassword />} />
			<Route path="/reset-password" element={<ResetPassword />} />
			<Route path="/organization/list" element={<EmployeeListPage />} />


			{/* Unprotected routes sementara */}
			<Route path="/school/dashboard" element={<SchoolDashboard />} />
			<Route element={<SchoolLayout />}>
				<Route path="/school/profile" element={<ProfilePage />} />
				<Route path="/school/settings" element={<SettingsPage />} />
				<Route path="/school/student-list" element={<StudentListPage />} />
			</Route>

			{/* Redirect unknown paths to homepage */}
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};

export default AppRoutes;
