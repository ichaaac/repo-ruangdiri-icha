// src/components/organization/school/profile/ProfilePictureUpload.jsx
import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";

const ProfilePictureUpload = ({ currentProfilePicture }) => {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(currentProfilePicture);
  const [isHovering, setIsHovering] = useState(false);
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Upload profile picture mutation
  const uploadProfilePicture = useMutation({
    mutationFn: async (file) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const formData = new FormData();
      formData.append("profilePicture", file);
      
      return axios.put(
        `${API_URL}/organizations/profile-picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          },
        }
      );
    },
    onSuccess: (response) => {
      // Invalidate both the general user profile and the specific organization profile
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['school', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['company', 'profile'] });
      
      // Update image preview if response contains new image URL
      if (response.data?.data?.organization?.profilePicture) {
        setPreviewImage(response.data.data.organization.profilePicture);
      }
    },
    onError: (error) => {
      console.error("Error uploading profile picture:", error);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
        className={clsx(
          "absolute right-0 bottom-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center",
          "transition-opacity duration-200",
          isHovering || uploadProfilePicture.isLoading ? "opacity-100" : "opacity-75 hover:opacity-100"
        )}
        aria-label="Upload profile picture"
      >
        {uploadProfilePicture.isLoading ? (
          <span className="material-icons text-white animate-spin text-sm">refresh</span>
        ) : (
          <span className="material-icons text-white text-sm">photo_camera</span>
        )}
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default ProfilePictureUpload;