import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const axiosInstance = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
		"ngrok-skip-browser-warning": "true",
	},
});

axiosInstance.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// TODO: belum bisa redirect 401(unauthorized) error
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		// Don't redirect on 401 errors during login attempts
		// This ensures login errors are handled by the component
		const isLoginAttempt = error.config.url.includes("/auth/login");

		if (error.response && error.response.status === 401 && !isLoginAttempt) {
			// Only clear tokens and redirect for non-login 401 errors
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

export default axiosInstance;
