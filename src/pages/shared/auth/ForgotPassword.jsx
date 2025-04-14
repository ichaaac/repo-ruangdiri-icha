"use client";
import React, { useState } from "react";
import SuccessModal from "../../../components/auth/SuccessModal";

/**
 * ForgotPassword component
 * Allows users to request a password reset link via email
 * 
 * @returns {JSX.Element} The ForgotPassword component
 */
const ForgotPassword = () => {
  // Form state
  const [email, setEmail] = useState("");
  
  // Error handling
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState(false);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState("");
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setErrorMessage("");
    setSuccessMessage("");
    setEmailError(false);
    
    // Validate email
    if (!email.trim()) {
      setErrorMessage("Email tidak boleh kosong");
      setEmailError(true);
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Format email tidak valid");
      setEmailError(true);
      return;
    }
    
    // Set loading state
    setIsSubmitting(true);
    
    try {
      // API call simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll simulate an error for specific test emails
      if (email === "notfound@example.com") {
        setErrorMessage("Email tidak ditemukan. Pastikan email yang kamu masukkan sudah benar terdaftar");
        setEmailError(true);
        return;
      }
      
      // Simulate successful request
      console.log("Reset password email sent to:", email);
      setSuccessMessage("Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam Anda.");
      setShowModal(true); // Show the success modal
      
    } catch (error) {
      // Handle any unexpected errors
      console.error("Forgot password error:", error);
      setErrorMessage("Terjadi kesalahan. Silakan coba lagi nanti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    setShowModal(false);
    // Optionally, you can redirect to login page after closing modal
    // window.location.href = "/login";
  };

  /**
   * Handle resend email
   */
  const handleResendEmail = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call for resending email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Resent password reset email to:", email);
      // You might want to show a different message for resend
      setSuccessMessage("Link reset password telah dikirim ulang ke email Anda.");
      
    } catch (error) {
      console.error("Resend error:", error);
      setErrorMessage("Gagal mengirim ulang email. Silakan coba lagi nanti.");
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row relative w-full min-h-screen font-sans overflow-hidden">
      {/* Left section with background and illustration */}
      <div className="w-full md:w-1/2 h-[40vh] md:h-screen relative max-sm:h-[30vh] bg-[#8CC3EE]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/bg-login.png")' }}
        >
          <div className="absolute inset-0 flex justify-center items-center">
            <img
              src="/img-forgot-password.png"
              alt="Forgot password illustration"
              className="w-[350px] xl:w-[450px] lg:w-[400px] md:w-[350px] sm:w-[300px] max-sm:w-[250px] object-contain"
            />
          </div>
        </div>
      </div>

      {/* Right section with form */}
      <div className="flex-1 p-6 md:p-10 max-md:p-5 max-sm:w-full bg-white overflow-auto">
        <div className="flex flex-col items-start mx-auto mt-10 sm:mt-16 md:mt-28 lg:mt-20 max-w-[480px] 
                      max-md:px-0 max-md:mt-10 max-sm:px-0 max-sm:py-0 max-sm:mt-8">
          
          {/* Error message */}
          {errorMessage && (
            <div className="flex items-center gap-2 self-stretch px-4 py-3 mb-5 text-xs leading-4 text-rose-500 bg-pink-100 border border-red-500 border-solid rounded-[200px]">
              <span className="material-icons text-sm">error</span>
              {errorMessage}
            </div>
          )}
          
          {/* Success message - Only show if modal is not shown */}
          {successMessage && !showModal && (
            <div className="flex items-center gap-2 self-stretch px-4 py-3 mb-5 text-xs leading-4 text-green-700 bg-green-100 border border-green-500 border-solid rounded-[200px]">
              <span className="material-icons text-sm">check_circle</span>
              {successMessage}
            </div>
          )}

          <h1 className="mb-3.5 text-3xl font-bold text-primary max-sm:text-2xl">
            Ubah Password
          </h1>

          <p className="mb-9 text-base leading-6 max-w-[480px] text-zinc-500 max-sm:text-sm max-sm:mb-6">
            Masukkan email kamu, kami akan mengirimkan tautan untuk mengubah
            password kamu.
          </p>

          <form onSubmit={handleSubmit} className="w-full">
            {/* Email input field */}
            <div className="mb-5 h-[52px] w-full">
              <div className="relative w-full">
                <div className={`flex items-center h-[52px] w-full px-6 rounded-[50px] border ${emailError ? 'border-rose-500' : 'border-[#8B8B8B]'} bg-white shadow-sm`}>
                  <span className={`material-icons ${emailError ? 'text-rose-500' : 'text-[#8B8B8B]'} mr-3`}>
                    mail
                  </span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) {
                        setEmailError(false);
                        setErrorMessage("");
                      }
                      if (successMessage) {
                        setSuccessMessage("");
                      }
                    }}
                    className={`flex-1 outline-none text-base ${emailError ? 'text-rose-500' : 'text-[#8B8B8B]'}`}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`mb-10 md:mb-20 text-base text-white bg-primary hover:bg-primary-variant1 transition-colors flex items-center justify-center h-[52px] rounded-[50px] w-full hover:scale-[1.01] active:scale-[0.99] transition-transform ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="material-icons animate-spin mr-2">
                    sync
                  </span>
                  {showModal ? "Mengirim Ulang..." : "Mengirim"}
                </span>
              ) : "Kirim"}
            </button>

            {/* Back to login link */}
            <a
              href="/login"
              className="flex gap-1.5 items-center text-xs cursor-pointer text-zinc-500 hover:text-primary transition-colors hover:-translate-x-1 transition-transform"
              tabIndex={isSubmitting ? -1 : 0}
            >
              <span className="material-icons text-[18px]">
                arrow_back
              </span>
              <span>Kembali ke halaman Masuk</span>
            </a>
          </form>
        </div>
      </div>
      
      {/* Success Modal */}
      {showModal && (
        <SuccessModal
          email={email}
          onClose={handleCloseModal}
          onResend={handleResendEmail}
          isResending={isSubmitting}
        />
      )}
    </div>
  );
};

export default ForgotPassword;