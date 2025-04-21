import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/school/Navbar";
import Sidebar from "../../components/school/Sidebar";

const SettingsPage = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    oldPassword: "password123",
    newPassword: "NewPass123!",
    confirmPassword: "NewPass123"
  });
  
  const [originalData, setOriginalData] = useState({...formData});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setHasChanges(true);
  };
  
  const handleSave = () => {
    // Here you would handle the API call to update settings
    console.log("Saving settings:", formData);
    setOriginalData({...formData});
    setHasChanges(false);
    setShowSuccessModal(true);
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
    setHasChanges(false);
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
  
  // Check if passwords match
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.newPassword !== "";
  
  // Get validation results
  const validationResults = validatePassword(formData.newPassword);
  
  return (
    <div className="min-h-screen bg-[#F8F7FA]">
      <Navbar />
      
      <div className="flex pt-[123px]">
        <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
        
        <div 
          className="w-full min-h-[calc(100vh-123px)] transition-all duration-300 ease-in-out relative"
          style={{ 
            marginLeft: sidebarExpanded ? '200px' : '69px'
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
                
                <EmailSection />
                <PasswordSection 
                  formData={formData}
                  handleChange={handleChange}
                  showOldPassword={showOldPassword} 
                  setShowOldPassword={setShowOldPassword}
                  showNewPassword={showNewPassword}
                  setShowNewPassword={setShowNewPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  validationResults={validationResults}
                  passwordsMatch={passwordsMatch}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                />
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
}

function EmailSection() {
  return (
    <div className="flex flex-col py-6 pr-3 pl-4 md:pl-7 mt-7 w-full bg-blue-50 rounded-xl">
      <label className="self-start text-xs leading-5 text-zinc-400">
        Email
      </label>
      <p className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base leading-none rounded-md min-h-8 text-zinc-500">
        smaveteran007@gmail.com
      </p>
    </div>
  );
}

function PasswordSection({
  formData,
  handleChange,
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  validationResults,
  passwordsMatch,
  handleSave,
  handleCancel
}) {
  return (
    <div className="flex flex-col py-6 pr-2.5 pl-4 md:pl-7 mt-6 w-full text-xs leading-loose bg-blue-50 rounded-xl">
      <OldPasswordField
        password={formData.oldPassword}
        showPassword={showOldPassword}
        setShowPassword={setShowOldPassword}
        handleChange={handleChange}
      />
      <NewPasswordField
        password={formData.newPassword}
        showPassword={showNewPassword}
        setShowPassword={setShowNewPassword}
        handleChange={handleChange}
      />
      <PasswordRequirements validationResults={validationResults} />
      <ConfirmPasswordField
        password={formData.confirmPassword}
        showPassword={showConfirmPassword}
        setShowPassword={setShowConfirmPassword}
        handleChange={handleChange}
        passwordsMatch={passwordsMatch}
      />
      <ActionButtons handleSave={handleSave} handleCancel={handleCancel} />
    </div>
  );
}

function OldPasswordField({ password, showPassword, setShowPassword, handleChange }) {
  return (
    <>
      <label className="self-start text-zinc-400">
        Password Lama
      </label>
      <div className="flex items-center px-3 py-1.5 mt-2 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 text-zinc-500">
        <input
          type={showPassword ? "text" : "password"}
          name="oldPassword"
          value={password}
          onChange={handleChange}
          className="flex-1 outline-none border-none bg-transparent"
          placeholder="Masukkan password lama"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="ml-2 focus:outline-none"
        >
          <span className="material-icons text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </>
  );
}

function NewPasswordField({ password, showPassword, setShowPassword, handleChange }) {
  return (
    <>
      <label className="self-start mt-6 text-zinc-400">
        Password Baru
      </label>
      <div className="flex items-center px-3 py-1.5 mt-2 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 text-zinc-500">
        <input
          type={showPassword ? "text" : "password"}
          name="newPassword"
          value={password}
          onChange={handleChange}
          className="flex-1 outline-none border-none bg-transparent"
          placeholder="Masukkan password baru"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="ml-2 focus:outline-none"
        >
          <span className="material-icons text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </>
  );
}

function PasswordRequirements({ validationResults }) {
  return (
    <div className="flex flex-col md:flex-row gap-3.5 self-start mt-1.5 ml-4 text-xs leading-4">
      <div className="text-zinc-500">
        Password harus terdiri dari :<br />{" "}
        <span className={validationResults.hasMinLength ? "text-lime-500" : "text-zinc-500"}>
          Minimal 8 karakter
        </span>
        <br />
        <span className={validationResults.hasUpperCase ? "text-lime-500" : "text-zinc-500"}>
          Minimal 1 huruf kapital
        </span>
      </div>
      <div className="text-zinc-500">
        <span className={validationResults.hasNumber ? "text-lime-500" : "text-zinc-500"}>
          Minimal 1 angka
        </span>
        <br />
        <span className={validationResults.hasSpecialChar ? "text-lime-500" : "text-zinc-500"}>
          Minimal 1 karakter khusus
        </span>
      </div>
    </div>
  );
}

function ConfirmPasswordField({ password, showPassword, setShowPassword, handleChange, passwordsMatch }) {
  return (
    <>
      <label className="self-start mt-6 text-zinc-400">
        Konfirmasi Password Baru
      </label>
      <div className={`flex items-center px-3 py-1.5 mt-2 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 ${password && !passwordsMatch ? 'text-rose-500' : 'text-zinc-500'}`}>
        <input
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          value={password}
          onChange={handleChange}
          className={`flex-1 outline-none border-none bg-transparent ${password && !passwordsMatch ? 'text-rose-500' : ''}`}
          placeholder="Masukkan kembali password baru"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="ml-2 focus:outline-none"
        >
          <span className={`material-icons text-sm ${password && !passwordsMatch ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-600'} transition-colors`}>
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {password && !passwordsMatch && (
        <p className="text-xs text-rose-500 mt-1 ml-2">
          Password tidak cocok
        </p>
      )}
    </>
  );
}

function ActionButtons({ handleSave, handleCancel }) {
  return (
    <div className="flex gap-3 items-center self-end mt-6 text-sm">
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
  );
}

// Success Modal Component
function SuccessModal({ onClose }) {
  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
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
          Password kamu berhasil diubah!
        </p>
      </motion.div>
    </motion.div>
  );
}

// Cancel Confirmation Modal Component
function CancelModal({ onCancel, onConfirm }) {
  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
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