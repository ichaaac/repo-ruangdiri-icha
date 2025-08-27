// src/components/shared/profile/ProfilePictureUpload.jsx

import { useState, useRef, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import api from "../../../lib/api"
import { toast } from "sonner"

// --- KOMPONEN MODAL DENGAN LAYOUT YANG DIPOLES ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, previewUrl, isUploading, mode }) => {
  if (!isOpen) return null

  const handleClose = () => {
    console.log("Confirmation modal closed by user - no upload occurred")
    onClose()
  }

  const handleConfirm = () => {
    console.log("User confirmed upload")
    onConfirm()
  }

  const buttonText = mode === "client-only" ? "Pilih Foto Ini" : "Simpan";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col relative z-[10000]"
      >
        {/* Konten Atas dengan Padding */}
        <div className="p-6 text-center relative">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <span className="material-icons text-xl">close</span>
          </button>
          <h3 className="text-lg font-bold text-[#488BBA] mb-2">Ganti Foto Profil?</h3>
          <p className="text-sm text-gray-500">
            {mode === "client-only" 
              ? "Foto ini akan ditampilkan sebagai foto profil baru Anda." 
              : "Foto ini akan diupload dan disimpan sebagai foto profil baru Anda."}
          </p>
        </div>

        {/* Preview Foto di Tengah */}
        <div className="px-6 py-4 flex justify-center">
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 shadow-inner">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
        </div>

        {/* Tombol Aksi di Bawah dengan Padding */}
        <div className="w-full p-6 pt-4">
          <button
            onClick={handleConfirm}
            disabled={isUploading}
            className="w-full h-12 px-6 bg-[#488BBA] text-white font-bold rounded-full hover:bg-[#3a7a9e] transition-colors disabled:bg-gray-400 flex items-center justify-center"
          >
            {isUploading ? (
              <span className="material-icons animate-spin">refresh</span>
            ) : (
              buttonText
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const ProfilePictureUpload = ({ 
  currentProfilePicture, 
  organizationType = "school", 
  isOnboarding = false,
  mode = "direct-upload", // "direct-upload" | "client-only"
  onImageSelect, // callback untuk client-only mode
  onUploadSuccess, // callback untuk direct-upload mode
  isEditing = true // new prop untuk control button visibility
}) => {
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(currentProfilePicture)
  const [isHovering, setIsHovering] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [tempPreviewUrl, setTempPreviewUrl] = useState(null)
  const queryClient = useQueryClient()

  const allowedTypes = ["image/jpeg", "image/png"]
  const maxSize = 2 * 1024 * 1024 // 2MB

  useEffect(() => {
    setPreviewImage(currentProfilePicture)
    setImageError(false)
  }, [currentProfilePicture])

  useEffect(() => {
    return () => {
      if (tempPreviewUrl && !tempPreviewUrl.startsWith('data:')) {
        URL.revokeObjectURL(tempPreviewUrl)
      }
    }
  }, [tempPreviewUrl])

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

  // DIRECT UPLOAD: Upload foto profil langsung ke server
  const uploadProfilePicture = useMutation({
    mutationFn: async (file) => {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")

      return api.organization.updateProfilePicture(file)
    },
    onSuccess: (response) => {
      toast.success("Foto profil berhasil diubah!")

      const newImageUrl = response?.data?.profilePicture || response?.data?.organization?.profilePicture
      if (newImageUrl) {
        setPreviewImage(newImageUrl)
        setImageError(false)
      }
      handleCloseConfirmation()

      // Callback untuk parent component
      if (onUploadSuccess) {
        onUploadSuccess(newImageUrl)
      }

      if (!isOnboarding) {
        queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Gagal mengupload foto profil."
      toast.error(message, { style: toastStyle, closeButton: false })
      handleCloseConfirmation()
    },
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) {
      console.log("No file selected - user canceled file picker")
      return
    }

    // Reset input
    e.target.value = ""

    // Validasi file
    if (!allowedTypes.includes(file.type)) {
      toast.error("Gunakan format JPG atau PNG.", { style: toastStyle, closeButton: false })
      return
    }
    if (file.size > maxSize) {
      toast.error("Ukuran file terlalu besar. Maksimal 2MB.", { style: toastStyle, closeButton: false })
      return
    }

    console.log("File is valid, proceeding to show confirmation modal.")

    if (mode === "client-only") {
      // Convert to base64 untuk preview dan storage
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target.result
        setTempPreviewUrl(base64String)
        setSelectedFile({ file, base64: base64String })
        setShowConfirmation(true)
        setImageError(false)
      }
      reader.readAsDataURL(file)
    } else {
      // Direct upload mode - gunakan object URL untuk preview
      const previewUrl = URL.createObjectURL(file)
      setSelectedFile(file)
      setTempPreviewUrl(previewUrl)
      setShowConfirmation(true)
      setImageError(false)
    }
  }

  const handleButtonClick = () => {
    if (mode === "direct-upload" && uploadProfilePicture.isPending) return
    
    console.log("Profile picture button clicked - opening file picker")
    fileInputRef.current.click()
  }

  const handleConfirmUpload = () => {
    if (!selectedFile) return

    if (mode === "client-only") {
      // CLIENT-ONLY MODE: Set preview dan callback ke parent
      setPreviewImage(selectedFile.base64)
      
      if (onImageSelect) {
        onImageSelect(selectedFile.base64)
      }
      
      toast.success("Foto profil dipilih! Klik 'Simpan' untuk menyimpan perubahan.")
    } else {
      // DIRECT UPLOAD MODE: Upload ke server langsung
      uploadProfilePicture.mutate(selectedFile)
    }
    
    handleCloseConfirmation()
  }

  const handleCloseConfirmation = () => {
    console.log("Modal closed")
    
    setShowConfirmation(false)
    setSelectedFile(null)
    if (tempPreviewUrl && !tempPreviewUrl.startsWith('data:')) {
      URL.revokeObjectURL(tempPreviewUrl)
    }
    setTempPreviewUrl(null)
  }

  const getFallbackIcon = () => {
    return organizationType === "company" ? "business" : "person"
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const isLoading = mode === "direct-upload" && uploadProfilePicture.isPending

  return (
    <>
      <div className="relative z-50">
        <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {previewImage && !imageError ? (
              <img
                src={previewImage}
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
            disabled={isLoading}
            className={clsx(
              "absolute right-0 bottom-0 w-6 h-6 sm:w-8 sm:h-8 bg-[#488BBA] rounded-full flex items-center justify-center",
              "transition-all duration-200",
              isHovering && !isLoading ? "opacity-100 scale-110" : "opacity-75",
              isLoading && "opacity-50 cursor-not-allowed bg-gray-400 scale-100",
              !isEditing && "hidden" // Hide button when not in editing mode
            )}
            aria-label="Upload profile picture"
          >
            {isLoading && !showConfirmation ? (
              <span className="material-icons text-white animate-spin text-xs sm:text-sm">refresh</span>
            ) : (
              <span className="material-icons text-white text-xs sm:text-sm">photo_camera</span>
            )}
          </button>

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
            onConfirm={handleConfirmUpload}
            previewUrl={tempPreviewUrl}
            isUploading={isLoading}
            mode={mode}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default ProfilePictureUpload