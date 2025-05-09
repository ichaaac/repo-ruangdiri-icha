// src/pages/shared/auth/Login.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api, { apiClient } from "../../../lib/api";
import { loginSchema } from "../../../schemas/validationSchema";

const Login = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	
	// Tracking field interactions
	const [emailTouched, setEmailTouched] = useState(false);
	const [passwordTouched, setPasswordTouched] = useState(false);
	
	const [errorMessage, setErrorMessage] = useState("");
	const [emailError, setEmailError] = useState(false);
	const [passwordError, setPasswordError] = useState(false);

	const emailRef = useRef(null);
	const passwordRef = useRef(null);

	const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
	const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

	useEffect(() => {
		// Check if email is saved in localStorage when component mounts
		const savedEmail = localStorage.getItem('rememberedEmail');
		if (savedEmail) {
			setEmail(savedEmail);
			setRememberMe(true);
		}
	}, []);

	// Gunakan loginMutation yang sudah ada dari kode asli tanpa diubah
	const loginMutation = useMutation({
		mutationFn: async (credentials) => {
			try {
				// Just do the login, no profile fetch
				const loginResponse = await apiClient.post(
					`${API_URL}/auth/login`,
					credentials
				);
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

				if (error.response.data && error.response.data.status === "fail") {
					// TODO : VALIDATION ERROR BUG
					if (error.response.data.errors && error.response.data.errors.length > 0) {
						// Handle specific field errors
						error.response.data.errors.forEach(err => {
							if (err.field === "email") {
								setEmailError(true);
								setErrorMessage(err.message);
							} else if (err.field === "password") {
								setPasswordError(true);
								setErrorMessage(err.message);
							}
						});
					} else {
						// General error message
						setErrorMessage(error.response.data.message || "Validation failed");
					}
				} else if (error.response.status === 401) {
					setErrorMessage("Email atau password tidak sesuai");
					setEmailError(true);
					setPasswordError(true);
				} else if (error.response.status === 400) {
					setErrorMessage("Invalid request");
					setEmailError(true);
					setPasswordError(true);
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
					setErrorMessage(message);
					setEmailError(true);
					setPasswordError(true);
				} else {
					setErrorMessage("Error occurred");
				}
			} else if (error.request) {
				// The request was made but no response was received
				console.log("Error request:", error.request);
				setErrorMessage("No server response");
			} else {
				// Something happened in setting up the request
				console.log("Error message:", error.message);
				setErrorMessage(error.message || "Request error");
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
			setErrorMessage("Google sign-in error");
		} finally {
			setIsGoogleSubmitting(false);
		}
	};

	// Validasi dengan Zod
	const validateWithZod = (formData, field = null) => {
		// Validasi khusus untuk field kosong (prioritas lebih tinggi)
		if (field === "email" || field === null) {
			if (!formData.email || !formData.email.trim()) {
				return { valid: false, message: "Email harus diisi", field: "email" };
			}
		}
		
		if (field === "password" || field === null) {
			if (!formData.password) {
				return { valid: false, message: "Password harus diisi", field: "password" };
			}
		}

		// Validasi kedua field kosong (khusus untuk submit form)
		if (field === null && (!formData.email || !formData.email.trim()) && !formData.password) {
			return { valid: false, message: "Email dan password harus diisi", field: "both" };
		}
		
		if ((field === "email" || field === null) && formData.email && formData.email.trim()) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(formData.email)) {
				return { valid: false, message: "Format email tidak valid", field: "email" };
			}
		}
		
		// Kalau sudah sampai di sini dan field spesifik, berarti valid
		if (field) {
			return { valid: true, message: "" };
		}
		
		// Validasi keseluruhan dengan Zod
		try {
			loginSchema.parse(formData);
			return { valid: true, message: "" };
		} catch (error) {
			if (error.errors && error.errors.length > 0) {
				// Ambil pesan error pertama (sudah dihandle kasus umum di atas, ini untuk kasus khusus)
				return { valid: false, message: error.errors[0].message, field: error.errors[0].path[0] };
			}
			return { valid: false, message: "Validasi gagal", field: field || "form" };
		}
	};

	// Handler untuk input email
	const handleEmailChange = (e) => {
		setEmail(e.target.value);
		
		// Reset error saat user mengetik
		if (emailError) {
			setEmailError(false);
			setErrorMessage("");
		}
	};

	// Handler untuk input password
	const handlePasswordChange = (e) => {
		setPassword(e.target.value);
		
		// Reset error saat user mengetik
		if (passwordError) {
			setPasswordError(false);
			setErrorMessage("");
		}
	};

	// Validasi email saat blur
	const validateEmail = () => {
		// Tandai field sebagai diinteraksi
		setEmailTouched(true);
		
		if (!email.trim()) {
			setEmailError(true);
			setErrorMessage("Email harus diisi");
			return false;
		}
		
		// Validasi dengan Zod
		const validation = validateWithZod({ email, password, rememberMe }, "email");
		if (!validation.valid) {
			setEmailError(true);
			setErrorMessage(validation.message);
			return false;
		}
		
		setEmailError(false);
		// Jangan reset errorMessage jika ada error di field password
		if (!passwordError) {
			setErrorMessage("");
		}
		return true;
	};

	// Validasi password saat blur
	const validatePassword = () => {
		// Tandai field sebagai diinteraksi
		setPasswordTouched(true);
		
		if (!password) {
			setPasswordError(true);
			setErrorMessage("Password harus diisi");
			return false;
		}
		
		// Validasi dengan Zod
		const validation = validateWithZod({ email, password, rememberMe }, "password");
		if (!validation.valid) {
			setPasswordError(true);
			setErrorMessage(validation.message);
			return false;
		}
		
		setPasswordError(false);
		// Jangan reset errorMessage jika ada error di field email
		if (!emailError) {
			setErrorMessage("");
		}
		return true;
	};

	const handleSubmit = (e) => {
		// Always ensure prevention of default behavior
		if (e && e.preventDefault) {
			e.preventDefault();
		}
		
		// Tandai semua field sebagai telah diinteraksi
		setEmailTouched(true);
		setPasswordTouched(true);
		
		// Reset error message
		setErrorMessage("");
		
		// Validasi form dengan zod
		const validation = validateWithZod({ email, password, rememberMe });
		
		if (!validation.valid) {
			// Tetapkan pesan error
			setErrorMessage(validation.message);
			
			// Tandai field yang error
			if (validation.field === "email") {
				setEmailError(true);
				setPasswordError(false);
				emailRef.current?.focus();
			} else if (validation.field === "password") {
				setPasswordError(true);
				setEmailError(false);
				passwordRef.current?.focus();
			} else {
				// Jika validasi umum, periksa masing-masing field
				if (!email.trim()) {
					setEmailError(true);
					setErrorMessage("Email harus diisi");
					emailRef.current?.focus();
					return;
				} else if (!password) {
					setPasswordError(true);
					setErrorMessage("Password harus diisi");
					passwordRef.current?.focus();
					return;
				}
			}
			return;
		}

		// Handle remember me functionality
		if (rememberMe) {
			localStorage.setItem('rememberedEmail', email);
		} else {
			localStorage.removeItem('rememberedEmail');
		}

		// If all validations pass, proceed with login
		loginMutation.mutate({ email, password, rememberMe });
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
					{errorMessage && (emailTouched || passwordTouched) && (
						<div className="flex items-center px-[15px] py-3 mb-4 text-[14px] leading-4 text-rose-500 bg-pink-100 border border-red-500 border-solid rounded-[200px] inline-flex h-[44px]">
							<span className="material-icons mr-[9px]" style={{ fontSize: '26px' }}>error</span>
							<span className="whitespace-nowrap">{errorMessage}</span>
						</div>
					)}
					
					<h1 className="mb-8 md:mb-10 text-3xl font-bold text-primary max-sm:text-2xl max-sm:text-center">
						Masuk ke Akun
					</h1>

					<form onSubmit={handleSubmit} className="w-full" id="loginForm" noValidate>
						{/* Email input */}
						<div className="mb-6 relative">
							{/* Email input field */}
							<div
								className={`flex gap-2.5 items-center px-6 py-3 bg-white border-solid border ${emailError ? "border-rose-500" : "border-zinc-500"} h-[52px] rounded-[50px] max-sm:px-4 max-sm:py-2.5 shadow-sm`}
							>
								<span
									className={`material-icons ${emailError ? "text-rose-500" : "text-[#8B8B8B]"}`}
								>
									mail
								</span>
								<input
									type="email"
									name="email"
									placeholder="Email / ID"
									className={`w-full text-base border-none outline-none ${emailError && emailTouched ? "text-rose-500" : "text-zinc-500"}`}
									value={email}
									onChange={handleEmailChange}
									onFocus={() => setEmailTouched(true)}
									onBlur={validateEmail}
									disabled={loginMutation.isPending}
									required
									maxLength={50}
									ref={emailRef}
									autoComplete="username"
								/>
							</div>
						</div>

						{/* Password input */}
						<div className="mb-6 relative">
							<div
								className={`flex gap-2.5 items-center px-6 py-3 bg-white border-solid border ${passwordError ? "border-rose-500" : "border-zinc-500"} h-[52px] rounded-[50px] max-sm:px-4 max-sm:py-2.5 shadow-sm`}
							>
								<span
									className={`material-icons ${passwordError ? "text-rose-500" : "text-[#8B8B8B]"}`}
								>
									lock
								</span>
								<input
									type={showPassword ? "text" : "password"}
									name="password"
									placeholder="Password"
									className={`flex-1 text-base border-none outline-none ${passwordError && passwordTouched ? "text-rose-500" : "text-zinc-500"}`}
									value={password}
									onChange={handlePasswordChange}
									onFocus={() => setPasswordTouched(true)}
									onBlur={validatePassword}
									disabled={loginMutation.isPending}
									required
									ref={passwordRef}
									autoComplete="current-password"
								/>
								<span
									className={`material-icons cursor-pointer hover:scale-110 transition-transform ${passwordError ? "text-rose-500" : "text-[#8B8B8B]"}`}
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
										className="sr-only"
										checked={rememberMe}
										onChange={() =>
											!loginMutation.isPending && setRememberMe(!rememberMe)
										}
										disabled={loginMutation.isPending}
									/>
									<span
										className="material-icons text-lg"
										style={{ color: rememberMe ? "#488BBE" : "#8B8B8B" }}
									>
										{rememberMe ? "check_circle" : "circle"}
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