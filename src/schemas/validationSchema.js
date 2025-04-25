import { z } from 'zod';

/**
 * Schema for password validation
 * Ensures passwords meet security requirements and match confirmation
 */
export const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Password saat ini tidak boleh kosong"),
  newPassword: z
    .string()
    .min(8, "Password harus minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus memiliki minimal 1 huruf kapital")
    .regex(/[0-9]/, "Password harus memiliki minimal 1 angka")
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Password harus memiliki minimal 1 karakter khusus"),
  confirmPassword: z.string().min(1, "Konfirmasi password tidak boleh kosong"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Password tidak sama",
  path: ["confirmPassword"],
}).refine(data => data.oldPassword !== data.newPassword, {
  message: "Tidak bisa menggunakan password yang sudah dipakai",
  path: ["newPassword"],
});

/**
 * Schema for school profile
 * Validates required fields for school information
 */
export const schoolProfileSchema = z.object({
  schoolName: z.string().min(1, "Nama sekolah tidak boleh kosong"),
  address: z.string().min(1, "Alamat tidak boleh kosong"),
  phoneNumber: z.string().min(1, "Nomor telepon tidak boleh kosong"),
  email: z.string().email("Format email tidak valid"),
  // Add additional fields specific to schools if needed
});

/**
 * Schema for company profile
 * Validates required fields for company information
 */
export const companyProfileSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan tidak boleh kosong"),
  address: z.string().min(1, "Alamat tidak boleh kosong"),
  phoneNumber: z.string().min(1, "Nomor telepon tidak boleh kosong"),
  email: z.string().email("Format email tidak valid"),
  industry: z.string().min(1, "Industri tidak boleh kosong"),
  // Add additional fields specific to companies if needed
});

/**
 * Schema for login validation
 */
export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid").min(1, "Email tidak boleh kosong"),
  password: z.string().min(1, "Password tidak boleh kosong"),
  rememberMe: z.boolean().optional().default(false)
});

/**
 * Schema for forgot password validation
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid").min(1, "Email tidak boleh kosong")
});

/**
 * Schema for reset password validation
 */
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password harus minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus memiliki minimal 1 huruf kapital")
    .regex(/[0-9]/, "Password harus memiliki minimal 1 angka")
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Password harus memiliki minimal 1 karakter khusus"),
  confirmPassword: z.string().min(1, "Konfirmasi password tidak boleh kosong")
}).refine(data => data.password === data.confirmPassword, {
  message: "Password tidak sama",
  path: ["confirmPassword"]
});