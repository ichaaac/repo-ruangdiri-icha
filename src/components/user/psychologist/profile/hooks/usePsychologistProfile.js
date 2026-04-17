import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const mapFromMe = (me) => {
  const p = me?.psychologistProfile || {};
  const rawExpertise = p?.fieldOfExpertise;
  const fieldOfExpertise = Array.isArray(rawExpertise)
    ? rawExpertise[0] || ""
    : rawExpertise || "";

  return {
    profilePicture: me?.profilePictureUrl || me?.profilePicture || "",
    fullName: me?.fullName || "",
    email: me?.email || "",
    phone: me?.phone || "",
    sippNumber: p?.sippNumber || "",
    registrationNumber: p?.registrationNumber || "",
    fieldOfExpertise,
    specialization: p?.specialization || "",
    typeOfPractice: p?.typeOfPractice || "",
    yearsOfExperience: p?.yearsOfExperience ?? "",
  };
};

const toFlatPayload = (v) => {
  const payload = {
    fullName: v.fullName,
    phone: v.phone || undefined,
    sippNumber: v.sippNumber || undefined,
    registrationNumber: v.registrationNumber || undefined,
    fieldOfExpertise: v.fieldOfExpertise || undefined,
    specialization: v.specialization || undefined,
    typeOfPractice: v.typeOfPractice || undefined,
    yearsOfExperience: v.yearsOfExperience === "" ? undefined : Number(v.yearsOfExperience),
  };

  // Profile picture — pass as File-like blob for FormData handling
  if (v.profilePicture?.startsWith("data:")) {
    payload._base64ProfilePicture = v.profilePicture;
  }

  return payload;
};

export const usePsychologistProfile = () => {
  const qc = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.user.getMe();
      return res?.data?.data ?? res?.data ?? res;
    },
  });

  const initialValues = useMemo(() => mapFromMe(meQuery.data), [meQuery.data]);

  const mutation = useMutation({
    mutationFn: async (values) => {
      const payload = toFlatPayload(values);

      // If there's a base64 profile picture, convert to File for FormData
      if (payload._base64ProfilePicture) {
        const res = await fetch(payload._base64ProfilePicture);
        const blob = await res.blob();
        payload.profilePicture = new File([blob], "profile.jpg", { type: blob.type });
        delete payload._base64ProfilePicture;
      }

      return api.user.updateProfile(payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      await qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  return {
    meQuery,
    initialValues,
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  };
};
