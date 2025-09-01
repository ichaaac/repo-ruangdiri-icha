// src/hooks/useAuth.js - UPDATED WITH E2E SUPPORT

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useLocation } from "react-router-dom"
import api, { getMe } from "../lib/api"
import e2eEncryption from '../components/shared/chats/lib/encryption'
import { chatsApi } from '../components/shared/chats/lib/chatsApi'

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

          // Store timezone from user profile
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
          localStorage.removeItem("userTimezone")
          // 🔐 E2E: Clear E2E keys on auth error
          localStorage.removeItem("e2e_private_key")
          e2eEncryption.clearAllSessionKeys()
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

  // 🔐 E2E: Setup E2E keys during login
  const setupE2EKeys = async (userPassword) => {
    try {
      console.log('🔐 Setting up E2E keys during login...')

      // Check if user already has E2E keys
      if (e2eEncryption.hasAccountKeyPair()) {
        console.log('✅ E2E keys already exist, retrieving...')
        
        try {
          const privateKey = e2eEncryption.retrievePrivateKey(userPassword)
          console.log('✅ E2E private key retrieved successfully')
          return true
        } catch (error) {
          console.error('❌ Failed to retrieve existing E2E key:', error)
          // If password fails, might be corrupted - generate new keys
        }
      }

      // Generate new E2E keypair
      console.log('🔑 Generating new E2E keypair...')
      const keyPair = await chatsApi.generateAccountKeyPair()
      
      // Store encrypted private key locally
      e2eEncryption.storePrivateKey(keyPair.privateKey, userPassword)
      
      // Register public key with backend
      const encryptedPrivateKeyData = JSON.stringify({
        encrypted: keyPair.privateKey,
        keyVersion: keyPair.keyVersion,
        algorithm: 'AES-256-CBC'
      })
      
      await chatsApi.registerAccountKey(
        keyPair.publicKey, 
        encryptedPrivateKeyData, 
        keyPair.keyVersion
      )
      
      console.log('✅ E2E keypair setup completed successfully')
      return true
    } catch (error) {
      console.error('❌ E2E key setup failed:', error)
      throw new Error('Failed to setup E2E encryption: ' + error.message)
    }
  }

  const login = useMutation({
    mutationFn: async (credentials) => {
      try {
        // Include timezone in login request
        const loginPayload = {
          email: credentials.email,
          password: credentials.password,
          timezone: credentials.timezone
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

        // Store timezone from login request
        if (credentials.timezone) {
          localStorage.setItem("userTimezone", credentials.timezone)
        }

        // 🔐 E2E: Setup E2E keys after successful login
        try {
          await setupE2EKeys(credentials.password)
          console.log('✅ E2E keys setup completed during login')
        } catch (e2eError) {
          console.error('❌ E2E setup failed during login:', e2eError)
          // Don't fail login due to E2E setup failure, but warn user
          console.warn('⚠️ E2E encryption setup failed - chat will work but may not be encrypted')
        }

        return { 
          accessToken, 
          organizationType, 
          userRole, 
          timezone: credentials.timezone,
          e2eSetup: true
        }
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

          // Store timezone from user profile (server response takes priority)
          if (userData?.timezone) {
            localStorage.setItem("userTimezone", userData.timezone)
            console.log("Timezone stored from server:", userData.timezone)
          }

          console.log("User data with E2E support:", userData)

          // Redirect logic with loop prevention
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
      localStorage.removeItem("userTimezone")
      // 🔐 E2E: Clear E2E keys on login error
      localStorage.removeItem("e2e_private_key")
      e2eEncryption.clearAllSessionKeys()
    },
  })

  // Smart redirect logic with loop prevention
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

  // Get dashboard path based on user role/org
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
        
        // 🔐 E2E: Update E2E keys with new password
        if (response.status === 'success' && e2eEncryption.hasAccountKeyPair()) {
          try {
            console.log('🔐 Updating E2E keys with new password...')
            
            // Retrieve current private key with old password
            const privateKey = e2eEncryption.retrievePrivateKey(oldPassword)
            
            // Re-encrypt with new password
            e2eEncryption.storePrivateKey(privateKey, newPassword)
            
            console.log('✅ E2E keys updated with new password')
          } catch (e2eError) {
            console.error('❌ Failed to update E2E keys with new password:', e2eError)
            // Don't fail password change due to E2E update failure
          }
        }
        
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
      localStorage.removeItem("userTimezone")
      // 🔐 E2E: Clear all E2E data on logout
      localStorage.removeItem("e2e_private_key")
      e2eEncryption.clearAllSessionKeys()
      queryClient.clear()
      navigate("/login")
      console.log('🔐 All E2E data cleared on logout')
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

  // Timezone helper functions
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

  // 🔐 E2E: Helper functions
  const hasE2EKeys = () => {
    return e2eEncryption.hasAccountKeyPair()
  }

  const getE2EStatus = () => {
    return e2eEncryption.getStatus()
  }

  const rotateE2EKeys = async (currentPassword) => {
    try {
      console.log('🔄 Rotating E2E keys...')
      
      // Generate new keypair
      const newKeyPair = await chatsApi.generateAccountKeyPair()
      
      // Store new encrypted private key locally
      e2eEncryption.storePrivateKey(newKeyPair.privateKey, currentPassword)
      
      // Register new keys with backend
      const encryptedPrivateKeyData = JSON.stringify({
        encrypted: newKeyPair.privateKey,
        keyVersion: newKeyPair.keyVersion + 1,
        algorithm: 'AES-256-CBC'
      })
      
      await chatsApi.rotateAccountKeys(
        newKeyPair.publicKey, 
        encryptedPrivateKeyData, 
        newKeyPair.keyVersion + 1
      )
      
      console.log('✅ E2E keys rotated successfully')
      return true
    } catch (error) {
      console.error('❌ E2E key rotation failed:', error)
      throw error
    }
  }

  const clearE2EData = () => {
    console.log('🧹 Clearing all E2E data...')
    localStorage.removeItem("e2e_private_key")
    e2eEncryption.clearAllSessionKeys()
    console.log('✅ All E2E data cleared')
  }

  // More precise onboarding check
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
    getUserTimezone,
    getTimezoneLabel,
    formatTimeWithTimezone,
    needsOnboarding,
    isOrganizationAdmin,
    isRegularUser,
    getUserTypeLabel,
    getDefaultRoute,
    refetchUser: refetch,
    // 🔐 E2E: Export E2E functions
    hasE2EKeys,
    getE2EStatus,
    rotateE2EKeys,
    clearE2EData,
    setupE2EKeys
  }
}