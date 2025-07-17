// src/pages/user/shared/OnboardingForm.jsx - FOR STUDENT/EMPLOYEE
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import clsx from "clsx"

// Components & utilities
import TextareaAutosize from "react-textarea-autosize"
import { PhoneInput } from "react-international-phone"
import "react-international-phone/style.css"
import { validatePhoneNumber, isEmptyPhone, extractDigits } from "@/lib/phoneUtils"
import { toast } from "sonner"

// --- KOMPONEN UPLOAD PROFILE PICTURE UNTUK USER ---
const UserProfilePictureUpload = ({ currentProfilePicture, userRole = "student", onFileSelect }) => {
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(currentProfilePicture)
  const [isHovering, setIsHovering] = useState(false)
  const [imageError, setImageError] = useState(false)

  const allowedTypes = ["image/jpeg", "image/png"]
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

    console.log("File selected for user onboarding:", file.name)
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
    console.log("User profile picture button clicked - opening file picker")
    fileInputRef.current.click()
  }

  const getFallbackIcon = () => {
    return userRole === "employee" ? "badge" : "school"
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
          accept="image/jpeg, image/png"
          className="hidden"
        />
      </div>
    </div>
  )
}

// Validation schema
const userOnboardingSchema = z.object({
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
  dateOfBirth: z.string().optional(),
  emergencyContact: z.string().max(255, "Kontak darurat maksimal 255 karakter").optional(),
  emergencyPhone: z
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

const UserOnboardingForm = () => {
  const { user, getOrganizationType } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [phoneValidationError, setPhoneValidationError] = useState("")
  const [emergencyPhoneValidationError, setEmergencyPhoneValidationError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)

  // Determine user role from URL or user data
  const userRole = window.location.pathname.includes('student') ? 'student' : 'employee'

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userOnboardingSchema),
    mode: "onBlur",
    defaultValues: {
      address: user?.address || "",
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth || "",
      emergencyContact: user?.emergencyContact || "",
      emergencyPhone: user?.emergencyPhone || "",
    },
  })

  // Pre-fill form with existing user data
  useEffect(() => {
    if (user) {
      console.log("Pre-filling user onboarding form with user data:", {
        address: user.address,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        fullName: user.fullName
      })
      
      // Pre-fill all fields if they exist
      if (user.address) setValue("address", user.address)
      if (user.phone) setValue("phone", user.phone)
      if (user.dateOfBirth) setValue("dateOfBirth", user.dateOfBirth)
      if (user.emergencyContact) setValue("emergencyContact", user.emergencyContact)
      if (user.emergencyPhone) setValue("emergencyPhone", user.emergencyPhone)
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
    console.log("Profile picture selected for user onboarding:", file.name)
    
    // Cleanup previous preview
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview)
    }
    
    setSelectedProfilePicture(file)
    setProfilePicturePreview(previewUrl)
  }

  // Complete user onboarding using same API
  const completeUserOnboarding = async (formData = {}) => {
    setIsSubmitting(true)

    try {
      console.log("Starting user onboarding completion...")

      // Step 1: Upload profile picture first if selected
      if (selectedProfilePicture) {
        console.log("Uploading profile picture...")
        try {
          // Use the same API as organization - it should work for users too
          await api.organization.updateProfilePicture(selectedProfilePicture)
          console.log("Profile picture uploaded successfully")
        } catch (error) {
          console.error("Profile picture upload failed:", error)
          // Continue with onboarding even if profile picture fails
          toast.error("Foto profil gagal diupload, tapi onboarding akan dilanjutkan")
        }
      }

      // Step 2: Complete onboarding with user data
      const payload = {
        onboarded: true, // Mark onboarding as completed
        userRole: userRole, // Add user role info
      }

      // Add form data if provided
      if (formData && typeof formData === 'object') {
        if (formData.address?.trim()) payload.address = formData.address.trim()
        if (formData.phone?.trim() && !isEmptyPhone(formData.phone)) {
          payload.phone = formData.phone.trim()
        }
        if (formData.dateOfBirth?.trim()) payload.dateOfBirth = formData.dateOfBirth.trim()
        if (formData.emergencyContact?.trim()) payload.emergencyContact = formData.emergencyContact.trim()
        if (formData.emergencyPhone?.trim() && !isEmptyPhone(formData.emergencyPhone)) {
          payload.emergencyPhone = formData.emergencyPhone.trim()
        }
      }

      console.log("Sending user onboarding payload:", payload)

      // Call API - using the same endpoint as organization
      const response = await api.organization.updateProfile(payload)
      console.log("User Onboarding API Response:", response)

      if (response?.status === "success") {
        // Clear cache and redirect
        queryClient.clear()
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] })

        // Wait for cache refresh then redirect based on user type
        setTimeout(() => {
          // For now, redirect to homepage or create user dashboard later
          console.log(`User onboarding completed! Redirecting to homepage...`)
          window.location.replace("/")
        }, 1000)
      } else {
        throw new Error("API response unsuccessful")
      }
    } catch (error) {
      console.error("User onboarding failed:", error)
      alert("Gagal menyelesaikan onboarding. Silakan coba lagi.")
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data) => {
    console.log("User form submitted with data:", data)
    setPhoneValidationError("")
    setEmergencyPhoneValidationError("")

    // Validate phone if provided
    if (data.phone && !isEmptyPhone(data.phone)) {
      const phoneError = validatePhoneNumber(data.phone)
      if (phoneError) {
        setPhoneValidationError(phoneError)
        return
      }
    }

    // Validate emergency phone if provided
    if (data.emergencyPhone && !isEmptyPhone(data.emergencyPhone)) {
      const emergencyPhoneError = validatePhoneNumber(data.emergencyPhone)
      if (emergencyPhoneError) {
        setEmergencyPhoneValidationError(emergencyPhoneError)
        return
      }
    }

    await completeUserOnboarding(data)
  }

  const handleSkip = async () => {
    console.log("Skipping user onboarding form...")
    setIsSubmitting(true)
    
    try {
      // Upload profile picture if selected
      if (selectedProfilePicture) {
        console.log("Uploading profile picture during skip...")
        try {
          await api.organization.updateProfilePicture(selectedProfilePicture)
          console.log("Profile picture uploaded during skip")
        } catch (error) {
          console.error("Profile picture upload failed during skip:", error)
          toast.error("Foto profil gagal diupload")
        }
      }
      
      // Complete onboarding without form data
      const payload = { 
        onboarded: true,
        userRole: userRole
      }
      console.log("Sending skip payload:", payload)
      
      const response = await api.organization.updateProfile(payload)
      console.log("Skip API Response:", response)

      if (response?.status === "success") {
        // Clear cache and redirect
        queryClient.clear()
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] })

        setTimeout(() => {
          console.log(`User onboarding skipped! Redirecting to homepage...`)
          window.location.replace("/")
        }, 1000)
      } else {
        throw new Error("API response unsuccessful")
      }
    } catch (error) {
      console.error("Skip user onboarding failed:", error)
      alert("Gagal melewati onboarding. Silakan coba lagi.")
      setIsSubmitting(false)
    }
  }

  const handlePhoneChange = (value, field, setError) => {
    if (isEmptyPhone(value)) {
      field.onChange("")
      setError("")
      return
    }

    const digits = extractDigits(value)
    if (digits.length <= 15) {
      field.onChange(value)
      const error = validatePhoneNumber(value)
      setError(error || "")
      setTimeout(() => trigger(field.name), 100)
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
          <div className="mt-4 px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
            {userRole === 'student' ? '👨‍🎓 Student' : '👨‍💼 Employee'}
          </div>
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
            Lengkapi Profil {userRole === 'student' ? 'Student' : 'Employee'}
          </h2>

          {/* Profile Picture Upload */}
          <div className="flex flex-col items-start">
            <UserProfilePictureUpload
              currentProfilePicture={user?.profilePicture || null}
              userRole={userRole}
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
                  onChange={(value) => handlePhoneChange(value, field, setPhoneValidationError)}
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

          {/* Date of Birth Field */}
          <div>
            <label className="block mb-2 text-sm text-zinc-600">Tanggal Lahir</label>
            <input
              type="date"
              {...register("dateOfBirth")}
              className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              style={{ height: "42px" }}
              disabled={isSubmitting}
            />
            {errors.dateOfBirth && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.dateOfBirth.message}
              </span>
            )}
          </div>

          {/* Emergency Contact Field */}
          <div>
            <label className="block mb-2 text-sm text-zinc-600">Kontak Darurat</label>
            <input
              type="text"
              {...register("emergencyContact")}
              maxLength={255}
              className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              style={{ height: "42px" }}
              placeholder="Nama kontak darurat"
              disabled={isSubmitting}
            />
            {errors.emergencyContact && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.emergencyContact.message}
              </span>
            )}
          </div>

          {/* Emergency Phone Field */}
          <div>
            <label className="block mb-2 text-sm text-zinc-600">Nomor Telepon Darurat</label>
            <Controller
              name="emergencyPhone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  defaultCountry="id"
                  value={field.value || ""}
                  onChange={(value) => handlePhoneChange(value, field, setEmergencyPhoneValidationError)}
                  onBlur={field.onBlur}
                  inputClassName={clsx(
                    "w-full h-[42px] border-[1.5px] text-base px-4 transition-colors",
                    errors.emergencyPhone || emergencyPhoneValidationError 
                      ? "border-red-500" 
                      : "border-zinc-300",
                  )}
                  disabled={isSubmitting}
                />
              )}
            />
            {(errors.emergencyPhone || emergencyPhoneValidationError) && (
              <span className="text-xs text-red-500 mt-1 block">
                {emergencyPhoneValidationError || errors.emergencyPhone?.message}
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
      </section>
    </div>
  )
}

export default UserOnboardingForm