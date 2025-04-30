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
        
        if (response.data?.status === "success") {
          return response.data.data;
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
        // Use the consolidated api.auth.login
        const loginResponse = await api.auth.login(credentials);

        if (loginResponse?.status !== "success") {
          throw new Error(loginResponse?.message || "Login failed");
        }

        // Extract token using the correct property name
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
      // Save token to localStorage
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("organizationType", data.organizationType);

      // Use window.location for a hard navigation to bypass React Router issues
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
   * Sends a password reset email
   */
  const forgotPassword = useMutation({
    mutationFn: async (email) => {
      const response = await api.auth.forgotPassword(email);
      return response;
    },
  });

  /**
   * Reset password mutation
   * Resets user password using token
   */
  const resetPassword = useMutation({
    mutationFn: async ({ token, newPassword }) => {
      const response = await api.auth.resetPassword(token, newPassword);
      return response;
    },
    onSuccess: () => {
      // Navigate to login page after successful password reset
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    },
  });

  /**
   * Change password mutation
   * Updates user's current password
   */
  const changePassword = useMutation({
    mutationFn: async ({ oldPassword, newPassword }) => {
      const response = await api.auth.changePassword(oldPassword, newPassword);
      return response;
    },
  });

  /**
   * Logout function
   * Clears auth tokens and user data
   */
  const logout = useMutation({
    mutationFn: async () => {
      try {
        // Call logout endpoint using the consolidated API
        await api.auth.logout();
      } catch (error) {
        console.error("Logout error:", error);
        // Continue with local logout even if API call fails
      }
    },
    onSettled: () => {
      // Clear user data and tokens regardless of success/failure
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("organizationType");

      // Clear query cache
      queryClient.setQueryData(["currentUser"], null);
      queryClient.setQueryData(["school", "profile"], null);
      queryClient.setQueryData(["company", "profile"], null);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Navigate to login page
      navigate("/login");
    },
  });

  /**
   * Check if user is authenticated
   * First check token, then check user data if needed
   */
  const isAuthenticated = () => {
    // First check for token - this is the primary authentication check
    const token = localStorage.getItem("token");
    if (!token) return false;

    // If we're still loading, consider the user authenticated based on token
    if (isLoading) return true;

    // If loading completed but no user data, still consider authenticated if token exists
    return !!token;
  };

  /**
   * Get user's organization type
   */
  const getOrganizationType = () => {
    // First check localStorage
    const storedType = localStorage.getItem("organizationType");
    if (storedType) return storedType;

    // Fallback to user data if available
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