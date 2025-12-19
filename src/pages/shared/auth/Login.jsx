// src/pages/shared/auth/Login.jsx - UPDATED WITH TIMEZONE SUPPORT

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { loginSchema } from "../../../schemas/validationSchema";
import { useNavigate, useLocation } from "react-router-dom";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	
	const [emailTouched, setEmailTouched] = useState(false);
	const [passwordTouched, setPasswordTouched] = useState(false);

	const [errorMessage, setErrorMessage] = useState("");
	const [emailError, setEmailError] = useState(false);
	const [passwordError, setPasswordError] = useState(false);

	const emailRef = useRef(null);
	const passwordRef = useRef(null);

	const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
	const navigate = useNavigate();
    const location = useLocation();

	// Use the useAuth hook
	const { login, isAuthenticated, needsOnboarding, user, isLoading } = useAuth();

	// ✅ NEW: Function to detect user timezone
	const detectTimezone = () => {
		try {
			const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			
			// Convert to Indonesian timezone format
			if (timezone.includes('Jakarta') || timezone.includes('Asia/Jakarta')) {
				return 'WIB';
			} else if (timezone.includes('Makassar') || timezone.includes('Asia/Makassar')) {
				return 'WITA';
			} else if (timezone.includes('Jayapura') || timezone.includes('Asia/Jayapura')) {
				return 'WIT';
			}
			
			// Default based on UTC offset
			const offset = new Date().getTimezoneOffset();
			if (offset === -420) return 'WIB'; // UTC+7
			if (offset === -480) return 'WITA'; // UTC+8
			if (offset === -540) return 'WIT'; // UTC+9
			
			// Default to WIB if can't determine
			return 'WIB';
		} catch (error) {
			console.error('Error detecting timezone:', error);
			return 'WIB'; // Default fallback
		}
	};


	// ===================================================
	// AUTO REDIRECT LOGIC (MUST BE DISABLED!)
	// ===================================================

	// ❌ DELETED: useAuth.js handles ALL redirects!
	
	useEffect(() => {
		const navEntries = performance.getEntriesByType("navigation");
		const isRefresh = navEntries[0]?.type === "reload";
	
		if (isRefresh) {
			// Clear everything on refresh
			setEmail("");
			setPassword("");
			sessionStorage.removeItem("tempEmail");
			sessionStorage.removeItem("tempPassword");
			localStorage.removeItem("rememberedPassword");
			localStorage.removeItem("rememberMe");
		} else {
			// Load saved data on normal navigation
			const savedEmail = localStorage.getItem("rememberedEmail");
			const tempEmail = sessionStorage.getItem("tempEmail");
	
			if (savedEmail) {
				setEmail(savedEmail);
				setRememberMe(true);
			} else if (tempEmail) {
				setEmail(tempEmail);
			}
		}
	}, []);

	// ✅ Show loading while checking authentication
	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<div className="flex items-center space-x-2">
					<span className="material-icons animate-spin text-blue-600">sync</span>
					<span className="text-blue-600">Checking authentication...</span>
				</div>
			</div>
		);
	}

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	const handleGoogleSignIn = async () => {
		setIsGoogleSubmitting(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 1200));
			console.log("Google Sign-in initiated");
		} catch (error) {
			console.error("Google Sign-in error:", error);
			setErrorMessage("Google sign-in error");
		} finally {
			setIsGoogleSubmitting(false);
		}
	};

	// Validation with Zod
	const validateWithZod = (formData, field = null) => {
		if (field === "email" || field === null) {
			if (!formData.email || !formData.email.trim()) {
				return { valid: false, message: "Email harus diisi", field: "email" };
			}
		}

		if (field === "password" || field === null) {
			if (!formData.password) {
				return {
					valid: false,
					message: "Password harus diisi",
					field: "password",
				};
			}
		}

		if (
			field === null &&
			(!formData.email || !formData.email.trim()) &&
			!formData.password
		) {
			return {
				valid: false,
				message: "Email dan password harus diisi",
				field: "both",
			};
		}

		if (
			(field === "email" || field === null) &&
			formData.email &&
			formData.email.trim()
		) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(formData.email)) {
				return {
					valid: false,
					message: "Format email tidak valid",
					field: "email",
				};
			}
		}

		if (field) {
			return { valid: true, message: "" };
		}

		try {
			loginSchema.parse(formData);
			return { valid: true, message: "" };
		} catch (error) {
			if (error.errors && error.errors.length > 0) {
				return {
					valid: false,
					message: error.errors[0].message,
					field: error.errors[0].path[0],
				};
			}
			return {
				valid: false,
				message: "Validasi gagal",
				field: field || "form",
			};
		}
	};

	const handleEmailChange = (e) => {
		setEmail(e.target.value);
		sessionStorage.setItem("tempEmail", e.target.value);
		
		if (emailError) {
			setEmailError(false);
			setErrorMessage("");
		}
	};

	const handlePasswordChange = (e) => {
		setPassword(e.target.value);
		
		if (passwordError) {
			setPasswordError(false);
			setErrorMessage("");
		}
	};

	const validateEmail = () => {
		setEmailTouched(true);

		if (!email.trim()) {
			setEmailError(true);
			setErrorMessage("Email harus diisi");
			return false;
		}

		const validation = validateWithZod(
			{ email, password, rememberMe },
			"email"
		);
		if (!validation.valid) {
			setEmailError(true);
			setErrorMessage(validation.message);
			return false;
		}

		setEmailError(false);
		if (!passwordError) {
			setErrorMessage("");
		}
		return true;
	};

	const validatePassword = () => {
		setPasswordTouched(true);

		if (!password) {
			setPasswordError(true);
			setErrorMessage("Password harus diisi");
			return false;
		}

		const validation = validateWithZod(
			{ email, password, rememberMe },
			"password"
		);
		if (!validation.valid) {
			setPasswordError(true);
			setErrorMessage(validation.message);
			return false;
		}

		setPasswordError(false);
		if (!emailError) {
			setErrorMessage("");
		}
		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		// ✅ KEEP ALL VALIDATION - Same as before
		setEmailTouched(true);
		setPasswordTouched(true);
		setErrorMessage("");

		// Validate form
		const validation = validateWithZod({ email, password, rememberMe });

		if (!validation.valid) {
			setErrorMessage(validation.message);

			if (validation.field === "email") {
				setEmailError(true);
				setPasswordError(false);
				emailRef.current?.focus();
			} else if (validation.field === "password") {
				setPasswordError(true);
				setEmailError(false);
				passwordRef.current?.focus();
			} else {
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

		// ✅ KEEP - Remember me logic
		if (rememberMe) {
			localStorage.setItem("rememberedEmail", email);
			localStorage.setItem("rememberMe", "true");
		} else {
			localStorage.removeItem("rememberedEmail");
			localStorage.removeItem("rememberedPassword");
			localStorage.removeItem("rememberMe");
		}

		try {
			console.log("Attempting login...");
			
			// ✅ UPDATED: Include timezone in login payload
			const timezone = detectTimezone();
			console.log("Detected timezone:", timezone);
			
			await login.mutateAsync({ 
				email: email.toLowerCase().trim(), 
				password, 
				rememberMe,
				timezone  // ✅ NEW: Send timezone to API
			});

			// Clear temporary session data after successful login
			sessionStorage.removeItem("tempEmail");
			
			console.log("Login successful - redirect will be handled by useAuth");
			
		} catch (error) {
			// ✅ KEEP ALL ERROR HANDLING - Same as before
			console.error("Login error:", error);

			if (error.response?.status === 401) {
				setErrorMessage("Email atau password tidak sesuai");
				setEmailError(true);
				setPasswordError(true);
			} else if (error.response?.status === 403) {
				setErrorMessage("Akun Anda belum diaktivasi atau diblokir");
			} else if (error.response?.status === 429) {
				setErrorMessage("Terlalu banyak percobaan login. Coba lagi nanti");
			} else if (error.response?.data?.message) {
				setErrorMessage(error.response.data.message);
			} else if (error.message) {
				setErrorMessage(error.message);
			} else {
				setErrorMessage("Terjadi kesalahan saat login. Silakan coba lagi");
			}
		}
	};

	return (
		<div className="flex flex-col md:flex-row w-full min-h-screen overflow-hidden">
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
						<div className="inline-flex items-center px-[15px] py-3 mb-4 text-[14px] leading-4 text-rose-500 bg-pink-100 border border-red-500 border-solid rounded-[200px] h-[44px]">
							<span
								className="material-icons mr-[9px]"
								style={{ fontSize: "26px" }}
							>
								error
							</span>
							<span className="whitespace-nowrap">{errorMessage}</span>
						</div>
					)}

					<h1 className="mb-8 md:mb-10 text-3xl font-bold text-primary max-sm:text-2xl max-sm:text-center">
						Masuk ke Akun
					</h1>

					<form
						onSubmit={handleSubmit}
						className="w-full"
						id="loginForm"
						noValidate
					>
						{/* Email input */}
						<div className="mb-6 relative">
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
									disabled={login.isPending}
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
									disabled={login.isPending}
									required
									ref={passwordRef}
									autoComplete="current-password"
								/>
								<span
									className={`material-icons cursor-pointer hover:scale-110 transition-transform ${passwordError ? "text-rose-500" : "text-[#8B8B8B]"}`}
									onClick={!login.isPending ? togglePasswordVisibility : undefined}
								>
									{showPassword ? "visibility" : "visibility_off"}
								</span>
							</div>
						</div>

						{/* Remember me and forgot password */}
						<div className="flex justify-between items-center mb-5 mt-8">
							<label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer hover:scale-[1.02] transition-transform select-none">
								<input
									id="rememberMeCheckbox"
									type="checkbox"
									checked={rememberMe}
									onChange={(e) => {
										if (!login.isPending) {
											setRememberMe(e.target.checked);
										}
									}}
									disabled={login.isPending}
									className="absolute w-0 h-0 opacity-0 pointer-events-none"
								/>

								<span
									className={`material-icons text-[18px] leading-none align-middle transition-colors ${
									rememberMe ? "text-[#488BBE]" : "text-zinc-400"
									}`}
								>
									{rememberMe ? "check_circle" : "radio_button_unchecked"}
								</span>

								<span className="leading-none">Ingat Saya</span>
							</label>
							<a
								href="/forgot-password"
								className="text-xs text-primary no-underline hover:underline hover:scale-[1.05] transition-transform"
								tabIndex={login.isPending ? -1 : 0}
							>
								Lupa Password?
							</a>
						</div>

						{/* Google Sign In Button */}
						<button
							type="button"
							onClick={handleGoogleSignIn}
							disabled={isGoogleSubmitting || login.isPending}
							className="w-full mb-4 flex items-center justify-center gap-3 h-[52px] rounded-[50px] border border-zinc-300 bg-white text-zinc-800 font-medium hover:bg-gray-50 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition"
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
							disabled={login.isPending || isGoogleSubmitting}
							className={`mb-4 w-full text-base text-white bg-primary cursor-pointer border-none h-[52px] rounded-[50px] hover:bg-primary-variant1 transition flex items-center justify-center hover:scale-[1.01] active:scale-[0.99]
		                        ${login.isPending ? "opacity-70 cursor-not-allowed" : ""}`}
						>
							{login.isPending ? (
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
								tabIndex={login.isPending ? -1 : 0}
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