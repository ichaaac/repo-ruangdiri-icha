// src/hooks/useAuth.js - UPDATED WITH TIMEZONE SUPPORT

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

          // ✅ NEW: Store timezone from user profile
          if (userData?.timezone) {
            localStorage.setItem("userTimezone", userData.timezone)
          }

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
          localStorage.removeItem("userTimezone") // ✅ NEW: Clear timezone on auth error
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
        // ✅ UPDATED: Include timezone in login request
        const loginPayload = {
          email: credentials.email,
          password: credentials.password,
          timezone: credentials.timezone // ✅ NEW: Send timezone to server
        }

        console.log("Login payload:", loginPayload)

        const loginResponse = await api.auth.login(loginPayload)

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

        // ✅ NEW: Store timezone from login request
        if (credentials.timezone) {
          localStorage.setItem("userTimezone", credentials.timezone)
        }

        return { accessToken, organizationType, userRole, timezone: credentials.timezone }
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

          // ✅ UPDATED: Store timezone from user profile (server response takes priority)
          if (userData?.timezone) {
            localStorage.setItem("userTimezone", userData.timezone)
            console.log("Timezone stored from server:", userData.timezone)
          }

          console.log("User data:", userData)

          // ✅ FIXED: Better redirect logic with loop prevention
          redirectAfterLogin(userData, location.pathname)
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
      localStorage.removeItem("userTimezone") // ✅ NEW: Clear timezone on login error
    },
  })

  // ✅ IMPROVED: Smart redirect logic with loop prevention
  const redirectAfterLogin = (userData, currentPath) => {
    // Prevent redirect if already on correct page
    if (currentPath.includes('/onboarding') && userData.isOnboarded === false) {
      console.log("Already on onboarding page, no redirect needed")
      return
    }

    if (userData.isOnboarded === false) {
      console.log("User needs onboarding, redirecting...")
      navigate("/onboarding", { replace: true })
    } else {
      console.log("User completed onboarding, redirecting to dashboard...")
      const dashboardPath = getDashboardPath(userData)
      navigate(dashboardPath, { replace: true })
    }
  }

  // ✅ HELPER: Get dashboard path based on user role/org
  const getDashboardPath = (userData) => {
    const userRole = userData.role
    const orgType = userData.organization?.type

    if (userRole === "student") return "/user/student/screening"
    if (userRole === "employee") return "/user/employee/screening"
    if (userRole === "psychologist") return "/user/psychologist/chat"
    if (orgType === "school") return "/organization/school/dashboard"
    if (orgType === "company") return "/organization/company/dashboard"
    return "/"
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
      localStorage.removeItem("userTimezone") // ✅ NEW: Clear timezone on logout
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

  // ✅ NEW: Timezone helper functions
  const getUserTimezone = () => {
    const userTimezone = user?.timezone
    const storedTimezone = localStorage.getItem("userTimezone")
    return userTimezone || storedTimezone || null
  }

  const getTimezoneLabel = () => {
    const timezone = getUserTimezone()
    switch (timezone) {
      case 'WIB':
        return 'Waktu Indonesia Barat (UTC+7)'
      case 'WITA':
        return 'Waktu Indonesia Tengah (UTC+8)'
      case 'WIT':
        return 'Waktu Indonesia Timur (UTC+9)'
      default:
        return timezone || 'Unknown Timezone'
    }
  }

  const formatTimeWithTimezone = (date, format = 'datetime') => {
    if (!date) return null
    
    const timezone = getUserTimezone()
    const dateObj = new Date(date)
    
    if (format === 'time') {
      return `${dateObj.toLocaleTimeString('id-ID')} ${timezone || ''}`
    } else if (format === 'date') {
      return `${dateObj.toLocaleDateString('id-ID')} ${timezone || ''}`
    } else {
      return `${dateObj.toLocaleString('id-ID')} ${timezone || ''}`
    }
  }

  // ✅ IMPROVED: More precise onboarding check
  const needsOnboarding = () => {
    // Only check if user data is loaded
    if (!user) return false
    return user.isOnboarded === false
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
    if (!user) return "/"
    return getDashboardPath(user)
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
    getUserTimezone, // ✅ NEW: Export timezone functions
    getTimezoneLabel, // ✅ NEW: Get timezone label
    formatTimeWithTimezone, // ✅ NEW: Format time with timezone
    needsOnboarding,
    isOrganizationAdmin,
    isRegularUser,
    getUserTypeLabel,
    getDefaultRoute,
    refetchUser: refetch,
  }
}