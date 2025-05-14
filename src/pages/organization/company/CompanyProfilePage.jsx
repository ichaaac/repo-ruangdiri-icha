// src/pages/organization/company/CompanyProfilePage.jsx 
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import CompanyInfoEditModal from "../../../components/organization/company/profile/CompanyInfoEditModal";
import CompanyAccountEditModal from "../../../components/organization/company/profile/CompanyAccountEditModal";
import ProfilePictureUpload from "../../../components/organization/company/profile/ProfilePictureUpload";
import { apiClient, getMe } from "../../../lib/api";
import { parsePhoneNumber } from 'libphonenumber-js';

// Helper function to format phone number with clear country code separation
const formatPhoneDisplay = (phoneNumber) => {
	if (!phoneNumber || phoneNumber === '') return '-';
	
	try {
		// Parse the phone number
		const parsed = parsePhoneNumber(phoneNumber);
		
		if (parsed && parsed.isValid()) {
			// Get country calling code and national number
			const countryCode = `+${parsed.countryCallingCode}`;
			const nationalNumber = parsed.nationalNumber;
			
			// Format national number based on country
			let formattedNational = nationalNumber;
			
			// Special formatting for Indonesia (+62)
			if (parsed.country === 'ID' && nationalNumber.length >= 10) {
				// Format: 8XX-XXXX-XXXX
				formattedNational = `${nationalNumber.slice(0, 3)}-${nationalNumber.slice(3, 7)}-${nationalNumber.slice(7)}`;
			} else if (parsed.country === 'US' && nationalNumber.length === 10) {
				// Format: (XXX) XXX-XXXX
				formattedNational = `(${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
			} else if (nationalNumber.length > 7) {
				// Generic format for other countries
				formattedNational = `${nationalNumber.slice(0, 3)}-${nationalNumber.slice(3, 7)}-${nationalNumber.slice(7)}`;
			}
			
			// Return with clear separation: +XX | XXX-XXXX-XXXX
			return `${countryCode} | ${formattedNational}`;
		}
		
		// If parsing fails, return original with attempt to separate
		if (phoneNumber.startsWith('+')) {
			// Try to guess country code length (most are 1-3 digits, some are 4)
			const withoutPlus = phoneNumber.substring(1);
			let countryCodeLength = 1;
			
			// Check common country code patterns
			if (withoutPlus.startsWith('1')) countryCodeLength = 1; // US, Canada
			else if (withoutPlus.startsWith('7')) countryCodeLength = 1; // Russia
			else if (withoutPlus.startsWith('44')) countryCodeLength = 2; // UK
			else if (withoutPlus.startsWith('62')) countryCodeLength = 2; // Indonesia
			else if (withoutPlus.startsWith('86')) countryCodeLength = 2; // China
			else if (withoutPlus.startsWith('358')) countryCodeLength = 3; // Finland
			else if (withoutPlus.startsWith('971')) countryCodeLength = 3; // UAE
			else if (withoutPlus.length > 3) countryCodeLength = 2; // Default guess
			
			const countryCode = `+${withoutPlus.substring(0, countryCodeLength)}`;
			const number = withoutPlus.substring(countryCodeLength);
			
			if (number) {
				return `${countryCode} | ${number}`;
			}
		}
		
		return phoneNumber;
	} catch (error) {
		console.error("Error formatting phone:", error);
		return phoneNumber;
	}
};

const Modal = ({ isOpen, onClose, children }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50">
			<div className="fixed inset-0 bg-black bg-opacity-30"></div>
			<div className="flex items-center justify-center h-full">
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.95, opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="relative z-10"
					onClick={(e) => e.stopPropagation()}
				>
					{children}
				</motion.div>
			</div>
		</div>
	);
};

const SuccessModal = ({ isOpen, message, onClose }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50">
			<div className="fixed inset-0 bg-black bg-opacity-50"></div>
			<div className="flex items-center justify-center h-full">
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.95, opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="relative z-10 bg-white rounded-xl p-6 w-[320px] flex flex-col items-center"
				>
					<span
						className="material-icons text-green-500"
						style={{ fontSize: "91px" }}
					>
						check_circle
					</span>
					<h2 className="text-lg font-bold mt-6 text-center">{message}</h2>
				</motion.div>
			</div>
		</div>
	);
};

// Error Modal component
const ErrorModal = ({ isOpen, message, onClose }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50">
			<div className="fixed inset-0 bg-black bg-opacity-50"></div>
			<div className="flex items-center justify-center h-full">
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.95, opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="relative z-10 bg-white rounded-xl p-6 w-[320px] flex flex-col items-center"
				>
					<span
						className="material-icons text-red-500"
						style={{ fontSize: "91px" }}
					>
						error_outline
					</span>
					<h2 className="text-lg font-bold mt-6 text-center text-red-600">
						{message}
					</h2>
					<button
						onClick={onClose}
						className="mt-6 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
					>
						Tutup
					</button>
				</motion.div>
			</div>
		</div>
	);
};

const CompanyProfilePage = () => {
	const [activeModal, setActiveModal] = useState(null);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [showErrorModal, setShowErrorModal] = useState(false);
	const [modalMessage, setModalMessage] = useState("");

	const {
		data: userData,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["company-profile"],
		queryFn: async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				throw new Error("No authentication token found");
			}

			try {
				const response = await getMe();
				if (response.data && response.data.status === "success") {
					return response.data.data;
				}

				throw new Error(
					response.data?.message || "No usable data returned from API"
				);
			} catch (error) {
				console.error("Profile API error details:", error);
				throw error;
			}
		},
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});

	const handleModalClose = (success) => {
		setActiveModal(null);
		if (success) {
			if (activeModal === "companyInfo") {
				setModalMessage("Informasi Perusahaan Berhasil Diubah!");
			} else {
				setModalMessage("Password Berhasil Diubah!");
			}
			setShowSuccessModal(true);
			setTimeout(() => {
				setShowSuccessModal(false);
			}, 2000);

			// Refresh data
			refetch();
		}
	};

	if (error) {
		return (
			<div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
				<div className="text-red-500 text-6xl mb-4">
					<span className="material-icons" style={{ fontSize: "6rem" }}>
						error_outline
					</span>
				</div>
				<h1 className="text-2xl font-bold text-red-600 mb-2">
					Terjadi Kesalahan
				</h1>
				<p className="text-gray-600 mb-6 text-center max-w-md">
					{error.message ||
						"Gagal memuat profil. Silakan coba beberapa saat lagi."}
				</p>
				<button
					onClick={() => refetch()}
					className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-variant1 transition-colors"
				>
					Coba Lagi
				</button>
			</div>
		);
	}

	return (
		<div className="box-border w-full min-h-screen bg-white">
			{/* Profile header */}
			<div className="relative">
				<h1
					className="absolute text-lg font-semibold text-primary"
					style={{ top: "92px", left: "12px", width: "52px" }}
				>
					Profil
				</h1>
				<div
					className="absolute h-[0.5px] bg-[#D9D9D9]"
					style={{ top: "99px", left: "76px", right: "20px" }}
				></div>
			</div>

			{/* ID/EN and Notification with absolute positioning */}
			<div
				className="absolute flex items-center gap-[23px]"
				style={{ top: "29px", right: "20px", width: "101px" }}
			>
				<div className="flex items-center">
					<span className="font-bold text-primary">ID</span>
					<span className="mx-2 text-primary">/</span>
					<span className="text-zinc-500">EN</span>
				</div>
				<button
					aria-label="Notifications"
					className="material-icons text-zinc-500"
				>
					notifications
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center h-64 mt-[180px]">
					<span className="material-icons animate-spin text-primary text-3xl">
						refresh
					</span>
				</div>
			) : (
				<div className="pt-[180px] px-[12px]">
					{/* Profile section */}
					<section className="mb-[20px]">
						<div className="flex gap-5 items-center p-5 bg-white rounded-xl border-solid border-[0.3px] border-[#8B8B8B] max-md:flex-col max-md:items-start max-sm:p-2.5">
							<ProfilePictureUpload
								currentProfilePicture={
									userData?.organization?.profilePicture || null
								}
							/>
							<div className="flex flex-col gap-1.5">
								<h2 className="text-base font-bold text-neutral-600">
									{userData?.fullName || "Nama Perusahaan"}
								</h2>
								<p className="text-xs text-neutral-600">Admin</p>
								<p className="text-xs text-neutral-600">
								</p>
							</div>
						</div>
					</section>

					{/* Company Information section */}
					<section className="mb-[20px]">
						<div className="p-5 bg-white rounded-xl border-solid border-[0.3px] border-[#8B8B8B] max-md:flex-col max-md:items-start max-sm:p-2.5">
							<div className="flex justify-between items-center mb-2.5">
								<h3 className="text-xl font-semibold text-primary">
									Informasi Perusahaan
								</h3>
								<button
									onClick={() => setActiveModal("companyInfo")}
									className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-md cursor-pointer hover:bg-primary-variant1 transition duration-200"
								>
									Edit
								</button>
							</div>

							{/* Gradient divider */}
							<div className="relative h-[1px] w-full mb-4">
								<div
									className="absolute inset-0"
									style={{
										background:
											"linear-gradient(90deg, #FFFFFF 0%, #488BBE 50%, #FFFFFF 100%)",
									}}
								></div>
							</div>

							<div className="flex flex-wrap">
								<div className="w-full md:w-[270px] mb-4 md:mb-0">
									<span className="block text-xs text-zinc-500">
										Nama Perusahaan
									</span>
									<span className="block text-base text-neutral-600 mt-1 pl-0">
										{userData?.fullName || "-"}
									</span>
								</div>
								<div className="w-full md:w-[369px] mb-4 md:mb-0">
									<span className="block text-xs text-zinc-500">Alamat</span>
									<span className="block text-base text-neutral-600 mt-1 pl-0">
										{userData?.organization?.address || "-"}
									</span>
								</div>
								<div className="w-full md:w-auto">
									<span className="block text-xs text-zinc-500">
										Nomor Telepon
									</span>
									<span className="block text-base text-neutral-600 mt-1 pl-0">
										{formatPhoneDisplay(userData?.organization?.phone)}
									</span>
								</div>
							</div>
						</div>
					</section>

					{/* Account Settings section */}
					<section>
						<div className="p-5 bg-white rounded-xl border-solid border-[0.3px] border-[#8B8B8B] max-md:flex-col max-md:items-start max-sm:p-2.5">
							<div className="flex justify-between items-center mb-2.5">
								<h3 className="text-xl font-semibold text-primary">
									Pengaturan Akun
								</h3>
								<button
									onClick={() => setActiveModal("accountSettings")}
									className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-md cursor-pointer hover:bg-primary-variant1 transition duration-200"
								>
									Edit
								</button>
							</div>

							{/* Gradient divider */}
							<div className="relative h-[1px] w-full mb-4">
								<div
									className="absolute inset-0"
									style={{
										background:
											"linear-gradient(90deg, #FFFFFF 0%, #488BBE 50%, #FFFFFF 100%)",
									}}
								></div>
							</div>

							<div className="flex flex-wrap">
								<div className="w-full md:w-[320px] mb-4 md:mb-0">
									<span className="block text-xs text-zinc-500">Email</span>
									<span className="block text-base text-neutral-600 mt-1 pl-0">
										{userData?.email || "Belum diisi"}
									</span>
								</div>
								<div className="w-full md:w-auto">
									<span className="block text-xs text-zinc-500">Password</span>
									<span className="block text-base text-neutral-600 mt-1 pl-0">
										********
									</span>
								</div>
							</div>
						</div>
					</section>
				</div>
			)}

			{/* Company Info Edit Modal */}
			<AnimatePresence>
				{activeModal === "companyInfo" && (
					<Modal isOpen={true} onClose={() => handleModalClose(false)}>
						<CompanyInfoEditModal
							onClose={handleModalClose}
							userData={userData}
						/>
					</Modal>
				)}
			</AnimatePresence>

			{/* Account Settings Edit Modal */}
			<AnimatePresence>
				{activeModal === "accountSettings" && (
					<Modal isOpen={true} onClose={() => handleModalClose(false)}>
						<CompanyAccountEditModal
							onClose={handleModalClose}
							userData={userData}
						/>
					</Modal>
				)}
			</AnimatePresence>

			{/* Success Modal */}
			<AnimatePresence>
				{showSuccessModal && (
					<SuccessModal
						isOpen={true}
						message={modalMessage}
						onClose={() => setShowSuccessModal(false)}
					/>
				)}
			</AnimatePresence>

			{/* Error Modal */}
			<AnimatePresence>
				{showErrorModal && (
					<ErrorModal
						isOpen={true}
						message={modalMessage}
						onClose={() => setShowErrorModal(false)}
					/>
				)}
			</AnimatePresence>
		</div>
	);
};

export default CompanyProfilePage;