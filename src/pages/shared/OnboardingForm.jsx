// src/pages/shared/OnboardingForm.jsx - Universal Form for All Roles

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import clsx from "clsx"

// Components & utilities
import TextareaAutosize from "react-textarea-autosize"
import { PhoneInput } from "react-international-phone"
import "react-international-phone/style.css"
import { validatePhoneNumber, isEmptyPhone, extractDigits } from "@/lib/phoneUtils"
import { toast } from "sonner"
import ProfilePictureUpload from "@/components/shared/profile/ProfilePictureUpload"

// === VALIDATION SCHEMAS ===
const baseSchema = z.object({
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

const userSchema = baseSchema.extend({
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

const psychologistSchema = userSchema.extend({
  licenseNumber: z.string().optional(),
  specializations: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
})

const OnboardingForm = () => {
  const { 
    user, 
    getUserRole, 
    getOrganizationType, 
    completeOnboarding, 
    skipOnboarding 
  } = useAuth()
  
  const [phoneValidationError, setPhoneValidationError] = useState("")
  const [emergencyPhoneValidationError, setEmergencyPhoneValidationError] = useState("")

  // Determine user type and appropriate schema
  const userRole = getUserRole()
  const orgType = getOrganizationType()
  const isOrgAdmin = !userRole && orgType
  const isPsychologist = userRole === 'psychologist'
  const isUserRole = userRole && ['student', 'employee', 'psychologist'].includes(userRole)

  // Select appropriate schema
  const getSchema = () => {
    if (isPsychologist) return psychologistSchema
    if (isUserRole) return userSchema
    return baseSchema
  }

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(getSchema()),
    mode: "onBlur",
    defaultValues: {
      address: user?.address || "",
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth || "",
      emergencyContact: user?.emergencyContact || "",
      emergencyPhone: user?.emergencyPhone || "",
      licenseNumber: user?.licenseNumber || "",
      specializations: user?.specializations || "",
      experience: user?.experience || "",
      education: user?.education || "",
    },
  })

  // Pre-fill form with existing user data
  useEffect(() => {
    if (user) {
      console.log("Pre-filling onboarding form with user data:", user)
      
      if (user.address) setValue("address", user.address)
      if (user.phone) setValue("phone", user.phone)
      
      if (isUserRole) {
        if (user.dateOfBirth) setValue("dateOfBirth", user.dateOfBirth)
        if (user.emergencyContact) setValue("emergencyContact", user.emergencyContact)
        if (user.emergencyPhone) setValue("emergencyPhone", user.emergencyPhone)
      }

      if (isPsychologist) {
        if (user.licenseNumber) setValue("licenseNumber", user.licenseNumber)
        if (user.specializations) setValue("specializations", user.specializations)
        if (user.experience) setValue("experience", user.experience)
        if (user.education) setValue("education", user.education)
      }
    }
  }, [user, setValue, isUserRole, isPsychologist])

  const onSubmit = async (data) => {
    console.log("Form submitted with data:", data)
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

    // Validate emergency phone if provided (for user roles)
    if (isUserRole && data.emergencyPhone && !isEmptyPhone(data.emergencyPhone)) {
      const emergencyPhoneError = validatePhoneNumber(data.emergencyPhone)
      if (emergencyPhoneError) {
        setEmergencyPhoneValidationError(emergencyPhoneError)
        return
      }
    }

    // Clean up data before sending
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ""
      )
    )

    console.log("Submitting clean data:", cleanData)
    completeOnboarding.mutate(cleanData)
  }

  const handleSkip = () => {
    console.log("Skipping onboarding...")
    skipOnboarding.mutate()
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

  const getRoleTitle = () => {
    if (userRole === 'student') return 'Siswa'
    if (userRole === 'employee') return 'Pegawai'
    if (userRole === 'psychologist') return 'Psikolog'
    if (orgType === 'school') return 'Admin Sekolah'
    if (orgType === 'company') return 'Admin Perusahaan'
    return 'User'
  }

  const getRoleIcon = () => {
    if (userRole === 'student') return '👨‍🎓'
    if (userRole === 'employee') return '👨‍💼'
    if (userRole === 'psychologist') return '👨‍⚕️'
    if (orgType === 'school') return '🏫'
    if (orgType === 'company') return '🏢'
    return '👤'
  }

  // Simplified animations
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  }

  const isSubmitting = completeOnboarding.isPending || skipOnboarding.isPending

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
            {getRoleIcon()} {getRoleTitle()}
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
            Lengkapi Profil {getRoleTitle()}
          </h2>

          {/* Profile Picture Upload */}
          <div className="flex flex-col items-start">
            <ProfilePictureUpload
              currentProfilePicture={user?.profilePicture || null}
              organizationType={orgType || "school"}
              isOnboarding={true}
            />
          </div>

          {/* Address Field - All roles */}
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

          {/* Phone Field - All roles */}
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

          {/* User Role Fields */}
          {isUserRole && (
            <>
              {/* Date of Birth */}
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

              {/* Emergency Contact */}
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

              {/* Emergency Phone */}
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
            </>
          )}

          {/* Psychologist Specific Fields */}
          {isPsychologist && (
            <>
              {/* License Number */}
              <div>
                <label className="block mb-2 text-sm text-zinc-600">Nomor Lisensi/SIPP</label>
                <input
                  type="text"
                  {...register("licenseNumber")}
                  className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  style={{ height: "42px" }}
                  placeholder="Nomor lisensi praktik"
                  disabled={isSubmitting}
                />
                {errors.licenseNumber && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {errors.licenseNumber.message}
                  </span>
                )}
              </div>

              {/* Specializations */}
              <div>
                <label className="block mb-2 text-sm text-zinc-600">Spesialisasi</label>
                <TextareaAutosize
                  {...register("specializations")}
                  minRows={2}
                  className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-colors"
                  placeholder="Misal: Psikologi Klinis, Terapi Kognitif, dll"
                  disabled={isSubmitting}
                />
                {errors.specializations && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {errors.specializations.message}
                  </span>
                )}
              </div>

              {/* Experience */}
              <div>
                <label className="block mb-2 text-sm text-zinc-600">Pengalaman</label>
                <input
                  type="text"
                  {...register("experience")}
                  className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  style={{ height: "42px" }}
                  placeholder="Misal: 5 tahun"
                  disabled={isSubmitting}
                />
                {errors.experience && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {errors.experience.message}
                  </span>
                )}
              </div>

              {/* Education */}
              <div>
                <label className="block mb-2 text-sm text-zinc-600">Pendidikan</label>
                <TextareaAutosize
                  {...register("education")}
                  minRows={2}
                  className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-colors"
                  placeholder="Misal: S1 Psikologi UI, S2 Psikologi Klinis UGM"
                  disabled={isSubmitting}
                />
                {errors.education && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {errors.education.message}
                  </span>
                )}
              </div>
            </>
          )}

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

export default OnboardingForm