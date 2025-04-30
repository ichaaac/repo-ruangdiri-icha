// src/pages/shared/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const Login = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);

	const [errorMessage, setErrorMessage] = useState("");
	const [emailError, setEmailError] = useState(false);
	const [passwordError, setPasswordError] = useState(false);

	const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
	const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

	const loginMutation = useMutation({
		mutationFn: async (credentials) => {
			try {
				// Just do the login, no profile fetch
				const loginResponse = await axios.post(
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
				axios
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

				// Handle various error responses
				if (error.response.status === 401) {
					setErrorMessage("Email atau password tidak valid.");
					setPasswordError(true);
				} else if (error.response.status === 400) {
					setErrorMessage(
						"Permintaan tidak valid. Periksa data yang Anda masukkan."
					);
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
						"Terjadi kesalahan. Silakan coba lagi nanti.";
					setErrorMessage(message);
				} else {
					setErrorMessage("Terjadi kesalahan. Silakan coba lagi nanti.");
				}
			} else if (error.request) {
				// The request was made but no response was received
				console.log("Error request:", error.request);
				setErrorMessage(
					"Tidak ada respons dari server. Periksa koneksi internet Anda."
				);
			} else {
				// Something happened in setting up the request
				console.log("Error message:", error.message);
				setErrorMessage(
					error.message || "Terjadi kesalahan saat mengirim permintaan."
				);
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
			setErrorMessage(
				"Terjadi kesalahan saat masuk dengan Google. Silakan coba lagi."
			);
		} finally {
			setIsGoogleSubmitting(false);
		}
	};

	const handleSubmit = (e) => {
		// Always ensure prevention of default behavior
		if (e && e.preventDefault) {
			e.preventDefault();
		}

		setErrorMessage("");
		setEmailError(false);
		setPasswordError(false);

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

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setErrorMessage("Format email tidak valid");
			setEmailError(true);
			return;
		}

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

					<form onSubmit={handleSubmit} className="w-full" id="loginForm">
						{/* Email input */}
						<div
							className={`flex gap-2.5 items-center px-6 py-3 mb-6 bg-white border-solid border ${emailError ? "border-rose-500" : "border-zinc-500"} h-[52px] rounded-[50px] max-sm:px-4 max-sm:py-2.5 shadow-sm`}
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
								className={`w-full text-base border-none outline-none ${emailError ? "text-rose-500" : "text-zinc-500"}`}
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									if (emailError) {
										setEmailError(false);
										setErrorMessage("");
									}
								}}
								disabled={loginMutation.isPending}
								required
								autoComplete="username"
							/>
						</div>

						{/* Password input */}
						<div
							className={`flex gap-2.5 items-center px-6 py-3 mb-6 bg-white border-solid border ${passwordError ? "border-rose-500" : "border-zinc-500"} h-[52px] rounded-[50px] max-sm:px-4 max-sm:py-2.5 shadow-sm`}
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
								className={`flex-1 text-base border-none outline-none ${passwordError ? "text-rose-500" : "text-zinc-500"}`}
								value={password}
								onChange={(e) => {
									setPassword(e.target.value);
									if (passwordError) {
										setPasswordError(false);
										setErrorMessage("");
									}
								}}
								disabled={loginMutation.isPending}
								required
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

						{/* Remember me and forgot password */}
						<div className="flex justify-between items-center mb-5">
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
