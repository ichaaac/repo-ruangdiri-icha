// src/pages/shared/OnboardingForm.jsx
import { useState, useEffect } from "react"
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
import ProfilePictureUpload from "@/components/shared/profile/ProfilePictureUpload"
import TextareaAutosize from "react-textarea-autosize"
import { PhoneInput } from "react-international-phone"
import "react-international-phone/style.css"
import { validatePhoneNumber, isEmptyPhone, extractDigits } from "@/lib/phoneUtils"

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
  const { user, getOrganizationType } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [phoneValidationError, setPhoneValidationError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      address: "",
      phone: "",
    },
  })

  // Pre-fill form with existing user data
  useEffect(() => {
    if (user) {
      if (user.address) setValue("address", user.address)
      if (user.phone) setValue("phone", user.phone)
    }
  }, [user, setValue])

  // FIXED: Based on backend analysis
  const completeOnboarding = async (formData = {}) => {
    setIsSubmitting(true)

    try {
      console.log("Starting onboarding completion...")

      // CRITICAL FIX: Based on seed data evidence
      // Seed shows: isOnboarded: true = completed onboarding
      // So we need to send onboarded: true to mark as completed
      const payload = {
        onboarded: true, // Mark onboarding as completed
      }

      // Add organizational data if provided
      if (formData.address?.trim() || (formData.phone?.trim() && !isEmptyPhone(formData.phone))) {
        payload.organizationData = {}
        
        if (formData.address?.trim()) {
          payload.organizationData.address = formData.address.trim()
        }
        
        if (formData.phone?.trim() && !isEmptyPhone(formData.phone)) {
          payload.organizationData.phone = formData.phone.trim()
        }
      }

      console.log("Sending payload:", payload)

      // Call API
      const response = await api.organization.updateProfile(payload)
      console.log("API Response:", response)

      if (response?.status === "success") {
        // Clear cache and redirect
        queryClient.clear()
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] })

        // Wait for cache refresh then redirect
        setTimeout(() => {
          const orgType = getOrganizationType()
          const redirectPath = orgType === "school" 
            ? "/organization/school/dashboard"
            : orgType === "company"
            ? "/organization/company/dashboard"
            : "/"
          
          console.log(`Onboarding completed! Redirecting to: ${redirectPath}`)
          window.location.replace(redirectPath)
        }, 1000)
      } else {
        throw new Error("API response unsuccessful")
      }
    } catch (error) {
      console.error("Onboarding failed:", error)
      alert("Gagal menyelesaikan onboarding. Silakan coba lagi.")
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data) => {
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
    await completeOnboarding() // Skip with no form data
  }

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

          {/* Profile Picture */}
          <div className="flex flex-col items-start">
            <ProfilePictureUpload
              currentProfilePicture={user?.profilePicture || null}
              organizationType={user?.organization?.type || "school"}
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
          className="absolute bottom-8 right-8 text-sm text-zinc-500 hover:underline hover:text-primary md:bottom-12 md:right-12 disabled:opacity-50 transition-colors"
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

export default OnboardingForm