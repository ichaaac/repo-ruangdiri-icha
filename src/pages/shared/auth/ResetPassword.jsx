// src/pages/shared/auth/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../../../lib/api";

const PasswordRequirement = ({ isValid, text }) => {
  return (
    <div className="flex gap-1.5 items-center text-xs">
      <span className={`material-icons text-sm ${isValid ? 'text-green-500' : 'text-rose-500'}`}>
        {isValid ? "check_circle" : "cancel"}
      </span>
      <span className={isValid ? 'text-green-500' : 'text-rose-500'}>
        {text}
      </span>
    </div>
  );
};

const ResetPassword = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const navigate = useNavigate();
  
  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Error handling
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState("");
  
  // Password validation state
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false,
  });
  
  // Check if token is present
  useEffect(() => {
    console.log("Token from URL:", token); // Debug log
    if (!token) {
      console.log("No token found in URL, but not redirecting automatically");
      setErrorMessage("Link reset password tidak valid atau sudah kadaluarsa. Silakan coba lagi atau minta link baru.");
      // Remove automatic redirect - let user choose to go back
    }
  }, [token]);

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, newPassword }) => api.auth.resetPassword(token, newPassword),
    onSuccess: (response) => {
      // Access the message from the response if available
      const message = response.message || "Password berhasil diubah. Anda akan diarahkan ke halaman Login.";
      setSuccessMessage(message);
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    },
    onError: (error) => {
      console.error("Reset password error:", error);
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage("Terjadi kesalahan. Silakan coba lagi nanti.");
        }
      } else {
        setErrorMessage("Terjadi kesalahan. Silakan coba lagi nanti.");
      }
    }
  });

  // Validate password as user types
  useEffect(() => {
    setValidations({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      passwordsMatch: password === confirmPassword && password !== "",
    });
  }, [password, confirmPassword]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrorMessage("");
    setPasswordError(false);
    setConfirmPasswordError(false);
    setSuccessMessage("");
    
    // Check if all validations pass
    const allValid = Object.values(validations).every((value) => value === true);
    
    if (!allValid) {
      if (!validations.minLength || !validations.hasUpperCase || 
          !validations.hasNumber || !validations.hasSpecialChar) {
        setErrorMessage("Password tidak memenuhi persyaratan");
        setPasswordError(true);
      } else if (!validations.passwordsMatch) {
        setErrorMessage("Password dan konfirmasi password tidak sama");
        setConfirmPasswordError(true);
      }
      return;
    }
    
    // Execute reset password mutation
    resetPasswordMutation.mutate({ token, newPassword: password });
  };

  return (
    <div className="flex flex-col md:flex-row relative w-full min-h-screen font-sans overflow-hidden">
      {/* Left section with gradient background and illustration */}
      <section className="w-full md:w-1/2 h-[40vh] md:h-screen relative max-sm:h-[30vh]" 
           style={{ background: 'linear-gradient(to bottom, #91D9E1, #5E6EC3)' }}>
        <div className="absolute inset-0 flex justify-center items-center">
          <img
            src="/img-forgot-password.png"
            alt="Reset password illustration"
            className="w-[350px] xl:w-[450px] lg:w-[400px] md:w-[350px] sm:w-[300px] max-sm:w-[250px] object-contain"
          />
        </div>
      </section>

      {/* Right section with form */}
      <section className="flex-1 p-6 md:p-10 max-md:p-5 max-sm:w-full bg-white overflow-auto">
        <div className="flex flex-col items-start mx-auto mt-10 sm:mt-16 md:mt-28 lg:mt-20 max-w-[480px] 
                      max-md:px-0 max-md:mt-10 max-sm:px-0 max-sm:py-0 max-sm:mt-8">
          
          {/* Show this section if no token is present */}
          {!token && (
            <div className="w-full">
              <div className="flex items-center gap-2 self-stretch px-4 py-3 mb-5 text-xs leading-4 text-rose-500 bg-pink-100 border border-red-500 border-solid rounded-[200px]">
                <span className="material-icons text-sm">error</span>
                {errorMessage || "Link reset password tidak valid atau sudah kadaluarsa."}
              </div>
              
              <div className="flex flex-col items-center justify-center text-center mt-8 mb-8">
                <span className="material-icons text-6xl text-rose-500 mb-4">link_off</span>
                <h2 className="text-xl font-bold mb-2">Link Reset Password Tidak Valid</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Link yang Anda gunakan tidak valid atau sudah kadaluarsa. Silakan kembali ke halaman lupa password untuk meminta link baru.
                </p>
                <a 
                  href="/forgot-password"
                  className="bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-variant1 transition-colors"
                >
                  Kembali ke Lupa Password
                </a>
              </div>
              
              <a
                href="/login"
                className="flex gap-1.5 items-center text-xs cursor-pointer text-zinc-500 hover:text-primary transition-colors mt-8 hover:-translate-x-1 transition-transform justify-center"
              >
                <span className="material-icons text-[18px]">
                  arrow_back
                </span>
                <span>Kembali ke halaman Masuk</span>
              </a>
            </div>
          )}
          
          {/* Only show the form if token is present */}
          {token && (
            <>
              {/* Success message */}
              {successMessage && (
                <div className="flex items-center gap-2 self-stretch px-4 py-3 mb-5 text-xs leading-4 text-green-700 bg-green-100 border border-green-500 border-solid rounded-[200px]">
                  <span className="material-icons text-sm">check_circle</span>
                  {successMessage}
                </div>
              )}
              
              {/* Error message */}
              {errorMessage && (
                <div className="flex items-center gap-2 self-stretch px-4 py-3 mb-5 text-xs leading-4 text-rose-500 bg-pink-100 border border-red-500 border-solid rounded-[200px]">
                  <span className="material-icons text-sm">error</span>
                  {errorMessage}
                </div>
              )}

              <h1 className="mb-3.5 text-3xl font-bold text-primary max-sm:text-2xl">
                Buat Password Baru
              </h1>

              <p className="mb-9 text-base leading-6 max-w-[480px] text-zinc-500 max-sm:text-sm max-sm:mb-6">
                Password yang baru harus berbeda dari password sebelumnya.
              </p>

              <form onSubmit={handleSubmit} className="w-full">
                {/* Password input field */}
                <div className="mb-5 h-[52px] w-full">
                  <div className="relative w-full">
                    <div className={`flex items-center h-[52px] w-full px-6 rounded-[50px] border ${passwordError ? 'border-rose-500' : 'border-[#8B8B8B]'} bg-white shadow-sm`}>
                      <span className={`material-icons ${passwordError ? 'text-rose-500' : 'text-[#8B8B8B]'} mr-3`}>
                        lock
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password Baru"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) {
                            setPasswordError(false);
                            setErrorMessage("");
                          }
                        }}
                        className={`flex-1 outline-none text-base ${passwordError ? 'text-rose-500' : 'text-[#8B8B8B]'}`}
                        disabled={resetPasswordMutation.isPending}
                      />
                      <span
                        className={`material-icons cursor-pointer ${passwordError ? 'text-rose-500' : 'text-[#8B8B8B]'} hover:scale-110 transition-transform`}
                        onClick={!resetPasswordMutation.isPending ? togglePasswordVisibility : undefined}
                      >
                        {showPassword ? "visibility" : "visibility_off"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Password requirements */}
                <div className="pl-12 mx-0 my-5 max-sm:pl-4">
                  <p className="mb-2.5 text-xs text-zinc-500">
                    Password harus terdiri dari:
                  </p>
                  <div className="grid gap-2.5 grid-cols-2 max-sm:grid-cols-1">
                    <PasswordRequirement
                      isValid={validations.minLength}
                      text="Minimal 8 karakter"
                    />
                    <PasswordRequirement
                      isValid={validations.hasUpperCase}
                      text="Minimal 1 huruf kapital"
                    />
                    <PasswordRequirement
                      isValid={validations.hasNumber}
                      text="Minimal 1 angka"
                    />
                    <PasswordRequirement
                      isValid={validations.hasSpecialChar}
                      text="Minimal 1 karakter khusus"
                    />
                  </div>
                </div>

                {/* Confirm password input field */}
                <div className="mb-10 h-[52px] w-full">
                  <div className="relative w-full">
                    <div className={`flex items-center h-[52px] w-full px-6 rounded-[50px] border ${confirmPasswordError ? 'border-rose-500' : 'border-[#8B8B8B]'} bg-white shadow-sm`}>
                      <span className={`material-icons ${confirmPasswordError ? 'text-rose-500' : 'text-[#8B8B8B]'} mr-3`}>
                        lock
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Konfirmasi Password Baru"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (confirmPasswordError) {
                            setConfirmPasswordError(false);
                            setErrorMessage("");
                          }
                        }}
                        className={`flex-1 outline-none text-base ${confirmPasswordError ? 'text-rose-500' : 'text-[#8B8B8B]'}`}
                        disabled={resetPasswordMutation.isPending}
                      />
                      <span
                        className={`material-icons cursor-pointer ${confirmPasswordError ? 'text-rose-500' : 'text-[#8B8B8B]'} hover:scale-110 transition-transform`}
                        onClick={!resetPasswordMutation.isPending ? toggleConfirmPasswordVisibility : undefined}
                      >
                        {showConfirmPassword ? "visibility" : "visibility_off"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className={`mb-10 text-base text-white bg-primary hover:bg-primary-variant1 transition-colors flex items-center justify-center h-[52px] rounded-[50px] w-full hover:scale-[1.01] active:scale-[0.99] transition-transform ${resetPasswordMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {resetPasswordMutation.isPending ? (
                    <span className="flex items-center">
                      <span className="material-icons animate-spin mr-2">
                        sync
                      </span>
                      <span>Memproses...</span>
                    </span>
                  ) : "Kirim"}
                </button>
                
                {/* Back to login link */}
                <a
                  href="/login"
                  className="flex gap-1.5 items-center text-xs cursor-pointer text-zinc-500 hover:text-primary transition-colors mt-4 hover:-translate-x-1 transition-transform"
                  tabIndex={resetPasswordMutation.isPending ? -1 : 0}
                >
                  <span className="material-icons text-[18px]">
                    arrow_back
                  </span>
                  <span>Kembali ke halaman Masuk</span>
                </a>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default ResetPassword;