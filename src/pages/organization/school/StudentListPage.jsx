import React, { useState, useRef, useCallback, useEffect } from "react";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
	useQuery,
} from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../../../lib/api";
import useDebounce from "../../../hooks/useDebounce";

const StudentListPage = () => {
	const queryClient = useQueryClient();
	const [searchInput, setSearchInput] = useState("");
	const [sortConfigInput, setSortConfigInput] = useState({
		key: null,
		direction: null,
	});
	const debouncedSearchTerm = useDebounce(searchInput, 500);
	const [appliedSortConfig, setAppliedSortConfig] = useState({
		key: null,
		direction: null,
	});

	const [showFilterModal, setShowFilterModal] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [editData, setEditData] = useState({});
	const [hasChanges, setHasChanges] = useState(false);
	const observerRef = useRef(null);
	const helpIconRef = useRef(null);
	const searchInputRef = useRef(null);
	const [showHelpTooltip, setShowHelpTooltip] = useState(false);

	// Filter states
	const [filtersInput, setFiltersInput] = useState({
		grade: null,
		classNumber: null,
		gender: null,
		screeningStatus: null,
		counselingStatus: null,
	});

	const [appliedFilters, setAppliedFilters] = useState({
		grade: null,
		classNumber: null,
		gender: null,
		screeningStatus: null,
		counselingStatus: null,
	});

	// Get user profile data
	const { data: userData, isLoading: userLoading } = useQuery({
		queryKey: ["userProfile"],
		queryFn: async () => {
			try {
				const response = await apiClient.get("/users/me");
				const userData = response?.data?.data;
				return userData || { fullName: "Pengguna" };
			} catch (error) {
				console.error("User profile API error:", error);
				return { fullName: "Pengguna" };
			}
		},
		staleTime: 1000 * 60 * 5,
	});

	// Fetch total student counts for the accurate totals display
	const { data: totalCounts } = useQuery({
		queryKey: ["totalStudentCounts"],
		queryFn: async () => {
			try {
				// Get the total count from metadata to show accurate totals
				const response = await apiClient.get("/organizations/students", {
					params: {
						page: 1,
						limit: 1,
					},
				});

				return {
					total: response.data?.metadata?.totalData || 0,
					female: response.data?.metadata?.femaleCount || 0,
					male: response.data?.metadata?.maleCount || 0,
				};
			} catch (error) {
				console.error("Student counts API error:", error);
				return { total: 0, female: 0, male: 0 };
			}
		},
		staleTime: 1000 * 60 * 5,
	});

	// Fetch available classrooms for filtering
	const { data: classroomsData } = useQuery({
		queryKey: ["classrooms"],
		queryFn: async () => {
			try {
				const response = await apiClient.get("/students/classrooms");
				return response.data?.data || [];
			} catch (error) {
				console.error("Classrooms API error:", error);
				return [];
			}
		},
		staleTime: 1000 * 60 * 60, // 1 hour
	});

	// Process classroom data to get unique grades and class numbers
	const uniqueClassroomData = React.useMemo(() => {
		if (!classroomsData || classroomsData.length === 0) {
			return {
				grades: ["X", "XI", "XII"],
				classNumbers: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
			};
		}

		const uniqueGrades = new Set();
		const uniqueClassNumbers = new Set();

		classroomsData.forEach((item) => {
			const classroom = item.classroom;
			if (!classroom) return;

			const parts = classroom.split("-");
			if (parts.length === 2) {
				const grade = /^[XVI]+$/.test(parts[0])
					? parts[0]
					: parts[0] === "10"
						? "X"
						: parts[0] === "11"
							? "XI"
							: parts[0] === "12"
								? "XII"
								: parts[0];

				uniqueGrades.add(grade);
				uniqueClassNumbers.add(parts[1]);
			}
		});

		return {
			grades:
				Array.from(uniqueGrades).length > 0
					? Array.from(uniqueGrades)
					: ["X", "XI", "XII"],
			classNumbers:
				Array.from(uniqueClassNumbers).length > 0
					? Array.from(uniqueClassNumbers)
					: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
		};
	}, [classroomsData]);

	// Helper function to build filter params
	const buildFilterParams = () => {
		const params = {
			page: 1,
			limit: 10, // Ensure we only load 10 items per page
		};

		if (debouncedSearchTerm) {
			params.search = debouncedSearchTerm;
		}

		if (appliedSortConfig.key && appliedSortConfig.direction) {
			params.sortBy =
				appliedSortConfig.key === "fullName" ? "name" : appliedSortConfig.key;
			params.sortOrder =
				appliedSortConfig.direction === "ascending" ? "asc" : "desc";
		}

		// Try multiple parameter formats for class filtering
		if (appliedFilters.grade && appliedFilters.classNumber) {
			// Try all possible API parameter names to ensure filtering works
			params.classroom = `${appliedFilters.grade}-${appliedFilters.classNumber}`;
			params.classId = `${appliedFilters.grade}-${appliedFilters.classNumber}`;
			params.kelas = `${appliedFilters.grade}-${appliedFilters.classNumber}`;
			params.class = `${appliedFilters.grade}-${appliedFilters.classNumber}`;
		}

		if (appliedFilters.gender) {
			params.gender = appliedFilters.gender === "L" ? "male" : "female";
		}

		if (appliedFilters.screeningStatus) {
			params.screening = appliedFilters.screeningStatus;
		}

		if (appliedFilters.counselingStatus !== null) {
			params.hasCounseled = appliedFilters.counselingStatus ? "1" : "0";
		}

		return params;
	};

	// Fetch students data with infinite query
	const {
		data: infiniteStudentsData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
		error,
		isSuccess: studentsLoaded,
		refetch,
	} = useInfiniteQuery({
		queryKey: [
			"infiniteStudents",
			debouncedSearchTerm,
			appliedSortConfig,
			appliedFilters,
		],
		queryFn: async ({ pageParam = 1 }) => {
			// Build query parameters
			const params = { ...buildFilterParams(), page: pageParam };

			try {
				const response = await apiClient.get(`/organizations/students`, {
					params,
				});

				const studentsData = response.data?.data?.students || [];
				const metadata = response.data?.metadata || {
					totalPage: 1,
					totalData: 0,
					page: pageParam,
					limit: 10,
					hasNextPage: false,
				};

				return {
					data: studentsData,
					metadata: metadata,
					pageParam,
				};
			} catch (error) {
				console.error("Students API error details:", error);
				throw error;
			}
		},
		getNextPageParam: (lastPage) => {
			const currentPage = lastPage.metadata.page;
			const totalPages = lastPage.metadata.totalPage;
			return currentPage < totalPages ? currentPage + 1 : undefined;
		},
		staleTime: 1000 * 60 * 2,
	});

	// Setup intersection observer for infinite scrolling with adjusted threshold
	const lastStudentElementRef = useCallback(
		(node) => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}

			if (isFetchingNextPage || !hasNextPage) return;

			observerRef.current = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && hasNextPage) {
						fetchNextPage();
					}
				},
				{
					// Use a lower threshold to trigger loading when element is partially visible
					threshold: 0.1,
					// Add rootMargin to ensure we start loading a bit before reaching the last element
					rootMargin: "0px 0px 100px 0px",
				}
			);

			if (node) observerRef.current.observe(node);
		},
		[isFetchingNextPage, hasNextPage, fetchNextPage]
	);

	// Student update mutation
	const updateStudentMutation = useMutation({
		mutationFn: async ({ id, data }) => {
			return apiClient.patch(`/organizations/students/${id}`, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["infiniteStudents"] });
			setEditingId(null);
			setEditData({});
			setHasChanges(false);
		},
		onError: (error) => {
			console.error("Error updating student:", error);
		},
	});

	// Process all loaded pages into a flat array of students
	const allStudents = infiniteStudentsData
		? infiniteStudentsData.pages.flatMap((page) => page.data)
		: [];

	// Student counts display - calculate gender from loaded students
	const studentCounts = {
		// Use the total count from the API metadata for accurate totals
		total: totalCounts?.total || 0,

		// Calculate gender counts from the loaded students data to match the list
		female: allStudents.filter(
			(student) => student.gender === "female" || student.gender === "f"
		).length,

		male: allStudents.filter(
			(student) => student.gender === "male" || student.gender === "m"
		).length,
	};

	// Search handling
	const handleSearch = (e) => {
		setSearchInput(e.target.value);
	};

	// Sorting
	const requestSort = (key) => {
		let direction = "ascending";

		if (
			sortConfigInput.key === key &&
			sortConfigInput.direction === "ascending"
		) {
			direction = "descending";
		} else if (
			sortConfigInput.key === key &&
			sortConfigInput.direction === "descending"
		) {
			direction = null;
		}

		setSortConfigInput({ key, direction });
		setAppliedSortConfig({ key, direction });
	};

	const getSortIcon = (key) => {
		if (sortConfigInput.key !== key) {
			return "sort";
		}
		return sortConfigInput.direction === "ascending"
			? "arrow_upward"
			: "arrow_downward";
	};

	// Filter functions - ensure screening status can only have one selection
	const handleFilterSelect = (filterType, value) => {
		if (filterType === "classNumber" && !filtersInput.grade) {
			return; // Can't select class number without grade
		}

		// Toggle logic - if clicking the same value, unset it
		if (filtersInput[filterType] === value) {
			setFiltersInput((prev) => {
				const newFilters = { ...prev, [filterType]: null };
				if (filterType === "grade") {
					newFilters.classNumber = null; // Also reset class number when grade is unset
				}
				return newFilters;
			});
		} else {
			setFiltersInput((prev) => ({ ...prev, [filterType]: value }));
		}
	};

	// Apply filters
	const applyFilters = () => {
		setAppliedFilters(filtersInput);
		setShowFilterModal(false);
	};

	const clearFilters = () => {
		const resetFilters = {
			grade: null,
			classNumber: null,
			gender: null,
			screeningStatus: null,
			counselingStatus: null,
		};

		setFiltersInput(resetFilters);
		setAppliedFilters(resetFilters);
	};

	// Edit functionality
	const startEditing = (id) => {
		if (editingId !== null) return;

		const student = allStudents.find((student) => student.id === id);
		if (!student) return;

		setEditingId(id);
		setEditData({
			fullName: student.fullName,
			nis: student.nis,
			classroom: student.classroom,
			gender: student.gender,
			iqScore: student.iqScore !== undefined ? student.iqScore : 0,
		});
		setHasChanges(false);
	};

	const cancelEditing = () => {
		setEditingId(null);
		setEditData({});
		setHasChanges(false);
	};

	const saveEditing = (id) => {
		if (!hasChanges) return;
		updateStudentMutation.mutate({ id, data: editData });
	};

	const handleEditChange = (e) => {
		const { name, value } = e.target;
		setEditData((prev) => ({ ...prev, [name]: value }));
		setHasChanges(true);
	};

	// Map screening status to UI components
	const getScreeningStatusUI = (status) => {
		switch (status) {
			case "at_risk":
				return {
					bgColor: "bg-red-100",
					icon: <span className="material-icons text-red-500">warning</span>,
				};
			case "monitored":
				return {
					bgColor: "bg-yellow-100",
					icon: <span className="material-icons text-yellow-500">error</span>,
				};
			case "stable":
			default:
				return {
					bgColor: "bg-green-100",
					icon: (
						<span className="material-icons text-green-500">check_circle</span>
					),
				};
		}
	};

	// Highlight search text
	const highlightText = (text) => {
		if (!searchInput || !text) return <span>{text}</span>;

		const parts = text.split(new RegExp(`(${searchInput})`, "gi"));
		return (
			<span>
				{parts.map((part, index) =>
					part.toLowerCase() === searchInput.toLowerCase() ? (
						<span key={index} className="font-bold bg-yellow-200">
							{part}
						</span>
					) : (
						<span key={index}>{part}</span>
					)
				)}
			</span>
		);
	};

	// Check if any filters are active
	const hasActiveFilters =
		appliedFilters.grade ||
		appliedFilters.classNumber ||
		appliedFilters.gender ||
		appliedFilters.screeningStatus !== null ||
		appliedFilters.counselingStatus !== null;

	useEffect(() => {
		if (studentsLoaded && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [studentsLoaded && searchInputRef.current]);

	// Render loading state
	if (isLoading && !isFetchingNextPage) {
		return (
			<div className="flex justify-center items-center h-full min-h-[80vh]">
				<div className="flex flex-col items-center">
					<span className="material-icons animate-spin text-[#488bbe] text-4xl mb-4">
						refresh
					</span>
					<p className="text-[#488bbe]">Memuat data siswa...</p>
				</div>
			</div>
		);
	}

	// Render error state
	if (isError) {
		return (
			<div className="flex justify-center items-center h-full min-h-[80vh]">
				<div className="flex flex-col items-center text-center p-6">
					<span className="material-icons text-red-500 text-4xl mb-4">
						error_outline
					</span>
					<p className="text-red-500 font-semibold mb-2">
						Gagal memuat data siswa
					</p>
					<p className="text-gray-600 mb-4">
						{error?.message || "Terjadi kesalahan saat mengambil data."}
					</p>
					<button
						onClick={() => refetch()}
						className="px-4 py-2 bg-[#488bbe] text-white rounded-full hover:bg-[#3399e9]"
					>
						Coba Lagi
					</button>
				</div>
			</div>
		);
	}

	return (
		<>
			{/* Language/Notification icons */}
			<div className="flex items-center justify-end px-6 pt-4">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<span className="text-[#8b8b8b] text-sm font-medium">ID / EN</span>
					</div>
					<div className="flex items-center">
						<span className="material-icons text-[#8b8b8b]">notifications</span>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="pt-8 pb-8 px-4 md:px-8">
				{/* User greeting and Stats */}
				<div className="flex flex-wrap justify-between items-center mb-6">
					<div className="mb-4 md:mb-0">
						<h1 className="text-xl md:text-3xl font-bold text-[#488bbe]">
							Halo, {userData?.fullName || "Pengguna"}
						</h1>
					</div>

					{/* Student Stats - using direct counts with fixed icon alignment */}
					<div className="flex flex-wrap gap-3">
						<div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
							<img
								src="/population-group-bg.svg"
								alt="Background"
								className="absolute inset-0 w-full h-full"
							/>
							<div className="z-10 flex items-center w-full pl-3">
								<span className="material-icons text-[#3399E9] text-lg">
									groups
								</span>
								<div className="flex flex-col items-center ml-auto mr-auto">
									<div className="text-xl md:text-2xl font-bold text-[#488BBE]">
										{studentCounts.total}
									</div>
									<div className="text-xs text-[#488BBE]">Siswa</div>
								</div>
							</div>
						</div>

						<div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
							<img
								src="/population-group-bg.svg"
								alt="Background"
								className="absolute inset-0 w-full h-full"
							/>
							<div className="z-10 flex items-center w-full pl-3">
								<span className="material-icons text-[#FF86E1] text-lg">
									face_2
								</span>
								<div className="flex flex-col items-center ml-auto mr-auto">
									<div className="text-xl md:text-2xl font-bold text-[#488BBE]">
										{studentCounts.female}
									</div>
									<div className="text-xs text-[#488BBE]">Perempuan</div>
								</div>
							</div>
						</div>

						<div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
							<img
								src="/population-group-bg.svg"
								alt="Background"
								className="absolute inset-0 w-full h-full"
							/>
							<div className="z-10 flex items-center w-full pl-3">
								<span className="material-icons text-[#FF7173] text-lg">
									face
								</span>
								<div className="flex flex-col items-center ml-auto mr-auto">
									<div className="text-xl md:text-2xl font-bold text-[#488BBE]">
										{studentCounts.male}
									</div>
									<div className="text-xs text-[#488BBE]">Laki Laki</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Search and Filter Row */}
				<div className="flex flex-wrap items-center gap-4 mb-6">
					<div className="relative w-full max-w-md">
						<span className="absolute inset-y-0 left-3 flex items-center">
							<span className="material-icons text-[#8b8b8b]">search</span>
						</span>
						<input
							ref={searchInputRef}
							type="text"
							placeholder="Cari Nama atau NIS..."
							value={searchInput}
							onChange={handleSearch}
							className="pl-10 pr-4 py-2 w-full rounded-full border border-[#d9d9d9] focus:outline-none focus:border-[#488bbe]"
						/>
					</div>

					<div className="flex items-center gap-2">
						<button
							className="flex items-center justify-center px-4 py-2 rounded-full text-[#8b8b8b] hover:bg-[#f7f7f9] transition-colors"
							onClick={() => setShowFilterModal(true)}
						>
							<span className="material-icons mr-2">filter_alt</span>
							<span>Filter</span>
						</button>

						{hasActiveFilters && (
							<button
								className="flex items-center justify-center px-4 py-2 rounded-full text-[#488bbe] hover:bg-[#e8f5ff] transition-colors"
								onClick={clearFilters}
							>
								<span className="material-icons mr-1 text-sm">close</span>
								<span>Clear all</span>
							</button>
						)}
					</div>
				</div>

				{/* Student Table */}
				<div className="bg-white rounded-xl shadow-md overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full table-fixed">
							<thead className="bg-[#e8f5ff]">
								<tr>
									<th
										className="w-[200px] px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider cursor-pointer"
										onClick={() => requestSort("fullName")}
									>
										<div className="flex items-center">
											NAMA
											<span className="material-icons text-sm ml-1">
												{getSortIcon("fullName")}
											</span>
										</div>
									</th>
									<th className="w-[120px] px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider">
										KELAS
									</th>
									<th className="w-[120px] px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider">
										JENIS KELAMIN
									</th>
									<th
										className="w-[120px] px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider cursor-pointer"
										onClick={() => requestSort("nis")}
									>
										<div className="flex items-center">
											NIS
											<span className="material-icons text-sm ml-1">
												{getSortIcon("nis")}
											</span>
										</div>
									</th>
									<th className="w-[100px] px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider">
										<div className="flex items-center justify-center relative group">
											SKRINING
											<span
												className="material-icons text-sm ml-1 text-gray-400 cursor-help"
												ref={helpIconRef}
												onMouseEnter={() => setShowHelpTooltip(true)}
												onMouseLeave={() => setShowHelpTooltip(false)}
											>
												help_outline
											</span>
											{/* Fixed tooltip positioning with exact dimensions */}
											{showHelpTooltip && (
												<div
													className="absolute w-[115px] h-[109px] bg-[#00000059] text-white text-xs rounded-[5px] p-[10px] z-50"
													style={{
														left: "calc(100% + 5px)",
														top: "-40px",
													}}
												>
													<div className="flex flex-col gap-[10px]">
														<div className="flex items-center">
															<span className="material-icons text-red-500 text-sm mr-1">
																warning
															</span>
															<span>Berisiko</span>
														</div>
														<div className="flex items-center">
															<span className="material-icons text-yellow-500 text-sm mr-1">
																error
															</span>
															<span>Pengawasan</span>
														</div>
														<div className="flex items-center">
															<span className="material-icons text-green-500 text-sm mr-1">
																check_circle
															</span>
															<span>Stabil</span>
														</div>
														<div className="flex items-center">
															<span className="material-icons text-gray-400 text-sm mr-1">
																remove
															</span>
															<span className="whitespace-nowrap">
																Belum Skrining
															</span>
														</div>
													</div>
												</div>
											)}
										</div>
									</th>
									<th className="w-[100px] px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider">
										KONSELING
									</th>
									<th
										className="w-[100px] px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider cursor-pointer"
										onClick={() => requestSort("iqScore")}
									>
										<div className="flex items-center justify-center">
											SKOR IQ
											<span className="material-icons text-sm ml-1">
												{getSortIcon("iqScore")}
											</span>
										</div>
									</th>
									<th className="w-[80px] px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider">
										AKSI
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{allStudents.map((student, index) => {
									const screeningStatus =
										student.screeningStatus || student.screening || "stable";
									const screeningUI = getScreeningStatusUI(screeningStatus);
									const counselingStatus =
										student.counselingStatus !== undefined
											? student.counselingStatus
											: student.isDoneCounseling;
									const isLastElement = index === allStudents.length - 1;

									return (
										<tr
											key={student.id}
											className="hover:bg-gradient-to-r from-white via-[#488BBE20] to-white transition-all duration-300"
											ref={isLastElement ? lastStudentElementRef : null}
										>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<div className="flex-shrink-0 h-10 w-10">
														<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
															<span className="material-icons text-gray-500">
																person
															</span>
														</div>
													</div>
													<div className="ml-4">
														{editingId === student.id ? (
															<input
																type="text"
																name="fullName"
																value={editData.fullName}
																onChange={handleEditChange}
																className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
															/>
														) : (
															<div className="text-sm font-medium text-gray-900">
																{highlightText(student.fullName)}
															</div>
														)}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{editingId === student.id ? (
													<input
														type="text"
														name="classroom"
														value={editData.classroom}
														onChange={handleEditChange}
														className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
													/>
												) : (
													<div className="text-sm text-gray-500">
														{student.classroom}
													</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{editingId === student.id ? (
													<select
														name="gender"
														value={editData.gender}
														onChange={handleEditChange}
														className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1"
													>
														<option value="male">Laki-laki</option>
														<option value="female">Perempuan</option>
													</select>
												) : (
													<div className="text-sm text-gray-500">
														{student.gender === "male" || student.gender === "m"
															? "Laki-laki"
															: "Perempuan"}
													</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{editingId === student.id ? (
													<input
														type="text"
														name="nis"
														value={editData.nis}
														onChange={handleEditChange}
														className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
													/>
												) : (
													<div className="text-sm text-gray-500">
														{highlightText(student.nis)}
													</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-center">
												<span
													className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${screeningUI.bgColor}`}
												>
													{screeningUI.icon}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-center">
												<span
													className={`${counselingStatus ? "text-green-500" : "text-red-500"}`}
												>
													{counselingStatus ? "Sudah" : "Belum"}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-center">
												{editingId === student.id ? (
													<input
														type="number"
														name="iqScore"
														value={editData.iqScore}
														onChange={handleEditChange}
														className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
													/>
												) : (
													<div className="text-sm text-gray-500">
														{student.iqScore}
													</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
												{editingId === student.id ? (
													<div className="flex space-x-2 justify-center">
														<button
															className={`text-[#9BCA61] hover:text-green-700 ${!hasChanges || updateStudentMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
															onClick={() =>
																hasChanges && saveEditing(student.id)
															}
															disabled={
																!hasChanges || updateStudentMutation.isPending
															}
															aria-label="Save"
														>
															<span className="material-icons">
																{updateStudentMutation.isPending
																	? "hourglass_empty"
																	: "check_circle"}
															</span>
														</button>
														<button
															className="text-[#EE4266] hover:text-red-700"
															onClick={cancelEditing}
															disabled={updateStudentMutation.isPending}
															aria-label="Cancel"
														>
															<span className="material-icons">cancel</span>
														</button>
													</div>
												) : (
													<button
														className={`text-[#8b8b8b] hover:text-[#488bbe] ${editingId !== null ? "opacity-50 cursor-not-allowed" : ""}`}
														onClick={() =>
															editingId === null && startEditing(student.id)
														}
														disabled={editingId !== null}
														aria-label="Edit student"
													>
														<span className="material-icons">edit</span>
													</button>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* Infinite Scroll Loading Indicator */}
					{isFetchingNextPage && (
						<div className="py-4 text-center">
							<div className="flex justify-center items-center space-x-2">
								<span className="material-icons animate-spin text-[#488bbe] text-xl">
									refresh
								</span>
								<span className="text-[#488bbe] text-sm">
									Memuat data tambahan...
								</span>
							</div>
						</div>
					)}

					{/* Infinite Scroll End Message */}
					{!hasNextPage && allStudents.length > 0 && (
						<div className="py-4 text-center text-gray-500 text-sm">
							Semua data siswa telah dimuat
						</div>
					)}

					{/* Empty State */}
					{allStudents.length === 0 && !isLoading && (
						<div className="py-16 text-center">
							<span className="material-icons text-gray-400 text-5xl mb-4">
								school
							</span>
							<p className="text-gray-500">
								Tidak ada data siswa yang tersedia
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Filter Modal */}
			<AnimatePresence>
				{showFilterModal && (
					<div className="fixed inset-0 bg-[#55555580] flex items-center justify-center z-50 p-4">
						<motion.div
							className="bg-white rounded-[10px] shadow-lg w-[655px] max-h-[90vh] overflow-hidden"
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={{ duration: 0.2, ease: "easeInOut" }}
						>
							<div className="p-5 flex flex-col max-h-[90vh]">
								<div className="flex flex-col justify-start items-start gap-5 overflow-y-auto">
									<div className="inline-flex justify-between items-center w-full">
										<div className="text-[#488bbe] text-xl font-semibold">
											Filter
										</div>
										<button
											onClick={() => setShowFilterModal(false)}
											className="text-[#488bbe] hover:text-[#3399e9]"
										>
											<span className="material-icons">close</span>
										</button>
									</div>

									<div className="flex flex-col justify-start items-start gap-5 w-full">
										{/* Grade Selection */}
										<div className="w-full flex flex-col justify-start items-start gap-2.5">
											<div className="text-[#488bbe] text-sm font-normal">
												Kelas
											</div>
											<div className="inline-flex justify-start items-center gap-[5px] flex-wrap">
												{/* Grade Level Buttons - using dynamic data */}
												{uniqueClassroomData.grades.map((grade) => (
													<button
														key={grade}
														className={`h-7 px-2.5 py-1 ${filtersInput.grade === grade ? "bg-[#488bbe] text-white" : "bg-[#eaecee] text-gray-700"} rounded-[5px] flex justify-center items-center transition-colors`}
														onClick={() => handleFilterSelect("grade", grade)}
													>
														<div className="text-center text-xs font-normal">
															{grade}
														</div>
													</button>
												))}
											</div>

											{/* Class Number Buttons - using dynamic data */}
											<div className="inline-flex justify-start items-center gap-[5px] flex-wrap">
												{uniqueClassroomData.classNumbers.map((classNum) => (
													<button
														key={classNum}
														className={`h-7 px-2.5 py-1 ${
															!filtersInput.grade
																? "bg-[#eaecee] text-gray-400 cursor-not-allowed"
																: filtersInput.classNumber === classNum
																	? "bg-[#488bbe] text-white"
																	: "bg-[#eaecee] text-gray-700"
														} rounded-[5px] flex justify-center items-center transition-colors`}
														onClick={() =>
															handleFilterSelect("classNumber", classNum)
														}
														disabled={!filtersInput.grade}
													>
														<div className="text-center text-xs font-normal">
															{classNum}
														</div>
													</button>
												))}
											</div>
										</div>

										{/* Gender, Screening and Counseling Selection */}
										<div className="inline-flex justify-start items-start gap-[35px] flex-wrap">
											{/* Gender Selection */}
											<div className="inline-flex flex-col justify-start items-start gap-2.5">
												<div className="text-[#488bbe] text-sm font-normal">
													Jenis Kelamin
												</div>
												<div className="inline-flex justify-start items-center gap-[5px]">
													<button
														className={`h-8 px-[9px] py-2.5 ${filtersInput.gender === "L" ? "bg-[#488bbe] text-white" : "bg-[#eaecee] text-gray-700"} rounded-[5px] flex justify-center items-center transition-colors`}
														onClick={() => handleFilterSelect("gender", "L")}
													>
														<div className="text-xs font-normal">L</div>
													</button>
													<button
														className={`h-8 px-[9px] py-2.5 ${filtersInput.gender === "P" ? "bg-[#488bbe] text-white" : "bg-[#eaecee] text-gray-700"} rounded-[5px] flex justify-center items-center transition-colors`}
														onClick={() => handleFilterSelect("gender", "P")}
													>
														<div className="text-xs font-normal">P</div>
													</button>
												</div>
											</div>

											{/* Screening Selection */}
											<div className="inline-flex flex-col justify-start items-start gap-2.5">
												<div className="text-[#488bbe] text-sm font-normal">
													Skrining
												</div>
												<div className="inline-flex justify-start items-center gap-[5px] flex-wrap">
													<button
														className={`h-8 px-[9px] py-2.5 ${filtersInput.screeningStatus === "at_risk" ? "bg-[#488bbe] text-white" : "bg-[#eaecee] text-gray-700"} rounded-[5px] flex justify-start items-center transition-colors`}
														onClick={() =>
															handleFilterSelect("screeningStatus", "at_risk")
														}
													>
														<div className="text-xs font-normal">Berisiko</div>
													</button>
													<button
														className={`h-8 px-[9px] py-2.5 ${filtersInput.screeningStatus === "monitored" ? "bg-[#488bbe] text-white" : "bg-[#eaecee] text-gray-700"} rounded-[5px] flex justify-center items-center transition-colors`}
														onClick={() =>
															handleFilterSelect("screeningStatus", "monitored")
														}
													>
														<div className="text-xs font-normal">
															Pengawasan
														</div>
													</button>
													<button
														className={`h-8 px-[9px] py-2.5 ${filtersInput.screeningStatus === "stable" ? "bg-[#488bbe] text-white" : "bg-[#eaecee] text-gray-700"} rounded-[5px] flex justify-center items-center transition-colors`}
														onClick={() =>
															handleFilterSelect("screeningStatus", "stable")
														}
													>
														<div className="text-xs font-normal">Stabil</div>
													</button>
												</div>
											</div>

											{/* Counseling Selection */}
											<div className="inline-flex flex-col justify-start items-start gap-2.5">
												<div className="text-[#488bbe] text-sm font-normal">
													Konseling
												</div>
												<div className="inline-flex justify-start items-center gap-[5px]">
													<button
														className={`h-8 px-[9px] py-2.5 ${filtersInput.counselingStatus === true ? "bg-[#488bbe] text-white" : "bg-[#eaecee] text-gray-700"} rounded-[5px] flex justify-start items-center transition-colors`}
														onClick={() =>
															handleFilterSelect("counselingStatus", true)
														}
													>
														<div className="text-xs font-normal">Sudah</div>
													</button>
													<button
														className={`h-8 px-[9px] py-2.5 ${filtersInput.counselingStatus === false ? "bg-[#488bbe] text-white" : "bg-[#eaecee] text-gray-700"} rounded-[5px] flex justify-start items-center transition-colors`}
														onClick={() =>
															handleFilterSelect("counselingStatus", false)
														}
													>
														<div className="text-xs font-normal">Belum</div>
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Save Button */}
								<div className="mt-4 pt-2 border-t border-gray-200">
									<button
										className="w-full h-[42px] px-7 py-2.5 bg-[#488bbe] rounded-[5px] flex justify-center items-center"
										onClick={applyFilters}
									>
										<div className="text-white text-xs font-semibold">
											Simpan
										</div>
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	);
};

export default StudentListPage;
