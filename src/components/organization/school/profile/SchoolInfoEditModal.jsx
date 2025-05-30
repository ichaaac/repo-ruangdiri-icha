// src/components/organization/school/profile/SchoolInfoEditModal.jsx
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../../lib/api";
import clsx from "clsx";
import ConfirmationModal from "../../company/profile/ConfirmationModal";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { validatePhoneNumber, isEmptyPhone, extractDigits } from "../../../../lib/phoneUtils";

// Schema validasi - semua field optional, cuma validasi format kalau ada isi
const schoolInfoSchema = z.object({
  fullName: z.string().optional(),
  address: z.string().max(255, "Alamat maksimal 255 karakter").optional(),
  phone: z.string().optional().refine((phone) => {
    if (!phone || phone.trim() === '' || isEmptyPhone(phone)) {
      return true;
    }
    const error = validatePhoneNumber(phone);
    return error === null;
  }, {
    message: "Format nomor telepon tidak valid",
  }),
});

const SchoolInfoEditModal = ({ onClose, userData }) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [phoneValidationError, setPhoneValidationError] = useState("");

  // Default values dari userData
  const defaultValues = {
    fullName: userData?.fullName || "",
    address: userData?.organization?.address || "",
    phone: userData?.organization?.phone || "",
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues,
    mode: "onBlur",
  });

  const watchedFields = watch();
  const addressLength = watchedFields.address?.length || 0;

  // Cek apakah ada perubahan dari nilai awal
  const hasChanges = 
    watchedFields.fullName !== defaultValues.fullName ||
    watchedFields.address !== defaultValues.address ||
    watchedFields.phone !== defaultValues.phone;

  useEffect(() => {
    if (userData) {
      setValue("fullName", userData.fullName || "");
      setValue("address", userData.organization?.address || "");
      setValue("phone", userData.organization?.phone || "");
    }
  }, [userData, setValue]);

  const updateSchoolInfoMutation = useMutation({
    mutationFn: async (data) => {
      setErrorMessage("");
      
      return apiClient.patch('/organizations/profile', {
        fullName: data.fullName || "", // Kirim string kosong kalau undefined
        address: data.address || "",
        phone: data.phone || "",
      });
    },
    onSuccess: () => onClose(true),
    onError: (error) => {
      console.error("School info update error:", error);
      setErrorMessage(
        error.response?.data?.message || 
        "Terjadi kesalahan saat mengubah informasi sekolah"
      );
    },
  });

  const onSubmit = (data) => {
    setErrorMessage("");
    
    // Double check phone validation before submit hanya kalau ada isi
    if (data.phone && !isEmptyPhone(data.phone)) {
      const phoneError = validatePhoneNumber(data.phone);
      if (phoneError) {
        setPhoneValidationError(phoneError);
        return;
      }
    }
    
    updateSchoolInfoMutation.mutate(data);
  };

  const handleCloseClick = () => {
    hasChanges ? setShowConfirmationModal(true) : onClose(false);
  };

  const handlePhoneChange = (value, field) => {
    if (isEmptyPhone(value)) {
      field.onChange('');
      setPhoneValidationError('');
      return;
    }
    
    const digits = extractDigits(value);
    if (digits.length <= 15) {
      field.onChange(value);
      
      // Real-time validation hanya kalau ada isi
      if (value && !isEmptyPhone(value)) {
        const error = validatePhoneNumber(value);
        setPhoneValidationError(error || '');
      } else {
        setPhoneValidationError('');
      }
      
      // Trigger form validation
      setTimeout(() => trigger('phone'), 100);
    }
  };

  const handlePhoneBlur = (field) => {
    if (isEmptyPhone(field.value)) {
      field.onChange('');
      setPhoneValidationError('');
    } else {
      // Final validation on blur hanya kalau ada isi
      const error = validatePhoneNumber(field.value);
      setPhoneValidationError(error || '');
    }
    field.onBlur();
  };

  if (showConfirmationModal) {
    return (
      <ConfirmationModal
        onCancel={() => setShowConfirmationModal(false)}
        onConfirm={() => {
          setShowConfirmationModal(false);
          onClose(false);
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg w-[520px] max-w-full">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Edit Informasi Sekolah
          </h2>
          <button 
            type="button" 
            onClick={handleCloseClick}
            className="text-primary hover:text-primary-variant1 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            {/* Nama Sekolah - Optional */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                {...register("fullName")}
                className={clsx(
                  "w-full rounded-md h-12 border-[1.5px] px-4 focus:outline-none focus:border-primary",
                  errors.fullName ? "border-red-500" : "border-gray-300"
                )}
                autoComplete="organization"
              />
              {errors.fullName && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.fullName.message}
                </span>
              )}
            </div>

            {/* Alamat - Optional dengan character counter */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm text-gray-500">
                  Alamat
                </label>
              </div>

              <textarea
                {...register("address")}
                rows={3}
                maxLength={255}
                className={clsx(
                  "w-full rounded-md border-[1.5px] px-4 py-3 focus:outline-none focus:border-primary resize-none pr-14",
                  errors.address ? "border-red-500" : "border-gray-300"
                )}
                placeholder="Masukkan alamat lengkap sekolah"
                autoComplete="street-address"
              />

              <span className="absolute bottom-2 right-3 text-xs text-gray-400 pointer-events-none select-none">
                {addressLength}/255
              </span>

              {errors.address && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.address.message}
                </span>
              )}
            </div>

            {/* Nomor Telepon - Optional */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Nomor Telepon
              </label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    defaultCountry="id"
                    value={field.value || ''}
                    onChange={(value) => handlePhoneChange(value, field)}
                    onBlur={() => handlePhoneBlur(field)}
                    inputClassName={clsx(
                      "w-full h-12 border-[1.5px] text-base px-4 focus:outline-none focus:border-primary",
                      (errors.phone || phoneValidationError) ? "border-red-500" : "border-gray-300"
                    )}
                    containerClassName="rounded-md overflow-hidden"
                    buttonClassName="h-12 px-3 flex items-center justify-center border-r border-gray-300"
                    placeholder="Masukkan nomor telepon"
                    inputProps={{
                      maxLength: 20,
                    }}
                    international
                    withCountryCallingCode
                    forceDialCode
                  />
                )}
              />
              {(errors.phone || phoneValidationError) && (
                <span className="text-xs text-red-500 mt-1 block">
                  {phoneValidationError || errors.phone?.message}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              {/* Error message on the left */}
              <div className="flex-grow mr-4">
                {errorMessage && (
                  <div className="inline-block px-4 py-3 text-xs bg-pink-100 border border-red-400 text-red-700 rounded-md" style={{ maxWidth: 'fit-content' }}>
                    <div className="flex items-center">
                      <span className="material-icons mr-2 text-sm">error</span>
                      {errorMessage}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submit button - disabled kalau gak ada perubahan */}
              <button
                type="submit"
                disabled={
                  !hasChanges || 
                  isSubmitting || 
                  Object.keys(errors).length > 0 || 
                  phoneValidationError || 
                  updateSchoolInfoMutation.isPending
                }
                className={clsx(
                  "h-12 px-6 rounded-md text-white font-semibold transition-colors",
                  hasChanges && 
                  !isSubmitting && 
                  Object.keys(errors).length === 0 && 
                  !phoneValidationError && 
                  !updateSchoolInfoMutation.isPending
                    ? "bg-primary hover:bg-primary-variant1"
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                {isSubmitting || updateSchoolInfoMutation.isPending ? (
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
        </form>
      </div>
    </div>
  );
};

export default SchoolInfoEditModal;