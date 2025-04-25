import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationAPI } from "../../api/organization";

/**
 * Profile Picture Upload Component
 * Allows users to upload and manage their profile picture
 * Uses React Query directly rather than through a custom hook with useEffect
 * 
 * @param {Object} props - Component props
 * @param {string|null} props.currentImage - Current profile image URL
 * @param {string} props.queryKey - Query key to invalidate on success
 */
const ProfilePictureUpload = ({ currentImage = null, queryKey = "profile" }) => {
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  
  // Create update profile picture mutation directly
  const updateProfilePicture = useMutation({
    mutationFn: (file) => organizationAPI.updateProfilePicture(file),
    onSuccess: () => {
      // Invalidate relevant queries on success
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    }
  });
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Format file tidak didukung. Gunakan format JPG, PNG, GIF, atau WEBP.');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maksimum 2MB.');
        return;
      }
      
      // Upload the file
      updateProfilePicture.mutate(file);
    }
  };
  
  // Open file selector on button click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative w-24 h-24"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <motion.button
          type="button"
          onClick={handleButtonClick}
          className="w-full h-full rounded-full overflow-hidden focus:outline-none"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          disabled={updateProfilePicture.isPending}
        >
          {currentImage ? (
            <img 
              src={currentImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary-light flex items-center justify-center">
              <span className="material-icons text-4xl text-primary">person</span>
            </div>
          )}
          
          {/* Hover overlay */}
          <motion.div 
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovering && !updateProfilePicture.isPending ? 0.5 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="material-icons text-white">photo_camera</span>
          </motion.div>
        </motion.button>
        
        {/* Edit button */}
        <div 
          className={`absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-md ${updateProfilePicture.isPending ? 'opacity-50' : ''}`}
          onClick={!updateProfilePicture.isPending ? handleButtonClick : undefined}
        >
          {updateProfilePicture.isPending ? (
            <span className="material-icons text-white text-sm animate-spin">sync</span>
          ) : (
            <span className="material-icons text-white text-sm">photo_camera</span>
          )}
        </div>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/gif, image/webp"
          className="hidden"
          disabled={updateProfilePicture.isPending}
        />
      </div>
      
      {/* Status messages */}
      {updateProfilePicture.isPending && (
        <p className="text-xs text-primary mt-2 flex items-center">
          <span className="material-icons animate-spin mr-1 text-sm">sync</span>
          Mengunggah...
        </p>
      )}
      
      {updateProfilePicture.isError && (
        <p className="text-xs text-red-500 mt-2 flex items-center">
          <span className="material-icons mr-1 text-sm">error</span>
          {updateProfilePicture.error?.message || "Gagal mengunggah gambar"}
        </p>
      )}
      
      {updateProfilePicture.isSuccess && (
        <p className="text-xs text-green-500 mt-2 flex items-center">
          <span className="material-icons mr-1 text-sm">check_circle</span>
          Foto profil berhasil diperbarui
        </p>
      )}
    </div>
  );
};

export default ProfilePictureUpload;