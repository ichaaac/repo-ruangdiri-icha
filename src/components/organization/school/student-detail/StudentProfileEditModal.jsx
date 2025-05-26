// src/components/organization/school/student-detail/StudentProfileEditModal.jsx - Fixed size and proper grade dropdown
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Menu, Transition } from '@headlessui/react';
import clsx from "clsx";
import { PhoneInput } from 'react-international-phone';
import { format } from "date-fns";
import { useClassrooms } from "@/hooks/useStudentData";
import 'react-international-phone/style.css';

// Phone validation helpers
const extractDigits = (phone) => phone?.replace(/[^\d]/g, '') || '';
const isEmptyPhone = (phone) => {
  if (!phone) return true;
  const digits = extractDigits(phone);
  return !digits || digits.length <= 3; // Just country code
};

// Validation schema
const studentProfileSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  nis: z.string().min(1, "NIS wajib diisi"),
  guardianContact: z.string()
    .optional()
    .refine((value) => {
      if (isEmptyPhone(value)) return true;
      const digits = extractDigits(value);
      return digits.length >= 7 && digits.length <= 15;
    }, {
      message: "Nomor telepon harus 7-15 digit"
    }),
  classroom: z.string().min(1, "Kelas wajib diisi"),
  grade: z.string().min(1, "Grade wajib diisi"),
  gender: z.enum(["male", "female"], {
    required_error: "Jenis kelamin wajib dipilih"
  }),
  iqScore: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseInt(val);
      return !isNaN(num) && num >= 0 && num <= 200;
    }, { message: "Skor IQ harus antara 0-200" }),
  iqCategory: z.string().optional()
});

// Classroom and Grade Dropdown Component
const ClassroomGradeDropdown = ({ classroomValue, gradeValue, onClassroomChange, onGradeChange, classrooms, grades, error }) => {
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [gradeDropdownPosition, setGradeDropdownPosition] = useState({ top: 0, left: 0 });

  const handleClassroomSelect = (classroom, event) => {
    onClassroomChange(classroom);
    
    // Calculate position for grade dropdown
    const rect = event.currentTarget.getBoundingClientRect();
    setGradeDropdownPosition({
      top: rect.top,
      left: rect.right + 5
    });
    
    setIsClassroomOpen(false);
    setIsGradeOpen(true);
  };

  const handleGradeSelect = (grade) => {
    onGradeChange(grade);
    setIsGradeOpen(false);
  };

  return (
    <div className="flex gap-2">
      {/* Classroom Dropdown */}
      <div className="relative flex-1">
        <Menu as="div" className="relative">
          <Menu.Button
            className={clsx(
              "w-full h-10 px-3 border border-gray-300 rounded-md bg-white flex items-center justify-between focus:outline-none focus:border-[#488BBE] transition-colors text-sm",
              error ? "border-red-500" : "border-gray-300"
            )}
            onClick={() => setIsClassroomOpen(!isClassroomOpen)}
          >
            <span className={classroomValue ? "text-gray-900" : "text-gray-400"}>
              {classroomValue || "Kelas"}
            </span>
            <span className="material-icons text-gray-400 text-sm">
              {isClassroomOpen ? 'expand_less' : 'expand_more'}
            </span>
          </Menu.Button>

          <Transition
            show={isClassroomOpen}
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute z-20 mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-md py-1 focus:outline-none">
              {classrooms.map((classroom) => (
                <Menu.Item key={classroom}>
                  {({ active }) => (
                    <button
                      type="button"
                      className={clsx(
                        "w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors",
                        active && "bg-blue-50",
                        classroomValue === classroom && "bg-blue-100 text-blue-600"
                      )}
                      onClick={(e) => handleClassroomSelect(classroom, e)}
                    >
                      {classroom}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Grade Dropdown */}
      <div className="relative w-16">
        <button
          type="button"
          className="w-full h-10 px-2 border border-gray-300 rounded-md bg-white flex items-center justify-center focus:outline-none focus:border-[#488BBE] transition-colors text-sm"
          onClick={() => classroomValue && setIsGradeOpen(!isGradeOpen)}
          disabled={!classroomValue}
        >
          <span className={gradeValue ? "text-gray-900" : "text-gray-400"}>
            {gradeValue || "-"}
          </span>
        </button>
      </div>

      {/* Grade dropdown - positioned absolutely */}
      {isGradeOpen && classroomValue && (
        <div 
          className="fixed z-30 bg-white shadow-lg border border-gray-200 rounded-md py-1 w-12"
          style={{ 
            top: gradeDropdownPosition.top, 
            left: gradeDropdownPosition.left 
          }}
        >
          {grades.map((grade) => (
            <button
              key={grade}
              type="button"
              className="w-full text-center px-2 py-2 text-sm hover:bg-blue-50 transition-colors"
              onClick={() => handleGradeSelect(grade)}
            >
              {grade}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close grade dropdown */}
      {isGradeOpen && (
        <div 
          className="fixed inset-0 z-25" 
          onClick={() => setIsGradeOpen(false)}
        />
      )}
    </div>
  );
};

// Compact dropdown component
const CompactDropdown = ({ value, onChange, options, placeholder, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => 
    (typeof opt === 'object' ? opt.value : opt) === value
  );
  
  const displayValue = selectedOption ? 
    (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : 
    placeholder;

  return (
    <div className="relative">
      <Menu as="div" className="relative">
        <Menu.Button
          className={clsx(
            "w-full h-10 px-3 border border-gray-300 rounded-md bg-white flex items-center justify-between focus:outline-none focus:border-[#488BBE] transition-colors text-sm",
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
        </Menu.Button>

        <Transition
          show={isOpen}
          as={React.Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute z-10 mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-md py-1 focus:outline-none max-h-48 overflow-y-auto">
            {options.map((option, index) => {
              const optionValue = typeof option === 'object' ? option.value : option;
              const optionLabel = typeof option === 'object' ? option.label : option;
              
              return (
                <Menu.Item key={index}>
                  {({ active }) => (
                    <button
                      type="button"
                      className={clsx(
                        "w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors",
                        active && "bg-blue-50",
                        value === optionValue && "bg-blue-100 text-blue-600"
                      )}
                      onClick={() => {
                        onChange(optionValue);
                        setIsOpen(false);
                      }}
                    >
                      {optionLabel}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

// Custom form field component
const FormField = ({ label, error, children, required = false }) => (
  <div className="mb-3">
    <label className="block text-xs text-gray-500 mb-1">
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

const StudentProfileEditModal = ({ studentData, onClose, onSuccess, updateStudentMutation }) => {
  const [errorMessage, setErrorMessage] = useState("");
  
  const profile = studentData?.studentProfile || {};
  
  // Fetch classroom data
  const { data: classroomData } = useClassrooms();
  const classrooms = classroomData?.classroomsResult || ['X', 'XI', 'XII'];
  const grades = classroomData?.gradesResult || ['A', 'B', 'C', 'D'];
  
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
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, dirtyFields }
  } = useForm({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      fullName: studentData?.fullName || '',
      birthPlace: profile?.birthPlace || '',
      birthDate: formatDateForInput(profile?.birthDate),
      nis: profile?.nis || '',
      guardianContact: profile?.guardianContact || '',
      classroom: profile?.classroom || '',
      grade: profile?.grade || '',
      gender: profile?.gender || 'male',
      iqScore: profile?.iqScore?.toString() || '',
      iqCategory: profile?.iqCategory || ''
    },
    mode: "onChange"
  });

  // Watch classroom and grade values
  const watchedClassroom = watch('classroom');
  const watchedGrade = watch('grade');

  // Reset form when student data changes
  useEffect(() => {
    if (studentData) {
      reset({
        fullName: studentData?.fullName || '',
        birthPlace: profile?.birthPlace || '',
        birthDate: formatDateForInput(profile?.birthDate),
        nis: profile?.nis || '',
        guardianContact: profile?.guardianContact || '',
        classroom: profile?.classroom || '',
        grade: profile?.grade || '',
        gender: profile?.gender || 'male',
        iqScore: profile?.iqScore?.toString() || '',
        iqCategory: profile?.iqCategory || ''
      });
    }
  }, [studentData, profile, reset]);

  const onSubmit = (data) => {
    // Reset any previous error
    setErrorMessage("");
    
    // Build payload with only changed fields
    const payload = {};
    
    // Check if fullName is dirty and changed
    if (dirtyFields.fullName && data.fullName !== studentData?.fullName) {
      payload.fullName = data.fullName.trim();
    }
    
    // Check studentProfile fields
    const studentProfilePayload = {};
    
    if (dirtyFields.birthPlace && data.birthPlace !== profile?.birthPlace) {
      studentProfilePayload.birthPlace = data.birthPlace?.trim() || null;
    }
    
    if (dirtyFields.birthDate && data.birthDate !== formatDateForInput(profile?.birthDate)) {
      studentProfilePayload.birthDate = data.birthDate || null;
    }
    
    if (dirtyFields.nis && data.nis !== profile?.nis) {
      studentProfilePayload.nis = data.nis.trim();
    }
    
    if (dirtyFields.guardianContact && data.guardianContact !== profile?.guardianContact) {
      studentProfilePayload.guardianContact = isEmptyPhone(data.guardianContact) ? null : data.guardianContact;
    }
    
    if (dirtyFields.classroom && data.classroom !== profile?.classroom) {
      studentProfilePayload.classroom = data.classroom;
    }
    
    if (dirtyFields.grade && data.grade !== profile?.grade) {
      studentProfilePayload.grade = data.grade;
    }
    
    if (dirtyFields.gender && data.gender !== profile?.gender) {
      studentProfilePayload.gender = data.gender;
    }
    
    if (dirtyFields.iqScore && data.iqScore !== profile?.iqScore?.toString()) {
      studentProfilePayload.iqScore = data.iqScore?.trim() ? parseInt(data.iqScore) : null;
    }
    
    if (dirtyFields.iqCategory && data.iqCategory !== profile?.iqCategory) {
      studentProfilePayload.iqCategory = data.iqCategory || null;
    }
    
    // Add studentProfile to payload if there are changes
    if (Object.keys(studentProfilePayload).length > 0) {
      payload.studentProfile = studentProfilePayload;
    }
    
    // If no changes, don't submit
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    console.log('📝 Submitting only changed fields:', payload);

    // Submit the data
    updateStudentMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess("Profil berhasil diubah!");
      },
      onError: (error) => {
        setErrorMessage(error.response?.data?.message || "Terjadi kesalahan saat memperbarui data");
        console.error("Error updating student profile:", error);
      }
    });
  };

  const genderOptions = [
    { value: 'male', label: 'Laki-laki' },
    { value: 'female', label: 'Perempuan' }
  ];

  const iqCategories = [
    { value: 'very_below_average', label: 'Jauh di bawah Rata-rata' },
    { value: 'below_average', label: 'Di bawah Rata-rata' },
    { value: 'average', label: 'Rata-rata' },
    { value: 'above_average', label: 'Di atas Rata-rata' },
    { value: 'very_above_average', label: 'Jauh di atas Rata-rata' }
  ];

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg w-[778px] h-[424px] flex flex-col">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#488BBE]">Edit Profil Siswa</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="text-[#488BBE] hover:text-[#3399E9] transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {errorMessage && (
          <div className="px-3 py-2 mb-3 text-xs bg-pink-100 border border-red-400 text-red-700 rounded-md">
            <div className="flex items-center">
              <span className="material-icons mr-1 text-sm">error</span>
              {errorMessage}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Row 1: Full Name | Birth Place & Date */}
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
                  placeholder="Tempat lahir"
                />
                <input
                  type="date"
                  {...register("birthDate")}
                  className="flex-1 rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors"
                />
              </div>
            </FormField>
          </div>

          {/* Row 2: NIS | Guardian Contact */}
          <div className="grid grid-cols-2 gap-6">
            <FormField 
              label="NIS"
              error={errors.nis}
              required
            >
              <input
                {...register("nis")}
                className={clsx(
                  "w-full rounded-md h-10 border px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors",
                  errors.nis ? "border-red-500" : "border-gray-300"
                )}
                placeholder="NIS"
              />
            </FormField>

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
                      "w-full h-10 border text-sm px-3 focus:outline-none focus:border-[#488BBE] transition-colors",
                      errors.guardianContact ? "border-red-500" : "border-gray-300"
                    )}
                    containerClassName="rounded-md overflow-hidden"
                    buttonClassName="h-10 px-3 flex items-center justify-center border-r border-gray-300"
                    placeholder="Kontak wali"
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
          </div>

          {/* Row 3: Classroom & Grade | Gender */}
          <div className="grid grid-cols-2 gap-6">
            <FormField 
              label="Kelas"
              error={errors.classroom || errors.grade}
              required
            >
              <ClassroomGradeDropdown
                classroomValue={watchedClassroom}
                gradeValue={watchedGrade}
                onClassroomChange={(value) => setValue('classroom', value, { shouldDirty: true })}
                onGradeChange={(value) => setValue('grade', value, { shouldDirty: true })}
                classrooms={classrooms}
                grades={grades}
                error={errors.classroom || errors.grade}
              />
            </FormField>

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
          </div>

          {/* Row 4: IQ Score | IQ Category */}
          <div className="grid grid-cols-2 gap-6">
            <FormField 
              label="Skor IQ"
              error={errors.iqScore}
            >
              <input
                type="number"
                {...register("iqScore")}
                className="w-full rounded-md h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#488BBE] transition-colors"
                placeholder="Skor IQ"
                min="0"
                max="200"
              />
            </FormField>

            <FormField 
              label="Kategori"
              error={errors.iqCategory}
            >
              <Controller
                name="iqCategory"
                control={control}
                render={({ field }) => (
                  <CompactDropdown
                    value={field.value}
                    onChange={field.onChange}
                    options={iqCategories}
                    placeholder="Pilih kategori"
                    error={errors.iqCategory}
                  />
                )}
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
          disabled={isSubmitting || updateStudentMutation.isPending}
          className={clsx(
            "h-10 px-6 rounded-md text-white font-semibold transition-colors text-sm",
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
    </div>
  );
};

export default StudentProfileEditModal;