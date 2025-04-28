import React, { useState } from "react";
import InformationModal from "../../../components/settings/InformationModal";
import AccountSettingsModal from "../../../components/settings/AccountSettingsModal";
/**
 * School Settings Page Component
 * Displays and manages school profile and account settings
 */
const SchoolSettingsPage = () => {
  // State for modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Mock data for school (in a real app, this would come from API)
  const schoolData = {
    schoolName: "SMA Veteran 007 Jakarta",
    address: "Jl. Bintaro Raya, RT.4/RW.10, Bintaro, Kec. Pesanggrahan, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12330",
    phoneNumber: "+62 | 858-1484-2474",
    email: "smaveteranjakarta@gmail.com"
  };

  // Handle form submissions
  const handleInfoSubmit = (data) => {
    console.log("School info updated:", data);
    setShowInfoModal(false);
    showSuccessNotification("Informasi sekolah berhasil diubah!");
  };

  const handleAccountSubmit = (data) => {
    console.log("Account settings updated:", data);
    setShowAccountModal(false);
    showSuccessNotification("Pengaturan akun berhasil diubah!");
  };

  // Show success notification
  const showSuccessNotification = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  return (
    <main className="w-full min-h-screen bg-[#F8F7FA] p-6 md:p-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 bg-white shadow-lg rounded-lg p-4 flex items-center gap-2 animate-fade-in-down">
          <span className="material-icons text-[#9BCA61]">check_circle</span>
          <span className="text-neutral-600">{successMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <header className="flex justify-end items-center mb-8">
        <div className="flex items-center text-sm font-bold">
          <span className="text-primary">ID /</span>
          <span className="text-zinc-500">EN</span>
        </div>
        <button
          aria-label="Notifications"
          className="flex items-center justify-center w-10 h-10 ml-4 text-zinc-500 hover:bg-gray-100 rounded-full"
        >
          <span className="material-icons">notifications</span>
        </button>
      </header>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Section */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h1 className="text-xl font-semibold text-primary">
              Profil
            </h1>
          </div>
          
          <div className="p-6 flex gap-5 items-center md:items-start">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                <img
                  src="URL_PROFILE_IMAGE"
                  alt="School profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 p-1 bg-primary rounded-full text-white shadow-md"
              >
                <span className="material-icons text-sm">photo_camera</span>
              </button>
            </div>

            <div className="flex flex-col">
              <h2 className="text-base font-bold text-neutral-600">
                {schoolData.schoolName}
              </h2>
              <p className="text-sm text-neutral-600 mt-1">Admin</p>
              <p className="text-sm text-neutral-600">Jakarta, Indonesia</p>
            </div>
          </div>
        </section>

        {/* School Information Section */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-primary">
              Informasi Sekolah
            </h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Nama Sekolah</label>
                <p className="text-base text-neutral-600">
                  {schoolData.schoolName}
                </p>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Alamat</label>
                <p className="text-base text-neutral-600">
                  {schoolData.address}
                </p>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Nomor Telepon</label>
                <p className="text-base text-neutral-600">
                  {schoolData.phoneNumber}
                </p>
              </div>

              <div className="flex justify-end">
                <button 
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary-variant1 transition-colors"
                  onClick={() => setShowInfoModal(true)}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Account Settings Section */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-primary">
              Pengaturan Akun
            </h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Email</label>
                <p className="text-base text-neutral-600">
                  {schoolData.email}
                </p>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Password</label>
                <p className="text-base text-neutral-600">********</p>
              </div>

              <div className="flex justify-end">
                <button 
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary-variant1 transition-colors"
                  onClick={() => setShowAccountModal(true)}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal Overlays */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <InformationModal
            type="school"
            initialData={schoolData}
            onClose={() => setShowInfoModal(false)}
            onSubmit={handleInfoSubmit}
          />
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <AccountSettingsModal
            type="school"
            initialData={schoolData}
            onClose={() => setShowAccountModal(false)}
            onSubmit={handleAccountSubmit}
          />
        </div>
      )}
    </main>
  );
};

export default SchoolSettingsPage;