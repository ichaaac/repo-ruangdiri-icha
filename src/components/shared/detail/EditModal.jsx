// src/components/shared/detail/EditModal.jsx - REVISED

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import clsx from "clsx"
import { PhoneInput } from "react-international-phone"
import { format } from "date-fns"
import { useAcademicInfo, useEmployeeRoles } from "../../../hooks/useDashboardMetrics"
import "react-international-phone/style.css"

// Phone validation helpers
const extractDigits = (phone) => phone?.replace(/[^\d]/g, "") || ""
const isEmptyPhone = (phone) => {
  if (!phone) return true
  const digits = extractDigits(phone)
  return !digits || digits.length <= 3
}

// Validation schemas
const studentSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  nis: z.string().min(1, "NIS wajib diisi"),
  guardianContact: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (isEmptyPhone(value)) return true
        const digits = extractDigits(value)
        return digits.length >= 7 && digits.length <= 15
      },
      { message: "Nomor telepon harus 7-15 digit" },
    ),
  classroom: z.string().min(1, "Kelas wajib diisi"),
  grade: z.string().min(1, "Grade wajib diisi"),
  gender: z.enum(["male", "female"], { required_error: "Jenis kelamin wajib dipilih" }),
  iqScore: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        const num = Number.parseInt(val)
        return !isNaN(num) && num >= 0 && num <= 200
      },
      { message: "Skor IQ harus antara 0-200" },
    ),
  iqCategory: z.string().optional(),
})

const employeeSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  employeeId: z.string().min(1, "ID Karyawan wajib diisi"),
  contact: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (isEmptyPhone(value)) return true
        const digits = extractDigits(value)
        return digits.length >= 7 && digits.length <= 15
      },
      { message: "Nomor telepon harus 7-15 digit" },
    ),
  department: z.string().min(1, "Departemen wajib diisi"),
  position: z.string().min(1, "Jabatan wajib diisi"),
  gender: z.enum(["male", "female"], { required_error: "Jenis kelamin wajib dipilih" }),
  yearsOfService: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        const num = Number.parseInt(val)
        return !isNaN(num) && num >= 0 && num <= 50
      },
      { message: "Lama bekerja harus antara 0-50 tahun" },
    ),
})

// Reusable Components
const FormField = ({ label, error, children, required = false }) => (
  <div className="flex flex-col">
    <label className="block text-xs text-gray-500 mb-2">
      {label}
      {required && " *"}
    </label>
    {children}
    {error && <span className="text-xs text-red-500 mt-1 block">{error.message}</span>}
  </div>
)

// MODIFIED: Dropdown now uses position:fixed to "float" above all containers
const CompactDropdown = ({ value, onChange, options, placeholder, error }) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef(null)
  const [dropdownStyle, setDropdownStyle] = useState({})

  const selectedOption = options.find((opt) => (typeof opt === "object" ? opt.value : opt) === value)
  const displayValue = selectedOption ? (typeof selectedOption === "object" ? selectedOption.label : selectedOption) : placeholder

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`, // 4px gap
        left: `${rect.left}px`,
        width: `${rect.width}px`,
      })
    }
  }, [isOpen])


  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={clsx(
          "w-full h-10 px-3 border rounded-md bg-white flex items-center justify-between focus:outline-none focus:border-[#488BBE] transition-colors text-sm",
          error ? "border-red-500" : "border-gray-300",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={clsx("truncate", selectedOption ? "text-gray-900" : "text-gray-400")}>{displayValue}</span>
        <span className="material-icons text-gray-400 text-sm ml-2 flex-shrink-0">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div 
           style={dropdownStyle}
           className="bg-white shadow-lg border border-gray-200 rounded-md py-1 focus:outline-none max-h-48 overflow-y-auto z-[10000]"
         >
          {options.map((option, index) => {
            const optionValue = typeof option === "object" ? option.value : option
            const optionLabel = typeof option === "object" ? option.label : option
            return (
              <button
                key={index}
                type="button"
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors",
                  value === optionValue && "bg-blue-100 text-blue-600",
                )}
                onClick={() => {
                  onChange(optionValue)
                  setIsOpen(false)
                }}
              >
                {optionLabel}
              </button>
            )
          })}
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

// MODIFIED: Cascading dropdown also uses position:fixed now
const CascadingClassroomDropdown = ({
  classroomValue,
  gradeValue,
  onClassroomChange,
  onGradeChange,
  classrooms,
  grades,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeClassroom, setActiveClassroom] = useState(classroomValue)
  const buttonRef = useRef(null)
  const [dropdownStyle, setDropdownStyle] = useState({})
  
  const displayValue =
    classroomValue && gradeValue ? `${classroomValue} - ${gradeValue}` : classroomValue || "Pilih Kelas"

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
      })
    }
  }, [isOpen])
  
  const handleGradeSelect = (grade) => {
    if (activeClassroom) {
      onClassroomChange(activeClassroom)
      onGradeChange(grade)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={clsx(
          "w-full h-10 px-3 border rounded-md bg-white flex items-center justify-between focus:outline-none focus:border-[#488BBE] transition-colors text-sm",
          error ? "border-red-500" : "border-gray-300",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={clsx("truncate", classroomValue ? "text-gray-900" : "text-gray-400")}>{displayValue}</span>
        <span className="material-icons text-gray-400 text-sm ml-2 flex-shrink-0">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div 
          style={dropdownStyle}
          className="z-[10000] bg-white shadow-lg border border-gray-200 rounded-md py-1 flex"
        >
          <div className="border-r border-gray-200">
            {classrooms.map((classroom) => (
              <button
                key={classroom}
                type="button"
                className={clsx(
                  "w-full text-center px-4 py-2 text-sm hover:bg-blue-50 transition-colors block",
                  (classroomValue === classroom || activeClassroom === classroom) && "bg-[#3399E9] text-white",
                )}
                onMouseEnter={() => setActiveClassroom(classroom)}
                onClick={() => onClassroomChange(classroom)}
              >
                {classroom}
              </button>
            ))}
          </div>
          
          {activeClassroom && (
            <div className="min-w-[4rem]"> {/* Give grade column a min-width */}
              {grades.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className="w-full text-center px-4 py-2 text-sm hover:bg-blue-50 transition-colors block"
                  onClick={() => handleGradeSelect(grade)}
                >
                  {grade}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)} />}
    </div>
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
    try { return format(new Date(dateString), "yyyy-MM-dd") } 
    catch (e) { return "" }
  }

  const getDefaultValues = () => {
    const baseValues = {
      fullName: data?.fullName || "",
      birthPlace: profile?.birthPlace || "",
      birthDate: formatDateForInput(profile?.birthDate),
      gender: profile?.gender || "male",
    }
    if (type === "student") {
      return {
        ...baseValues,
        nis: profile?.nis || "",
        guardianContact: profile?.guardianContact || "",
        classroom: profile?.classroom || "",
        grade: profile?.grade || "",
        iqScore: profile?.iqScore?.toString() || "",
        iqCategory: profile?.iqCategory || "",
      }
    }
    return {
      ...baseValues,
      employeeId: profile?.employeeId || profile?.id || "",
      contact: profile?.contact || profile?.phone || "",
      department: profile?.department || "",
      position: profile?.position || "",
      yearsOfService: profile?.yearsOfService?.toString() || "",
    }
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(type === "student" ? studentSchema : employeeSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  })

  const watchedClassroom = watch("classroom")
  const watchedGrade = watch("grade")

  useEffect(() => {
    if (data) { reset(getDefaultValues()) }
  }, [data, profile, reset])

  const onSubmit = (formData) => {
    setErrorMessage("")
    const payload = {}
    if (dirtyFields.fullName) { payload.fullName = formData.fullName.trim() }
    const profilePayload = {}
    const profileKey = type === "student" ? "studentProfile" : "employeeProfile"

    // Common fields
    if (dirtyFields.birthPlace) { profilePayload.birthPlace = formData.birthPlace?.trim() || null }
    if (dirtyFields.birthDate) { profilePayload.birthDate = formData.birthDate || null }
    if (dirtyFields.gender) { profilePayload.gender = formData.gender }

    // Type-specific fields
    if (type === "student") {
      if (dirtyFields.nis) { profilePayload.nis = formData.nis.trim() }
      if (dirtyFields.guardianContact) { profilePayload.guardianContact = isEmptyPhone(formData.guardianContact) ? null : formData.guardianContact }
      if (dirtyFields.classroom) { profilePayload.classroom = formData.classroom }
      if (dirtyFields.grade) { profilePayload.grade = formData.grade }
      if (dirtyFields.iqScore) { profilePayload.iqScore = formData.iqScore?.trim() ? Number.parseInt(formData.iqScore) : null }
      if (dirtyFields.iqCategory) { profilePayload.iqCategory = formData.iqCategory || null }
    } else {
      if (dirtyFields.employeeId) { profilePayload.employeeId = formData.employeeId.trim() }
      if (dirtyFields.contact) { profilePayload.contact = isEmptyPhone(formData.contact) ? null : formData.contact }
      if (dirtyFields.department) { profilePayload.department = formData.department }
      if (dirtyFields.position) { profilePayload.position = formData.position }
      if (dirtyFields.yearsOfService) { profilePayload.yearsOfService = formData.yearsOfService?.trim() ? Number.parseInt(formData.yearsOfService) : null }
    }

    if (Object.keys(profilePayload).length > 0) { payload[profileKey] = profilePayload }
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
    // Modal container remains non-scrollable
    <div className="bg-white rounded-lg shadow-lg w-[90vw] max-w-[800px] h-[600px] flex flex-col">
      {/* MODIFIED: Header - Removed border-b */}
      <div className="flex-shrink-0 flex justify-between items-center p-6">
        <h2 className="text-lg font-semibold text-[#488BBE]">Edit Profil {type === "student" ? "Siswa" : "Karyawan"}</h2>
        <button type="button" onClick={onClose} className="text-[#488BBE] hover:text-[#3399E9] transition-colors"><span className="material-icons">close</span></button>
      </div>

      {/* Content - This area scrolls if content is too long. Dropdowns will float above it. */}
      <div className="flex-1 p-6 pt-0 overflow-y-auto">
        {errorMessage && (
          <div className="px-3 py-2 mb-4 text-xs bg-pink-100 border border-red-400 text-red-700 rounded-md">
            <div className="flex items-center"><span className="material-icons mr-1 text-sm">error</span>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField label="Nama Lengkap" error={errors.fullName} required>
              <input
                {...register("fullName")}
                className={clsx("w-full rounded-md h-10 border px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors", errors.fullName ? "border-red-500" : "border-gray-300")}
                placeholder="Nama lengkap"
              />
            </FormField>

            <FormField label="Tempat & Tanggal Lahir" error={errors.birthPlace || errors.birthDate}>
              <div
                className={clsx("flex items-center w-full h-10 rounded-md border bg-white focus-within:border-[#488BBE] transition-colors overflow-hidden", (errors.birthPlace || errors.birthDate) ? "border-red-500" : "border-gray-300")}
              >
                <input
                  {...register("birthPlace")}
                  className="flex-grow w-1/2 h-full bg-transparent px-3 text-sm focus:outline-none"
                  placeholder="Tempat lahir"
                />
                {/* MODIFIED: Added a visual divider */}
                <div className="w-px h-full bg-gray-300" />
                <input
                  type="date"
                  {...register("birthDate")}
                  className="flex-grow w-1/2 h-full bg-transparent px-3 text-sm focus:outline-none"
                />
              </div>
            </FormField>
          </div>

          {/* Other form rows... */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField label={type === "student" ? "NIS" : "ID Karyawan"} error={type === "student" ? errors.nis : errors.employeeId} required>
              <input
                {...register(type === "student" ? "nis" : "employeeId")}
                className={clsx("w-full rounded-md h-10 border px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors", (type === "student" ? errors.nis : errors.employeeId) ? "border-red-500" : "border-gray-300")}
                placeholder={type === "student" ? "NIS" : "ID Karyawan"}
              />
            </FormField>
            <FormField label={type === "student" ? "Kontak Wali" : "Kontak"} error={type === "student" ? errors.guardianContact : errors.contact}>
              <Controller
                name={type === "student" ? "guardianContact" : "contact"}
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    defaultCountry="id"
                    value={field.value || ""}
                    onChange={(value) => {
                      if (isEmptyPhone(value)) { field.onChange(""); return }
                      const digits = extractDigits(value)
                      if (digits.length <= 15) field.onChange(value)
                    }}
                    onBlur={() => {
                      if (isEmptyPhone(field.value)) field.onChange("");
                      field.onBlur()
                    }}
                    inputClassName={clsx("w-full h-10 border text-sm px-3 focus:outline-none focus:border-[#488BBE] transition-colors", (type === "student" ? errors.guardianContact : errors.contact) ? "border-red-500" : "border-gray-300")}
                    containerClassName="rounded-md overflow-hidden"
                    buttonClassName="h-10 px-3 flex items-center justify-center border-r border-gray-300"
                    placeholder={type === "student" ? "Kontak wali" : "Kontak"}
                    inputProps={{ maxLength: 20 }}
                    international
                    withCountryCallingCode
                    forceDialCode
                  />
                )}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {type === "student" ? (
              <FormField label="Kelas" error={errors.classroom || errors.grade} required>
                <CascadingClassroomDropdown
                  classroomValue={watchedClassroom}
                  gradeValue={watchedGrade}
                  onClassroomChange={(value) => setValue("classroom", value, { shouldDirty: true, shouldValidate: true })}
                  onGradeChange={(value) => setValue("grade", value, { shouldDirty: true, shouldValidate: true })}
                  classrooms={classrooms}
                  grades={grades}
                  error={errors.classroom || errors.grade}
                />
              </FormField>
            ) : (
              <FormField label="Departemen" error={errors.department} required>
                <Controller name="department" control={control} render={({ field }) => ( <CompactDropdown value={field.value} onChange={field.onChange} options={departments} placeholder="Pilih departemen" error={errors.department} /> )} />
              </FormField>
            )}
            {type === "student" ? (
              <FormField label="Skor IQ" error={errors.iqScore}>
                <input type="number" {...register("iqScore")} className="w-full rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors" placeholder="Skor IQ" min="0" max="200" />
              </FormField>
            ) : (
              <FormField label="Jabatan" error={errors.position} required>
                <Controller name="position" control={control} render={({ field }) => ( <CompactDropdown value={field.value} onChange={field.onChange} options={positions} placeholder="Pilih jabatan" error={errors.position} /> )} />
              </FormField>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField label="Jenis Kelamin" error={errors.gender} required>
              <Controller name="gender" control={control} render={({ field }) => ( <CompactDropdown value={field.value} onChange={field.onChange} options={genderOptions} placeholder="Pilih jenis kelamin" error={errors.gender} /> )} />
            </FormField>
            {type === "student" ? (
              <FormField label="Kategori" error={errors.iqCategory}>
                <Controller name="iqCategory" control={control} render={({ field }) => ( <CompactDropdown value={field.value} onChange={field.onChange} options={iqCategories} placeholder="Pilih kategori" error={errors.iqCategory} /> )} />
              </FormField>
            ) : (
              <FormField label="Lama Bekerja (Tahun)" error={errors.yearsOfService}>
                <input type="number" {...register("yearsOfService")} className="w-full rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors" placeholder="Lama bekerja" min="0" max="50" />
              </FormField>
            )}
          </div>
        </form>
      </div>

      {/* MODIFIED: Footer - Removed border-t */}
      <div className="flex-shrink-0 flex justify-end p-6 bg-white">
        <button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || updateMutation.isPending || !hasChanges}
          className={clsx( "h-10 px-6 rounded-md text-white font-semibold transition-colors text-sm", isSubmitting || updateMutation.isPending || !hasChanges ? "bg-gray-400 cursor-not-allowed" : "bg-[#488BBE] hover:bg-[#3399E9]" )}
        >
          {isSubmitting || updateMutation.isPending ? (<span className="flex items-center"><span className="material-icons animate-spin text-sm mr-1">refresh</span>Menyimpan...</span>) : ("Simpan")}
        </button>
      </div>
    </div>
  )
}

export default EditModal