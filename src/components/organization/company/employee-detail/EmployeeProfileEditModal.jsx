// src/components/organization/company/employee-detail/EmployeeProfileEditModal.jsx
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Menu, Transition } from '@headlessui/react';
import clsx from "clsx";
import { PhoneInput } from 'react-international-phone';
import { format } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";
import { useDepartments } from "@/hooks/useEmployeeData";
import 'react-international-phone/style.css';

// Phone validation helpers
const extractDigits = (phone) => phone?.replace(/[^\d]/g, '') || '';
const isEmptyPhone = (phone) => {
  if (!phone) return true;
  const digits = extractDigits(phone);
  return !digits || digits.length <= 3;
};

// Helper to format birth info display
const formatBirthDisplay = (birthPlace, birthDate) => {
  if (!birthPlace && !birthDate) return "";
  
  let result = birthPlace || "";
  
  if (birthDate) {
    if (result) result += " | ";
    try {
      const date = new Date(birthDate);
      result += format(date, "d MMMM yyyy", { locale: indonesianLocale });
    } catch (e) {
      result += birthDate;
    }
  }
  
  return result;
};

// Validation schema
const employeeProfileSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  employeeId: z.string().min(1, "ID Karyawan wajib diisi"),
  contact: z.string()
    .optional()
    .refine((value) => {
      if (isEmptyPhone(value)) return true;
      const digits = extractDigits(value);
      return digits.length >= 7 && digits.length <= 15;
    }, {
      message: "Nomor telepon harus 7-15 digit"
    }),
  department: z.string().min(1, "Departemen wajib diisi"),
  position: z.string().min(1, "Jabatan wajib diisi"),
  gender: z.enum(["male", "female"], {
    required_error: "Jenis kelamin wajib dipilih"
  }),
  yearsOfService: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseInt(val);
      return !isNaN(num) && num >= 0 && num <= 50;
    }, { message: "Lama bekerja harus antara 0-50 tahun" })
});

// Compact dropdown component with external overflow
const CompactDropdown = ({ value, onChange, options, placeholder, error, allowOverflow = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => 
    (typeof opt === 'object' ? opt.value : opt) === value
  );
  
  const displayValue = selectedOption ? 
    (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : 
    placeholder;

  return (
    <div className="relative">
      <button
        type="button"
        className={clsx(
          "w-full h-10 px-3 border rounded-md bg-white flex items-center justify-between focus:outline-none focus:border-[#488BBE] transition-colors text-sm",
          error ? "border-red-500" : "border-gray-300"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {displayValue}
        </span>
        <span className="material-icons text-gray-400 text-sm">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className={clsx(
          "absolute mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-md py-1 focus:outline-none",
          allowOverflow ? "z-[60] max-h-none" : "z-50 max-h-48 overflow-y-auto"
        )}>
          {options.map((option, index) => {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;
            
            return (
              <button
                key={index}
                type="button"
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors",
                  value === optionValue && "bg-blue-100 text-blue-600"
                )}
                onClick={() => {
                  onChange(optionValue);
                  setIsOpen(false);
                }}
              >
                {optionLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Custom form field component
const FormField = ({ label, error, children, required = false }) => (
  <div className="mb-4">
    <label className="block text-xs text-gray-500 mb-2">
      {label}{required && '*'}
    </label>
    {children}
    {error && (
      <span className="text-xs text-red-500 mt-1 block">
        {error.message}
      </span>
    )}
  </div>
);

const EmployeeProfileEditModal = ({ employeeData, onClose, onSuccess, updateEmployeeMutation }) => {
  const [errorMessage, setErrorMessage] = useState("");
  
  const profile = employeeData?.employeeProfile || employeeData || {};
  
  // Fetch departments and positions data
  const { data: departmentData } = useDepartments();
  const departments = departmentData?.departments || ['Human Resources', 'Finance', 'Marketing', 'IT', 'Operations'];
  const positions = departmentData?.positions || ['Head', 'Manager', 'Staff', 'Specialist', 'Developer', 'Analyst'];
  
  // Format birth date to YYYY-MM-DD for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch (e) {
      return '';
    }
  };

  // Initialize form with employee data
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, dirtyFields }
  } = useForm({
    resolver: zodResolver(employeeProfileSchema),
    defaultValues: {
      fullName: employeeData?.fullName || '',
      birthPlace: profile?.birthPlace || '',
      birthDate: formatDateForInput(profile?.birthDate),
      employeeId: profile?.employeeId || profile?.id || '',
      contact: profile?.contact || profile?.phone || '',
      department: profile?.department || '',
      position: profile?.position || '',
      gender: profile?.gender || 'male',
      yearsOfService: profile?.yearsOfService?.toString() || ''
    },
    mode: "onChange"
  });

  // Reset form when employee data changes
  useEffect(() => {
    if (employeeData) {
      reset({
        fullName: employeeData?.fullName || '',
        birthPlace: profile?.birthPlace || '',
        birthDate: formatDateForInput(profile?.birthDate),
        employeeId: profile?.employeeId || profile?.id || '',
        contact: profile?.contact || profile?.phone || '',
        department: profile?.department || '',
        position: profile?.position || '',
        gender: profile?.gender || 'male',
        yearsOfService: profile?.yearsOfService?.toString() || ''
      });
    }
  }, [employeeData, profile, reset]);

  const onSubmit = (data) => {
    setErrorMessage("");
    
    // Build payload with only changed fields
    const payload = {};
    
    if (dirtyFields.fullName && data.fullName !== employeeData?.fullName) {
      payload.fullName = data.fullName.trim();
    }
    
    const employeeProfilePayload = {};
    
    if (dirtyFields.birthPlace && data.birthPlace !== profile?.birthPlace) {
      employeeProfilePayload.birthPlace = data.birthPlace?.trim() || null;
    }
    
    if (dirtyFields.birthDate && data.birthDate !== formatDateForInput(profile?.birthDate)) {
      employeeProfilePayload.birthDate = data.birthDate || null;
    }
    
    if (dirtyFields.employeeId && data.employeeId !== (profile?.employeeId || profile?.id)) {
      employeeProfilePayload.employeeId = data.employeeId.trim();
    }
    
    if (dirtyFields.contact && data.contact !== (profile?.contact || profile?.phone)) {
      employeeProfilePayload.contact = isEmptyPhone(data.contact) ? null : data.contact;
    }
    
    if (dirtyFields.department && data.department !== profile?.department) {
      employeeProfilePayload.department = data.department;
    }
    
    if (dirtyFields.position && data.position !== profile?.position) {
      employeeProfilePayload.position = data.position;
    }
    
    if (dirtyFields.gender && data.gender !== profile?.gender) {
      employeeProfilePayload.gender = data.gender;
    }
    
    if (dirtyFields.yearsOfService && data.yearsOfService !== profile?.yearsOfService?.toString()) {
      employeeProfilePayload.yearsOfService = data.yearsOfService?.trim() ? parseInt(data.yearsOfService) : null;
    }
    
    if (Object.keys(employeeProfilePayload).length > 0) {
      payload.employeeProfile = employeeProfilePayload;
    }
    
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    console.log('📝 Submitting only changed fields:', payload);

    updateEmployeeMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess("Profil berhasil diubah!");
      },
      onError: (error) => {
        setErrorMessage(error.response?.data?.message || "Terjadi kesalahan saat memperbarui data");
        console.error("Error updating employee profile:", error);
      }
    });
  };

  const genderOptions = [
    { value: 'male', label: 'L' },
    { value: 'female', label: 'P' }
  ];

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg w-[778px] h-[500px] flex flex-col">
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-[#488BBE]">Edit Profil Karyawan</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="text-[#488BBE] hover:text-[#3399E9] transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {errorMessage && (
          <div className="px-3 py-2 mb-4 text-xs bg-pink-100 border border-red-400 text-red-700 rounded-md">
            <div className="flex items-center">
              <span className="material-icons mr-1 text-sm">error</span>
              {errorMessage}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Row 1: Full Name | Tempat Tanggal Lahir */}
          <div className="grid grid-cols-2 gap-6">
            <FormField 
              label="Nama Lengkap"
              error={errors.fullName}
              required
            >
              <input
                {...register("fullName")}
                className={clsx(
                  "w-full rounded-md h-10 border px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors",
                  errors.fullName ? "border-red-500" : "border-gray-300"
                )}
                placeholder="Nama lengkap"
              />
            </FormField>

            <FormField 
              label="Tempat Tanggal Lahir"
              error={errors.birthPlace}
            >
              <div className="flex gap-2">
                <input
                  {...register("birthPlace")}
                  className="flex-1 rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors"
                  placeholder="Jakarta"
                />
                <div className="flex items-center px-2 text-gray-400">|</div>
                <input
                  type="date"
                  {...register("birthDate")}
                  className="flex-1 rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors"
                />
              </div>
            </FormField>
          </div>

          {/* Row 2: Employee ID | Kontak */}
          <div className="grid grid-cols-2 gap-6">
            <FormField 
              label="ID Karyawan"
              error={errors.employeeId}
              required
            >
              <input
                {...register("employeeId")}
                className={clsx(
                  "w-full rounded-md h-10 border px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors",
                  errors.employeeId ? "border-red-500" : "border-gray-300"
                )}
                placeholder="ID Karyawan"
              />
            </FormField>

            <FormField 
              label="Kontak"
              error={errors.contact}
            >
              <Controller
                name="contact"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    defaultCountry="id"
                    value={field.value || ''}
                    onChange={(value) => {
                      if (isEmptyPhone(value)) {
                        field.onChange('');
                        return;
                      }
                      const digits = extractDigits(value);
                      if (digits.length <= 15) field.onChange(value);
                    }}
                    onBlur={() => {
                      if (isEmptyPhone(field.value)) field.onChange('');
                      field.onBlur();
                    }}
                    inputClassName={clsx(
                      "w-full h-10 border text-sm px-3 focus:outline-none focus:border-[#488BBE] transition-colors",
                      errors.contact ? "border-red-500" : "border-gray-300"
                    )}
                    containerClassName="rounded-md overflow-hidden"
                    buttonClassName="h-10 px-3 flex items-center justify-center border-r border-gray-300"
                    placeholder="Kontak"
                    inputProps={{ maxLength: 20 }}
                    international
                    withCountryCallingCode
                    forceDialCode
                  />
                )}
              />
            </FormField>
          </div>

          {/* Row 3: Department | Position */}
          <div className="grid grid-cols-2 gap-6">
            <FormField 
              label="Departemen"
              error={errors.department}
              required
            >
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <CompactDropdown
                    value={field.value}
                    onChange={field.onChange}
                    options={departments}
                    placeholder="Pilih departemen"
                    error={errors.department}
                  />
                )}
              />
            </FormField>

            <FormField 
              label="Jabatan"
              error={errors.position}
              required
            >
              <Controller
                name="position"
                control={control}
                render={({ field }) => (
                  <CompactDropdown
                    value={field.value}
                    onChange={field.onChange}
                    options={positions}
                    placeholder="Pilih jabatan"
                    error={errors.position}
                  />
                )}
              />
            </FormField>
          </div>

          {/* Row 4: Jenis Kelamin | Lama Bekerja */}
          <div className="grid grid-cols-2 gap-6">
            <FormField 
              label="Jenis Kelamin"
              error={errors.gender}
              required
            >
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <CompactDropdown
                    value={field.value}
                    onChange={field.onChange}
                    options={genderOptions}
                    placeholder="Pilih gender"
                    error={errors.gender}
                  />
                )}
              />
            </FormField>

            <FormField 
              label="Lama Bekerja (Tahun)"
              error={errors.yearsOfService}
            >
              <input
                type="number"
                {...register("yearsOfService")}
                className="w-full rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors"
                placeholder="Lama bekerja"
                min="0"
                max="50"
              />
            </FormField>
          </div>
        </form>
      </div>

      {/* Fixed Footer */}
      <div className="flex justify-end p-6 border-t bg-white">
        <button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || updateEmployeeMutation.isPending}
          className={clsx(
            "h-10 px-6 rounded-md text-white font-semibold transition-colors text-sm",
            isSubmitting || updateEmployeeMutation.isPending
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#488BBE] hover:bg-[#3399E9]"
          )}
        >
          {isSubmitting || updateEmployeeMutation.isPending ? (
            <span className="flex items-center">
              <span className="material-icons animate-spin text-sm mr-1">refresh</span>
              Menyimpan...
            </span>
          ) : (
            "Simpan"
          )}
        </button>
      </div>
    </div>
  );
};

export { EmployeeProfileEditModal };