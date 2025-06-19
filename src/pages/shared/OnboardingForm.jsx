// src/pages/shared/OnboardingForm.jsx - Sesuai Permintaan Terakhir

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import clsx from "clsx";

// Komponen & utilitas
import ProfilePictureUpload from "@/components/shared/profile/ProfilePictureUpload";
import TextareaAutosize from 'react-textarea-autosize';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { validatePhoneNumber, isEmptyPhone, extractDigits } from "@/lib/phoneUtils";

// Skema validasi Zod
const onboardingSchema = z.object({
  address: z.string().max(255, "Alamat maksimal 255 karakter").optional(),
  phone: z.string().optional().refine((phone) => {
    if (!phone || isEmptyPhone(phone)) return true;
    return validatePhoneNumber(phone) === null;
  }, { message: "Format nomor telepon tidak valid" }),
});

const OnboardingForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phoneValidationError, setPhoneValidationError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: { address: "", phone: "" }
  });
  
  // NOTE: Logic redirect sekarang ada di dalam ProtectedRoute setelah login
  const updateMutation = useMutation({
    mutationFn: (payload) => api.organization.updateProfile(payload),
    onSuccess: () => {
      // Setelah update, cukup invalidasi query user dan biarkan ProtectedRoute bekerja
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      navigate("/"); // Arahkan ke homepage, nanti akan di-redirect oleh ProtectedRoute jika perlu
    },
    onError: (error) => {
      console.error("Onboarding failed:", error);
      alert("Gagal menyimpan. Coba lagi.");
    },
  });

  const onSubmit = (data) => {
    setPhoneValidationError("");
    if (data.phone && !isEmptyPhone(data.phone)) {
      const phoneError = validatePhoneNumber(data.phone);
      if (phoneError) {
        setPhoneValidationError(phoneError);
        return;
      }
    }
    
    // === PERUBAHAN PAYLOAD SESUAI PERMINTAAN ===
    const payload = { isOnboarded: false }; // WARNING: INI AKAN BIKIN LOOP
    if (data.address.trim()) payload.address = data.address.trim();
    if (data.phone.trim() && !isEmptyPhone(data.phone)) payload.phone = data.phone.trim();

    updateMutation.mutate(payload);
  };
  
  const handleSkip = () => {
    updateMutation.mutate({ isOnboarded: false }); // WARNING: INI JUGA AKAN BIKIN LOOP
  }

  const handlePhoneChange = (value, field) => {
    if (isEmptyPhone(value)) { field.onChange(''); setPhoneValidationError(''); return; }
    const digits = extractDigits(value);
    if (digits.length <= 15) {
      field.onChange(value);
      const error = validatePhoneNumber(value);
      setPhoneValidationError(error || '');
      setTimeout(() => trigger('phone'), 100);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen overflow-hidden">
      
      <section className="hidden md:flex flex-col w-full md:w-1/2 relative justify-center items-center p-8" style={{ background: "linear-gradient(to bottom, #91D9E1, #5E6EC3)" }}>
        <div className="text-center text-white max-w-md">
          <h1 className="text-5xl lg:text-6xl font-bold drop-shadow-lg">Lengkapi Profilmu</h1>
          {/* Jarak ditambah di sini (mt-8) */}
          <p className="mt-8 text-2xl lg:text-3xl font-medium drop-shadow-md">{user?.fullName || "Admiral Keren"}</p>
        </div>
      </section>

      <section className="relative flex flex-1 justify-center items-center w-full md:w-1/2 py-8 md:py-16 px-4 bg-white overflow-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[454px] flex flex-col gap-6 md:gap-8">
          
          <div className="flex flex-col items-start">
            <h2 className="text-2xl font-bold text-primary mb-6 text-center w-full md:hidden">Lengkapi Profil</h2>
            <ProfilePictureUpload currentProfilePicture={user?.profilePicture || null} organizationType={user?.organization?.type || "school"}/>
          </div>

          <div>
            <label className="block mb-2 text-sm text-zinc-600">Alamat</label>
            <TextareaAutosize {...register("address")} minRows={1} maxLength={255} className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none" style={{ height: '42px' }} placeholder="Masukkan alamat lengkap" disabled={updateMutation.isPending}/>
            {errors.address && <span className="text-xs text-red-500 mt-1 block">{errors.address.message}</span>}
          </div>

          <div>
            <label className="block mb-2 text-sm text-zinc-600">Nomor Telepon</label>
            <Controller name="phone" control={control} render={({ field }) => (<PhoneInput defaultCountry="id" value={field.value || ''} onChange={(value) => handlePhoneChange(value, field)} onBlur={field.onBlur} inputClassName={clsx("w-full h-[42px] border-[1.5px] text-base px-4", (errors.phone || phoneValidationError) ? "border-red-500" : "border-zinc-300")} disabled={updateMutation.isPending}/>)}/>
            {(errors.phone || phoneValidationError) && <span className="text-xs text-red-500 mt-1 block">{phoneValidationError || errors.phone?.message}</span>}
          </div>

          <div className="mt-2 flex justify-end">
            <button type="submit" disabled={updateMutation.isPending} className="flex items-center justify-center font-semibold text-white bg-primary rounded-lg transition-colors hover:bg-primary-variant1 disabled:bg-gray-400 disabled:cursor-not-allowed" style={{ width: '114px', height: '32px' }}>
              {updateMutation.isPending ? "..." : "Simpan"}
            </button>
          </div>
        </form>
        <button type="button" onClick={handleSkip} disabled={updateMutation.isPending} className="absolute bottom-8 right-8 text-sm text-zinc-500 hover:underline md:bottom-12 md:right-12">
          Lewati Langkah Ini
        </button>
      </section>
    </div>
  );
};

export default OnboardingForm;