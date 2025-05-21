// src/components/organization/school/profile/SchoolAccountEditModal.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../../lib/api";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ConfirmationModal from "../../company/profile/ConfirmationModal";

// Validation schema
const passwordSchema = z.object({
  email: z.string().email("Email tidak valid"),
  oldPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/\d/, "Password harus memiliki minimal 1 angka")
    .regex(/[A-Z]/, "Password harus memiliki minimal 1 huruf kapital")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password harus memiliki minimal 1 karakter khusus"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

const SchoolAccountEditModal = ({ onClose, userData }) => {
  const [validations, setValidations] = useState({
    minLength: false,
    hasNumber: false,
    hasUpperCase: false,
    hasSpecialChar: false,
  });
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: userData?.email || "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  // Update email when userData changes
  useEffect(() => {
    if (userData) {
      setValue("email", userData.email || "");
    }
  }, [userData, setValue]);

  // Validate password in real-time
  useEffect(() => {
    setValidations({
      minLength: newPassword?.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      setErrorMessage("");
      return apiClient.patch('/users/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => onClose(true),
    onError: (error) => {
      console.error("Password change error:", error);
      // Tampilkan pesan error dari backend
      setErrorMessage(
        error.response?.data?.message || 
        "Terjadi kesalahan saat mengubah password"
      );
    },
  });

  const onSubmit = (data) => {
    setErrorMessage("");
    changePasswordMutation.mutate({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword
    });
  };

  const handleCloseClick = () => {
    isDirty ? setShowConfirmationModal(true) : onClose(false);
  };

  // Mempersiapkan pesan error untuk ditampilkan
  const getValidationErrors = () => {
    const errorMessages = [];
    
    if (errors.email) {
      errorMessages.push(errors.email.message);
    }
    
    if (errors.oldPassword) {
      errorMessages.push(errors.oldPassword.message);
    }
    
    if (errors.newPassword) {
      errorMessages.push(errors.newPassword.message);
    }
    
    if (errors.confirmPassword) {
      errorMessages.push(errors.confirmPassword.message);
    }
    
    if (errorMessage) {
      errorMessages.push(errorMessage);
    }
    
    return errorMessages;
  };

  const validationErrors = getValidationErrors();
  const hasValidationErrors = validationErrors.length > 0;

  // Password validation indicator component
  const PasswordValidationItem = ({ isValid, text }) => (
    <div className="flex items-center gap-2">
      <motion.span 
        animate={isValid ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className="material-icons text-sm"
        style={{ color: isValid ? "#0EAD69" : "#71717A" }}
      >
        {isValid ? "check_circle" : "cancel"}
      </motion.span>
      <span className={`text-xs ${isValid ? "text-green-600" : "text-zinc-500"}`}>
        {text}
      </span>
    </div>
  );

  // Password input field component
  const PasswordField = ({ label, name, error, placeholder }) => {
    const [showPassword, setShowPassword] = useState(false);
    
    return (
      <div>
        <label className="block text-sm text-gray-500 mb-1">{label}</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register(name)}
            className={clsx(
              "w-full rounded-md h-12 border-[1.5px] px-4 pr-10 focus:outline-none focus:border-primary",
              error ? "border-red-500" : "border-gray-300"
            )}
            placeholder={placeholder}
            autoComplete={name.includes("new") ? "new-password" : "current-password"}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="material-icons">
              {showPassword ? "visibility" : "visibility_off"}
            </span>
          </button>
        </div>
      </div>
    );
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
          <h2 className="text-xl font-semibold text-primary">Ubah Password</h2>
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
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <input
                type="email"
                {...register("email")}
                disabled
                className="w-full rounded-md h-12 border-[1.5px] border-gray-300 px-4 bg-gray-100"
                autoComplete="email"
              />
            </div>

            <div>
              <PasswordField
                label="Password Lama"
                name="oldPassword"
                error={errors.oldPassword}
                placeholder="Masukkan password lama"
              />
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#488BBE] hover:underline transition-all"
                >
                  Lupa Password?
                </Link>
              </div>
            </div>

            <PasswordField
              label="Password Baru"
              name="newPassword"
              error={errors.newPassword}
              placeholder="Masukkan password baru"
            />

            <div>
              <span className="block text-xs text-gray-500 mb-3">
                Password harus terdiri dari:
              </span>
              <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                <PasswordValidationItem 
                  isValid={validations.minLength} 
                  text="Minimal 8 karakter" 
                />
                <PasswordValidationItem 
                  isValid={validations.hasNumber} 
                  text="Minimal 1 angka" 
                />
                <PasswordValidationItem 
                  isValid={validations.hasUpperCase} 
                  text="Minimal 1 huruf kapital" 
                />
                <PasswordValidationItem 
                  isValid={validations.hasSpecialChar} 
                  text="Minimal 1 karakter khusus" 
                />
              </div>
            </div>

            <PasswordField
              label="Konfirmasi Password Baru"
              name="confirmPassword"
              error={errors.confirmPassword}
              placeholder="Konfirmasi password baru"
            />

            <div className="flex justify-between items-center pt-2">
              {/* Error message on the left */}
              <div className="flex-grow mr-4">
                {hasValidationErrors && (
                  <div className="inline-block px-4 py-3 text-xs bg-pink-100 border border-red-400 text-red-700 rounded-md" style={{ maxWidth: 'fit-content' }}>
                    <div className="flex items-start">
                      <span className="material-icons mr-2 text-sm">error</span>
                      <div className="flex flex-col">
                        {validationErrors.map((error, index) => (
                          <div key={index} className="flex items-center mb-1 last:mb-0">
                            <span className="material-icons text-xs mr-1">error_outline</span>
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submit button on the right */}
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || Object.keys(errors).length > 0 || changePasswordMutation.isPending}
                className={clsx(
                  "h-12 px-6 rounded-md text-white font-semibold transition-colors",
                  isDirty && !isSubmitting && Object.keys(errors).length === 0 && !changePasswordMutation.isPending
                    ? "bg-primary hover:bg-primary-variant1"
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                {isSubmitting || changePasswordMutation.isPending ? (
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

export default SchoolAccountEditModal;