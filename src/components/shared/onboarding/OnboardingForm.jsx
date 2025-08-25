// src/components/shared/onboarding/OnboardingForm.jsx - FIXED ENDPOINT LOGIC
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import clsx from "clsx"

// ✅ FIXED: Import the updated onboarding API
import onboardingApi from "./lib/onboardingApi"

// Components & utilities
import TextareaAutosize from "react-textarea-autosize"
import { PhoneInput } from "react-international-phone"
import "react-international-phone/style.css"
import { validatePhoneNumber, isEmptyPhone } from "@/lib/phoneUtils"
import { toast } from "sonner"

// --- SIMPLIFIED PROFILE PICTURE COMPONENT ---
const ProfilePictureUpload = ({ currentProfilePicture, organizationType, onFileSelect }) => {
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(currentProfilePicture)
  const [imageError, setImageError] = useState(false)

  const maxSize = 2 * 1024 * 1024 // 2MB
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]

  useEffect(() => {
    setPreviewImage(currentProfilePicture)
    setImageError(false)
  }, [currentProfilePicture])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    e.target.value = ""

    if (!allowedTypes.includes(file.type)) {
      toast.error("Gunakan format JPG, PNG, GIF, atau WebP.")
      return
    }
    if (file.size > maxSize) {
      toast.error("Ukuran file terlalu besar. Maksimal 2MB.")
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPreviewImage(previewUrl)
    setImageError(false)
    onFileSelect(file, previewUrl)
  }

  const getFallbackIcon = () => {
    return organizationType === "company" ? "business" : "person"
  }

  return (
    <div className="relative">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
        {previewImage && !imageError ? (
          <img
            src={previewImage || "/placeholder.svg"}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="material-icons text-gray-400" style={{ fontSize: "2.5rem" }}>
            {getFallbackIcon()}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="absolute right-0 bottom-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center opacity-75 hover:opacity-100 hover:scale-110 transition-all duration-200"
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
  )
}

// --- VALIDATION SCHEMA ---
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
      { message: "Format nomor telepon tidak valid" }
    ),
})

// --- MAIN COMPONENT ---
const OnboardingForm = () => {
  const { user, getUserRole, getOrganizationType, refetchUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [phoneValidationError, setPhoneValidationError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)

  // Determine if user is organization or regular user
  const userRole = getUserRole()
  const orgType = getOrganizationType()
  // const isOrganization = ['school', 'company'].includes(orgType) || user?.organization // ✅ REMOVED: No longer needed for API calls

  const {
    register,
    handleSubmit,
    control,
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
      if (user.address) setValue("address", user.address)
      if (user.phone) setValue("phone", user.phone)
    }
  }, [user, setValue])

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePicturePreview)
      }
    }
  }, [profilePicturePreview])

  const handleProfilePictureSelect = (file, previewUrl) => {
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview)
    }
    setSelectedProfilePicture(file)
    setProfilePicturePreview(previewUrl)
  }

  const redirectToDashboard = () => {
    let redirectPath = "/"
    
    if (userRole === 'student') {
      redirectPath = "/user/student/screening"
    } else if (userRole === 'employee') {
      redirectPath = "/user/employee/screening"
    } else if (userRole === 'psychologist') {
      redirectPath = "/user/psychologist/chat"
    } else if (orgType === "school") {
      redirectPath = "/organization/school/dashboard"
    } else if (orgType === "company") {
      redirectPath = "/organization/company/dashboard"
    }
    
    console.log(`Redirecting to: ${redirectPath}`)
    
    navigate(redirectPath, { replace: true })
    
    setTimeout(() => {
      window.location.href = redirectPath
    }, 500)
  }

  // ✅ FIXED: Simplified onboarding logic using unified API
  const completeOnboarding = async (formData = {}) => {
    setIsSubmitting(true)

    try {
      // Step 1: Upload profile picture if selected
      if (selectedProfilePicture) {
        try {
          await onboardingApi.uploadProfilePicture(selectedProfilePicture) // ✅ FIXED: Use unified upload function
          console.log("Profile picture uploaded successfully")
        } catch (error) {
          console.error("Profile picture upload failed:", error)
          toast.error("Foto profil gagal diupload")
        }
      }

      // Step 2: Complete onboarding with form data
      const onboardingData = {}
      
      if (formData && typeof formData === 'object') {
        if (formData.address?.trim()) {
          onboardingData.address = formData.address.trim()
        }
        if (formData.phone?.trim() && !isEmptyPhone(formData.phone)) {
          onboardingData.phone = formData.phone.trim()
        }
      }

      console.log("Completing onboarding with data:", onboardingData)
      
      // ✅ FIXED: Use unified complete function
      let response = await onboardingApi.completeProfileOnboarding(onboardingData)

      console.log("Onboarding API response:", response)
      toast.success("Profil berhasil disimpan!")

      // ✅ FIXED: Enhanced cache clearing and user refetch
      console.log("Clearing cache and refetching user data...")
      
      queryClient.clear()
      
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      await queryClient.invalidateQueries({ queryKey: ["user"] })
      await queryClient.invalidateQueries({ queryKey: ["auth"] })
      
      if (refetchUser) {
        try {
          await refetchUser()
          console.log("User data refetched successfully")
        } catch (error) {
          console.error("Failed to refetch user:", error)
        }
      }

      setTimeout(() => {
        redirectToDashboard()
      }, 1500)

    } catch (error) {
      console.error("Onboarding failed:", error)
      toast.error("Gagal menyimpan profil")
    } finally {
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

  // ✅ FIXED: Simplified skip logic using unified API
  const handleSkip = async () => {
    console.log("Skipping onboarding...")
    setIsSkipping(true)
    
    try {
      // Step 1: Upload profile picture if selected
      if (selectedProfilePicture) {
        try {
          await onboardingApi.uploadProfilePicture(selectedProfilePicture) // ✅ FIXED: Use unified upload function
          console.log("Profile picture uploaded during skip")
        } catch (error) {
          console.error("Profile picture upload failed during skip:", error)
          toast.error("Foto profil gagal diupload")
        }
      }
      
      // Step 2: Skip onboarding (only mark as onboarded)
      console.log("Skipping onboarding...")
      
      // ✅ FIXED: Use unified skip API method
      let response = await onboardingApi.skipOnboarding()
      
      console.log("Skip onboarding API response:", response)
      toast.success("Onboarding dilewati!")

      // ✅ FIXED: Enhanced cache clearing and user refetch
      console.log("Clearing cache and refetching user data...")
      
      queryClient.clear()
      
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      await queryClient.invalidateQueries({ queryKey: ["user"] })
      await queryClient.invalidateQueries({ queryKey: ["auth"] })
      
      if (refetchUser) {
        try {
          await refetchUser()
          console.log("User data refetched successfully")
        } catch (error) {
          console.error("Failed to refetch user:", error)
        }
      }

      setTimeout(() => {
        redirectToDashboard()
      }, 1500)

    } catch (error) {
      console.error("Skip onboarding failed:", error)
      toast.error("Gagal melewati onboarding")
    } finally {
      setIsSkipping(false)
    }
  }

  const handlePhoneChange = (value, field) => {
    if (isEmptyPhone(value)) {
      field.onChange("")
      setPhoneValidationError("")
      return
    }

    field.onChange(value)
    const error = validatePhoneNumber(value)
    setPhoneValidationError(error || "")
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

          {/* Profile Picture Upload */}
          <div className="flex flex-col items-start">
            <ProfilePictureUpload
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
              disabled={isSubmitting || isSkipping}
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
                  disabled={isSubmitting || isSkipping}
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
              disabled={isSubmitting || isSkipping}
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
          disabled={isSkipping || isSubmitting}
          className="absolute bottom-8 right-8 text-sm text-zinc-500 hover:text-primary md:bottom-12 md:right-12 disabled:opacity-50 transition-colors"
        >
          {isSkipping ? (
            <span className="flex items-center gap-2">
              <span className="material-icons animate-spin text-xs">sync</span>
              Melewati...
            </span>
          ) : (
            "Lewati Langkah Ini"
          )}
        </button>
      </section>
    </div>
  )
}

export default OnboardingForm