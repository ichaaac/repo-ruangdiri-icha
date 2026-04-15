// src/hooks/useAuth.js - FIXED E2E SETUP

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useLocation } from "react-router-dom"
import Pushy from 'pushy-sdk-web'
import api, { getMe } from "../lib/api"
import { chatsApi } from '../components/shared/chats/lib/chatsApi'

const teardownPushy = async (userId) => {
  try {
    await Pushy.unsubscribe(`user-${userId}`)
  } catch {
    // silence — non-critical
  }
}

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
    const token = localStorage.getItem("token");
    
    // ✅ Check if token exists
    if (!token) {
      console.log("❌ No token found");
      return null;
    }

    console.log("🔑 Token exists, fetching user...");

    try {
      const response = await getMe();
      
      console.log("📥 getMe response:", response);
      
      if (response?.status === "success") {
        const userData = response.data;

        // Store timezone from user profile
        if (userData?.timezone) {
          localStorage.setItem("userTimezone", userData.timezone);
        }

        // Store organization type if exists
        const orgType = userData?.organization?.type;
        if (orgType) {
          localStorage.setItem("organizationType", orgType);
          queryClient.setQueryData([`${orgType}-profile`], userData);
        }

        // Store user role if exists
        const userRole = userData?.role;
        if (userRole) {
          localStorage.setItem("userRole", userRole);
        }

        // Store admin scope for branch/region admins
        const adminLevel = userData?.adminLevel
        if (adminLevel === "cabang" && userData?.branch?.id) {
          localStorage.setItem("adminScope", JSON.stringify({
            branchId: userData.branch.id,
            label: userData.branch.name
          }))
        } else if (adminLevel === "wilayah" && userData?.region?.id) {
          localStorage.setItem("adminScope", JSON.stringify({
            regionId: userData.region.id,
            label: userData.region.name
          }))
        } else {
          localStorage.removeItem("adminScope")
        }

        console.log("✅ User data fetched:", {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          isOnboarded: userData.isOnboarded
        });

        return userData;
      }
      
      console.error("❌ getMe returned non-success status");
      return null;
      
    } catch (e) {
      console.error("❌ Error fetching user data:", e);
      console.error("❌ Error status:", e.response?.status);
      console.error("❌ Error data:", e.response?.data);
      
      // ✅ Handle 401 Unauthorized
      if (e.response?.status === 401) {
        console.error("❌ Token invalid or expired!");
        localStorage.removeItem("token");
        localStorage.removeItem("organizationType");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userTimezone");
        localStorage.removeItem("e2e_account_keys");
        localStorage.removeItem("e2e_private_key");
      }
      return null;
    }
  },
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnMount: 'always',  // ✅ Always refetch on mount
  cacheTime: 0,  // ✅ Don't cache
  staleTime: 0,  // ✅ Always stale
});

  // 🔐 FIXED: Setup E2E keys during login (check server status first)
  const setupE2EKeys = async (userPassword) => {
    try {
      console.log('🔑 Checking E2E setup status...')

      // Get fresh user data to check E2E status
      const userResponse = await getMe()
      const userData = userResponse?.data
      const e2eStatus = userData?.e2eEncryption

      console.log('📊 E2E Status from server:', e2eStatus)

      // Check if user already has E2E keys registered on server
      if (e2eStatus?.hasE2EKeys === true && e2eStatus?.publicKeyRegistered === true) {
        console.log('✅ E2E keys already registered on server, skipping setup')
        
        // Store basic info locally for reference
        const keyData = {
          hasKeys: true,
          registered: true,
          lastUsedAt: e2eStatus.lastUsedAt,
          keyCount: e2eStatus.keyCount,
          serverConfirmed: true
        }
        localStorage.setItem('e2e_status', JSON.stringify(keyData))
        
        return true
      }

      // Only generate and register if server says we don't have keys
      if (e2eStatus?.hasE2EKeys === false || e2eStatus?.publicKeyRegistered === false) {
        console.log('🔑 Server confirms no E2E keys, starting setup...')

        // STEP 1: Generate new E2E keypair from backend
        console.log('🔑 Generating new E2E keypair from backend...')
        const keyPair = await chatsApi.generateAccountKeyPair()
        
        if (!keyPair.publicKey || !keyPair.privateKey) {
          throw new Error('Invalid keypair received from backend')
        }

        console.log('✅ Keypair generated:', {
          publicKeyLength: keyPair.publicKey?.length,
          privateKeyLength: keyPair.privateKey?.length,
          keyVersion: keyPair.keyVersion
        })

        // STEP 2: Store keypair locally
        const keyData = {
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
          keyVersion: keyPair.keyVersion,
          createdAt: new Date().toISOString(),
          registered: false
        }

        localStorage.setItem('e2e_account_keys', JSON.stringify(keyData))
        console.log('💾 E2E keys stored locally')

        // STEP 3: Register public key with backend
        console.log('📝 Registering public key with backend...')
        await chatsApi.registerAccountKey(
          keyPair.publicKey, 
          keyPair.privateKey,  // Backend will handle encryption
          keyPair.keyVersion
        )

        // Update local status
        keyData.registered = true
        localStorage.setItem('e2e_account_keys', JSON.stringify(keyData))

        console.log('✅ E2E keypair setup completed successfully')
        return true
      }

      console.log('ℹ️ E2E status unclear from server, skipping setup')
      return true

    } catch (error) {
      console.error('❌ E2E key setup failed:', error)
      
      // Handle specific errors
      if (error.message?.includes('User already has account key registered')) {
        console.log('ℹ️ Keys already registered (detected from error), marking as complete')
        const keyData = {
          hasKeys: true,
          registered: true,
          serverConfirmed: true,
          detectedFromError: true
        }
        localStorage.setItem('e2e_status', JSON.stringify(keyData))
        return true
      }
      
      // Don't fail login due to E2E setup failure
      console.warn('⚠️ E2E encryption setup failed - chat will work but may not be encrypted')
      return false
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

        // 🔐 FIXED: Setup E2E keys after successful login
        let e2eSetupSuccess = false
        try {
          e2eSetupSuccess = await setupE2EKeys(credentials.password)
          console.log('✅ E2E keys setup completed during login')
        } catch (e2eError) {
          console.error('❌ E2E setup failed during login:', e2eError)
          // Don't fail login due to E2E setup failure
          console.warn('⚠️ E2E encryption setup failed - chat will work but may not be encrypted')
        }

        return { 
          accessToken, 
          organizationType, 
          userRole, 
          timezone: credentials.timezone,
          e2eSetup: e2eSetupSuccess
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
      // localStorage.removeItem("e2e_account_keys")
      // localStorage.removeItem("e2e_private_key")
    },
  })

  // Smart redirect logic with loop prevention
  const redirectAfterLogin = (userData, currentPath) => {
  console.log('='.repeat(80));
  console.log('🎯 [redirectAfterLogin] Starting redirect logic');
  console.log('👤 User data:', {
    id: userData?.id,
    email: userData?.email,
    role: userData?.role,
    isOnboarded: userData?.isOnboarded
  });
  console.log('📍 Current path:', currentPath);
  
  // ✅ Guard clause
  if (!userData) {
    console.log('❌ No user data');
    console.log('='.repeat(80));
    return;
  }
  
  // ✅ Prevent rapid redirects (loop protection)
  const REDIRECT_KEY = 'last_redirect_attempt';
  const lastRedirect = sessionStorage.getItem(REDIRECT_KEY);
  const now = Date.now();
  
  if (lastRedirect && (now - parseInt(lastRedirect)) < 1000) {
    console.warn('⚠️ Redirect attempted too soon, preventing loop');
    console.log('='.repeat(80));
    return;
  }
  
  sessionStorage.setItem(REDIRECT_KEY, now.toString());
  
  // ✅ Check onboarding status
  if (userData.isOnboarded === false) {
    if (currentPath === '/onboarding') {
      console.log('✅ Already on onboarding');
      console.log('='.repeat(80));
      return;
    }
    
    console.log('🔄 Redirecting to onboarding');
    console.log('='.repeat(80));
    navigate('/onboarding', { replace: true });
    return;
  }
  
  // ✅ User is onboarded
  if (userData.isOnboarded === true) {
    console.log('✅ User onboarded');
    
    const dashboardPath = getDashboardPath(userData);
    console.log('🎯 Dashboard path:', dashboardPath);
    console.log('📍 Current path:', currentPath);
    
    // ✅ Already on target dashboard? Stay there
    if (currentPath === dashboardPath) {
      console.log('✅ Already on dashboard, staying');
      console.log('='.repeat(80));
      return;
    }
    
    // ✅ Coming from login or onboarding? Redirect to dashboard
    if (currentPath === '/login' || currentPath === '/onboarding') {
      console.log('🎯 Redirecting from', currentPath, 'to', dashboardPath);
      console.log('='.repeat(80));
      navigate(dashboardPath, { replace: true });
      return;
    }
    
    // ✅ On some other page? Let them stay
    console.log('ℹ️ User on different page, allowing navigation');
    console.log('='.repeat(80));
  }
};
  // Get dashboard path based on user role/org
  // Get dashboard path based on user role/org
const getDashboardPath = (userData) => {
  const userRole = userData?.role
  const orgType = userData?.organization?.type

  console.log('🎯 [getDashboardPath] Determining redirect for:', { userRole, orgType });

  // Handle all user roles
  switch (userRole) {
    case 'student':
      console.log('✅ Student → /user/student/screening');
      return '/user/student/screening';

    case 'employee':
      console.log('✅ Employee → /user/employee/screening');
      return '/user/employee/screening';

    case 'psychologist':
      console.log('✅ Psychologist → /user/psychologist/schedule');
      return '/user/psychologist/schedule';

    case 'client':
      console.log('✅ Client → /user/client/dashboard');
      return '/user/client/dashboard';

    default:
      // Check organization type for admin users
      if (orgType === 'school') {
        console.log('✅ School Admin → /organization/school/dashboard');
        return '/organization/school/dashboard';
      }
      if (orgType === 'company') {
        console.log('✅ Company Admin → /organization/company/dashboard');
        return '/organization/company/dashboard';
      }
      
      // Fallback
      console.warn('⚠️ Unknown user type, redirecting to /dashboard');
      return '/dashboard';
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
        
        // 🔐 FIXED: Update E2E keys with new password
        if (response.status === 'success') {
          try {
            console.log('🔑 Updating E2E keys with new password...')
            
            const existingKeys = localStorage.getItem('e2e_account_keys')
            if (existingKeys) {
              const keyData = JSON.parse(existingKeys)
              
              // Re-register keys with new password
              await chatsApi.registerAccountKey(
                keyData.publicKey,
                keyData.privateKey,  // Backend will re-encrypt with new credentials
                keyData.keyVersion
              )
              
              console.log('✅ E2E keys updated with new password')
            }
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
      localStorage.removeItem("e2e_account_keys")
      localStorage.removeItem("e2e_private_key")
      localStorage.removeItem("adminScope")
      const userId = queryClient.getQueryData(["currentUser"])?.id
      if (userId) teardownPushy(userId)

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

  // 🔐 FIXED: E2E Helper functions
  const hasE2EKeys = () => {
    // Check localStorage first
    const keys = localStorage.getItem('e2e_account_keys')
    const status = localStorage.getItem('e2e_status')
    
    if (keys) {
      try {
        const keyData = JSON.parse(keys)
        return !!(keyData.publicKey && keyData.privateKey)
      } catch {
        return false
      }
    }
    
    if (status) {
      try {
        const statusData = JSON.parse(status)
        return statusData.hasKeys === true
      } catch {
        return false
      }
    }
    
    // Check from user data if available
    return user?.e2eEncryption?.hasE2EKeys === true
  }

  const getE2EStatus = () => {
    const hasKeys = hasE2EKeys()
    const keyData = hasKeys ? JSON.parse(localStorage.getItem('e2e_account_keys') || '{}') : null
    const statusData = localStorage.getItem('e2e_status') ? JSON.parse(localStorage.getItem('e2e_status')) : null
    
    return {
      isEnabled: hasKeys,
      hasAccountKeys: hasKeys,
      keyVersion: keyData?.keyVersion || statusData?.keyVersion || 0,
      createdAt: keyData?.createdAt || statusData?.createdAt || null,
      lastUsedAt: statusData?.lastUsedAt || user?.e2eEncryption?.lastUsedAt || null,
      serverStatus: user?.e2eEncryption || null,
      algorithm: 'ECDH-ES'
    }
  }

  const getE2EKeys = () => {
    try {
      // First try to get from localStorage
      const keys = localStorage.getItem('e2e_account_keys')
      if (keys) {
        const keyData = JSON.parse(keys)
        if (keyData.publicKey && keyData.privateKey) {
          return keyData
        }
      }
      
      // If no local keys but server says we have keys, try to use server info
      const serverE2E = user?.e2eEncryption
      if (serverE2E?.hasE2EKeys === true && serverE2E?.publicKeyRegistered === true) {
        console.warn('⚠️ Server has E2E keys but local keys missing')
        
        // Return a placeholder that indicates we need to get the key from server
        // This is a temporary solution - ideally we'd fetch the public key from server
        return {
          hasServerKeys: true,
          publicKey: null, // Will need to fetch from participants API
          privateKey: null,
          keyVersion: serverE2E.keyCount || 1,
          serverStatus: serverE2E
        }
      }
      
      return null
    } catch {
      return null
    }
  }

  const rotateE2EKeys = async (currentPassword, reason = 'manual_rotation') => {
    try {
      console.log('🔄 Rotating E2E keys...', { reason })
      
      // Check if we have existing keys to rotate from
      const existingKeys = getE2EKeys()
      if (!existingKeys && user?.e2eEncryption?.hasE2EKeys === false) {
        console.log('ℹ️ No existing keys found, performing initial setup instead')
        return await setupE2EKeys(currentPassword)
      }
      
      // Generate new keypair
      const newKeyPair = await chatsApi.generateAccountKeyPair()
      
      // Use rotation endpoint
      const currentKeyVersion = existingKeys?.keyVersion || user?.e2eEncryption?.keyCount || 1
      await chatsApi.rotateAccountKeys(
        newKeyPair.publicKey,
        newKeyPair.privateKey,
        currentKeyVersion + 1
      )
      
      // Update local storage
      const newKeyData = {
        publicKey: newKeyPair.publicKey,
        privateKey: newKeyPair.privateKey,
        keyVersion: currentKeyVersion + 1,
        createdAt: new Date().toISOString(),
        rotatedAt: new Date().toISOString(),
        rotationReason: reason,
        registered: true
      }
      
      localStorage.setItem('e2e_account_keys', JSON.stringify(newKeyData))
      
      // Clear old status
      localStorage.removeItem('e2e_status')
      
      console.log('✅ E2E keys rotated successfully')
      return true
    } catch (error) {
      console.error('❌ E2E key rotation failed:', error)
      throw error
    }
  }

  const clearE2EData = () => {
    console.log('🧹 Clearing all E2E data...')
    localStorage.removeItem("e2e_account_keys")
    localStorage.removeItem("e2e_private_key")
    localStorage.removeItem("e2e_status")
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
    return userRole && ["student", "employee", "psychologist", "client"].includes(userRole)
  }

  // ===================================================
  // ADMIN HIERARCHY (Pusat > Wilayah > Cabang)
  // ===================================================

  const getAdminLevel = () => {
    return user?.adminLevel || "pusat"
  }

  const getAdminBranch = () => {
    return user?.branch || null
  }

  const getAdminRegion = () => {
    return user?.region || null
  }

  const getAdminScopeParams = () => {
    const level = getAdminLevel()
    if (level === "cabang" && user?.branch?.id) return { branchId: user.branch.id }
    if (level === "wilayah" && user?.region?.id) return { regionId: user.region.id }
    return {}
  }

  const getAdminScopeName = () => {
    const level = getAdminLevel()
    if (level === "cabang") return getAdminBranch()?.name || null
    if (level === "wilayah") return getAdminRegion()?.name || null
    return null
  }

  const getUserTypeLabel = () => {
    const userRole = getUserRole()
    const orgType = getOrganizationType()
    const adminLevel = getAdminLevel()

    if (userRole === "student") return "Siswa"
    if (userRole === "employee") return "Pegawai"
    if (userRole === "psychologist") return "Psikolog"
    if (userRole === "client") return "Klien"
    if (orgType === "school") {
      if (adminLevel === "cabang") return "Admin Cabang Sekolah"
      if (adminLevel === "wilayah") return "Admin Wilayah Sekolah"
      return "Admin Sekolah"
    }
    if (orgType === "company") {
      if (adminLevel === "cabang") return "Admin Cabang"
      if (adminLevel === "wilayah") return "Admin Wilayah"
      return "Admin Pusat"
    }
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
    getAdminLevel,
    getAdminBranch,
    getAdminRegion,
    getAdminScopeParams,
    getAdminScopeName,
    getDefaultRoute: () => {
      if (!user) return '/';
      return getDashboardPath(user);
    },
    refetchUser: refetch,
    // 🔐 FIXED: Export E2E functions
    hasE2EKeys,
    getE2EStatus,
    getE2EKeys,
    rotateE2EKeys,
    clearE2EData,
    setupE2EKeys
  }
}