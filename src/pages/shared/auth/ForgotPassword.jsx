import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "../../../lib/api";
import SuccessModal from "../../../components/auth/SuccessModal";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  
  // Create forgotPassword mutation with proper API path
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email) => {
      return await api.auth.forgotPassword(email);
    },
    onSuccess: (response) => {
      const message = response.message || "Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam Anda.";
      setSuccessMessage(message);
      setShowModal(true);
    },
    onError: (error) => {
      console.error("Forgot password error:", error);
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage("Terjadi kesalahan. Silakan coba lagi nanti.");
        }
      } else {
        setErrorMessage("Terjadi kesalahan. Silakan coba lagi nanti.");
      }
      setEmailError(true);
    }
  });

  // Create a separate resend mutation using the API
  const resendEmailMutation = useMutation({
    mutationFn: async (email) => {
      return await api.auth.forgotPassword(email);
    },
    onSuccess: (response) => {
      const message = response.message || "Link reset password telah dikirim ulang ke email Anda.";
      setSuccessMessage(message);
    },
    onError: (error) => {
      console.error("Resend email error:", error);
      setErrorMessage("Gagal mengirim ulang email. Silakan coba lagi nanti.");
      setShowModal(false);
    }
  });

  const handleSubmit = (e) => {
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
    
    // Execute forgot password mutation
    forgotPasswordMutation.mutate(email);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleResendEmail = () => {
    resendEmailMutation.mutate(email);
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
      <div className="flex-1 p-6 md:p-10 max-md:p-5 max-sm:w-full bg-white overflow-auto flex items-center justify-center">
        <div className="flex flex-col items-start mx-auto max-w-[480px] 
                      max-md:px-0 max-sm:px-0 max-sm:py-0">
          
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
                    disabled={forgotPasswordMutation.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button 
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className={`mb-10 md:mb-20 text-base text-white bg-primary hover:bg-primary-variant1 transition-colors flex items-center justify-center h-[52px] rounded-[50px] w-full hover:scale-[1.01] active:scale-[0.99] transition-transform ${forgotPasswordMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {forgotPasswordMutation.isPending ? (
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
              tabIndex={forgotPasswordMutation.isPending ? -1 : 0}
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
          isResending={resendEmailMutation.isPending}
        />
      )}
    </div>
  );
};

export default ForgotPassword;