// src/components/shared/detail/EditModal.jsx 

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import clsx from "clsx"
import { PhoneInput } from "react-international-phone"
import { format } from "date-fns"
import { useAcademicInfo, useEmployeeRoles } from "../../../hooks/useDashboardMetrics"
import "react-international-phone/style.css"

// Helpers
const extractDigits = (phone) => phone?.replace(/[^\d]/g, "") || ""
const isEmptyPhone = (phone) => !phone || extractDigits(phone).length <= 3
const phoneValidation = (value) => isEmptyPhone(value) || (extractDigits(value).length >= 7 && extractDigits(value).length <= 15)

// Schemas
const commonFields = {
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female"], { required_error: "Jenis kelamin wajib dipilih" }),
}

const studentSchema = z.object({
  ...commonFields,
  nis: z.string().min(1, "NIS wajib diisi"),
  guardianContact: z.string().optional().refine(phoneValidation, { message: "Nomor telepon harus 7-15 digit" }),
  classroom: z.string().min(1, "Kelas wajib diisi"),
  grade: z.string().min(1, "Grade wajib diisi"),
  iqScore: z.string().optional().refine(val => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 200), { message: "Skor IQ harus antara 0-200" }),
  iqCategory: z.string().optional(),
})

const employeeSchema = z.object({
  ...commonFields,
  employeeId: z.string().min(1, "ID Karyawan wajib diisi"),
  contact: z.string().optional().refine(phoneValidation, { message: "Nomor telepon harus 7-15 digit" }),
  department: z.string().min(1, "Departemen wajib diisi"),
  position: z.string().min(1, "Jabatan wajib diisi"),
  yearsOfService: z.string().optional().refine(val => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 50), { message: "Lama bekerja harus antara 0-50 tahun" }),
})

// Components
const FormField = ({ label, error, children, required = false }) => (
  <div className="flex flex-col">
    <label className="block text-xs text-gray-500 mb-2">{label}{required && " *"}</label>
    {children}
    {error && <span className="text-xs text-red-500 mt-1 block">{error.message}</span>}
  </div>
)

const FloatingDropdown = ({ value, onChange, options, placeholder, error }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef(null)

  const selectedOption = options.find(opt => (typeof opt === "object" ? opt.value : opt) === value)
  const displayValue = selectedOption ? (typeof selectedOption === "object" ? selectedOption.label : selectedOption) : placeholder

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width })
    }
  }

  const handleToggle = () => {
    if (!isOpen) updatePosition()
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    if (isOpen) {
      const handleResize = () => updatePosition()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={clsx("w-full h-10 px-3 border rounded-md bg-white flex items-center justify-between focus:outline-none focus:border-[#488BBE] transition-colors text-sm", error ? "border-red-500" : "border-gray-300")}
        onClick={handleToggle}
      >
        <span className={clsx("truncate text-left", selectedOption ? "text-gray-900" : "text-gray-400")}>{displayValue}</span>
        <span className="material-icons text-gray-400 text-sm ml-2 flex-shrink-0">{isOpen ? "expand_less" : "expand_more"}</span>
      </button>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div className="fixed z-[9999] bg-white shadow-lg border border-gray-200 rounded-md py-1 max-h-48 overflow-y-auto" style={position}>
            {options.map((option, index) => {
              const optionValue = typeof option === "object" ? option.value : option
              const optionLabel = typeof option === "object" ? option.label : option
              return (
                <button key={index} type="button" className={clsx("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", value === optionValue && "bg-blue-100 text-blue-600")} onClick={() => { onChange(optionValue); setIsOpen(false) }}>
                  {optionLabel}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
    </>
  )
}

const FloatingCascadingDropdown = ({ classroomValue, gradeValue, onClassroomChange, onGradeChange, classrooms, grades, error }) => {
  const [isClassroomOpen, setIsClassroomOpen] = useState(false)
  const [isGradeOpen, setIsGradeOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef(null)

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width })
    }
  }

  const handleToggle = () => {
    if (!isClassroomOpen) updatePosition()
    setIsClassroomOpen(!isClassroomOpen)
    setIsGradeOpen(false)
  }

  const displayValue = classroomValue && gradeValue ? `${classroomValue}-${gradeValue}` : classroomValue || "Pilih Kelas"

  return (
    <>
      <button ref={buttonRef} type="button" className={clsx("w-full h-10 px-3 border rounded-md bg-white flex items-center justify-between focus:outline-none focus:border-[#488BBE] transition-colors text-sm", error ? "border-red-500" : "border-gray-300")} onClick={handleToggle}>
        <span className={classroomValue ? "text-gray-900" : "text-gray-400"}>{displayValue}</span>
        <span className="material-icons text-gray-400 text-sm">{isClassroomOpen ? "expand_less" : "expand_more"}</span>
      </button>

      {isClassroomOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => { setIsClassroomOpen(false); setIsGradeOpen(false) }} />
          <div className="fixed z-[9999] bg-white shadow-lg border border-gray-200 rounded-md py-1" style={{ ...position, width: '64px' }}>
            {classrooms.map(classroom => (
              <button key={classroom} type="button" className={clsx("w-full text-center px-3 py-2 text-sm hover:bg-blue-50 transition-colors", classroomValue === classroom && "bg-[#3399E9] text-white")} onClick={() => { onClassroomChange(classroom); setIsGradeOpen(true); setIsClassroomOpen(false) }}>
                {classroom}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}

      {isGradeOpen && classroomValue && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => { setIsClassroomOpen(false); setIsGradeOpen(false) }} />
          <div className="fixed z-[9999] bg-white shadow-lg border border-gray-200 rounded-md py-1" style={{ top: position.top, left: position.left + 68, width: '64px' }}>
            {grades.map(grade => (
              <button key={grade} type="button" className="w-full text-center px-3 py-2 text-sm hover:bg-blue-50 transition-colors" onClick={() => { onGradeChange(grade); setIsGradeOpen(false); setIsClassroomOpen(false) }}>
                {grade}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  )
}

const EditModal = ({ data, type, onClose, onSuccess, updateMutation }) => {
  const [errorMessage, setErrorMessage] = useState("")
  const profile = data?.studentProfile || data?.employeeProfile || data || {}

  const { data: academicData } = useAcademicInfo()
  const { data: employeeData } = useEmployeeRoles()

  const classrooms = academicData?.data?.classrooms || ["X", "XI", "XII"]
  const grades = academicData?.data?.grades || ["A", "B", "C", "D"]
  const departments = employeeData?.data?.departments || ["Human Resources", "Finance", "Marketing", "IT", "Operations"]
  const positions = employeeData?.data?.positions || ["Head", "Manager", "Staff", "Specialist", "Developer", "Analyst"]

  const formatDateForInput = (dateString) => {
    if (!dateString) return ""
    try { return format(new Date(dateString), "yyyy-MM-dd") } catch { return "" }
  }

  const getDefaultValues = () => {
    const baseValues = {
      fullName: data?.fullName || "",
      birthPlace: profile?.birthPlace || "",
      birthDate: formatDateForInput(profile?.birthDate),
      gender: profile?.gender || "male",
    }

    return type === "student" ? {
      ...baseValues,
      nis: profile?.nis || "",
      guardianContact: profile?.guardianContact || "",
      classroom: profile?.classroom || "",
      grade: profile?.grade || "",
      iqScore: profile?.iqScore?.toString() || "",
      iqCategory: profile?.iqCategory || "",
    } : {
      ...baseValues,
      employeeId: profile?.employeeId || profile?.id || "",
      contact: profile?.contact || profile?.phone || "",
      department: profile?.department || "",
      position: profile?.position || "",
      yearsOfService: profile?.yearsOfService?.toString() || "",
    }
  }

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting, dirtyFields } } = useForm({
    resolver: zodResolver(type === "student" ? studentSchema : employeeSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  })

  const watchedClassroom = watch("classroom")
  const watchedGrade = watch("grade")

  useEffect(() => { if (data) reset(getDefaultValues()) }, [data, profile, reset])

  const onSubmit = (formData) => {
    setErrorMessage("")
    const payload = {}

    if (dirtyFields.fullName && formData.fullName !== data?.fullName) {
      payload.fullName = formData.fullName.trim()
    }

    const profilePayload = {}
    const profileKey = type === "student" ? "studentProfile" : "employeeProfile"

    // Common fields
    if (dirtyFields.birthPlace && formData.birthPlace !== profile?.birthPlace) profilePayload.birthPlace = formData.birthPlace?.trim() || null
    if (dirtyFields.birthDate && formData.birthDate !== formatDateForInput(profile?.birthDate)) profilePayload.birthDate = formData.birthDate || null
    if (dirtyFields.gender && formData.gender !== profile?.gender) profilePayload.gender = formData.gender

    // Type-specific fields
    if (type === "student") {
      if (dirtyFields.nis && formData.nis !== profile?.nis) profilePayload.nis = formData.nis.trim()
      if (dirtyFields.guardianContact && formData.guardianContact !== profile?.guardianContact) profilePayload.guardianContact = isEmptyPhone(formData.guardianContact) ? null : formData.guardianContact
      if (dirtyFields.classroom && formData.classroom !== profile?.classroom) profilePayload.classroom = formData.classroom
      if (dirtyFields.grade && formData.grade !== profile?.grade) profilePayload.grade = formData.grade
      if (dirtyFields.iqScore && formData.iqScore !== profile?.iqScore?.toString()) profilePayload.iqScore = formData.iqScore?.trim() ? parseInt(formData.iqScore) : null
      if (dirtyFields.iqCategory && formData.iqCategory !== profile?.iqCategory) profilePayload.iqCategory = formData.iqCategory || null
    } else {
      if (dirtyFields.employeeId && formData.employeeId !== (profile?.employeeId || profile?.id)) profilePayload.employeeId = formData.employeeId.trim()
      if (dirtyFields.contact && formData.contact !== (profile?.contact || profile?.phone)) profilePayload.contact = isEmptyPhone(formData.contact) ? null : formData.contact
      if (dirtyFields.department && formData.department !== profile?.department) profilePayload.department = formData.department
      if (dirtyFields.position && formData.position !== profile?.position) profilePayload.position = formData.position
      if (dirtyFields.yearsOfService && formData.yearsOfService !== profile?.yearsOfService?.toString()) profilePayload.yearsOfService = formData.yearsOfService?.trim() ? parseInt(formData.yearsOfService) : null
    }

    if (Object.keys(profilePayload).length > 0) payload[profileKey] = profilePayload
    if (Object.keys(payload).length === 0) { onClose(); return }

    updateMutation.mutate(payload, {
      onSuccess: () => onSuccess(`Profil ${type === "student" ? "siswa" : "karyawan"} berhasil diubah!`),
      onError: (error) => setErrorMessage(error.response?.data?.message || "Terjadi kesalahan saat memperbarui data"),
    })
  }

  const genderOptions = [{ value: "male", label: "Laki-laki" }, { value: "female", label: "Perempuan" }]
  const iqCategories = [
    { value: "very_below_average", label: "Jauh Di Bawah Rata-rata" },
    { value: "below_average", label: "Di Bawah Rata-rata" },
    { value: "average", label: "Rata-rata" },
    { value: "above_average", label: "Di Atas Rata-rata" },
    { value: "very_above_average", label: "Jauh Di Atas Rata-rata" },
    { value: "genius", label: "Jenius" },
  ]

  const hasChanges = Object.keys(dirtyFields).length > 0

  return (
    <div className="bg-white rounded-lg shadow-lg w-[90vw] max-w-[800px] h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center p-6">
        <h2 className="text-lg font-semibold text-[#488BBE]">Edit Profil {type === "student" ? "Siswa" : "Karyawan"}</h2>
        <button type="button" onClick={onClose} className="text-[#488BBE] hover:text-[#3399E9] transition-colors">
          <span className="material-icons">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 overflow-hidden">
        {errorMessage && (
          <div className="px-3 py-2 mb-4 text-xs bg-pink-100 border border-red-400 text-red-700 rounded-md">
            <div className="flex items-center">
              <span className="material-icons mr-1 text-sm">error</span>
              {errorMessage}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="h-full pb-3">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left Column */}
            <div className="space-y-6">
              <FormField label="Nama Lengkap" error={errors.fullName} required>
                <input {...register("fullName")} className={clsx("w-full rounded-md h-10 border px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors", errors.fullName ? "border-red-500" : "border-gray-300")} placeholder="Nama lengkap" />
              </FormField>

              {/* <FormField label={type === "student" ? "NIS" : "ID Karyawan"} error={type === "student" ? errors.nis : errors.employeeId} required>
                <input {...register(type === "student" ? "nis" : "employeeId")} className={clsx("w-full rounded-md h-10 border px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors", (type === "student" ? errors.nis : errors.employeeId) ? "border-red-500" : "border-gray-300")} placeholder={type === "student" ? "NIS" : "ID Karyawan"} />
              </FormField> */}

              {type === "student" ? (
                <FormField label="Kelas" error={errors.classroom || errors.grade} required>
                  <FloatingCascadingDropdown classroomValue={watchedClassroom} gradeValue={watchedGrade} onClassroomChange={(value) => setValue("classroom", value, { shouldDirty: true })} onGradeChange={(value) => setValue("grade", value, { shouldDirty: true })} classrooms={classrooms} grades={grades} error={errors.classroom || errors.grade} />
                </FormField>
              ) : (
                <FormField label="Departemen" error={errors.department} required>
                  <Controller name="department" control={control} render={({ field }) => <FloatingDropdown value={field.value} onChange={field.onChange} options={departments} placeholder="Pilih departemen" error={errors.department} />} />
                </FormField>
              )}

              <FormField label="Jenis Kelamin" error={errors.gender} required>
                <Controller name="gender" control={control} render={({ field }) => <FloatingDropdown value={field.value} onChange={field.onChange} options={genderOptions} placeholder="Pilih jenis kelamin" error={errors.gender} />} />
              </FormField>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tempat Lahir" error={errors.birthPlace}>
                  <input {...register("birthPlace")} className="w-full rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors" placeholder="Tempat lahir" />
                </FormField>
                <FormField label="Tanggal Lahir" error={errors.birthDate}>
                  <input type="date" {...register("birthDate")} className="w-full rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors" />
                </FormField>
              </div>

              <FormField label={type === "student" ? "Kontak Wali" : "Kontak"} error={type === "student" ? errors.guardianContact : errors.contact}>
                <Controller name={type === "student" ? "guardianContact" : "contact"} control={control} render={({ field }) => (
                  <PhoneInput defaultCountry="id" value={field.value || ""} onChange={(value) => { if (isEmptyPhone(value)) { field.onChange(""); return } const digits = extractDigits(value); if (digits.length <= 15) field.onChange(value) }} onBlur={() => { if (isEmptyPhone(field.value)) field.onChange(""); field.onBlur() }} inputClassName={clsx("w-full h-10 border text-sm px-3 focus:outline-none focus:border-[#488BBE] transition-colors", (type === "student" ? errors.guardianContact : errors.contact) ? "border-red-500" : "border-gray-300")} containerClassName="rounded-md overflow-hidden" buttonClassName="h-10 px-3 flex items-center justify-center border-r border-gray-300" placeholder={type === "student" ? "Kontak wali" : "Kontak"} inputProps={{ maxLength: 20 }} international withCountryCallingCode forceDialCode />
                )} />
              </FormField>

              {type === "student" ? (
                <>
                  <FormField label="Skor IQ" error={errors.iqScore}>
                    <input type="number" {...register("iqScore")} className="w-full rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors" placeholder="Skor IQ" min="0" max="200" />
                  </FormField>
                  <FormField label="Kategori" error={errors.iqCategory}>
                    <Controller name="iqCategory" control={control} render={({ field }) => <FloatingDropdown value={field.value} onChange={field.onChange} options={iqCategories} placeholder="Pilih kategori" error={errors.iqCategory} />} />
                  </FormField>
                </>
              ) : (
                <>
                  <FormField label="Jabatan" error={errors.position} required>
                    <Controller name="position" control={control} render={({ field }) => <FloatingDropdown value={field.value} onChange={field.onChange} options={positions} placeholder="Pilih jabatan" error={errors.position} />} />
                  </FormField>
                  <FormField label="Lama Bekerja (Tahun)" error={errors.yearsOfService}>
                    <input type="number" {...register("yearsOfService")} className="w-full rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors" placeholder="Lama bekerja" min="0" max="50" />
                  </FormField>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex justify-end px-6 pb-6">
        <button type="submit" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || updateMutation.isPending || !hasChanges} className={clsx("h-10 px-6 rounded-md text-white font-semibold transition-colors text-sm", isSubmitting || updateMutation.isPending || !hasChanges ? "bg-gray-400 cursor-not-allowed" : "bg-[#488BBE] hover:bg-[#3399E9]")}>
          {isSubmitting || updateMutation.isPending ? (
            <span className="flex items-center">
              <span className="material-icons animate-spin text-sm mr-1">refresh</span>
              Menyimpan...
            </span>
          ) : "Simpan"}
        </button>
      </div>
    </div>
  )
}

export default EditModal