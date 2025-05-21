// src/components/organization/school/student-detail/StudentProfileEditModal.jsx
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import clsx from "clsx";
import { PhoneInput } from 'react-international-phone';
import { format } from "date-fns";
import 'react-international-phone/style.css';

// Phone validation helpers
const extractDigits = (phone) => phone?.replace(/[^\d]/g, '') || '';
const isEmptyPhone = (phone) => {
  const digits = extractDigits(phone);
  return !digits || digits.length <= 3; // Just country code
};

// Validation schema
const studentProfileSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  nis: z.string().min(1, "NIS wajib diisi"),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female"]),
  classroom: z.string().min(1, "Kelas wajib diisi"),
  guardianName: z.string().optional(),
  guardianContact: z.string()
    .optional()
    .refine((value) => {
      if (isEmptyPhone(value)) return true;
      const digits = extractDigits(value);
      return digits.length >= 7 && digits.length <= 15;
    }, {
      message: "Nomor telepon harus 7-15 digit"
    }),
  iqScore: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseInt(val);
      return !isNaN(num) && num >= 0 && num <= 200;
    }, { message: "Skor IQ harus antara 0-200" })
    .transform(val => val ? parseInt(val) : null),
});

// Confirmation modal component
const ConfirmationModal = ({ onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center">
    <div className="fixed inset-0 bg-black bg-opacity-30"></div>
    <div className="bg-white rounded-lg w-[400px] py-8 px-6 relative z-10 flex flex-col items-center">
      <div className="mb-4">
        <div className="w-24 h-24 rounded-full bg-[#F5385D] flex items-center justify-center text-white">
          <span className="material-icons text-5xl">error_outline</span>
        </div>
      </div>
      <p className="text-gray-500 mb-2 text-center">Perubahan yang belum disimpan akan hilang.</p>
      <h3 className="text-[#F5385D] font-bold text-xl mb-6 text-center">Apakah kamu yakin?</h3>
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="px-10 py-2 border border-[#F5385D] rounded-full text-[#F5385D] hover:bg-red-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          className="px-10 py-2 bg-[#F5385D] rounded-full text-white hover:bg-red-600 transition-colors"
        >
          Ya
        </button>
      </div>
    </div>
  </div>
);

// Custom form field component
const FormField = ({ label, error, children }) => (
  <div className="mb-4">
    <label className="block text-sm text-gray-500 mb-1">{label}</label>
    {children}
    {error && (
      <span className="text-xs text-red-500 mt-1 block">
        {error.message}
      </span>
    )}
  </div>
);

const StudentProfileEditModal = ({ studentData, onClose, onSuccess, updateStudentMutation }) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const profile = studentData?.studentProfile || {};
  
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

  // Initialize form with student data
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = useForm({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      fullName: studentData?.fullName || '',
      nis: profile?.nis || '',
      birthPlace: profile?.birthPlace || '',
      birthDate: formatDateForInput(profile?.birthDate),
      gender: profile?.gender || 'male',
      classroom: profile?.classroom || '',
      guardianName: profile?.guardianName || '',
      guardianContact: profile?.guardianContact || '',
      iqScore: profile?.iqScore?.toString() || '',
    },
    mode: "onChange"
  });

  // Reset form when student data changes
  useEffect(() => {
    if (studentData) {
      reset({
        fullName: studentData?.fullName || '',
        nis: profile?.nis || '',
        birthPlace: profile?.birthPlace || '',
        birthDate: formatDateForInput(profile?.birthDate),
        gender: profile?.gender || 'male',
        classroom: profile?.classroom || '',
        guardianName: profile?.guardianName || '',
        guardianContact: profile?.guardianContact || '',
        iqScore: profile?.iqScore?.toString() || '',
      });
    }
  }, [studentData, profile, reset]);

  const onSubmit = (data) => {
    // Reset any previous error
    setErrorMessage("");
    
    // Clean up and format data
    const formattedData = {
      fullName: data.fullName.trim(),
      studentProfile: {
        nis: data.nis.trim(),
        gender: data.gender,
        classroom: data.classroom.trim(),
      }
    };

    // Add optional fields if they have values
    if (data.birthPlace?.trim()) {
      formattedData.studentProfile.birthPlace = data.birthPlace.trim();
    }
    
    if (data.birthDate) {
      formattedData.studentProfile.birthDate = data.birthDate;
    }
    
    if (data.guardianName?.trim()) {
      formattedData.studentProfile.guardianName = data.guardianName.trim();
    }
    
    if (!isEmptyPhone(data.guardianContact)) {
      formattedData.studentProfile.guardianContact = data.guardianContact;
    }
    
    if (data.iqScore !== null) {
      formattedData.studentProfile.iqScore = data.iqScore;
    }

    // Submit the data
    updateStudentMutation.mutate(formattedData, {
      onSuccess: () => {
        onSuccess("Data siswa berhasil diperbarui!");
      },
      onError: (error) => {
        setErrorMessage(error.response?.data?.message || "Terjadi kesalahan saat memperbarui data");
        console.error("Error updating student profile:", error);
      }
    });
  };

  const handleCloseClick = () => {
    if (isDirty) {
      setShowConfirmationModal(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg w-[720px] max-w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#488BBE]">Edit Profil Siswa</h2>
            <button 
              type="button" 
              onClick={handleCloseClick}
              className="text-[#488BBE] hover:text-[#3399E9] transition-colors"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          {errorMessage && (
            <div className="px-4 py-3 mb-4 text-xs bg-pink-100 border border-red-400 text-red-700 rounded-md">
              <div className="flex items-center">
                <span className="material-icons mr-2 text-sm">error</span>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-x-6">
              {/* Full Name */}
              <FormField 
                label="Nama Lengkap*"
                error={errors.fullName}
              >
                <input
                  {...register("fullName")}
                  className={clsx(
                    "w-full rounded-md h-12 border-[1.5px] px-4 focus:outline-none focus:border-[#488BBE] transition-colors",
                    errors.fullName ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="Masukkan nama lengkap siswa"
                />
              </FormField>

              {/* NIS */}
              <FormField 
                label="NIS*"
                error={errors.nis}
              >
                <input
                  {...register("nis")}
                  className={clsx(
                    "w-full rounded-md h-12 border-[1.5px] px-4 focus:outline-none focus:border-[#488BBE] transition-colors",
                    errors.nis ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="Masukkan NIS"
                />
              </FormField>

              {/* Birth Place */}
              <FormField 
                label="Tempat Lahir"
                error={errors.birthPlace}
              >
                <input
                  {...register("birthPlace")}
                  className="w-full rounded-md h-12 border-[1.5px] border-gray-300 px-4 focus:outline-none focus:border-[#488BBE] transition-colors"
                  placeholder="Masukkan tempat lahir (opsional)"
                />
              </FormField>

              {/* Birth Date */}
              <FormField 
                label="Tanggal Lahir"
                error={errors.birthDate}
              >
                <input
                  type="date"
                  {...register("birthDate")}
                  className="w-full rounded-md h-12 border-[1.5px] border-gray-300 px-4 focus:outline-none focus:border-[#488BBE] transition-colors date-none"
                />
              </FormField>

              {/* Gender */}
              <FormField 
                label="Jenis Kelamin*"
                error={errors.gender}
              >
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="male"
                      {...register("gender")}
                      className="w-4 h-4 accent-[#488BBE]"
                    />
                    <span>Laki-laki</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="female"
                      {...register("gender")}
                      className="w-4 h-4 accent-[#488BBE]"
                    />
                    <span>Perempuan</span>
                  </label>
                </div>
              </FormField>

              {/* Class */}
              <FormField 
                label="Kelas*"
                error={errors.classroom}
              >
                <input
                  {...register("classroom")}
                  className={clsx(
                    "w-full rounded-md h-12 border-[1.5px] px-4 focus:outline-none focus:border-[#488BBE] transition-colors",
                    errors.classroom ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="Contoh: X-1, XI IPA 2"
                />
              </FormField>

              {/* Guardian Name */}
              <FormField 
                label="Nama Wali"
                error={errors.guardianName}
              >
                <input
                  {...register("guardianName")}
                  className="w-full rounded-md h-12 border-[1.5px] border-gray-300 px-4 focus:outline-none focus:border-[#488BBE] transition-colors"
                  placeholder="Masukkan nama wali siswa (opsional)"
                />
              </FormField>

              {/* Guardian Contact */}
              <FormField 
                label="Kontak Wali"
                error={errors.guardianContact}
              >
                <Controller
                  name="guardianContact"
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
                        "w-full h-12 border-[1.5px] text-base px-4 focus:outline-none focus:border-[#488BBE] transition-colors",
                        errors.guardianContact ? "border-red-500" : "border-gray-300"
                      )}
                      containerClassName="rounded-md overflow-hidden"
                      buttonClassName="h-12 px-3 flex items-center justify-center border-r border-gray-300"
                      placeholder="Masukkan nomor telepon wali (opsional)"
                      inputProps={{
                        maxLength: 20,
                      }}
                      international
                      withCountryCallingCode
                      forceDialCode
                    />
                  )}
                />
              </FormField>

              {/* IQ Score */}
              <FormField 
                label="Skor IQ"
                error={errors.iqScore}
              >
                <input
                  type="number"
                  {...register("iqScore")}
                  className="w-full rounded-md h-12 border-[1.5px] border-gray-300 px-4 focus:outline-none focus:border-[#488BBE] transition-colors"
                  placeholder="Masukkan skor IQ (opsional)"
                  min="0"
                  max="200"
                />
              </FormField>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting || updateStudentMutation.isPending}
                className={clsx(
                  "h-12 px-6 rounded-md text-white font-semibold transition-colors",
                  isSubmitting || updateStudentMutation.isPending
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#488BBE] hover:bg-[#3399E9]"
                )}
              >
                {isSubmitting || updateStudentMutation.isPending ? (
                  <span className="flex items-center">
                    <span className="material-icons animate-spin text-sm mr-1">refresh</span>
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <ConfirmationModal
          onCancel={() => setShowConfirmationModal(false)}
          onConfirm={() => {
            setShowConfirmationModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default StudentProfileEditModal;