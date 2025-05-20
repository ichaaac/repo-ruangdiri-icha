// src/components/organization/school/profile/SchoolInfoEditModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../../lib/api";
import clsx from "clsx";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

const extractDigits = (phone) => phone?.replace(/[^\d]/g, '') || '';
const isEmptyPhone = (phone) => {
  const digits = extractDigits(phone);
  return !digits || digits.length <= 3; // Just country code
};

// Memperbaiki validasi schema
const schoolInfoSchema = z.object({
  fullName: z.string().nullable(),
  address: z.string().optional().transform(val => val?.trim() || ''),
  phone: z.string()
    .optional()
    .refine((value) => {
      if (isEmptyPhone(value)) return true;
      const digits = extractDigits(value);
      return digits.length >= 7 && digits.length <= 15;
    }, {
      message: "Nomor telepon harus 7-15 digit"
    })
});

// AutoResizeTextarea component dimodifikasi untuk mengatasi masalah newline
const AutoResizeTextarea = ({ className, ...props }) => {
  const textareaRef = useRef(null);
  
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  useEffect(() => {
    adjustHeight();
  }, [props.value]);
  
  return (
    <textarea
      ref={textareaRef}
      className={className}
      onChange={(e) => {
        props.onChange(e);
        adjustHeight();
      }}
      {...props}
      style={{ resize: 'none', overflow: 'hidden', minHeight: '48px' }}
    />
  );
};

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

const SchoolInfoEditModal = ({ onClose, userData }) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();

  // Initialize form
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      fullName: userData?.fullName || "",
      address: userData?.organization?.address || "",
      phone: isEmptyPhone(userData?.organization?.phone) ? "" : userData?.organization?.phone || "",
    },
    mode: "onChange",
  });

  const addressValue = watch("address");
  
  // Improved validation for determining if changes are meaningful
  const isMeaninglessChange = () => {
    // If the only changes are whitespace or newlines, consider it meaningless
    const trimmedAddress = addressValue.replace(/\s+/g, '');
    const originalAddress = (userData?.organization?.address || "").replace(/\s+/g, '');
    
    return (
      !isDirty || 
      (trimmedAddress === originalAddress && 
        trimmedAddress === "" && 
        Object.keys(isDirty).length === 1 && 
        isDirty.address)
    );
  };

  // Handle changes to address field
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setValue("address", value);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      setErrorMessage("");
      
      const processedData = {
        fullName: data.fullName === null ? "" : data.fullName,
        address: !data.address || data.address.trim() === "" ? "" : data.address.trim(),
        phone: isEmptyPhone(data.phone) ? "" : data.phone
      };
      
      console.log("Submitting school info:", processedData);
      
      try {
        const response = await apiClient.patch('/organizations/profile', processedData);
        return response;
      } catch (error) {
        console.error("First attempt failed:", error);
        if (processedData.fullName === "") {
          console.log("Trying direct API call to set empty name");
          const directResponse = await apiClient.patch('/organizations/profile/name', { fullName: "" });
          return directResponse;
        }
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log("Update profile success:", response.data);
      
      // Invalidate both queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['school-profile'] });
      
      onClose(true);
    },
    onError: (error) => {
      console.error("Update profile error:", error);
      setErrorMessage(error.response?.data?.message || "Terjadi kesalahan");
    },
  });

  const onSubmit = (data) => {
    // Process and submit data
    updateProfileMutation.mutate(data);
  };

  const handleCloseClick = () => {
    if (isDirty && !isMeaninglessChange()) {
      setShowConfirmationModal(true);
    } else {
      onClose(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg w-[520px] max-w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary">Edit Informasi Sekolah</h2>
            <button 
              type="button" 
              onClick={handleCloseClick}
              className="text-primary hover:text-primary-variant1 transition-colors"
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
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Nama Sekolah
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    {...register("fullName")}
                    className={clsx(
                      "w-full rounded-md h-12 border-[1.5px] px-4 pr-10 focus:outline-none focus:border-primary",
                      errors.fullName ? "border-red-500" : "border-gray-300"
                    )}
                  />
                </div>
                {errors.fullName && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {errors.fullName.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Alamat Sekolah
                </label>
                <AutoResizeTextarea
                  {...register("address")}
                  onChange={handleAddressChange}
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim();
                    setValue("address", trimmed);
                  }}
                  className="w-full rounded-md px-4 py-3 focus:outline-none focus:border-primary border-[1.5px] border-gray-300 resize-none max-h-32 overflow-y-auto"
                  value={addressValue}
                />
              </div>

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
                        "w-full h-12 border-[1.5px] text-base px-4 focus:outline-none focus:border-primary",
                        errors.phone ? "border-red-500" : "border-gray-300"
                      )}
                      containerClassName="rounded-md overflow-hidden"
                      buttonClassName="h-12 px-3 flex items-center justify-center border-r border-gray-300"
                      placeholder="Masukkan nomor telepon (opsional)"
                      inputProps={{
                        maxLength: 20,
                      }}
                      international
                      withCountryCallingCode
                      forceDialCode
                    />
                  )}
                />
                {errors.phone && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {errors.phone.message}
                  </span>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !isDirty ||
                    isMeaninglessChange() || 
                    updateProfileMutation.isPending
                  }
                  className={clsx(
                    "h-12 px-6 rounded-md text-white font-semibold transition-colors",
                    isDirty && !isMeaninglessChange() && !isSubmitting && !updateProfileMutation.isPending
                      ? "bg-primary hover:bg-primary-variant1"
                      : "bg-gray-400 cursor-not-allowed"
                  )}
                >
                  {isSubmitting || updateProfileMutation.isPending ? (
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

      {showConfirmationModal && (
        <ConfirmationModal
          onCancel={() => setShowConfirmationModal(false)}
          onConfirm={() => {
            setShowConfirmationModal(false);
            onClose(false);
          }}
        />
      )}
    </>
  );
};

export default SchoolInfoEditModal;