"use client";
import React, { useState } from "react";

/**
 * Login component
 * Handles user authentication with email and password
 * 
 * @returns {JSX.Element} The Login component
 */
const Login = () => {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Error handling
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrorMessage("");
    setEmailError(false);
    setPasswordError(false);
    
    // Validate inputs
    if (!email.trim()) {
      setErrorMessage("Email tidak boleh kosong");
      setEmailError(true);
      return;
    }
    
    if (!password) {
      setErrorMessage("Password tidak boleh kosong");
      setPasswordError(true);
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
      
      // Simulating an unregistered email error
      if (email === "test@unregistered.com") {
        setErrorMessage("Email tidak terdaftar. Silakan daftar terlebih dahulu atau periksa kembali email Anda.");
        setEmailError(true);
        return;
      }
      
      // Simulating incorrect password
      if (password && password.length < 6) {
        setErrorMessage("Password tidak valid. Periksa kembali password Anda.");
        setPasswordError(true);
        return;
      }
      
      // Simulate successful login
      console.log("Login successful:", { email, password, rememberMe });
      
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Terjadi kesalahan. Silakan coba lagi nanti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen overflow-hidden">
      {/* Left section with gradient background and illustration */}
      <section 
        className="w-full md:w-1/2 h-[40vh] md:h-screen relative max-sm:h-[30vh]" 
        style={{ background: 'linear-gradient(to bottom, #91D9E1, #5E6EC3)' }}
      >
        <div className="absolute inset-0 flex justify-center items-center">
          <img
            src="/img-login.png"
            alt="Login illustration"
            className="w-[350px] xl:w-[400px] lg:w-[350px] md:w-[300px] sm:w-[250px] max-sm:w-[200px] object-contain"
          />
        </div>
      </section>

      {/* Right section with form */}
      <section className="flex flex-1 justify-center items-center w-full md:w-1/2 py-8 px-4 bg-white overflow-auto">
        <div className="w-[90%] max-w-[454px] max-md:p-0 max-md:mt-5">
          <h1 className="mb-8 md:mb-10 text-3xl font-bold text-primary max-sm:text-2xl max-sm:text-center">
            Masuk ke Akun 
          </h1>

          {/* Error message alert */}
          {errorMessage && (
            <div className="flex items-center px-4 py-3 mb-4 text-xs leading-4 text-rose-500 bg-pink-100 border border-red-500 border-solid rounded-[200px]">
              <span className="material-icons mr-2 text-sm">error</span>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email input */}
            <div className={`flex gap-2.5 items-center px-6 py-3 mb-6 bg-white border-solid border ${emailError ? 'border-rose-500' : 'border-zinc-500'} h-[52px] rounded-[50px] max-sm:px-4 max-sm:py-2.5 shadow-sm`}>
              <span className={`material-icons ${emailError ? 'text-rose-500' : 'text-[#8B8B8B]'}`}>
                mail
              </span>
              <input
                type="email"
                placeholder="Email"
                className={`w-full text-base border-none outline-none ${emailError ? 'text-rose-500' : 'text-zinc-500'}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) {
                    setEmailError(false);
                    setErrorMessage("");
                  }
                }}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Password input */}
            <div className={`flex gap-2.5 items-center px-6 py-3 mb-6 bg-white border-solid border ${passwordError ? 'border-rose-500' : 'border-zinc-500'} h-[52px] rounded-[50px] max-sm:px-4 max-sm:py-2.5 shadow-sm`}>
              <span className={`material-icons ${passwordError ? 'text-rose-500' : 'text-[#8B8B8B]'}`}>
                lock
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={`flex-1 text-base border-none outline-none ${passwordError ? 'text-rose-500' : 'text-zinc-500'}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) {
                    setPasswordError(false);
                    setErrorMessage("");
                  }
                }}
                disabled={isSubmitting}
                required
              />
              <span
                className={`material-icons cursor-pointer hover:scale-110 transition-transform ${passwordError ? 'text-rose-500' : 'text-[#8B8B8B]'}`}
                onClick={!isSubmitting ? togglePasswordVisibility : undefined}
              >
                {showPassword ? "visibility" : "visibility_off"}
              </span>
            </div>

            {/* Remember me and forgot password */}
            <div className="flex justify-between items-center mb-5">
              <label className="flex gap-2 items-center text-xs text-zinc-500 cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={rememberMe}
                    onChange={() => !isSubmitting && setRememberMe(!rememberMe)}
                    disabled={isSubmitting}
                  />
                  <span className="material-icons text-lg" style={{ color: rememberMe ? '#488BBE' : '#8B8B8B' }}>
                    {rememberMe ? 'check_circle' : 'circle'}
                  </span>
                </div>
                <span>Ingat Saya</span>
              </label>

              <a
                href="/forgot-password"
                className="text-xs text-primary no-underline hover:underline hover:scale-[1.05] transition-transform"
                tabIndex={isSubmitting ? -1 : 0}
              >
                Lupa Password?
              </a>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`mb-4 w-full text-base text-white bg-primary cursor-pointer border-none h-[52px] rounded-[50px] hover:bg-primary-variant1 transition-colors flex items-center justify-center hover:scale-[1.01] active:scale-[0.99] transition-transform
                        ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="material-icons animate-spin mr-2">
                    sync
                  </span>
                  <span>Masuk...</span>
                </span>
              ) : "Masuk"}
            </button>

            {/* Sign up link */}
            <p className="text-xs text-center text-zinc-500 mt-6">
              Belum memiliki akun?{" "}
              <a
                href="#"
                className="font-bold text-orange-400 underline hover:text-orange-500 hover:scale-[1.05] inline-block transition-transform"
                tabIndex={isSubmitting ? -1 : 0}
              >
                Kontak Kami
              </a>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Login;
