// src/hooks/useAuth.js - Fixed to correctly handle the API response

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api, { getMe } from "../lib/api";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const token = localStorage.getItem("token");

      // If no token, return null (not authenticated)
      if (!token) return null;

      try {
        // Use the consolidated getMe function
        const response = await getMe();
        
        // Directly access the response structure as shown in the API example
        if (response?.status === "success") {
          const userData = response.data;
          
          // Save user type to localStorage and query cache
          const orgType = userData?.organization?.type || localStorage.getItem("organizationType");
          
          if (orgType) {
            // Set data for organization-specific profile queries
            queryClient.setQueryData([`${orgType}-profile`], userData);
          }
          
          return userData;
        }

        return null;
      } catch (e) {
        console.error("Error fetching user data:", e);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Login mutation
   * Handles user authentication and stores tokens
   */
  const login = useMutation({
    mutationFn: async (credentials) => {
      try {
        const loginResponse = await api.auth.login(credentials);

        if (loginResponse?.status !== "success") {
          throw new Error(loginResponse?.message || "Login failed");
        }

        const accessToken = loginResponse.data.accessToken;
        const organizationType = loginResponse.data.organizationType;

        if (!accessToken) {
          throw new Error("Access token tidak ditemukan dalam respons");
        }

        return { accessToken, organizationType };
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("organizationType", data.organizationType);

      if (data.organizationType === "school") {
        window.location.href = "/demo/organization/school/profile";
      } else if (data.organizationType === "company") {
        window.location.href = "/demo/organization/company/profile";
      } else {
        window.location.href = "/";
      }
    },
  });

  /**
   * Forgot password mutation
   */
  const forgotPassword = useMutation({
    mutationFn: async (email) => {
      const response = await api.auth.forgotPassword(email);
      return response;
    },
  });

  /**
   * Reset password mutation
   */
  const resetPassword = useMutation({
    mutationFn: async ({ token, newPassword }) => {
      const response = await api.auth.resetPassword(token, newPassword);
      return response;
    },
    onSuccess: () => {
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    },
  });

  /**
   * Change password mutation
   */
  const changePassword = useMutation({
    mutationFn: async ({ oldPassword, newPassword }) => {
      try {
        // Set a custom header to prevent 401 intercept redirect
        const response = await api.auth.changePassword(oldPassword, newPassword, true);
        return response;
      } catch (error) {
        // Explicitly handle 401 error here
        if (error.response?.status === 401) {
          throw new Error("Password lama tidak valid");
        }
        throw error;
      }
    },
  });

  /**
   * Logout function
   */
  const logout = useMutation({
    mutationFn: async () => {
      try {
        await api.auth.logout();
      } catch (error) {
        console.error("Logout error:", error);
      }
    },
    onSettled: () => {
      // Clear user data and tokens
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("organizationType");

      // Clear query cache
      queryClient.setQueryData(["currentUser"], null);
      queryClient.setQueryData(["school-profile"], null);
      queryClient.setQueryData(["company-profile"], null);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      navigate("/login");
    },
  });

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    if (isLoading) return true;
    return !!token;
  };

  /**
   * Get user's organization type
   */
  const getOrganizationType = () => {
    const storedType = localStorage.getItem("organizationType");
    if (storedType) return storedType;
    return user?.organization?.type || null;
  };

  return {
    user,
    isLoading,
    error,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
    logout,
    isAuthenticated,
    getOrganizationType,
    refetchUser: refetch,
  };
};