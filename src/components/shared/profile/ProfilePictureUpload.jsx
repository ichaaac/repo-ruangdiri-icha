// src/components/shared/profile/ProfilePictureUpload.jsx
import { useState, useRef, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import clsx from "clsx"
import api from "../../../lib/api"
import { toast } from "sonner"

const ProfilePictureUpload = ({ currentProfilePicture, organizationType = "school" }) => {
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(currentProfilePicture)
  const [isHovering, setIsHovering] = useState(false)
  const [imageError, setImageError] = useState(false)
  const queryClient = useQueryClient()
  
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  const maxSize = 2 * 1024 * 1024 // 2MB

  // Update preview when currentProfilePicture changes
  useEffect(() => {
    setPreviewImage(currentProfilePicture)
    setImageError(false)
  }, [currentProfilePicture])

  // Custom toast style
  const toastStyle = {
    backgroundColor: "#FEE2E2", // red-100
    color: "#B91C1C",           // red-700
    fontSize: "0.75rem",        // text-xs
    textAlign: "center",
    padding: "6px 12px",
    borderRadius: "6px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    maxWidth: "200px",
  }

  // Upload profile picture mutation
  const uploadProfilePicture = useMutation({
    mutationFn: async (file) => {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      console.log("Uploading profile picture...")

      // Use the organization API method
      return api.organization.updateProfilePicture(file)
    },
    onSuccess: (response) => {
      console.log("Profile picture upload success:", response)

      // Force refetch user data immediately and after delay
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      queryClient.refetchQueries({ queryKey: ["currentUser"] })

      // Also refetch after a longer delay to ensure backend is updated
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["currentUser"] })
      }, 1000)

      // Set preview image from response - check both locations
      let newImageUrl = null
      if (response?.data?.profilePicture) {
        newImageUrl = response.data.profilePicture
      } else if (response?.data?.organization?.profilePicture) {
        newImageUrl = response.data.organization.profilePicture
      }

      if (newImageUrl) {
        setPreviewImage(newImageUrl)
        setImageError(false)
      }
    },
    onError: (error) => {
      console.error("Error uploading profile picture:", error);
    
      const message = error.response?.data?.message || "Gagal mengupload foto profil. Silakan coba lagi.";
    
      toast.error(message, {
        style: toastStyle,
        closeButton: false, // Remove close button
      });
    }
  })

  const handleFileChange = (e) => {
    // Reset the input value to ensure the change event fires even if the same file is selected
    const input = e.target
    const file = input.files[0]
    if (!file) return
  
    // Clear the input value to allow the same file to be selected again
    // This has to be wrapped in setTimeout to not interfere with the current selection
    setTimeout(() => {
      input.value = ''
    }, 100)
  
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.", {
        style: toastStyle,
        closeButton: false, // Remove close button
      })
      return
    }
  
    if (file.size > maxSize) {
      toast.error("Ukuran file terlalu besar. Maksimal 2MB.", {
        style: toastStyle,
        closeButton: false, // Remove close button
      })
      return
    }
  
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result)
      setImageError(false)
    }
    reader.readAsDataURL(file)
  
    uploadProfilePicture.mutate(file)
  }
  
  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  // Get appropriate fallback icon based on organization type
  const getFallbackIcon = () => {
    return organizationType === "company" ? "business" : "person"
  }

  // Handle image load error
  const handleImageError = () => {
    console.log("Profile image failed to load:", previewImage)
    setImageError(true)
  }

  // Add useEffect to debug when previewImage changes
  useEffect(() => {
    console.log("Preview image updated:", previewImage)
    console.log("Image error state:", imageError)

    // Cleanup object URLs when component unmounts
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage)
      }
    }
  }, [previewImage, imageError])

  return (
    <div className="relative z-50">
      <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden">
          {previewImage && !imageError ? (
            <img
              src={previewImage || "/placeholder.svg"}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={() => console.log("Profile image loaded successfully:", previewImage)}
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
    </div>
  )
}

export default ProfilePictureUpload