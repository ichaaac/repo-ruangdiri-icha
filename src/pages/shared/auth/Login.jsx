// src/pages/shared/auth/Login.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../../../lib/api";
import { loginSchema } from "../../../schemas/validationSchema";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Field state tracking
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const formRef = useRef(null);

  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    // Check if email is saved in localStorage when component mounts
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);
  
  // Validate form with Zod
  const validateForm = (data, field = null) => {
    try {
      // If field is provided, only validate that field
      // Otherwise validate the entire form
      if (field) {
        // For single field validation, create a partial schema
        const partialSchema = loginSchema.pick({ [field]: true });
        partialSchema.parse({ [field]: data[field] });
        
        // Clear error for this field if validation passes
        setErrors(prev => ({ ...prev, [field]: undefined }));
        // Clear error message if validation passes
        setApiError("");
        return true;
      } else {
        // Validate entire form
        loginSchema.parse(data);
        setErrors({});
        setApiError("");
        return true;
      }
    } catch (error) {
      // Process Zod validation errors
      if (error.errors) {
        const newErrors = {};
        
        error.errors.forEach(err => {
          // Get the field name from the path
          const fieldName = err.path[0];
          newErrors[fieldName] = err.message;
          
          // Set the first error message as the main tooltip message
          if (!apiError) {
            setApiError(err.message);
          }
        });
        
        // If validating a single field, only update that field's error
        if (field) {
          setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
        } else {
          // Update all errors
          setErrors(newErrors);
        }
      }
      return false;
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      try {
        // Menggunakan fungsi api yang sudah ada
        const loginResponse = await api.login(credentials);
        console.log("Login Response:", loginResponse.data);

        if (loginResponse.data?.status !== "success") {
          throw new Error(loginResponse.data?.message || "Login failed");
        }

        // Extract token and organization type
        const { accessToken, organizationType } = loginResponse.data.data;

        if (!accessToken) {
          console.error("Token not found in response:", loginResponse.data);
          throw new Error("Access token tidak ditemukan dalam respons");
        }

        return { accessToken, organizationType };
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Login Success Data:", data);

      // Clear any existing data
      localStorage.removeItem("token");
      localStorage.removeItem("organizationType");
      localStorage.removeItem("user");

      // Save token to localStorage
      localStorage.setItem("token", data.accessToken);

      // Save organization type to localStorage
      localStorage.setItem("organizationType", data.organizationType);

      console.log("Token and organizationType saved to localStorage");

      // For testing purpose, make a dummy API call to /users/me to pre-populate cache
      // This is to reduce the chance of infinite redirect loops
      try {
        api
          .get(`${API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${data.accessToken}`,
            },
          })
          .then(() => {
            // Navigate after ensuring profile data is fetched
            if (data.organizationType === "school") {
              // Use the demo route first to avoid protected route issues
              window.location.href = "/demo/organization/school/profile";
            } else if (data.organizationType === "company") {
              window.location.href = "/demo/organization/company/profile";
            } else {
              window.location.href = "/";
            }
          })
          .catch(() => {
            // Even if profile fetch fails, still redirect
            if (data.organizationType === "school") {
              window.location.href = "/demo/organization/school/profile";
            } else if (data.organizationType === "company") {
              window.location.href = "/demo/organization/company/profile";
            } else {
              window.location.href = "/";
            }
          });
      } catch (error) {
        console.error("Error fetching profile after login:", error);
        // Still try to navigate
        if (data.organizationType === "school") {
          window.location.href = "/demo/organization/school/profile";
        } else if (data.organizationType === "company") {
          window.location.href = "/demo/organization/company/profile";
        } else {
          window.location.href = "/";
        }
      }
    },
    onError: (error) => {
      console.error("Login error:", error);

      // Detailed error logging
      if (error.response) {
        console.log("Error response:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });

        // Handle backend validation format
        if (error.response.data && error.response.data.status === "fail") {
          // Process validation errors
          if (error.response.data.errors && error.response.data.errors.length > 0) {
            // Handle specific field errors
            const newErrors = { ...errors };
            
            error.response.data.errors.forEach(err => {
              if (err.field === "email" || err.field === "password") {
                newErrors[err.field] = err.message;
                // Set field as touched to display error
                setTouchedFields(prev => ({ ...prev, [err.field]: true }));
              }
            });
            
            setErrors(newErrors);
            
            // Set general API error if there's a message
            if (error.response.data.message) {
              setApiError(error.response.data.message);
            }
          } else {
            // General error message
            setApiError(error.response.data.message || "Validation failed");
          }
        } else if (error.response.status === 401) {
          setApiError("Invalid credentials");
          // Mark both fields as invalid
          setErrors({
            email: "Email atau password salah",
            password: "Email atau password salah"
          });
          // Set both as touched to display errors
          setTouchedFields({ email: true, password: true });
        } else if (error.response.status === 400) {
          setApiError("Invalid request");
        } else if (
          error.response.data &&
          typeof error.response.data === "object"
        ) {
          // Try to extract message from various potential structures
          const message =
            error.response.data.message ||
            error.response.data.error ||
            (error.response.data.data && error.response.data.data.message) ||
            "Error occurred";
          setApiError(message);
        } else {
          setApiError("Error occurred");
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.log("Error request:", error.request);
        setApiError("No server response");
      } else {
        // Something happened in setting up the request
        console.log("Error message:", error.message);
        setApiError(error.message || "Request error");
      }
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    try {
      // Simulate Google sign-in process
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log("Google Sign-in initiated");

      // In a real implementation, this would redirect to Google Auth
    } catch (error) {
      console.error("Google Sign-in error:", error);
      setApiError("Google sign-in error");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Update form data
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Clear API error when user changes any input
    if (apiError) {
      setApiError("");
    }
    
    // Validate field if it has been touched before
    if (touchedFields[name]) {
      validateForm({ ...formData, [name]: newValue }, name);
    }
  };

  const handleInputBlur = (e) => {
    const { name } = e.target;
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Validate this specific field
    validateForm(formData, name);
    
    // Jika field kosong, tampilkan pesan error
    if (name === 'email' && !formData.email.trim()) {
      setApiError("Email harus diisi");
      setErrors(prev => ({ ...prev, email: "Email harus diisi" }));
    } else if (name === 'password' && !formData.password) {
      setApiError("Password harus diisi");
      setErrors(prev => ({ ...prev, password: "Password harus diisi" }));
    }
  };

  const handleSubmit = (e) => {
    // Prevent default form submission behavior
    e.preventDefault();
    
    // Mark all fields as touched
    setTouchedFields({
      email: true,
      password: true
    });
    
    // Clear any API errors
    setApiError("");
    
    // Validate entire form
    const isValid = validateForm(formData);
    
    if (!isValid) {
      // Focus the first field with an error
      if (errors.email) {
        emailRef.current?.focus();
      } else if (errors.password) {
        passwordRef.current?.focus();
      }
      return;
    }
    
    // Handle remember me functionality
    if (formData.rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    // If validation passes, proceed with login
    loginMutation.mutate({ 
      email: formData.email, 
      password: formData.password, 
      rememberMe: formData.rememberMe 
    });
  };

  // Get field error state (for styling)
  const getFieldErrorState = (fieldName) => {
    return touchedFields[fieldName] && errors[fieldName];
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen overflow-hidden">
      {/* Left section with gradient background and illustration */}
      <section
        className="w-full md:w-1/2 h-[40vh] md:h-screen relative max-sm:h-[30vh]"
        style={{ background: "linear-gradient(to bottom, #91D9E1, #5E6EC3)" }}
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
          {/* General error message tooltip */}
          {apiError && (touchedFields.email || touchedFields.password) && (
            <div className="flex items-center px-[15px] py-3 mb-4 text-[14px] leading-4 text-rose-500 bg-pink-100 border border-red-500 border-solid rounded-[200px] inline-flex h-[44px]">
              <span className="material-icons mr-[9px]" style={{ fontSize: '26px' }}>error</span>
              <span className="whitespace-nowrap">{apiError}</span>
            </div>
          )}
          
          <h1 className="mb-8 md:mb-10 text-3xl font-bold text-primary max-sm:text-2xl max-sm:text-center">
            Masuk ke Akun
          </h1>

          <form 
            onSubmit={handleSubmit} 
            className="w-full" 
            id="loginForm" 
            ref={formRef}
            // Disable browser default validation
            noValidate
          >
            {/* Email input */}
            <div className="mb-6 relative">
              {/* Email input field */}
              <div
                className={`flex gap-2.5 items-center px-6 py-3 bg-white border-solid border ${getFieldErrorState('email') ? "border-rose-500" : "border-zinc-500"} h-[52px] rounded-[50px] max-sm:px-4 max-sm:py-2.5 shadow-sm`}
              >
                <span
                  className={`material-icons ${getFieldErrorState('email') ? "text-rose-500" : "text-[#8B8B8B]"}`}
                >
                  mail
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="Email / ID"
                  className={`w-full text-base border-none outline-none ${getFieldErrorState('email') ? "text-rose-500" : "text-zinc-500"}`}
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={loginMutation.isPending}
                  ref={emailRef}
                  autoComplete="username"
                  maxLength={50}
                />
              </div>
            </div>

            {/* Password input */}
            <div className="mb-6 relative">
              <div
                className={`flex gap-2.5 items-center px-6 py-3 bg-white border-solid border ${getFieldErrorState('password') ? "border-rose-500" : "border-zinc-500"} h-[52px] rounded-[50px] max-sm:px-4 max-sm:py-2.5 shadow-sm`}
              >
                <span
                  className={`material-icons ${getFieldErrorState('password') ? "text-rose-500" : "text-[#8B8B8B]"}`}
                >
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className={`flex-1 text-base border-none outline-none ${getFieldErrorState('password') ? "text-rose-500" : "text-zinc-500"}`}
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={loginMutation.isPending}
                  ref={passwordRef}
                  autoComplete="current-password"
                />
                <span
                  className={`material-icons cursor-pointer hover:scale-110 transition-transform ${getFieldErrorState('password') ? "text-rose-500" : "text-[#8B8B8B]"}`}
                  onClick={
                    !loginMutation.isPending
                      ? togglePasswordVisibility
                      : undefined
                  }
                >
                  {showPassword ? "visibility" : "visibility_off"}
                </span>
              </div>
            </div>

            {/* Remember me and forgot password */}
            <div className="flex justify-between items-center mb-5 mt-8">
              <label className="flex gap-2 items-center text-xs text-zinc-500 cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    className="sr-only"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    disabled={loginMutation.isPending}
                  />
                  <span
                    className="material-icons text-lg"
                    style={{ color: formData.rememberMe ? "#488BBE" : "#8B8B8B" }}
                  >
                    {formData.rememberMe ? "check_circle" : "circle"}
                  </span>
                </div>
                <span>Ingat Saya</span>
              </label>

              <a
                href="/forgot-password"
                className="text-xs text-primary no-underline hover:underline hover:scale-[1.05] transition-transform"
                tabIndex={loginMutation.isPending ? -1 : 0}
              >
                Lupa Password?
              </a>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || loginMutation.isPending}
              className="w-full mb-4 flex items-center justify-center gap-3 h-[52px] rounded-[50px] border border-zinc-300 bg-white text-zinc-800 font-medium hover:bg-gray-50 transition-colors hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-transform"
            >
              {isGoogleSubmitting ? (
                <span className="material-icons animate-spin">sync</span>
              ) : (
                <>
                  <img
                    src="/logo/google-logo.png"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  <span>Masuk dengan Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center mb-4">
              <div className="flex-grow h-px bg-[#D9D9D9]"></div>
              <span className="px-4 text-sm text-zinc-500">Atau</span>
              <div className="flex-grow h-px bg-[#D9D9D9]"></div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loginMutation.isPending || isGoogleSubmitting}
              className={`mb-4 w-full text-base text-white bg-primary cursor-pointer border-none h-[52px] rounded-[50px] hover:bg-primary-variant1 transition-colors flex items-center justify-center hover:scale-[1.01] active:scale-[0.99] transition-transform
                        ${loginMutation.isPending ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loginMutation.isPending ? (
                <span className="flex items-center">
                  <span className="material-icons animate-spin mr-2">sync</span>
                  <span>Masuk...</span>
                </span>
              ) : (
                "Masuk"
              )}
            </button>

            {/* Sign up link */}
            <p className="text-xs text-center text-zinc-500 mt-6">
              Belum memiliki akun?{" "}
              <a
                href="#"
                className="font-bold text-orange-400 underline hover:text-orange-500 hover:scale-[1.05] inline-block transition-transform"
                tabIndex={loginMutation.isPending ? -1 : 0}
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