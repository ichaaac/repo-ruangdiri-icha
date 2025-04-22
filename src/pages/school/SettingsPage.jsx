import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/school/Navbar";
import Sidebar from "../../components/school/Sidebar";

const SettingsPage = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [errors, setErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [originalData, setOriginalData] = useState({...formData});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear specific error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
    
    setHasChanges(true);
  };
  
  const handleSave = () => {
    // Validate fields
    const newErrors = {};
    let hasError = false;
    
    // Check if old password is empty
    if (!formData.oldPassword) {
      newErrors.oldPassword = "Password saat ini tidak boleh kosong";
      hasError = true;
    }
    
    // Check if new password is same as old password
    if (formData.newPassword && formData.newPassword === formData.oldPassword) {
      newErrors.newPassword = "Tidak bisa menggunakan password yang sudah dipakai";
      hasError = true;
    }
    
    // Check if passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Password tidak sama";
      hasError = true;
    }
    
    // Check password requirements if not empty
    if (formData.newPassword) {
      const validationResults = validatePassword(formData.newPassword);
      if (!validationResults.isValid) {
        newErrors.newPassword = "Password tidak memenuhi persyaratan";
        hasError = true;
      }
    } else if (isEditing) {
      newErrors.newPassword = "Password baru tidak boleh kosong";
      hasError = true;
    }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    // Here you would handle the API call to update settings
    console.log("Saving settings:", formData);
    setOriginalData({...formData});
    setHasChanges(false);
    setIsEditing(false);
    setShowSuccessModal(true);
    
    // Reset form after saving
    setFormData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      resetForm();
    }
  };
  
  const confirmCancel = () => {
    resetForm();
    setShowCancelModal(false);
  };
  
  const resetForm = () => {
    // Reset form data
    setFormData({...originalData});
    setErrors({
      oldPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setHasChanges(false);
    setIsEditing(false);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };
  
  // Check if password meets requirements
  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    
    return {
      hasMinLength,
      hasUpperCase,
      hasNumber,
      hasSpecialChar,
      isValid: hasMinLength && hasUpperCase && hasNumber && hasSpecialChar
    };
  };
  
  // Get validation results
  const validationResults = validatePassword(formData.newPassword);
  
  // Determine effective sidebar state for content positioning
  const isSidebarOpen = sidebarExpanded || sidebarHovered;
  
  return (
    <div className="min-h-screen bg-[#F8F7FA]">
      <Navbar />
      
      <div className="flex pt-[123px]">
        <Sidebar 
          expanded={sidebarExpanded} 
          setExpanded={setSidebarExpanded} 
          onHoverChange={setSidebarHovered}
        />
        
        <div 
          className="w-full min-h-[calc(100vh-123px)] transition-all duration-400 ease-in-out relative"
          style={{ 
            marginLeft: isSidebarOpen ? '200px' : '69px'
          }}
        >
          {/* Full-screen background */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              background: `url('/layanan-kami-bg.svg')`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          />
          
          <div className="relative z-10 p-6 md:p-10 w-full max-w-[1440px] mx-auto">
            <div className="flex flex-col bg-white rounded-xl shadow-md w-full max-w-[695px] mx-auto my-6 overflow-hidden">
              <div className="flex flex-col items-start px-6 md:px-10 pt-8 pb-6 w-full">
                <h1 className="text-2xl md:text-3xl font-bold leading-none text-primary">
                  Pengaturan Akun
                </h1>
                
                <div className="w-full mt-7">
                  <EmailSection />
                  
                  {isEditing ? (
                    <PasswordEditSection 
                      formData={formData}
                      handleChange={handleChange}
                      showOldPassword={showOldPassword} 
                      setShowOldPassword={setShowOldPassword}
                      showNewPassword={showNewPassword}
                      setShowNewPassword={setShowNewPassword}
                      showConfirmPassword={showConfirmPassword}
                      setShowConfirmPassword={setShowConfirmPassword}
                      validationResults={validationResults}
                      errors={errors}
                      handleSave={handleSave}
                      handleCancel={handleCancel}
                    />
                  ) : (
                    <PasswordViewSection handleEdit={handleEdit} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <SuccessModal onClose={() => setShowSuccessModal(false)} />
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelModal 
            onCancel={() => setShowCancelModal(false)} 
            onConfirm={confirmCancel} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function EmailSection() {
  return (
    <div className="flex flex-col py-6 pr-3 pl-4 md:pl-7 w-full bg-blue-50 rounded-xl">
      <label className="self-start text-xs leading-5 text-zinc-400">
        Email
      </label>
      <p className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base leading-none rounded-md min-h-8 text-zinc-500">
        smaveteran007@gmail.com
      </p>
    </div>
  );
}

function PasswordViewSection({ handleEdit }) {
  return (
    <div className="flex flex-col py-6 pr-3 pl-4 md:pl-7 mt-4 w-full bg-blue-50 rounded-xl">
      <label className="self-start text-xs leading-5 text-zinc-400">
        Password
      </label>
      <div className="flex justify-between items-center w-full">
        <p className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base leading-none rounded-md min-h-8 text-zinc-500">
          ••••••••
        </p>
        <button 
          onClick={handleEdit}
          className="px-4 py-1.5 text-white bg-primary hover:bg-primary-variant1 transition-colors rounded-[50px] text-sm"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function PasswordEditSection({
  formData,
  handleChange,
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  validationResults,
  errors,
  handleSave,
  handleCancel
}) {
  return (
    <div className="flex flex-col py-6 pr-2.5 pl-4 md:pl-7 mt-4 w-full text-xs leading-loose bg-blue-50 rounded-xl">
      {/* Old Password Field */}
      <div className="mb-4">
        <label className="self-start text-zinc-400">
          Password Saat Ini
        </label>
        <div className={`flex items-center px-3 py-1.5 mt-2 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 ${errors.oldPassword ? 'border border-[#EE4266]' : ''}`}>
          <input
            type={showOldPassword ? "text" : "password"}
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
            className={`flex-1 outline-none border-none bg-transparent ${errors.oldPassword ? 'text-[#EE4266]' : 'text-zinc-500'}`}
            placeholder="Masukkan password saat ini"
          />
          <span 
            className={`material-icons text-sm cursor-pointer ${errors.oldPassword ? 'text-[#EE4266]' : 'text-zinc-400 hover:text-zinc-600'} transition-colors`}
            onClick={() => setShowOldPassword(!showOldPassword)}
          >
            {showOldPassword ? "visibility_off" : "visibility"}
          </span>
        </div>
        
        {/* Error message for old password with animation */}
        <AnimatePresence>
          {errors.oldPassword && (
            <motion.div 
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-xs rounded-[200px] text-[#EE4266] bg-[#FFEAEC] border border-[#C34F58]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <span className="material-icons text-sm">error</span>
              <span>{errors.oldPassword}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Password Field */}
      <div className="mb-1">
        <label className="self-start text-zinc-400">
          Password Baru
        </label>
        <div className={`flex items-center px-3 py-1.5 mt-2 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 ${errors.newPassword ? 'border border-[#EE4266]' : ''}`}>
          <input
            type={showNewPassword ? "text" : "password"}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className={`flex-1 outline-none border-none bg-transparent ${errors.newPassword ? 'text-[#EE4266]' : 'text-zinc-500'}`}
            placeholder="Masukkan password baru"
          />
          <span 
            className={`material-icons text-sm cursor-pointer ${errors.newPassword ? 'text-[#EE4266]' : 'text-zinc-400 hover:text-zinc-600'} transition-colors`}
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? "visibility_off" : "visibility"}
          </span>
        </div>
        
        {/* Error message for new password with animation */}
        <AnimatePresence>
          {errors.newPassword && (
            <motion.div 
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-xs rounded-[200px] text-[#EE4266] bg-[#FFEAEC] border border-[#C34F58]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <span className="material-icons text-sm">error</span>
              <span>{errors.newPassword}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Password Requirements */}
      <div className="ml-4 mb-4">
        <p className="text-xs text-zinc-500 mb-1">Password harus terdiri dari:</p>
        <div className="flex gap-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] mr-1" style={{ color: validationResults.hasMinLength ? "#9BCA61" : "#EE4266" }}>
                {validationResults.hasMinLength ? "check_circle" : "cancel"}
              </span>
              <span className={validationResults.hasMinLength ? "text-[#9BCA61]" : "text-[#EE4266]"}>
                Minimal 8 karakter
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] mr-1" style={{ color: validationResults.hasUpperCase ? "#9BCA61" : "#EE4266" }}>
                {validationResults.hasUpperCase ? "check_circle" : "cancel"}
              </span>
              <span className={validationResults.hasUpperCase ? "text-[#9BCA61]" : "text-[#EE4266]"}>
                Minimal 1 huruf kapital
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] mr-1" style={{ color: validationResults.hasNumber ? "#9BCA61" : "#EE4266" }}>
                {validationResults.hasNumber ? "check_circle" : "cancel"}
              </span>
              <span className={validationResults.hasNumber ? "text-[#9BCA61]" : "text-[#EE4266]"}>
                Minimal 1 angka
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons text-[14px] mr-1" style={{ color: validationResults.hasSpecialChar ? "#9BCA61" : "#EE4266" }}>
                {validationResults.hasSpecialChar ? "check_circle" : "cancel"}
              </span>
              <span className={validationResults.hasSpecialChar ? "text-[#9BCA61]" : "text-[#EE4266]"}>
                Minimal 1 karakter khusus
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Password Field */}
      <div className="mb-6">
        <label className="self-start text-zinc-400">
          Konfirmasi Password Baru
        </label>
        <div className={`flex items-center px-3 py-1.5 mt-2 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 ${errors.confirmPassword ? 'border border-[#EE4266]' : ''}`}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`flex-1 outline-none border-none bg-transparent ${errors.confirmPassword ? 'text-[#EE4266]' : 'text-zinc-500'}`}
            placeholder="Masukkan kembali password baru"
          />
          <span 
            className={`material-icons text-sm cursor-pointer ${errors.confirmPassword ? 'text-[#EE4266]' : 'text-zinc-400 hover:text-zinc-600'} transition-colors`}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? "visibility_off" : "visibility"}
          </span>
        </div>
        
        {/* Error message with animation - Only shows under confirm password field */}
        <AnimatePresence>
          {errors.confirmPassword && (
            <motion.div 
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-xs rounded-[200px] text-[#EE4266] bg-[#FFEAEC] border border-[#C34F58]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <span className="material-icons text-sm">error</span>
              <span>{errors.confirmPassword}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 items-center self-end text-sm">
        <button 
          type="button"
          onClick={handleCancel}
          className="px-4 py-1.5 rounded-[50px] text-primary border border-primary hover:bg-blue-50 transition-colors"
        >
          Batal
        </button>
        <button 
          type="button"
          onClick={handleSave}
          className="px-4 py-1.5 rounded-[50px] bg-primary text-white hover:bg-primary-variant1 transition-colors"
        >
          Simpan
        </button>
      </div>
    </div>
  );
}

// Success Modal Component
function SuccessModal({ onClose }) {
  return (
    <motion.div 
      className="fixed inset-0 bg-[#8DD0DEB2] flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-xl w-[90%] max-w-[454px] py-8 md:py-10 flex flex-col items-center justify-center relative shadow-lg"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span className="material-icons">close</span>
        </button>
        
        <span className="material-icons text-[60px] md:text-[80px] text-primary-variant1">
          check_circle
        </span>
        
        <p className="text-lg md:text-xl mt-4 text-primary-variant1 font-bold text-center px-4">
          Data kamu telah berhasil diubah
        </p>
      </motion.div>
    </motion.div>
  );
}

// Cancel Confirmation Modal Component
function CancelModal({ onCancel, onConfirm }) {
  return (
    <motion.div 
      className="fixed inset-0 bg-[#8DD0DEB2] flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onCancel}
    >
      <motion.div 
        className="bg-white rounded-xl w-[90%] max-w-[454px] py-6 md:py-8 flex flex-col items-center justify-center relative shadow-lg"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="material-icons text-[60px] md:text-[80px] text-[#EE4266]">
          error
        </span>
        
        <p className="text-lg md:text-xl mt-4 text-[#EE4266] font-bold text-center">
          Apakah kamu yakin?
        </p>
        
        <p className="text-sm mt-3 text-[#8B8B8B] max-w-[300px] text-center px-4">
          Perubahan yang belum disimpan akan hilang.
        </p>
        
        <div className="w-[80%] h-[1px] bg-gray-200 my-5"></div>
        
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="px-5 md:px-6 py-2 border border-[#EE4266] text-[#EE4266] rounded-[50px] hover:bg-red-50 transition-colors"
          >
            Batal
          </button>
          
          <button 
            onClick={onConfirm}
            className="px-5 md:px-6 py-2 bg-[#EE4266] text-white rounded-[50px] hover:bg-red-700 transition-colors"
          >
            Ya
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SettingsPage;