// src/components/shared/onboarding/OnboardingForm.jsx
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { apiClient } from "@/lib/api" // Import direct axios client
import clsx from "clsx"

// Components & utilities
import TextareaAutosize from "react-textarea-autosize"
import { PhoneInput } from "react-international-phone"
import "react-international-phone/style.css"
import { validatePhoneNumber, isEmptyPhone, extractDigits } from "@/lib/phoneUtils"
import { toast } from "sonner"

// --- KOMPONEN UPLOAD PROFILE PICTURE KHUSUS ONBOARDING ---
const OnboardingProfilePictureUpload = ({ currentProfilePicture, organizationType = "school", onFileSelect }) => {
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(currentProfilePicture)
  const [isHovering, setIsHovering] = useState(false)
  const [imageError, setImageError] = useState(false)

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  const maxSize = 2 * 1024 * 1024 // 2MB

  useEffect(() => {
    setPreviewImage(currentProfilePicture)
    setImageError(false)
  }, [currentProfilePicture])

  const toastStyle = {
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "0.75rem",
    textAlign: "center",
    padding: "6px 12px",
    borderRadius: "6px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    maxWidth: "200px",
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) {
      console.log("No file selected - user canceled file picker")
      return
    }

    console.log("File selected for onboarding:", file.name)
    e.target.value = ""

    if (!allowedTypes.includes(file.type)) {
      toast.error("Gunakan format JPG, PNG, GIF, atau WebP.", { style: toastStyle, closeButton: false })
      return
    }
    if (file.size > maxSize) {
      toast.error("Ukuran file terlalu besar. Maksimal 2MB.", { style: toastStyle, closeButton: false })
      return
    }

    // Set preview dan notify parent component
    const previewUrl = URL.createObjectURL(file)
    setPreviewImage(previewUrl)
    setImageError(false)
    
    // Notify parent component about file selection
    onFileSelect(file, previewUrl)
  }

  const handleButtonClick = () => {
    console.log("Onboarding profile picture button clicked - opening file picker")
    fileInputRef.current.click()
  }

  const getFallbackIcon = () => {
    return organizationType === "company" ? "business" : "person"
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className="relative z-10">
      <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {previewImage && !imageError ? (
            <img
              src={previewImage || "/placeholder.svg"}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <span className="material-icons text-gray-400" style={{ fontSize: "2.5rem" }}>
              {getFallbackIcon()}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleButtonClick}
          className={clsx(
            "absolute right-0 bottom-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center",
            "transition-all duration-200",
            isHovering ? "opacity-100 scale-110" : "opacity-75"
          )}
          aria-label="Upload profile picture"
        >
          <span className="material-icons text-white text-xs sm:text-sm">photo_camera</span>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/gif, image/webp"
          className="hidden"
        />
      </div>
    </div>
  )
}

// Validation schema
const onboardingSchema = z.object({
  address: z.string().max(255, "Alamat maksimal 255 karakter").optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (phone) => {
        if (!phone || isEmptyPhone(phone)) return true
        return validatePhoneNumber(phone) === null
      },
      { message: "Format nomor telepon tidak valid" },
    ),
})

const OnboardingForm = () => {
  const { user, getUserRole, getOrganizationType } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [phoneValidationError, setPhoneValidationError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)

  // Determine user type for API routing
  const userRole = getUserRole()
  const orgType = getOrganizationType()
  const isUser = ['student', 'employee', 'psychologist'].includes(userRole)
  const isOrganization = ['school', 'company'].includes(orgType)

  console.log("OnboardingForm - User Type:", { userRole, orgType, isUser, isOrganization })

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: {
      address: user?.address || "",
      phone: user?.phone || "",
    },
  })

  // Pre-fill form with existing user data
  useEffect(() => {
    if (user) {
      console.log("Pre-filling onboarding form with user data:", {
        address: user.address,
        phone: user.phone,
        fullName: user.fullName
      })
      
      // Pre-fill address jika ada
      if (user.address) {
        setValue("address", user.address)
      }
      // Pre-fill phone jika ada  
      if (user.phone) {
        setValue("phone", user.phone)
      }
    }
  }, [user, setValue])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview)
      }
    }
  }, [profilePicturePreview])

  const handleProfilePictureSelect = (file, previewUrl) => {
    console.log("Profile picture selected for onboarding:", file.name)
    
    // Cleanup previous preview
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview)
    }
    
    setSelectedProfilePicture(file)
    setProfilePicturePreview(previewUrl)
  }

  // FIXED: Complete onboarding with proper error handling
  const completeOnboarding = async (formData = {}) => {
    setIsSubmitting(true)

    try {
      console.log("Starting onboarding completion...")
      console.log("User details:", { 
        userRole, 
        orgType, 
        isUser, 
        isOrganization,
        userOrgData: user?.organization
      })

      // Step 1: Upload profile picture first if selected
      if (selectedProfilePicture) {
        console.log("Uploading profile picture...")
        try {
          const formDataPicture = new FormData()
          formDataPicture.append('profilePicture', selectedProfilePicture)

          // Try organization endpoint first if user has organization data
          if (isOrganization || user?.organization) {
            console.log("Uploading profile picture for ORGANIZATION")
            await apiClient.patch('/organizations/profile', formDataPicture, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
          } else {
            console.log("Uploading profile picture for USER")
            await apiClient.patch('/users/me/profile', formDataPicture, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
          }

          console.log("Profile picture uploaded successfully")
        } catch (error) {
          console.error("Profile picture upload failed:", error)
          // Continue with onboarding even if profile picture fails
          toast.error("Foto profil gagal diupload, tapi onboarding akan dilanjutkan")
        }
      }

      // Step 2: Complete onboarding with address and phone data
      const payload = {
        onboarded: true, // Mark onboarding as completed
      }

      // Only add address and phone if form data is provided (not skipped)
      if (formData && typeof formData === 'object') {
        if (formData.address?.trim()) {
          payload.address = formData.address.trim()
        }
        
        if (formData.phone?.trim() && !isEmptyPhone(formData.phone)) {
          payload.phone = formData.phone.trim()
        }
      }

      console.log("Sending onboarding payload:", payload)

      // Try organization endpoint first if user has organization data
      let response
      let endpointUsed = ""

      try {
        if (isOrganization || user?.organization) {
          // For organizations: PATCH /organizations/profile
          console.log("Completing onboarding for ORGANIZATION")
          endpointUsed = "/organizations/profile"
          response = await apiClient.patch('/organizations/profile', payload)
        } else {
          // For users: PATCH /users/me/profile
          console.log("Completing onboarding for USER")
          endpointUsed = "/users/me/profile"
          response = await apiClient.patch('/users/me/profile', payload)
        }
      } catch (primaryError) {
        console.error(`Primary endpoint ${endpointUsed} failed:`, primaryError)
        
        // If primary endpoint fails with 403 "User does not belong to any organization"
        // Try alternative approach
        if (primaryError.response?.status === 403 && 
            primaryError.response?.data?.message?.includes("organization")) {
          
          console.log("Trying alternative endpoint due to organization error...")
          
          try {
            if (endpointUsed === "/users/me/profile") {
              // Try organization endpoint as fallback
              console.log("Fallback: Trying organization endpoint")
              response = await apiClient.patch('/organizations/profile', payload)
            } else {
              // Try user endpoint as fallback
              console.log("Fallback: Trying user endpoint")
              response = await apiClient.patch('/users/me/profile', payload)
            }
          } catch (fallbackError) {
            console.error("Fallback endpoint also failed:", fallbackError)
            
            // If both endpoints fail, mark onboarding as completed locally and redirect
            console.log("Both endpoints failed, auto-completing onboarding...")
            toast.warning("Onboarding berhasil dilewati karena masalah server")
            
            // Clear cache and redirect anyway
            queryClient.clear()
            await queryClient.invalidateQueries({ queryKey: ["currentUser"] })

            setTimeout(() => {
              let redirectPath = "/"

              if (userRole === 'student') {
                redirectPath = "/user/student/booking"
              } else if (userRole === 'employee') {
                redirectPath = "/user/employee/booking"
              } else if (userRole === 'psychologist') {
                redirectPath = "/user/psychologist/chat"
              } else if (orgType === "school") {
                redirectPath = "/organization/school/dashboard"
              } else if (orgType === "company") {
                redirectPath = "/organization/company/dashboard"
              }
              
              console.log(`Auto-completing onboarding, redirecting to: ${redirectPath}`)
              navigate(redirectPath, { replace: true })
            }, 1000)
            
            setIsSubmitting(false)
            return
          }
        } else {
          // Re-throw if it's not the organization error
          throw primaryError
        }
      }

      console.log("Onboarding API Response:", response)
      toast.success("Onboarding berhasil diselesaikan!")

      // Clear cache and redirect
      queryClient.clear()
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] })

      // Wait for cache refresh then redirect
      setTimeout(() => {
        let redirectPath = "/"

        if (userRole === 'student') {
          redirectPath = "/user/student/booking"
        } else if (userRole === 'employee') {
          redirectPath = "/user/employee/booking"
        } else if (userRole === 'psychologist') {
          redirectPath = "/user/psychologist/chat"
        } else if (orgType === "school") {
          redirectPath = "/organization/school/dashboard"
        } else if (orgType === "company") {
          redirectPath = "/organization/company/dashboard"
        }
        
        console.log(`Onboarding completed! Redirecting to: ${redirectPath}`)
        navigate(redirectPath, { replace: true })
      }, 1000)

    } catch (error) {
      console.error("Onboarding failed:", error)
      toast.error(`Gagal menyelesaikan onboarding: ${error.response?.data?.message || error.message}`)
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data) => {
    console.log("Form submitted with data:", data)
    setPhoneValidationError("")

    // Validate phone if provided
    if (data.phone && !isEmptyPhone(data.phone)) {
      const phoneError = validatePhoneNumber(data.phone)
      if (phoneError) {
        setPhoneValidationError(phoneError)
        return
      }
    }

    await completeOnboarding(data)
  }

  const handleSkip = async () => {
    console.log("Skipping onboarding form...")
    setIsSubmitting(true)
    
    try {
      // Upload profile picture if selected
      if (selectedProfilePicture) {
        console.log("Uploading profile picture during skip...")
        try {
          const formDataPicture = new FormData()
          formDataPicture.append('profilePicture', selectedProfilePicture)

          // Try organization endpoint first if user has organization data
          if (isOrganization || user?.organization) {
            console.log("Uploading profile picture for ORGANIZATION (skip)")
            await apiClient.patch('/organizations/profile', formDataPicture, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
          } else {
            console.log("Uploading profile picture for USER (skip)")
            await apiClient.patch('/users/me/profile', formDataPicture, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
          }

          console.log("Profile picture uploaded during skip")
        } catch (error) {
          console.error("Profile picture upload failed during skip:", error)
          toast.error("Foto profil gagal diupload")
        }
      }
      
      // Complete onboarding without form data - only send onboarded: true
      const payload = { onboarded: true }
      console.log("Sending skip payload:", payload)
      
      let response
      let endpointUsed = ""

      try {
        if (isOrganization || user?.organization) {
          console.log("Skipping onboarding for ORGANIZATION")
          endpointUsed = "/organizations/profile"
          response = await apiClient.patch('/organizations/profile', payload)
        } else {
          console.log("Skipping onboarding for USER")
          endpointUsed = "/users/me/profile"
          response = await apiClient.patch('/users/me/profile', payload)
        }
      } catch (primaryError) {
        console.error(`Primary skip endpoint ${endpointUsed} failed:`, primaryError)
        
        // If primary endpoint fails with 403 "User does not belong to any organization"
        // Try alternative approach
        if (primaryError.response?.status === 403 && 
            primaryError.response?.data?.message?.includes("organization")) {
          
          console.log("Trying alternative skip endpoint due to organization error...")
          
          try {
            if (endpointUsed === "/users/me/profile") {
              // Try organization endpoint as fallback
              console.log("Fallback: Trying organization endpoint for skip")
              response = await apiClient.patch('/organizations/profile', payload)
            } else {
              // Try user endpoint as fallback
              console.log("Fallback: Trying user endpoint for skip")
              response = await apiClient.patch('/users/me/profile', payload)
            }
          } catch (fallbackError) {
            console.error("Fallback skip endpoint also failed:", fallbackError)
            
            // If both endpoints fail, mark onboarding as completed locally and redirect
            console.log("Both skip endpoints failed, auto-completing onboarding...")
            toast.warning("Onboarding berhasil dilewati karena masalah server")
            
            // Clear cache and redirect anyway
            queryClient.clear()
            await queryClient.invalidateQueries({ queryKey: ["currentUser"] })

            setTimeout(() => {
              let redirectPath = "/"

              if (userRole === 'student') {
                redirectPath = "/user/student/booking"
              } else if (userRole === 'employee') {
                redirectPath = "/user/employee/booking"
              } else if (userRole === 'psychologist') {
                redirectPath = "/user/psychologist/chat"
              } else if (orgType === "school") {
                redirectPath = "/organization/school/dashboard"
              } else if (orgType === "company") {
                redirectPath = "/organization/company/dashboard"
              }
              
              console.log(`Auto-completing skip, redirecting to: ${redirectPath}`)
              navigate(redirectPath, { replace: true })
            }, 1000)
            
            setIsSubmitting(false)
            return
          }
        } else {
          // Re-throw if it's not the organization error
          throw primaryError
        }
      }

      console.log("Skip API Response:", response)
      toast.success("Onboarding dilewati!")

      // Clear cache and redirect
      queryClient.clear()
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] })

      // Wait for cache refresh then redirect
      setTimeout(() => {
        let redirectPath = "/"

        if (userRole === 'student') {
          redirectPath = "/user/student/booking"
        } else if (userRole === 'employee') {
          redirectPath = "/user/employee/booking"
        } else if (userRole === 'psychologist') {
          redirectPath = "/user/psychologist/chat"
        } else if (orgType === "school") {
          redirectPath = "/organization/school/dashboard"
        } else if (orgType === "company") {
          redirectPath = "/organization/company/dashboard"
        }
        
        console.log(`Onboarding skipped! Redirecting to: ${redirectPath}`)
        navigate(redirectPath, { replace: true })
      }, 1000)

    } catch (error) {
      console.error("Skip onboarding failed:", error)
      toast.error(`Gagal melewati onboarding: ${error.response?.data?.message || error.message}`)
      setIsSubmitting(false)
    }
  }

  // Add bypass onboarding function for stuck users
  const bypassOnboarding = async () => {
    console.log("Bypassing onboarding completely...")
    setIsSubmitting(true)
    
    try {
      // Clear cache first
      queryClient.clear()
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] })

      // Force redirect to dashboard
      setTimeout(() => {
        let redirectPath = "/"

        if (userRole === 'student') {
          redirectPath = "/user/student/booking"
        } else if (userRole === 'employee') {
          redirectPath = "/user/employee/booking"
        } else if (userRole === 'psychologist') {
          redirectPath = "/user/psychologist/chat"
        } else if (orgType === "school") {
          redirectPath = "/organization/school/dashboard"
        } else if (orgType === "company") {
          redirectPath = "/organization/company/dashboard"
        }
        
        console.log(`Bypassing onboarding, redirecting to: ${redirectPath}`)
        toast.info("Onboarding dilewati paksa - silakan lengkapi profil nanti")
        navigate(redirectPath, { replace: true })
      }, 500)

    } catch (error) {
      console.error("Bypass failed:", error)
      setIsSubmitting(false)
    }
  }

  // Check if user is already onboarded but stuck in onboarding page
  useEffect(() => {
    if (user && user.isOnboarded === true) {
      console.log("User already onboarded but stuck in onboarding page, redirecting...")
      bypassOnboarding()
    }
  }, [user])

  const handlePhoneChange = (value, field) => {
    if (isEmptyPhone(value)) {
      field.onChange("")
      setPhoneValidationError("")
      return
    }

    const digits = extractDigits(value)
    if (digits.length <= 15) {
      field.onChange(value)
      const error = validatePhoneNumber(value)
      setPhoneValidationError(error || "")
      setTimeout(() => trigger("phone"), 100)
    }
  }

  // Simplified animations
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  }

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Left Section - Hero */}
      <section
        className="hidden md:flex flex-col w-full md:w-1/2 relative justify-center items-center p-8"
        style={{
          background: "linear-gradient(135deg, #91D9E1 0%, #5E6EC3 100%)",
        }}
      >
        <motion.div 
          className="text-center text-white max-w-md"
          {...fadeInUp}
        >
          <h1 className="text-5xl lg:text-6xl font-bold drop-shadow-lg">
            Lengkapi Profilmu
          </h1>
          <p className="mt-8 text-2xl lg:text-3xl font-medium drop-shadow-md">
            {user?.fullName || "User"}
          </p>
        </motion.div>
      </section>

      {/* Right Section - Form */}
      <section className="relative flex flex-1 justify-center items-center w-full md:w-1/2 py-8 md:py-16 px-4 bg-white overflow-auto">
        <motion.form 
          onSubmit={handleSubmit(onSubmit)} 
          className="w-full max-w-[454px] flex flex-col gap-6 md:gap-8"
          {...fadeInUp}
        >
          {/* Mobile Title */}
          <h2 className="text-2xl font-bold text-primary mb-6 text-center w-full md:hidden">
            Lengkapi Profil
          </h2>

          {/* Profile Picture Upload - ONBOARDING VERSION */}
          <div className="flex flex-col items-start">
            <OnboardingProfilePictureUpload
              currentProfilePicture={user?.profilePicture || null}
              organizationType={user?.organization?.type || userRole || "school"}
              onFileSelect={handleProfilePictureSelect}
            />
          </div>

          {/* Address Field */}
          <div>
            <label className="block mb-2 text-sm text-zinc-600">Alamat</label>
            <TextareaAutosize
              {...register("address")}
              minRows={1}
              maxLength={255}
              className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-colors"
              style={{ height: "42px" }}
              placeholder="Masukkan alamat lengkap"
              disabled={isSubmitting}
            />
            {errors.address && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.address.message}
              </span>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block mb-2 text-sm text-zinc-600">Nomor Telepon</label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  defaultCountry="id"
                  value={field.value || ""}
                  onChange={(value) => handlePhoneChange(value, field)}
                  onBlur={field.onBlur}
                  inputClassName={clsx(
                    "w-full h-[42px] border-[1.5px] text-base px-4 transition-colors",
                    errors.phone || phoneValidationError 
                      ? "border-red-500" 
                      : "border-zinc-300",
                  )}
                  disabled={isSubmitting}
                />
              )}
            />
            {(errors.phone || phoneValidationError) && (
              <span className="text-xs text-red-500 mt-1 block">
                {phoneValidationError || errors.phone?.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center font-semibold text-white bg-primary rounded-lg transition-all duration-200 hover:bg-primary-variant1 disabled:bg-gray-400 disabled:cursor-not-allowed"
              style={{ width: "114px", height: "32px" }}
            >
              {isSubmitting ? (
                <span className="material-icons animate-spin text-sm">sync</span>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </motion.form>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="absolute bottom-8 right-8 text-sm text-zinc-500 hover:text-primary md:bottom-12 md:right-12 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="material-icons animate-spin text-xs">sync</span>
              Memproses...
            </span>
          ) : (
            "Lewati Langkah Ini"
          )}
        </button>

        {/* Emergency Bypass Button - for stuck users */}
        <button
          type="button"
          onClick={bypassOnboarding}
          disabled={isSubmitting}
          className="absolute bottom-8 left-8 text-xs text-red-500 hover:text-red-700 md:bottom-12 md:left-12 disabled:opacity-50 transition-colors"
          title="Klik jika terjebak di onboarding"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1">
              <span className="material-icons animate-spin text-xs">sync</span>
              Bypassing...
            </span>
          ) : (
            "🚨 Bypass Onboarding"
          )}
        </button>
      </section>
    </div>
  )
}

export default OnboardingForm