// src/components/organization/school/profile/SchoolInfoEditModal.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";

// Zod schema for form validation
const schoolInfoSchema = z.object({
  fullName: z.string().min(1, "Nama sekolah wajib diisi"),
  address: z.string().min(1, "Alamat sekolah wajib diisi"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
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
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Initialize form with current user data
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      fullName: userData?.fullName || "",
      address: userData?.organization?.address || "",
      phone: userData?.organization?.phone || "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      return axios.patch(
        `${API_URL}/organizations/profile`,
        data,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
    },
    onSuccess: () => {
      // Invalidate both general user profile and organization-specific queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['school', 'profile'] });
      
      if (onClose) onClose(true); // Pass true to indicate success
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
    },
  });

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  // Reset form with user data when component mounts or userData changes
  useEffect(() => {
    if (userData) {
      reset({
        fullName: userData.fullName || "",
        address: userData.organization?.address || "",
        phone: userData.organization?.phone || "",
      });
    }
  }, [userData, reset]);

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

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
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
                  placeholder="Masukkan nama sekolah"
                />
                {errors.fullName && (
                  <span className="text-xs text-red-500 mt-1">
                    {errors.fullName.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Alamat Sekolah
                </label>
                <input
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
                <label className="block text-sm text-gray-500 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  {...register("phone")}
                  className={clsx(
                    "w-full rounded-md h-12 border-[1.5px] px-4 focus:outline-none focus:border-primary",
                    errors.phone ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="Masukkan nomor telepon"
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
                  disabled={isSubmitting || !isDirty}
                  className={clsx(
                    "h-12 px-6 rounded-md text-white font-semibold transition-colors",
                    isDirty && !isSubmitting
                      ? "bg-primary hover:bg-primary-variant1"
                      : "bg-gray-400 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <span className="material-icons animate-spin text-sm inline-block mr-1">refresh</span>
                  ) : null}
                  Simpan
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