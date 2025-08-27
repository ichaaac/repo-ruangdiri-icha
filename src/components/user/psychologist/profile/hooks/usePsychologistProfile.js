// src/components/user/psychologist/profile/hooks/usePsychologistProfile.js
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import psychologistProfileApi from "../lib/psychologistProfileApi";

const mapFromMe = (me) => {
  const p = me?.psychologistProfile || {};
  return {
    profilePicture: me?.profilePicture || "",
    fullName: me?.fullName || "",
    email: me?.email || "",
    phone: me?.phone || "",
    sippNumber: p?.sippNumber || "",
    registrationNumber: p?.registrationNumber || "",
    fieldOfExpertise: p?.fieldOfExpertise || "",
    specialization: p?.specialization || "",
    typeOfPractice: p?.typeOfPractice || "",
    yearsOfExperience: p?.yearsOfExperience ?? "",
  };
};

const toPayload = (v) => {
  const payload = {
    fullName: v.fullName,
    email: v.email,
    phone: v.phone,
    psychologistProfile: {
      sippNumber: v.sippNumber || null,
      registrationNumber: v.registrationNumber || null,
      fieldOfExpertise: v.fieldOfExpertise || null,
      specialization: v.specialization || null,
      typeOfPractice: v.typeOfPractice || null,
      yearsOfExperience:
        v.yearsOfExperience === "" ? null : Number(v.yearsOfExperience),
    },
  };

  // Tambahkan profile picture jika ada dan berupa base64
  if (v.profilePicture && v.profilePicture.startsWith('data:')) {
    payload.profilePicture = v.profilePicture;
  }

  return payload;
};

export const usePsychologistProfile = () => {
  const qc = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await psychologistProfileApi.getProfile();
      return res?.data?.data ?? res?.data ?? res;
    },
  });

  const initialValues = useMemo(
    () => mapFromMe(meQuery.data),
    [meQuery.data]
  );

  const mutation = useMutation({
    mutationFn: async (values) => {
      console.log("Submitting profile update with values:", values);
      const payload = toPayload(values);
      console.log("Payload to be sent:", payload);
      
      try {
        const response = await psychologistProfileApi.updateProfile(payload);
        console.log("Profile update response:", response);
        return response;
      } catch (error) {
        console.error("Profile update error:", error);
        console.error("Error response:", error.response?.data);
        throw error;
      }
    },
    onSuccess: async (response) => {
      console.log("Profile update successful:", response);
      await qc.invalidateQueries({ queryKey: ["me"] });
      await qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Gagal menyimpan profil.";
      console.error("Profile update failed:", error);
    },
  });

  return {
    meQuery,
    initialValues,
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    errorMessage: mutation.isError
      ? mutation.error?.response?.data?.message || "Gagal menyimpan profil."
      : "",
  };
};