"use client"

// src/components/shared/profile/ProfilePage.jsx
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../../../hooks/useAuth"
import ProfileEditModal from "./ProfileEditModal"
import AccountEditModal from "./AccountEditModal"
import ProfilePictureUpload from "./ProfilePictureUpload"
import { formatPhoneDisplay } from "../../../lib/phoneUtils"

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-30"></div>
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}

const SuccessModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50"></div>
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 bg-white rounded-xl p-6 w-full max-w-sm flex flex-col items-center"
        >
          <span className="material-icons text-green-500" style={{ fontSize: "91px" }}>
            check_circle
          </span>
          <h2 className="text-lg font-bold mt-6 text-center">{message}</h2>
        </motion.div>
      </div>
    </div>
  )
}

const ErrorModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50"></div>
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 bg-white rounded-xl p-6 w-full max-w-sm flex flex-col items-center"
        >
          <span className="material-icons text-red-500" style={{ fontSize: "91px" }}>
            error_outline
          </span>
          <h2 className="text-lg font-bold mt-6 text-center text-red-600">{message}</h2>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
          >
            Tutup
          </button>
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Reusable Profile Page Component
 * @param {Object} props
 * @param {string} props.organizationType - "school" or "company"
 * @param {string} props.organizationLabel - "Sekolah" or "Perusahaan"
 * @param {string} props.organizationInfoTitle - "Informasi Sekolah" or "Informasi Perusahaan"
 * @param {string} props.organizationNameLabel - "Nama Sekolah" or "Nama Perusahaan"
 * @param {string} props.addressLabel - "Alamat" or "Alamat Perusahaan"
 */
const ProfilePage = ({
  organizationType = "school",
  organizationLabel = "Sekolah",
  organizationInfoTitle = "Informasi Sekolah",
  organizationNameLabel = "Nama Sekolah",
  addressLabel = "Alamat",
}) => {
  const [activeModal, setActiveModal] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")

  const { user: userData, isLoading, error, refetchUser } = useAuth()

  const handleModalClose = (success) => {
    setActiveModal(null)
    if (success) {
      if (activeModal === "organizationInfo") {
        setModalMessage(`${organizationInfoTitle} Berhasil Diubah!`)
      } else {
        setModalMessage("Password Berhasil Diubah!")
      }
      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 2000)

      refetchUser()
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="text-red-500 text-4xl sm:text-6xl mb-4">
          <span className="material-icons" style={{ fontSize: "4rem" }}>
            error_outline
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-2 text-center">Terjadi Kesalahan</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md text-sm sm:text-base">
          {error.message || "Gagal memuat profil. Silakan coba beberapa saat lagi."}
        </p>
        <button
          onClick={() => refetchUser()}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-variant1 transition-colors text-sm sm:text-base"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  const displayPhone = formatPhoneDisplay(userData?.organization?.phone)

  return (
    <div className="box-border w-full min-h-screen bg-white">
      {/* Profile header */}
      <div className="relative">
        <h1
          className="absolute text-base sm:text-lg font-semibold text-primary"
          style={{
            top: "92px",
            left: "12px",
            width: "auto",
          }}
        >
          Profil
        </h1>
        <div
          className="absolute h-0.5 bg-gray-300"
          style={{
            top: "99px",
            left: "76px",
            right: "20px",
          }}
        ></div>
      </div>

      {/* ID/EN and Notification with absolute positioning */}
      <div
        className="absolute flex items-center gap-4 sm:gap-6"
        style={{
          top: "29px",
          right: "20px",
        }}
      >
        <div className="flex items-center">
          <span className="font-bold text-primary text-sm sm:text-base">ID</span>
          <span className="mx-2 text-primary text-sm sm:text-base">/</span>
          <span className="text-zinc-500 text-sm sm:text-base">EN</span>
        </div>
        <button aria-label="Notifications" className="material-icons text-zinc-500 text-xl sm:text-2xl">
          notifications
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64 mt-32 sm:mt-44">
          <span className="material-icons animate-spin text-primary text-2xl sm:text-3xl">refresh</span>
        </div>
      ) : (
        <div className="pt-32 sm:pt-44 px-3 sm:px-6 lg:px-12 pb-8">
          {/* Profile section */}
          <section className="mb-5">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center p-4 sm:p-5 bg-white rounded-xl border border-gray-300">
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <ProfilePictureUpload
                  currentProfilePicture={userData?.profilePicture || userData?.organization?.profilePicture || null}
                  organizationType={organizationType}
                />
              </div>
              <div className="flex flex-col gap-1.5 text-center sm:text-left w-full sm:w-auto">
                <h2 className="text-base font-bold text-neutral-600">{userData?.fullName || "-"}</h2>
                <p className="text-xs text-neutral-600">Admin</p>
              </div>
            </div>
          </section>

          {/* Organization Information section */}
          <section className="mb-5">
            <div className="p-4 sm:p-5 bg-white rounded-xl border border-gray-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2.5 gap-2">
                <h3 className="text-lg sm:text-xl font-semibold text-primary">{organizationInfoTitle}</h3>
                <button
                  onClick={() => setActiveModal("organizationInfo")}
                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-md cursor-pointer hover:bg-primary-variant1 transition duration-200 w-full sm:w-auto"
                >
                  Edit
                </button>
              </div>

              {/* Gradient divider */}
              <div className="relative h-px w-full mb-4">
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, #FFFFFF 0%, #488BBE 50%, #FFFFFF 100%)",
                  }}
                ></div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                <div className="w-full lg:w-64 xl:w-80">
                  <span className="block text-xs text-zinc-500">{organizationNameLabel}</span>
                  <span className="block text-sm sm:text-base text-neutral-600 mt-1 break-words">
                    {userData?.fullName || "-"}
                  </span>
                </div>
                <div className="w-full lg:w-80 xl:w-96">
                  <span className="block text-xs text-zinc-500">{addressLabel}</span>
                  <span className="block text-sm sm:text-base text-neutral-600 mt-1 break-words">
                    {userData?.organization?.address || "-"}
                  </span>
                </div>
                <div className="w-full lg:w-auto">
                  <span className="block text-xs text-zinc-500">Nomor Telepon</span>
                  <span className="block text-sm sm:text-base text-neutral-600 mt-1 break-words">{displayPhone}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Account Settings section */}
          <section>
            <div className="p-4 sm:p-5 bg-white rounded-xl border border-gray-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2.5 gap-2">
                <h3 className="text-lg sm:text-xl font-semibold text-primary">Pengaturan Akun</h3>
                <button
                  onClick={() => setActiveModal("accountSettings")}
                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-md cursor-pointer hover:bg-primary-variant1 transition duration-200 w-full sm:w-auto"
                >
                  Edit
                </button>
              </div>

              {/* Gradient divider */}
              <div className="relative h-px w-full mb-4">
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, #FFFFFF 0%, #488BBE 50%, #FFFFFF 100%)",
                  }}
                ></div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                <div className="w-full lg:w-80 xl:w-96">
                  <span className="block text-xs text-zinc-500">Email</span>
                  <span className="block text-sm sm:text-base text-neutral-600 mt-1 break-words">
                    {userData?.email || "Belum diisi"}
                  </span>
                </div>
                <div className="w-full lg:w-auto">
                  <span className="block text-xs text-zinc-500">Password</span>
                  <span className="block text-sm sm:text-base text-neutral-600 mt-1">********</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Organization Info Edit Modal */}
      <AnimatePresence>
        {activeModal === "organizationInfo" && (
          <Modal isOpen={true} onClose={() => handleModalClose(false)}>
            <ProfileEditModal
              onClose={handleModalClose}
              userData={userData}
              organizationType={organizationType}
              organizationLabel={organizationLabel}
              organizationNameLabel={organizationNameLabel}
              addressLabel={addressLabel}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Account Settings Modal */}
      <AnimatePresence>
        {activeModal === "accountSettings" && (
          <Modal isOpen={true} onClose={() => handleModalClose(false)}>
            <AccountEditModal onClose={handleModalClose} userData={userData} organizationType={organizationType} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <SuccessModal isOpen={true} message={modalMessage} onClose={() => setShowSuccessModal(false)} />
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && <ErrorModal isOpen={true} message={modalMessage} onClose={() => setShowErrorModal(false)} />}
      </AnimatePresence>
    </div>
  )
}

export default ProfilePage
