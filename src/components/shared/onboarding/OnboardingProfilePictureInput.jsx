"use client"

// src/components/shared/onboarding/OnboardingProfilePictureInput.jsx - DIPERBAIKI: VALIDASI FILE DISAMAKAN

import { useState, useRef, useEffect } from "react"
import clsx from "clsx"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

// --- KOMPONEN MODAL DENGAN LAYOUT YANG DIPOLES ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, previewUrl, isConfirming }) => {
  if (!isOpen) return null

  const handleClose = () => {
    console.log("Confirmation modal closed by user - no upload occurred")
    onClose()
  }

  const handleConfirm = () => {
    console.log("User confirmed photo selection")
    onConfirm()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          style={{ backgroundColor: "#55555580" }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col"
          >
            {/* Konten Atas dengan Padding */}
            <div className="p-6 text-center relative">
              <button
                type="button"
                onClick={handleClose}
                disabled={isConfirming}
                className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <span className="material-icons text-xl">close</span>
              </button>
              <h3 className="text-lg font-bold text-[#488BBA] mb-2">Ganti Foto Profil?</h3>
              <p className="text-sm text-gray-500">Foto ini akan ditampilkan sebagai foto profil baru Anda.</p>
            </div>
            {/* Preview Foto di Tengah */}
            <div className="px-6 py-4 flex justify-center">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 shadow-inner">
                {previewUrl ? (
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
            </div>
            {/* Tombol Aksi di Bawah dengan Padding */}
            <div className="w-full p-6 pt-4">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming}
                className="w-full h-12 px-6 bg-primary text-white font-bold rounded-full hover:bg-primary-variant1 transition-colors disabled:bg-gray-400 flex items-center justify-center"
              >
                {isConfirming ? <span className="material-icons animate-spin">refresh</span> : "Simpan"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const OnboardingProfilePictureInput = ({ currentProfilePicture, organizationType = "school", onFileSelect }) => {
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(currentProfilePicture)
  const [isHovering, setIsHovering] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedFileForConfirmation, setSelectedFileForConfirmation] = useState(null)
  const [tempPreviewUrlForConfirmation, setTempPreviewUrlForConfirmation] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // --- PERUBAHAN DI SINI ---
  // Menyamakan validasi dengan ProfilePictureUpload
  const allowedTypes = ["image/jpeg", "image/png"]; // Hanya izinkan JPG dan PNG
  const maxSize = 2 * 1024 * 1024; // 2MB

  useEffect(() => {
    setPreviewImage(currentProfilePicture)
    setImageError(false)
  }, [currentProfilePicture])

  useEffect(() => {
    return () => {
      if (tempPreviewUrlForConfirmation) {
        URL.revokeObjectURL(tempPreviewUrlForConfirmation)
      }
    }
  }, [tempPreviewUrlForConfirmation])

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:") && previewImage !== currentProfilePicture) {
        URL.revokeObjectURL(previewImage)
      }
    }
  }, [previewImage, currentProfilePicture])

  const toastStyle = {
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "0.75rem",
    textAlign: "center",
    padding: "6px 12px",
    borderRadius: "6px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    maxWidth: "200px",
  }

  // --- PERUBAHAN DI SINI ---
  // Logika validasi disamakan persis dengan ProfilePictureUpload
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) {
      console.log("No file selected - user canceled file picker")
      return
    }
    e.target.value = "" // Reset input

    // Validasi tipe file
    if (!allowedTypes.includes(file.type)) {
      toast.error("Gunakan format JPG atau PNG.", { style: toastStyle, closeButton: false })
      return // Stop eksekusi
    }

    // Validasi ukuran file
    if (file.size > maxSize) {
      toast.error("Ukuran file terlalu besar. Maksimal 2MB.", { style: toastStyle, closeButton: false })
      return // Stop eksekusi
    }

    // Lanjut jika valid
    setSelectedFileForConfirmation(file)
    const newTempUrl = URL.createObjectURL(file)
    setTempPreviewUrlForConfirmation(newTempUrl)
    setShowConfirmation(true)
  }

  const handleButtonClick = () => {
    console.log("Profile picture button clicked - opening file picker")
    fileInputRef.current.click()
  }

  const handleConfirmSelection = () => {
    if (selectedFileForConfirmation && tempPreviewUrlForConfirmation) {
      setIsConfirming(true)
      onFileSelect(selectedFileForConfirmation, tempPreviewUrlForConfirmation)
      setPreviewImage(tempPreviewUrlForConfirmation)
      setImageError(false)
      setShowConfirmation(false)
      setSelectedFileForConfirmation(null)
      setIsConfirming(false)
    }
  }

  const handleCloseConfirmation = () => {
    setShowConfirmation(false)
    setSelectedFileForConfirmation(null)
    if (tempPreviewUrlForConfirmation) {
      URL.revokeObjectURL(tempPreviewUrlForConfirmation)
      setTempPreviewUrlForConfirmation(null)
    }
  }

  const getFallbackIcon = () => {
    return organizationType === "company" ? "business" : "person"
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <>
      <div className="relative z-10">
        <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {previewImage && !imageError ? (
              <img
                src={previewImage || "/placeholder.svg"}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <span className="material-icons text-gray-400" style={{ fontSize: "2.5rem" }}>
                {getFallbackIcon()}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleButtonClick}
            className={clsx(
              "absolute right-0 bottom-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center",
              "transition-all duration-200",
              isHovering ? "opacity-100 scale-110" : "opacity-75",
            )}
            aria-label="Upload profile picture"
          >
            <span className="material-icons text-white text-xs sm:text-sm">photo_camera</span>
          </button>
          
          {/* --- PERUBAHAN DI SINI --- */}
          {/* Menyamakan atribut `accept` */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png"
            className="hidden"
          />
        </div>
      </div>

      <AnimatePresence>
        {showConfirmation && (
          <ConfirmationModal
            isOpen={showConfirmation}
            onClose={handleCloseConfirmation}
            onConfirm={handleConfirmSelection}
            previewUrl={tempPreviewUrlForConfirmation}
            isConfirming={isConfirming}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default OnboardingProfilePictureInput