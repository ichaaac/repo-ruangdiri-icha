// src/components/organization/school/profile/SchoolInfoEditModal.jsx
import React, { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../../lib/api";
import clsx from "clsx";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import ConfirmationModal from "../../company/profile/ConfirmationModal";

const extractDigits = (phone) => phone?.replace(/[^\d]/g, '') || '';
const isEmptyPhone = (phone) => {
  const digits = extractDigits(phone);
  return !digits || digits.length <= 3; // Just country code
};

const SchoolInfoEditModal = ({ onClose, userData }) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting, isDirty },
    watch
  } = useForm({
    defaultValues: {
      fullName: userData?.fullName || "",
      address: userData?.organization?.address || "",
      phone: isEmptyPhone(userData?.organization?.phone) ? "" : userData?.organization?.phone || "",
    }
  });

  const fullName = watch("fullName");
  const address = watch("address");
  const phone = watch("phone");
  const hasMeaningfulChanges = () => {
    if (!isDirty) return false;
    
    const originalName = (userData?.fullName || "").trim();
    const originalAddress = (userData?.organization?.address || "").trim();
    const originalPhone = (userData?.organization?.phone || "").trim();
    
    const currentName = (fullName || "").trim();
    const currentAddress = (address || "").trim();
    const currentPhone = (phone || "").trim();
    
    return (
      originalName !== currentName || 
      originalAddress !== currentAddress || 
      originalPhone !== currentPhone
    );
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      setErrorMessage("");
      
      const processedData = {
        ...data,
        phone: isEmptyPhone(data.phone) ? "" : data.phone
      };
      
      return apiClient.patch('/organizations/profile', processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['school-profile'] });
      onClose(true);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || "Terjadi kesalahan");
    },
  });

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleCloseClick = () => {
    if (isDirty && hasMeaningfulChanges()) {
      setShowConfirmationModal(true);
    } else {
      onClose(false);
    }
  };

  const addressValue = useWatch({ control, name: "address" }); 

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
          <h2 className="text-xl font-semibold text-primary">Edit Informasi Sekolah</h2>
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
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Nama Sekolah
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  {...register("fullName")}
                  className="w-full rounded-md h-12 border-[1.5px] px-4 pr-10 focus:outline-none focus:border-primary border-gray-300"
                />
              </div>
            </div>

     
            <div className="relative">
              <label className="block text-sm text-gray-500 mb-1">
                Alamat Sekolah
              </label>
              <textarea
                {...register("address", {
                  maxLength: 255,
                  onChange: (e) => {
                    const trimmed = e.target.value.slice(0, 255);
                    e.target.value = trimmed; // langsung potong di tempat
                  },
                })}
                maxLength={255}
                className="w-full rounded-md px-4 py-3 focus:outline-none focus:border-primary border-[1.5px] border-gray-300 resize-none min-h-[48px] pr-12"
              />

              <span
                className={clsx(
                  "absolute bottom-2 right-3 text-[11px] pointer-events-none",
                  (addressValue?.length || 0) >= 255 ? "text-red-500 font-semibold" : "text-gray-400"
                )}
              >
                {(addressValue?.length || 0)}/255
              </span>
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
                      field.onChange(value);
                    }}
                    onBlur={() => {
                      if (isEmptyPhone(field.value)) field.onChange('');
                      field.onBlur();
                    }}
                    inputClassName="w-full h-12 border-[1.5px] text-base px-4 focus:outline-none focus:border-primary border-gray-300"
                    containerClassName="rounded-md overflow-hidden"
                    buttonClassName="h-12 px-3 flex items-center justify-center border-r border-gray-300"
                    placeholder="Masukkan nomor telepon (opsional)"
                    international
                    withCountryCallingCode
                    forceDialCode
                  />
                )}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              {/* Error message on the left */}
              <div className="flex-grow mr-4">
                {errorMessage && (
                  <div className="inline-block px-4 py-3 text-xs bg-pink-100 border border-red-400 text-red-700 rounded-md" style={{ maxWidth: 'fit-content' }}>
                    <div className="flex items-start">
                      <span className="material-icons mr-2 text-sm">error</span>
                      <div className="flex items-center">
                        <span className="material-icons text-xs mr-1">error_outline</span>
                        {errorMessage}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submit button on the right */}
              <button
                type="submit"
                disabled={isSubmitting || updateProfileMutation.isPending || !hasMeaningfulChanges()}
                className={clsx(
                  "h-12 px-6 rounded-md text-white font-semibold transition-colors",
                  hasMeaningfulChanges() && !isSubmitting && !updateProfileMutation.isPending
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
  );
};

export default SchoolInfoEditModal;