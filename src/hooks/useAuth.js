import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/auth";

/**
 * Custom hook for authentication-related operations
 * Using React Query to manage state without useEffect or Context
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get current user query
  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
      }
    },
    // Don't refetch automatically - we'll control refetching
    staleTime: Infinity
  });

  /**
   * Login mutation
   * Handles user authentication and stores tokens
   */
  const login = useMutation({
    mutationFn: (credentials) => authAPI.login(credentials),
    onSuccess: (response) => {
      // Store auth token and user data
      if (response?.data?.access_token && response?.data?.user) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Update query cache with user data
        queryClient.setQueryData(['currentUser'], response.data.user);
        
        // Redirect based on user role/organization type
        if (response.data.user.organization?.type === 'school') {
          navigate('/organization/school/dashboard');
        } else if (response.data.user.organization?.type === 'company') {
          navigate('/organization/company/dashboard');
        } else {
          navigate('/');
        }
      }
    }
  });

  /**
   * Forgot password mutation
   * Sends a password reset email
   */
  const forgotPassword = useMutation({
    mutationFn: (email) => authAPI.forgotPassword(email)
  });

  /**
   * Reset password mutation
   * Resets user password using token
   */
  const resetPassword = useMutation({
    mutationFn: ({ token, newPassword }) => authAPI.resetPassword(token, newPassword),
    onSuccess: () => {
      // Navigate to login page after successful password reset
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  });

  /**
   * Change password mutation
   * Updates user's current password
   */
  const changePassword = useMutation({
    mutationFn: ({ oldPassword, newPassword }) => authAPI.changePassword(oldPassword, newPassword)
  });

  /**
   * Logout function
   * Clears auth tokens and user data
   */
  const logout = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      // Clear user data and tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear query cache
      queryClient.setQueryData(['currentUser'], null);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // Navigate to login page
      navigate('/login');
    },
    onError: () => {
      // Even on error, clear tokens and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      queryClient.setQueryData(['currentUser'], null);
      navigate('/login');
    }
  });

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  /**
   * Get user's organization type
   */
  const getOrganizationType = () => {
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
    refetchUser: refetch
  };
};