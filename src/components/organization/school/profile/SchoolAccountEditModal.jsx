// src/components/organization/school/profile/SchoolAccountEditModal.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";

// Zod schema for form validation
const passwordSchema = z.object({
  email: z.string().email("Email tidak valid"),
  oldPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/\d/, "Password harus memiliki minimal 1 angka")
    .regex(/[A-Z]/, "Password harus memiliki minimal 1 huruf kapital")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password harus memiliki minimal 1 karakter khusus"
    ),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

const SchoolAccountEditModal = ({ onClose }) => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validations, setValidations] = useState({
    minLength: false,
    hasNumber: false,
    hasUpperCase: false,
    hasSpecialChar: false,
  });
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
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Watch for password changes to update validation indicators
  const newPassword = watch("newPassword");

  useEffect(() => {
    if (userData) {
      setValue("email", userData.email || "");
    }
  }, [userData, setValue]);

  useEffect(() => {
    validatePassword(newPassword);
  }, [newPassword]);

  const validatePassword = (password) => {
    setValidations({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      return axios.patch(`${process.env.REACT_APP_API_URL}/users/change-password`, {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        if (onClose) onClose();
      }, 2000);
    },
    onError: (error) => {
      console.error("Error changing password:", error);
    },
  });

  const onSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <>
      <div className="flex flex-col gap-2.5 items-center p-8 mx-auto bg-white rounded-xl w-[523px] max-md:p-5 max-md:w-[90%] max-sm:p-4 max-sm:w-full">
        <header className="self-start text-xl font-bold text-primary leading-normal">
          Edit Pengaturan Akun
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
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  disabled
                  className="w-full rounded-md h-[34px] border border-gray-300 px-3 bg-gray-100"
                />
              </div>

              <div className="flex flex-col gap-2.5 items-start w-full">
                <label className="text-xs text-zinc-500">
                  Password Lama
                </label>
                <input
                  type="password"
                  {...register("oldPassword")}
                  className={clsx(
                    "w-full rounded-md h-[34px] border px-3",
                    errors.oldPassword ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.oldPassword && (
                  <span className="text-xs text-red-500">
                    {errors.oldPassword.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5 items-start w-full">
                <label className="text-xs text-zinc-500">
                  Password Baru
                </label>
                <input
                  type="password"
                  {...register("newPassword")}
                  className={clsx(
                    "w-full rounded-md h-[34px] border px-3",
                    errors.newPassword ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.newPassword && (
                  <span className="text-xs text-red-500">
                    {errors.newPassword.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 items-start w-full">
                <span className="text-xs text-zinc-500">
                  Password harus terdiri dari :
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-sm" style={{ color: validations.minLength ? "#0EAD69" : "#71717A" }}>
                      {validations.minLength ? "check_circle" : "cancel"}
                    </span>
                    <span
                      className={`text-xs ${validations.minLength ? "text-core-success" : "text-zinc-500"}`}
                    >
                      Minimal 8 karakter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-sm" style={{ color: validations.hasNumber ? "#0EAD69" : "#71717A" }}>
                      {validations.hasNumber ? "check_circle" : "cancel"}
                    </span>
                    <span
                      className={`text-xs ${validations.hasNumber ? "text-core-success" : "text-zinc-500"}`}
                    >
                      Minimal 1 angka
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-sm" style={{ color: validations.hasUpperCase ? "#0EAD69" : "#71717A" }}>
                      {validations.hasUpperCase ? "check_circle" : "cancel"}
                    </span>
                    <span
                      className={`text-xs ${validations.hasUpperCase ? "text-core-success" : "text-zinc-500"}`}
                    >
                      Minimal 1 huruf kapital
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-sm" style={{ color: validations.hasSpecialChar ? "#0EAD69" : "#71717A" }}>
                      {validations.hasSpecialChar ? "check_circle" : "cancel"}
                    </span>
                    <span
                      className={`text-xs ${validations.hasSpecialChar ? "text-core-success" : "text-zinc-500"}`}
                    >
                      Minimal 1 karakter khusus
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 items-start w-full">
                <label className="text-xs text-zinc-500">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  {...register("confirmPassword")}
                  className={clsx(
                    "w-full rounded-md h-[34px] border px-3",
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.confirmPassword && (
                  <span className="text-xs text-red-500">
                    {errors.confirmPassword.message}
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
                    disabled={isSubmitting || !isDirty || Object.keys(errors).length > 0}
                    className={clsx(
                      "px-7 py-2.5 h-8 text-base font-bold text-white rounded-md leading-normal w-[114px]",
                      "max-md:px-6 max-md:py-2 max-md:text-sm max-md:h-[30px] max-md:w-[100px]",
                      "max-sm:px-5 max-sm:py-1.5 max-sm:h-7 max-sm:text-xs max-sm:w-[90px]",
                      isDirty && !isSubmitting && Object.keys(errors).length === 0
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
                Password Berhasil Diubah!
              </h2>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SchoolAccountEditModal;