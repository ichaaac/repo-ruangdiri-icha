"use client"

// src/components/shared/profile/ProfilePictureUpload.jsx
import { useState, useRef, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import clsx from "clsx"
import api from "../../../lib/api"

/**
 * Reusable Profile Picture Upload Component
 * @param {Object} props
 * @param {string} props.currentProfilePicture - Current profile picture URL
 * @param {string} props.organizationType - "school" or "company" for different icons
 */
const ProfilePictureUpload = ({ currentProfilePicture, organizationType = "school" }) => {
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(currentProfilePicture)
  const [isHovering, setIsHovering] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [imageError, setImageError] = useState(false)
  const queryClient = useQueryClient()

  // Update preview when currentProfilePicture changes
  useEffect(() => {
    setPreviewImage(currentProfilePicture)
    setImageError(false)
  }, [currentProfilePicture])

  // Upload profile picture mutation
  const uploadProfilePicture = useMutation({
    mutationFn: async (file) => {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      // Clear any previous errors
      setUploadError(null)

      console.log("Uploading profile picture...")

      // Use the organization API method
      return api.organization.updateProfilePicture(file)
    },
    onSuccess: (response) => {
      console.log("Profile picture upload success:", response)

      // Force refetch user data
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })

      // Also refetch after a short delay to ensure backend is updated
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["currentUser"] })
      }, 500)

      // Set preview image from response - check both locations
      let newImageUrl = null
      if (response?.data?.profilePicture) {
        newImageUrl = response.data.profilePicture
      }

      if (newImageUrl) {
        setPreviewImage(newImageUrl)
        setImageError(false)
      }
    },
    onError: (error) => {
      console.error("Error uploading profile picture:", error)

      // Set user-friendly error message
      if (error.response?.data?.message) {
        setUploadError(error.response.data.message)
      } else {
        setUploadError("Gagal mengupload foto profil. Silakan coba lagi.")
      }

      // Show error for 3 seconds
      setTimeout(() => {
        setUploadError(null)
      }, 3000)
    },
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.")
      setTimeout(() => setUploadError(null), 3000)
      return
    }

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setUploadError("Ukuran file terlalu besar. Maksimal 2MB.")
      setTimeout(() => setUploadError(null), 3000)
      return
    }

    // Create a preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result)
      setImageError(false)
    }
    reader.readAsDataURL(file)

    // Upload the file
    uploadProfilePicture.mutate(file)
  }

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const getFallbackIcon = () => {
    return organizationType === "company" 
  }

  // Handle image load error
  const handleImageError = () => {
    console.error("Profile image failed to load")
    setImageError(true)
  }

  return (
    <div className="relative">
      <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden">
          {previewImage && !imageError ? (
            <img
              src={previewImage || "/placeholder.svg"}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="material-icons text-gray-400" style={{ fontSize: "2.5rem" }}>
                {getFallbackIcon()}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleButtonClick}
          disabled={uploadProfilePicture.isPending}
          className={clsx(
            "absolute right-0 bottom-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center",
            "transition-opacity duration-200",
            isHovering || uploadProfilePicture.isPending ? "opacity-100" : "opacity-75 hover:opacity-100",
            uploadProfilePicture.isPending ? "cursor-not-allowed" : "cursor-pointer",
          )}
          aria-label="Upload profile picture"
        >
          {uploadProfilePicture.isPending ? (
            <span className="material-icons text-white animate-spin text-xs sm:text-sm">refresh</span>
          ) : (
            <span className="material-icons text-white text-xs sm:text-sm">photo_camera</span>
          )}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/gif, image/webp"
          className="hidden"
        />
      </div>

      {/* Error message display - Fixed width issue */}
      {uploadError && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs z-[9999] shadow-lg text-center min-w-max">
          {uploadError}
        </div>
      )}
    </div>
  )
}

export default ProfilePictureUpload
