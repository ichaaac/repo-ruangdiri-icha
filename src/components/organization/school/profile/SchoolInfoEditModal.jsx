// src/components/organization/school/profile/SchoolInfoEditModal.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";

// Zod schema for form validation
const schoolInfoSchema = z.object({
  fullName: z.string().min(1, "Nama sekolah wajib diisi"),
  address: z.string().min(1, "Alamat sekolah wajib diisi"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
});

const SchoolInfoEditModal = ({ onClose }) => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current user profile data
  const { data: userData, isLoading: isLoadingUserData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/me`);
      return response.data.data;
    },
  });

  // Initialize form with current user data
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      fullName: "",
      address: "",
      phone: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      return axios.patch(`${process.env.REACT_APP_API_URL}/organizations/profile`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        if (onClose) onClose();
      }, 2000);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
    },
  });

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  // Reset form with user data when it becomes available
  useEffect(() => {
    if (userData) {
      reset({
        fullName: userData.fullName || "",
        address: userData.organization?.address || "",
        phone: userData.organization?.phone || "",
      });
    }
  }, [userData, reset]);

  return (
    <>
      <div className="flex flex-col gap-2.5 items-center p-8 mx-auto bg-white rounded-xl w-[523px] max-md:p-5 max-md:w-[90%] max-sm:p-4 max-sm:w-full">
        <header className="self-start text-xl font-bold text-primary leading-normal">
          Edit Informasi Sekolah
        </header>

        {isLoadingUserData ? (
          <div className="flex justify-center items-center w-full h-40">
            <span className="material-icons animate-spin">refresh</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-col gap-2.5 items-start w-full">
                <label className="text-xs text-zinc-500">
                  Nama Sekolah
                </label>
                <input
                  type="text"
                  {...register("fullName")}
                  className={clsx(
                    "w-full rounded-md h-[34px] border px-3",
                    errors.fullName ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.fullName && (
                  <span className="text-xs text-red-500">
                    {errors.fullName.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5 items-start w-full">
                <label className="text-xs text-zinc-500">
                  Alamat
                </label>
                <input
                  type="text"
                  {...register("address")}
                  className={clsx(
                    "w-full rounded-md h-[34px] border px-3",
                    errors.address ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.address && (
                  <span className="text-xs text-red-500">
                    {errors.address.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5 items-start w-full">
                <label className="text-xs text-zinc-500">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  {...register("phone")}
                  className={clsx(
                    "w-full rounded-md h-[34px] border px-3",
                    errors.phone ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.phone && (
                  <span className="text-xs text-red-500">
                    {errors.phone.message}
                  </span>
                )}
              </div>

              <div className="flex justify-end w-full mt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-7 py-2.5 h-8 text-base font-bold text-primary border border-primary rounded-md leading-normal w-[114px] bg-white hover:bg-primary-light transition-colors duration-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !isDirty}
                    className={clsx(
                      "px-7 py-2.5 h-8 text-base font-bold text-white rounded-md leading-normal w-[114px]",
                      "max-md:px-6 max-md:py-2 max-md:text-sm max-md:h-[30px] max-md:w-[100px]",
                      "max-sm:px-5 max-sm:py-1.5 max-sm:h-7 max-sm:text-xs max-sm:w-[90px]",
                      isDirty && !isSubmitting
                        ? "bg-primary cursor-pointer hover:bg-primary-variant1 transition-colors duration-200"
                        : "bg-gray-400 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <span className="material-icons animate-spin text-sm">refresh</span>
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[306px] relative">
            <div className="flex flex-col items-center">
              <span
                className="material-icons text-core-success"
                style={{ fontSize: "91px" }}
              >
                check_circle
              </span>
              <h2 className="text-lg font-bold mt-6 text-center">
                Informasi Sekolah Berhasil Diubah!
              </h2>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SchoolInfoEditModal;