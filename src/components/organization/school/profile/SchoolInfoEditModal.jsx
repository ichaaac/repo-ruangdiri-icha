// src/components/organization/school/profile/SchoolInfoEditModal.jsx
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

// Format phone number with proper hyphens for Indonesia
const formatIndonesianPhoneNumber = (value) => {
  if (!value) return '';
  
  try {
    // Ensure the value starts with a country code
    const phoneValue = value.startsWith('+') ? value : `+${value}`;
    const phoneNumber = parsePhoneNumber(phoneValue, 'ID');
    
    if (phoneNumber && phoneNumber.isValid()) {
      const nationalNumber = phoneNumber.nationalNumber;
      
      // Format Indonesian numbers: +62 8XX-XXXX-XXXX
      if (nationalNumber.length > 7) {
        return `+${phoneNumber.countryCallingCode} ${nationalNumber.slice(0, 3)}-${nationalNumber.slice(3, 7)}-${nationalNumber.slice(7)}`;
      } else if (nationalNumber.length > 3) {
        return `+${phoneNumber.countryCallingCode} ${nationalNumber.slice(0, 3)}-${nationalNumber.slice(3)}`;
      } else {
        return `+${phoneNumber.countryCallingCode} ${nationalNumber}`;
      }
    }
  } catch (error) {
    console.error("Error formatting phone number:", error);
  }
  
  return value;
};

const schoolInfoSchema = z.object({
  fullName: z.string().min(1, "Nama sekolah wajib diisi"),
  address: z.string().min(1, "Alamat sekolah wajib diisi"),
  phone: z.string()
    .min(1, "Nomor telepon wajib diisi")
    .refine((value) => {
      try {
        if (value.length < 8) return true;
        return isValidPhoneNumber(value, 'ID');
      } catch (error) {
        return false;
      }
    }, "Format nomor telepon tidak valid")
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

const SchoolInfoEditModal = ({ onClose, userData }) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Initialize form with current user data
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      fullName: userData?.fullName || "",
      address: userData?.organization?.address || "",
      phone: userData?.organization?.phone || "+62", // Ensure we have at least the country code
    },
    mode: "onChange",
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Clear previous error messages
      setErrorMessage("");
      
      console.log("Updating organization profile with data:", data);
      
      return axios.patch(
        `${API_URL}/organizations/profile`,
        data,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          }
        }
      );
    },
    onSuccess: (response) => {
      console.log("Profile update success:", response.data);
      
      // Invalidate both general user profile and organization-specific queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['school', 'profile'] });
      
      if (onClose) onClose(true); // Pass true to indicate success
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      
      // Handle specific error messages
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Terjadi kesalahan saat memperbarui profil");
      }
    },
  });

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleCloseClick = () => {
    if (isDirty) {
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
                <label className="block text-sm text-gray-500 mb-1" htmlFor="fullName">
                  Nama Sekolah
                </label>
                <input
                  id="fullName"
                  type="text"
                  {...register("fullName")}
                  className={clsx(
                    "w-full rounded-md h-12 border-[1.5px] px-4 focus:outline-none focus:border-primary",
                    errors.fullName ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="Masukkan nama sekolah"
                />
                {errors.fullName && (
                  <span className="text-xs text-red-500 mt-1">
                    {errors.fullName.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1" htmlFor="address">
                  Alamat Sekolah
                </label>
                <input
                  id="address"
                  type="text"
                  {...register("address")}
                  className={clsx(
                    "w-full rounded-md h-12 border-[1.5px] px-4 focus:outline-none focus:border-primary",
                    errors.address ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="Jalan Lorem Ipsum dolor sit amet"
                />
                {errors.address && (
                  <span className="text-xs text-red-500 mt-1">
                    {errors.address.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1" htmlFor="phone">
                  Nomor Telepon
                </label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      defaultCountry="ID"
                      value={field.value}
                      onChange={(value) => {
                        // Apply custom formatting and update the field
                        const formattedValue = formatIndonesianPhoneNumber(value);
                        field.onChange(formattedValue);
                      }}
                      onBlur={field.onBlur}
                      inputClassName={clsx(
                        "w-full h-12 border-[1.5px] text-base px-4 focus:outline-none focus:border-primary",
                        errors.phone ? "border-red-500" : "border-gray-300"
                      )}
                      containerClassName={clsx(
                        "rounded-md overflow-hidden", 
                        errors.phone ? "border-red-500" : "border-gray-300"
                      )}
                      buttonClassName="h-12 px-3 flex items-center justify-center border-r border-gray-300"
                      placeholder="Masukkan nomor telepon"
                      inputProps={{
                        id: "phone",
                        name: "phone",
                      }}
                      international={true}
                      withCountryCallingCode={true}
                      disableDialCodeAndPrefix={false}
                      forceDialCode={true}
                    />
                  )}
                />
                {errors.phone && (
                  <span className="text-xs text-red-500 mt-1">
                    {errors.phone.message}
                  </span>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !isDirty || updateProfileMutation.isPending}
                  className={clsx(
                    "h-12 px-6 rounded-md text-white font-semibold transition-colors",
                    isDirty && !isSubmitting && !updateProfileMutation.isPending
                      ? "bg-primary hover:bg-primary-variant1"
                      : "bg-gray-400 cursor-not-allowed"
                  )}
                >
                  {isSubmitting || updateProfileMutation.isPending ? (
                    <span className="flex items-center">
                      <span className="material-icons animate-spin text-sm inline-block mr-1">refresh</span>
                      <span>Menyimpan...</span>
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