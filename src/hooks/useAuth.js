// src/hooks/useAuth.js - FIXED AUTO REFETCH ISSUE

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

          const orgType = userData?.organization?.type
          if (orgType) {
            localStorage.setItem("organizationType", orgType)
            queryClient.setQueryData([`${orgType}-profile`], userData)
          }

          return userData
        }

        return null
      } catch (e) {
        console.error("Error fetching user data:", e)
        if (e.response?.status === 401) {
          localStorage.removeItem("token")
          localStorage.removeItem("organizationType")
        }
        return null
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    // FIXED: Ubah refetchOnMount jadi false untuk mencegah auto-refetch saat di onboarding
    refetchOnMount: false,
    // FIXED: Perbesar staleTime untuk mencegah refetch yang tidak perlu
    staleTime: 10 * 60 * 1000, // 10 minutes - lebih lama untuk stability
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })

  const login = useMutation({
    mutationFn: async (credentials) => {
      try {
        const loginResponse = await api.auth.login(credentials)

        if (loginResponse?.status !== "success") {
          throw new Error(loginResponse?.message || "Login failed")
        }

        const { accessToken, organizationType } = loginResponse.data

        if (!accessToken) {
          throw new Error("Access token tidak ditemukan dalam respons")
        }

        localStorage.setItem("token", accessToken)
        localStorage.setItem("organizationType", organizationType)

        return { accessToken, organizationType }
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

          // FIXED: Correct logic for isOnboarded
          console.log("User isOnboarded status:", userData.isOnboarded)

          if (userData.isOnboarded === false) {
            // User needs onboarding
            console.log("User needs onboarding, redirecting to onboarding...")
            navigate("/onboarding")
          } else {
            // User completed onboarding, redirect to dashboard
            console.log("User completed onboarding, redirecting to dashboard...")
            const orgType = userData.organization?.type

            if (orgType === "school") {
              navigate("/organization/school/dashboard")
            } else if (orgType === "company") {
              navigate("/organization/company/dashboard")
            } else {
              navigate("/")
            }
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
    },
  })

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
      queryClient.clear()
      navigate("/login")
    },
  })

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

  const needsOnboarding = () => {
    return user?.isOnboarded === false
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
    needsOnboarding,
    refetchUser: refetch,
  }
}