import React, { useState } from "react";
import { motion } from "framer-motion";
import { companyProfileSchema } from "../../../schemas/validationSchema";
import { organizationService } from "../../../services/organizationService";
import { useAuth } from "../../../hooks/useAuth";

// Components
import PasswordChangeForm from "../../../components/settings/PasswordChangeForm";
import ProfileEditModal from "../../../components/settings/ProfileEditModal";
import ProfilePictureUpload from "../../../components/settings/ProfilePictureUpload";
import SuccessModal from "../../../components/settings/SuccessModal";

/**
 * Company Settings page component
 * Manages company profile and account settings
 * Uses React Query without useEffect or Context
 */
const CompanySettings = () => {
  // UI state
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Get profile data using React Query
  const { data: profileData, isLoading, error } = organizationService.useProfileData("company");
  const updateProfile = organizationService.useUpdateProfile();
  const { changePassword } = useAuth();

  // Show success modal with custom message
  const handleSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  // Handle profile update
  const handleProfileUpdate = (data) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        setShowProfileModal(false);
        handleSuccess("Data profil perusahaan berhasil diperbarui");
      }
    });
  };

  // Handle password update
  const handlePasswordUpdate = (data) => {
    changePassword.mutate(
      { oldPassword: data.oldPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          setIsEditingPassword(false);
          handleSuccess("Password berhasil diubah");
        }
      }
    );
  };

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-primary">sync</span>
          <span className="text-primary">Loading...</span>
        </div>
      </div>
    );
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>Failed to load profile data. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Use profile data from API or fallback to default
  const company = profileData?.data || {
    companyName: "PT Mencari Cinta Sejati",
    address: "Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta 12190",
    phoneNumber: "+62 | 821-2345-6789",
    email: "info@mencari-cinta-sejati.com",
    industry: "Technology",
    profilePicture: null,
  };

  return (
    <div className="relative z-10 p-6 md:p-10 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col bg-white rounded-xl shadow-md w-full max-w-[695px] mx-auto my-6 overflow-hidden">
        <div className="flex flex-col items-start px-6 md:px-10 pt-8 pb-6 w-full">
          <h1 className="text-2xl md:text-3xl font-bold leading-none text-primary">
            Pengaturan Akun
          </h1>

          {/* Profile Picture */}
          <div className="w-full flex justify-center my-8">
            <ProfilePictureUpload 
              currentImage={company.profilePicture} 
              queryKey="company-profile"
            />
          </div>

          <div className="w-full mt-4">
            {/* Company Info Section */}
            <div className="flex flex-col py-6 pr-3 pl-4 md:pl-7 w-full bg-blue-50 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-primary">
                  Informasi Perusahaan
                </h2>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-3 py-1 text-sm text-white bg-primary rounded-md hover:bg-primary-variant1 transition-colors"
                >
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400">Nama Perusahaan</label>
                  <p className="text-base text-zinc-700">{company.companyName}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Email</label>
                  <p className="text-base text-zinc-700">{company.email}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-zinc-400">Alamat</label>
                  <p className="text-base text-zinc-700">{company.address}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Nomor Telepon</label>
                  <p className="text-base text-zinc-700">{company.phoneNumber}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Industri</label>
                  <p className="text-base text-zinc-700">{company.industry}</p>
                </div>
              </div>
            </div>

            {/* Password Section */}
            {isEditingPassword ? (
              <PasswordChangeForm
                onCancel={() => setIsEditingPassword(false)}
                onSubmit={handlePasswordUpdate}
                isSubmitting={changePassword.isPending}
              />
            ) : (
              <div className="flex flex-col py-6 pr-3 pl-4 md:pl-7 w-full bg-blue-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs text-zinc-400">Password</label>
                    <p className="text-base text-zinc-700">••••••••</p>
                  </div>
                  <button
                    onClick={() => setIsEditingPassword(true)}
                    className="px-3 py-1 text-sm text-white bg-primary rounded-md hover:bg-primary-variant1 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSubmit={handleProfileUpdate}
        schema={companyProfileSchema}
        defaultValues={company}
        title="Edit Informasi Perusahaan"
        fields={[
          { name: "companyName", label: "Nama Perusahaan", type: "text" },
          { name: "email", label: "Email", type: "email" },
          { name: "address", label: "Alamat", type: "textarea" },
          { name: "phoneNumber", label: "Nomor Telepon", type: "tel" },
          { name: "industry", label: "Industri", type: "text" },
        ]}
        isSubmitting={updateProfile.isPending}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />
    </div>
  );
};

export default CompanySettings;