// src/components/organization/school/profile/ProfilePictureUpload.jsx
import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";

const ProfilePictureUpload = ({ currentProfilePicture }) => {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(currentProfilePicture);
  const [isHovering, setIsHovering] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Update preview when currentProfilePicture changes
  useEffect(() => {
    setPreviewImage(currentProfilePicture);
  }, [currentProfilePicture]);

  // Upload profile picture mutation
  const uploadProfilePicture = useMutation({
    mutationFn: async (file) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Clear any previous errors
      setUploadError(null);
      
      const formData = new FormData();
      formData.append("profilePicture", file);
      
      console.log("Uploading profile picture...");
      
      return axios.put(
        `${API_URL}/api/v1/organizations/profile-picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          },
        }
      );
    },
    onSuccess: (response) => {
      console.log("Profile picture upload success:", response.data);
      
      // Invalidate both the general user profile and the specific organization profile
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['school', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['company', 'profile'] });
      
      // Update image preview if response contains new image URL
      if (response.data?.data?.organization?.profilePicture) {
        setPreviewImage(response.data.data.organization.profilePicture);
      } else if (response.data?.data?.profilePicture) {
        setPreviewImage(response.data.data.profilePicture);
      }
    },
    onError: (error) => {
      console.error("Error uploading profile picture:", error);
      
      // Set user-friendly error message
      if (error.response?.data?.message) {
        setUploadError(error.response.data.message);
      } else {
        setUploadError("Gagal mengupload foto profil. Silakan coba lagi.");
      }
      
      // Show error for 3 seconds
      setTimeout(() => {
        setUploadError(null);
      }, 3000);
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
        <div className="w-24 h-24 rounded-full overflow-hidden">
          {previewImage ? (
            <img
              src={previewImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="material-icons text-gray-400" style={{ fontSize: "3rem" }}>
                person
              </span>
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={uploadProfilePicture.isPending}
          className={clsx(
            "absolute right-0 bottom-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center",
            "transition-opacity duration-200",
            isHovering || uploadProfilePicture.isPending ? "opacity-100" : "opacity-75 hover:opacity-100",
            uploadProfilePicture.isPending ? "cursor-not-allowed" : "cursor-pointer"
          )}
          aria-label="Upload profile picture"
        >
          {uploadProfilePicture.isPending ? (
            <span className="material-icons text-white animate-spin text-sm">refresh</span>
          ) : (
            <span className="material-icons text-white text-sm">photo_camera</span>
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
      
      {/* Error message display */}
      {uploadError && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs whitespace-nowrap">
          {uploadError}
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;