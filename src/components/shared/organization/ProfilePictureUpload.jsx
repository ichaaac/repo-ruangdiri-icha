// src/components/shared/organization/ProfilePictureUpload.jsx
import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { apiClient } from "../../../lib/api";

const ProfilePictureUpload = ({ currentProfilePicture }) => {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(currentProfilePicture);
  const [isHovering, setIsHovering] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const queryClient = useQueryClient();

  // Update preview when currentProfilePicture changes
  useEffect(() => {
    setPreviewImage(currentProfilePicture);
  }, [currentProfilePicture]);

  // Upload profile picture mutation using the new endpoint
  const uploadProfilePicture = useMutation({
    mutationFn: async (file) => {
      setUploadError(null);
      
      const formData = new FormData();
      formData.append("profilePicture", file);
      
      return apiClient.patch(
        "/organizations/profile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
    },
    onSuccess: (response) => {
      // Invalidate user queries to refetch
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // Update preview with new image
      if (response.data?.data?.organization?.profilePicture) {
        setPreviewImage(response.data.data.organization.profilePicture);
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Gagal mengupload foto profil. Silakan coba lagi.";
      setUploadError(message);
      setTimeout(() => setUploadError(null), 3000);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.");
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setUploadError("Ukuran file terlalu besar. Maksimal 2MB.");
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload the file
    uploadProfilePicture.mutate(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="relative">
      <div
        className="relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden">
          {previewImage ? (
            <img
              src={previewImage}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={() => {
                setPreviewImage(null);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="material-icons text-gray-400" style={{ fontSize: "2.5rem" }}>
                business
              </span>
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={uploadProfilePicture.isPending}
          className={clsx(
            "absolute right-0 bottom-0 w-7 h-7 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center",
            "transition-opacity duration-200",
            isHovering || uploadProfilePicture.isPending ? "opacity-100" : "opacity-75 hover:opacity-100",
            uploadProfilePicture.isPending ? "cursor-not-allowed" : "cursor-pointer"
          )}
          aria-label="Upload profile picture"
        >
          {uploadProfilePicture.isPending ? (
            <span className="material-icons text-white animate-spin text-xs md:text-sm">refresh</span>
          ) : (
            <span className="material-icons text-white text-xs md:text-sm">photo_camera</span>
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
      
      {/* Error message display - Responsive */}
      {uploadError && (
        <div className="absolute -bottom-10 md:-bottom-12 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-2 md:px-3 py-1 rounded-md text-[10px] md:text-xs whitespace-nowrap z-[9999] shadow-lg">
          {uploadError}
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;