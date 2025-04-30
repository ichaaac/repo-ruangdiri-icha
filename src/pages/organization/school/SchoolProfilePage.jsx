import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// import axios from "../../../lib/axios";
import { getMe } from "../../../api/users";
import { motion, AnimatePresence } from "framer-motion";
import SchoolInfoEditModal from "../../../components/organization/school/profile/SchoolInfoEditModal";
import SchoolAccountEditModal from "../../../components/organization/school/profile/SchoolAccountEditModal";
import ProfilePictureUpload from "../../../components/organization/school/profile/ProfilePictureUpload";

// Enhanced Modal component with proper styling based on design images
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

// Success Modal component
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

const SchoolProfilePage = () => {
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
		queryKey: ["school-profile"],
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
			if (activeModal === "schoolInfo") {
				setModalMessage("Informasi Sekolah Berhasil Diubah!");
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
					className="absolute h-[0.5px] bg-[#8B8B8B]"
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
									{userData?.fullName || "Nama Sekolah"}
								</h2>
								<p className="text-xs text-neutral-600">Admin</p>
								<p className="text-xs text-neutral-600">
									{userData?.organization?.address
										? userData.organization.address.split(",")[0]
										: "Alamat"}
									, Indonesia
								</p>
							</div>
						</div>
					</section>

					{/* School Information section */}
					<section className="mb-[20px]">
						<div className="p-5 bg-white rounded-xl border-solid border-[0.3px] border-[#8B8B8B] max-md:flex-col max-md:items-start max-sm:p-2.5">
							<div className="flex justify-between items-center mb-2.5">
								<h3 className="text-xl font-semibold text-primary">
									Informasi Sekolah
								</h3>
								<button
									onClick={() => setActiveModal("schoolInfo")}
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
										Nama Sekolah
									</span>
									<span className="block text-base text-neutral-600 mt-1 pl-0">
										{userData?.fullName || "Belum diisi"}
									</span>
								</div>
								<div className="w-full md:w-[369px] mb-4 md:mb-0">
									<span className="block text-xs text-zinc-500">Alamat</span>
									<span className="block text-base text-neutral-600 mt-1 pl-0">
										{userData?.organization?.address || "Belum diisi"}
									</span>
								</div>
								<div className="w-full md:w-auto">
									<span className="block text-xs text-zinc-500">
										Nomor Telepon
									</span>
									<span className="block text-base text-neutral-600 mt-1 pl-0">
										{userData?.organization?.phone || "Belum diisi"}
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

			{/* School Info Edit Modal */}
			<AnimatePresence>
				{activeModal === "schoolInfo" && (
					<Modal isOpen={true} onClose={() => handleModalClose(false)}>
						<SchoolInfoEditModal
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
						<SchoolAccountEditModal
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

export default SchoolProfilePage;
