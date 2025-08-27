// src/pages/user/psychologist/PsychologistProfilePage.jsx
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import PsychologistProfile from "@/components/user/psychologist/profile/PsychologistProfile";
import { usePsychologistProfile } from "@/components/user/psychologist/profile/hooks/usePsychologistProfile";

const PsychologistProfilePage = () => {
  const { meQuery, initialValues, submit, isSubmitting, errorMessage } = usePsychologistProfile();
  const [values, setValues] = useState(initialValues);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { 
    setValues(initialValues); 
  }, [initialValues]);

  const handleEdit = useCallback(() => setIsEditing(true), []);
  
  const handleCancel = useCallback(() => { 
    setValues(initialValues); 
    setIsEditing(false); 
  }, [initialValues]);

  const handleSave = useCallback(async () => {
    try {
      console.log("Saving profile with values:", values);
      await submit(values);
      setIsEditing(false);
      toast.success("Profil berhasil disimpan");
    } catch (error) {
      console.error("Error saving profile:", error);
      const message = error?.response?.data?.message || error?.message || "Gagal menyimpan profil";
      toast.error(message);
    }
  }, [submit, values]);

  if (meQuery.isLoading) return <div className="p-6">Loading…</div>;
  if (meQuery.error) return <div className="p-6 text-red-600">Gagal memuat profil.</div>;

  return (
    <PsychologistProfile
      values={values}
      onChange={setValues}
      isEditing={isEditing}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={handleSave}
      isSaving={isSubmitting}
    />
  );
};

export default PsychologistProfilePage;