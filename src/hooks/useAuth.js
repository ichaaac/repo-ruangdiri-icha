// src/hooks/useAuth.js - Updated with Complete Onboarding Logic

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useLocation } from "react-router-dom"
import api, { getMe } from "../lib/api"

export const useAuth = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const token = localStorage.getItem("token")
      if (!token) return null

      try {
        const response = await getMe()
        if (response?.status === "success") {
          const userData = response.data

          // Store organization type if exists (for admin users)
          const orgType = userData?.organization?.type
          if (orgType) {
            localStorage.setItem("organizationType", orgType)
            queryClient.setQueryData([`${orgType}-profile`], userData)
          }

          // Store user role if exists (for regular users)
          const userRole = userData?.role
          if (userRole) {
            localStorage.setItem("userRole", userRole)
          }

          return userData
        }
        return null
      } catch (e) {
        console.error("Error fetching user data:", e)
        if (e.response?.status === 401) {
          localStorage.removeItem("token")
          localStorage.removeItem("organizationType")
          localStorage.removeItem("userRole")
        }
        return null
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })

  const login = useMutation({
    mutationFn: async (credentials) => {
      try {
        const loginResponse = await api.auth.login(credentials)

        if (loginResponse?.status !== "success") {
          throw new Error(loginResponse?.message || "Login failed")
        }

        const { accessToken, organizationType, userRole } = loginResponse.data

        if (!accessToken) {
          throw new Error("Access token tidak ditemukan dalam respons")
        }

        localStorage.setItem("token", accessToken)
        
        // Store organization type or user role
        if (organizationType) {
          localStorage.setItem("organizationType", organizationType)
        }
        if (userRole) {
          localStorage.setItem("userRole", userRole)
        }

        return { accessToken, organizationType, userRole }
      } catch (error) {
        console.error("Login error:", error)
        throw error
      }
    },
    onSuccess: async (data) => {
      console.log("Login success, fetching user data...")

      try {
        const userResponse = await getMe()

        if (userResponse?.status === "success") {
          const userData = userResponse.data
          queryClient.setQueryData(["currentUser"], userData)

          console.log("User data:", userData)

          // Redirect based on onboarding status and role/org type
          if (userData.isOnboarded === false) {
            // User needs onboarding
            redirectToOnboarding(userData)
          } else {
            // User completed onboarding
            redirectToDashboard(userData)
          }
        } else {
          queryClient.invalidateQueries({ queryKey: ["currentUser"] })
          navigate("/")
        }
      } catch (error) {
        console.error("Error fetching user data after login:", error)
        queryClient.invalidateQueries({ queryKey: ["currentUser"] })
        navigate("/")
      }
    },
    onError: (error) => {
      console.error("Login failed:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("organizationType")
      localStorage.removeItem("userRole")
    },
  })

  // Helper function to redirect to appropriate onboarding
  const redirectToOnboarding = (userData) => {
    const userRole = userData.role
    const orgType = userData.organization?.type

    console.log("Redirecting to onboarding...", { userRole, orgType })

    // All roles now use the unified onboarding system
    navigate("/onboarding")
  }

  // Helper function to redirect to appropriate dashboard
  const redirectToDashboard = (userData) => {
    const userRole = userData.role
    const orgType = userData.organization?.type

    console.log("Redirecting to dashboard...", { userRole, orgType })

    if (userRole === "student") {
      navigate("/user/student/booking")        // booking session
    } else if (userRole === "employee") {
      navigate("/user/employee/booking")       // booking session  
    } else if (userRole === "psychologist") {
      navigate("/user/psychologist/chat")      // chat page
    } else if (orgType === "school") {
      navigate("/organization/school/dashboard")
    } else if (orgType === "company") {
      navigate("/organization/company/dashboard")
    } else {
      navigate("/")
    }
  }

  const forgotPassword = useMutation({
    mutationFn: async (email) => {
      const response = await api.auth.forgotPassword(email)
      return response
    },
  })

  const resetPassword = useMutation({
    mutationFn: async ({ token, newPassword }) => {
      const response = await api.auth.resetPassword(token, newPassword)
      return response
    },
    onSuccess: () => {
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    },
  })

  const changePassword = useMutation({
    mutationFn: async ({ oldPassword, newPassword }) => {
      try {
        const response = await api.auth.changePassword(oldPassword, newPassword)
        return response
      } catch (error) {
        if (error.response?.status === 401) {
          throw new Error("Password lama tidak valid")
        }
        throw error
      }
    },
  })

  const logout = useMutation({
    mutationFn: async () => {
      try {
        await api.auth.logout()
      } catch (error) {
        console.error("Logout error:", error)
      }
    },
    onSettled: () => {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("organizationType")
      localStorage.removeItem("userRole")
      queryClient.clear()
      navigate("/login")
    },
  })

  // ===================================================
  // HELPER FUNCTIONS
  // ===================================================

  const isAuthenticated = () => {
    const token = localStorage.getItem("token")
    if (!token) return false
    if (isLoading) return true
    return !!user
  }

  const getOrganizationType = () => {
    const userOrgType = user?.organization?.type
    const storedType = localStorage.getItem("organizationType")
    return userOrgType || storedType || null
  }

  const getUserRole = () => {
    const userRole = user?.role
    const storedRole = localStorage.getItem("userRole")
    return userRole || storedRole || null
  }

  const needsOnboarding = () => {
    return user?.isOnboarded === false
  }

  const isOrganizationAdmin = () => {
    const orgType = getOrganizationType()
    const userRole = getUserRole()
    return !userRole && orgType && (orgType === "school" || orgType === "company")
  }

  const isRegularUser = () => {
    const userRole = getUserRole()
    return userRole && ["student", "employee", "psychologist"].includes(userRole)
  }

  const getUserTypeLabel = () => {
    const userRole = getUserRole()
    const orgType = getOrganizationType()

    if (userRole === "student") return "Siswa"
    if (userRole === "employee") return "Pegawai"
    if (userRole === "psychologist") return "Psikolog"
    if (orgType === "school") return "Admin Sekolah"
    if (orgType === "company") return "Admin Perusahaan"
    return "User"
  }

  const getDefaultRoute = () => {
    const userRole = getUserRole()
    const orgType = getOrganizationType()

    if (userRole === "student") return "/user/student/booking"
    if (userRole === "employee") return "/user/employee/booking"
    if (userRole === "psychologist") return "/user/psychologist/chat"
    if (orgType === "school") return "/organization/school/dashboard"
    if (orgType === "company") return "/organization/company/dashboard"
    return "/"
  }

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
    getUserRole,
    needsOnboarding,
    isOrganizationAdmin,
    isRegularUser,
    getUserTypeLabel,
    getDefaultRoute,
    refetchUser: refetch,
  }
}