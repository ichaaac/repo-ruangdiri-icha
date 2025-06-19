// src/hooks/useAuth.js - Updated to support development routes

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import api, { getMe } from "../lib/api";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in development mode (accessing /dev routes)
  const isDevelopmentMode = location.pathname.startsWith('/dev');

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      // Skip API call for development routes
      if (isDevelopmentMode) {
        // Return mock user data for development
        const mockUser = {
          id: "dev-user-123",
          fullName: "Development User",
          email: "dev@example.com",
          organization: {
            id: "dev-org-123",
            name: "Development Organization",
            type: location.pathname.includes('/dev/school') ? "school" : "company",
            profilePicture: null
          }
        };
        return mockUser;
      }

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
    // Don't refetch automatically for development routes
    refetchOnWindowFocus: !isDevelopmentMode,
    refetchOnMount: !isDevelopmentMode,
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
    onSuccess: () => {
      // Cukup invalidasi query biar data user ke-fetch ulang.
      // Gak perlu navigate, biarin ProtectedRoute yang urus.
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    
      // Atau kalo mau lebih cepet, navigate ke homepage aja dulu
      navigate("/");
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
      // Skip API call for development mode
      if (isDevelopmentMode) {
        // Mock successful password change
        return { status: "success", message: "Password changed successfully" };
      }

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
      // Skip API call for development mode
      if (isDevelopmentMode) {
        return { status: "success" };
      }

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

      // Redirect based on current mode
      if (isDevelopmentMode) {
        navigate("/dev");
      } else {
        navigate("/login");
      }
    },
  });

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    // Always authenticated for development routes
    if (isDevelopmentMode) return true;
    
    const token = localStorage.getItem("token");
    if (!token) return false;
    if (isLoading) return true;
    return !!token;
  };

  /**
   * Get user's organization type
   */
  const getOrganizationType = () => {
    // Return organization type based on development route
    if (isDevelopmentMode) {
      return location.pathname.includes('/dev/school') ? 'school' : 'company';
    }
    
    const storedType = localStorage.getItem("organizationType");
    if (storedType) return storedType;
    return user?.organization?.type || null;
  };

  /**
   * Check if we're in development mode
   */
  const isDevelopment = () => {
    return isDevelopmentMode;
  };

  return {
    user,
    isLoading: isDevelopmentMode ? false : isLoading, // No loading for dev mode
    error: isDevelopmentMode ? null : error, // No errors for dev mode
    login,
    forgotPassword,
    resetPassword,
    changePassword,
    logout,
    isAuthenticated,
    getOrganizationType,
    isDevelopment,
    refetchUser: refetch,
  };
};