// src/pages/organization/school/StudentListPage.jsx
import React, { useState, useRef, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import SchoolSidebar from "../../../components/organization/school/SchoolSidebar";
import api, { apiClient } from "../../../lib/api";

const StudentListPage = () => {
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const observerRef = useRef(null);
  
  // Handle window resize without useEffect using event listeners
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    // Close sidebar on mobile automatically
    if (mobile) {
      setSidebarExpanded(false);
    }
  }, []);
  
  // Add resize listener when component mounts
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
  }

  // Get user profile data
  const { 
    data: userData,
    isLoading: userLoading
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      try {
        const response = await apiClient.get(
          `${API_URL}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Make sure we're returning the correct data path and handle potential undefined
        if (response.data && response.data.data) {
          return response.data.data;
        }
        // Return an empty object if the expected data structure isn't found
        return {};
      } catch (error) {
        console.error('User profile API error:', error);
        // Return empty object instead of throwing to prevent undefined
        return {};
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    retryDelay: 1000,
    // Ensure we don't use stale error data
    useErrorBoundary: false
  });

  // Fetch students data with infinite query
  const { 
    data: infiniteStudentsData, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['infiniteStudents', searchTerm, sortConfig],
    queryFn: async ({ pageParam = 1 }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: pageParam,
        limit: 10 // Fixed to 10 per request as specified
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Add sorting if applicable
      if (sortConfig.key && sortConfig.direction) {
        params.append('sortBy', sortConfig.key);
        params.append('sortDirection', sortConfig.direction === 'ascending' ? 'asc' : 'desc');
      }

      try {
        const response = await api.get(
          `${API_URL}/organizations/students?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Log the entire response for debugging
        console.log('Students API Raw Response:', response);
        
        // Extract the data
        const studentsData = response.data.data?.students || [];
        const metadata = response.data.metadata || {
          totalPage: 1,
          totalData: 0,
          page: pageParam,
          limit: 10,
          hasNextPage: false
        };
        
        return {
          data: studentsData,
          metadata: metadata,
          pageParam
        };
      } catch (error) {
        console.error('Students API error details:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      // Check if there are more pages to load
      const currentPage = lastPage.metadata.page;
      const totalPages = lastPage.metadata.totalPage;
      
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  // Setup intersection observer for infinite scrolling
  const lastStudentElementRef = useCallback(node => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Skip if we're already fetching or there are no more pages
    if (isFetchingNextPage || !hasNextPage) return;
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.5 });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Student update mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log(`Updating student ${id} with data:`, data);
      
      return api.patch(
        `${API_URL}/organizations/students/${id}`,
        data,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
    },
    onSuccess: (response) => {
      console.log('Student update successful:', response.data);
      
      queryClient.invalidateQueries({ queryKey: ['infiniteStudents'] });
      setEditingId(null);
      setEditData({});
      setHasChanges(false);
    },
    onError: (error) => {
      console.error("Error updating student:", error);
      if (error.response) {
        console.error('Update error response status:', error.response.status);
        console.error('Update error response data:', error.response.data);
      }
    },
  });

  // Process all loaded pages into a flat array of students
  const allStudents = infiniteStudentsData
    ? infiniteStudentsData.pages.flatMap(page => page.data)
    : [];

  // Calculate student statistics
  const totalStudents = allStudents.length;
  const femaleStudents = allStudents.filter(student => 
    student.gender === "female" || student.gender === "f"
  ).length;
  const maleStudents = allStudents.filter(student => 
    student.gender === "male" || student.gender === "m"
  ).length;

  // Search handling
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // When search changes, we'll need to refetch from the beginning
    queryClient.resetQueries(['infiniteStudents']);
  };

  // Sorting
  const requestSort = (key) => {
    let direction = "ascending";

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      direction = null;
    }

    setSortConfig({ key, direction });
    // When sort changes, we'll need to refetch from the beginning
    queryClient.resetQueries(['infiniteStudents']);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return "sort";
    }
    return sortConfig.direction === "ascending" ? "arrow_upward" : "arrow_downward";
  };

  // Edit functionality
  const startEditing = (id) => {
    if (editingId !== null) return; // Prevent editing multiple rows

    const student = allStudents.find((student) => student.id === id);
    if (!student) return;
    
    setEditingId(id);
    setEditData({
      fullName: student.fullName,
      nis: student.nis,
      classroom: student.classroom,
      gender: student.gender,
      iqScore: student.iqScore !== undefined ? student.iqScore : 0
    });
    setHasChanges(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
    setHasChanges(false);
  };

  const saveEditing = (id) => {
    if (!hasChanges) return; // Prevent saving if no changes

    updateStudentMutation.mutate({ 
      id, 
      data: editData 
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  // Determine effective sidebar state for content positioning
  const isSidebarOpen = sidebarExpanded || sidebarHovered;

  // Map screening status to UI components
  const getScreeningStatusUI = (status) => {
    switch (status) {
      case 'at_risk':
        return {
          bgColor: 'bg-red-100',
          icon: <span className="material-icons text-red-500">warning</span>
        };
      case 'monitored':
        return {
          bgColor: 'bg-yellow-100',
          icon: <span className="material-icons text-yellow-500">error</span>
        };
      case 'stable':
      default:
        return {
          bgColor: 'bg-green-100',
          icon: <span className="material-icons text-green-500">check_circle</span>
        };
    }
  };

  // Render helper for loading states
  if (isLoading && !isFetchingNextPage) {
    return (
      <div className="min-h-screen bg-white flex">
        <SchoolSidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} onHoverChange={setSidebarHovered} />
        <div 
          className="w-full min-h-screen transition-all duration-300 ease-in-out pt-[60px] bg-white flex justify-center items-center"
          style={{
            marginLeft: isMobile ? (isSidebarOpen ? "240px" : "0") : (isSidebarOpen ? "240px" : "69px"),
          }}
        >
          <div className="flex flex-col items-center">
            <span className="material-icons animate-spin text-primary text-4xl mb-4">refresh</span>
            <p className="text-primary">Memuat data siswa...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render helper for error states
  if (isError) {
    return (
      <div className="min-h-screen bg-white flex">
        <SchoolSidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} onHoverChange={setSidebarHovered} />
        <div 
          className="w-full min-h-screen transition-all duration-300 ease-in-out pt-[60px] bg-white flex justify-center items-center"
          style={{
            marginLeft: isMobile ? (isSidebarOpen ? "240px" : "0") : (isSidebarOpen ? "240px" : "69px"),
          }}
        >
          <div className="flex flex-col items-center text-center p-6">
            <span className="material-icons text-red-500 text-4xl mb-4">error_outline</span>
            <p className="text-red-500 font-semibold mb-2">Gagal memuat data siswa</p>
            <p className="text-gray-600 mb-4">{error?.message || 'Terjadi kesalahan saat mengambil data.'}</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-variant1"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Defined directly in the page */}
      <div
        className="fixed top-0 right-0 z-50 bg-white h-[60px] flex items-center justify-end px-6 shadow-sm"
        style={{ 
          left: isMobile ? (isSidebarOpen ? "240px" : "0") : (isSidebarOpen ? "240px" : "69px"), 
          transition: "left 0.3s ease" 
        }}
      >
        {isMobile && (
          <button 
            className="absolute left-4" 
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            <span className="material-icons text-[#8b8b8b]">
              {isSidebarOpen ? "close" : "menu"}
            </span>
          </button>
        )}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#8b8b8b] text-sm font-medium">ID / EN</span>
          </div>

          <div className="flex items-center">
            <span className="material-icons text-[#8b8b8b]">notifications</span>
          </div>
          
          {/* User profile info */}
          {userData && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#488BBE] flex items-center justify-center text-white">
                {userData.fullName ? userData.fullName.charAt(0).toUpperCase() : '?'}
              </div>
              <span className="text-sm font-medium hidden md:block">
                {userData.fullName || 'User'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        <SchoolSidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} onHoverChange={setSidebarHovered} />

        <div
          className="w-full min-h-screen transition-all duration-300 ease-in-out pt-[60px] bg-white"
          style={{
            marginLeft: isMobile ? (isSidebarOpen ? "240px" : "0") : (isSidebarOpen ? "240px" : "69px"),
          }}
        >
          <div className="p-4 md:p-10 w-full max-w-[1440px] mx-auto">
            {/* Page Header - Part of the header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
              <h1 className="text-xl md:text-3xl font-bold text-[#488bbe] mb-4 md:mb-0">
                Daftar Siswa
              </h1>

              <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-end">
                {/* Student Stats - Part of the header */}
                <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#3399E9]">groups</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{totalStudents}</div>
                    <div className="text-xs text-[#488BBE]">Siswa</div>
                  </div>
                </div>

                <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#FF86E1]">face_2</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{femaleStudents}</div>
                    <div className="text-xs text-[#488BBE]">Perempuan</div>
                  </div>
                </div>

                <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#FF7173]">face</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{maleStudents}</div>
                    <div className="text-xs text-[#488BBE]">Laki Laki</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter - Part of the header */}
            <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
              <div className="relative flex-grow w-full md:max-w-md">
                <span className="absolute inset-y-0 left-3 flex items-center">
                  <span className="material-icons text-[#8b8b8b]">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Cari Nama atau NIS..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 w-full rounded-full border border-[#d9d9d9] focus:outline-none focus:border-[#488bbe]"
                />
              </div>

              {/* Global Filter Button - No background */}
              <button
                className="flex items-center justify-center px-4 py-2 rounded-full text-[#8b8b8b] hover:bg-[#f7f7f9] transition-colors w-full md:w-auto"
                onClick={() => setShowFilterModal(true)}
              >
                <span className="material-icons mr-2">filter_alt</span>
                <span>Filter</span>
              </button>
            </div>

            {/* Student Table with Fixed Width Columns */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <thead className="bg-[#e8f5ff]">
                    <tr>
                      <th 
                        className="w-[200px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("fullName")}
                      >
                        <div className="flex items-center">
                          NAMA
                          <span className="material-icons text-sm ml-1">{getSortIcon("fullName")}</span>
                        </div>
                      </th>
                      <th 
                        className="w-[120px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider"
                      >
                        KELAS
                      </th>
                      <th className="w-[120px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        JENIS KELAMIN
                      </th>
                      <th 
                        className="w-[120px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("nis")}
                      >
                        <div className="flex items-center">
                          NIS
                          <span className="material-icons text-sm ml-1">{getSortIcon("nis")}</span>
                        </div>
                      </th>
                      <th className="w-[100px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        SKRINING
                      </th>
                      <th className="w-[100px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        KONSELING
                      </th>
                      <th 
                        className="w-[100px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("iqScore")}
                      >
                        <div className="flex items-center justify-center">
                          SKOR IQ
                          <span className="material-icons text-sm ml-1">{getSortIcon("iqScore")}</span>
                        </div>
                      </th>
                      <th className="w-[80px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allStudents.map((student, index) => {
                      // Get status of the current student for UI
                      const screeningStatus = student.screeningStatus || student.screening || 'stable';
                      const screeningUI = getScreeningStatusUI(screeningStatus);
                      const counselingStatus = student.counselingStatus !== undefined ? student.counselingStatus : student.isDoneCounseling;
                      
                      // Check if this is the last element and should be observed
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
                                  <span className="material-icons text-gray-500">person</span>
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
                                    {student.fullName}
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
                              <div className="text-sm text-gray-500">{student.classroom}</div>
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
                                {student.gender === 'male' || student.gender === 'm' ? 'Laki-laki' : 'Perempuan'}
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
                              <div className="text-sm text-gray-500">{student.nis}</div>
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
                            <span className={`${counselingStatus ? "text-green-500" : "text-red-500"}`}>
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
                              <div className="text-sm text-gray-500">{student.iqScore}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {editingId === student.id ? (
                              <div className="flex space-x-2 justify-center">
                                <button
                                  className={`text-[#9BCA61] hover:text-green-700 ${!hasChanges || updateStudentMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                                  onClick={() => hasChanges && saveEditing(student.id)}
                                  disabled={!hasChanges || updateStudentMutation.isPending}
                                  aria-label="Save"
                                >
                                  <span className="material-icons">
                                    {updateStudentMutation.isPending ? "hourglass_empty" : "check_circle"}
                                  </span>
                                </button>
                                <button 
                                  className="text-[#EE4266] hover:text-red-700" 
                                  onClick={cancelEditing} 
                                  disabled={updateStudentMutation.isPending}
                                  aria-label="Cancel"
                                >
                                  <span className="material-icons">
                                    cancel
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <button
                                className={`text-[#8b8b8b] hover:text-[#488bbe] ${editingId !== null ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={() => editingId === null && startEditing(student.id)}
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
                    <span className="material-icons animate-spin text-primary text-xl">refresh</span>
                    <span className="text-primary text-sm">Memuat data tambahan...</span>
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
                  <span className="material-icons text-gray-400 text-5xl mb-4">school</span>
                  <p className="text-gray-500">Tidak ada data siswa yang tersedia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-[#8DD0DEB2] flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-[#488bbe]">Filter</h2>
              <button onClick={() => setShowFilterModal(false)} aria-label="Close filter modal">
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Kelas</option>
                  <option value="10A">10A</option>
                  <option value="10B">10B</option>
                  <option value="10C">10C</option>
                  <option value="11A">11A</option>
                  <option value="11B">11B</option>
                  <option value="11C">11C</option>
                  <option value="12A">12A</option>
                  <option value="12B">12B</option>
                  <option value="12C">12C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="all" className="form-radio" defaultChecked />
                    <span className="ml-2">Semua</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="male" className="form-radio" />
                    <span className="ml-2">Laki-laki</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="female" className="form-radio" />
                    <span className="ml-2">Perempuan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Skrining</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Status</option>
                  <option value="stable">Aman</option>
                  <option value="monitored">Pengawasan</option>
                  <option value="at_risk">Beresiko</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Konseling</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Status</option>
                  <option value="true">Sudah</option>
                  <option value="false">Belum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skor IQ</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-1/2 p-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-1/2 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                className="px-4 py-2 border border-[#488bbe] text-[#488bbe] rounded-full hover:bg-[#e8f5ff]"
                onClick={() => setShowFilterModal(false)}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-[#488bbe] text-white rounded-full hover:bg-[#3399e9]"
                onClick={() => {
                  // Reset queries to apply filters
                  queryClient.resetQueries(['infiniteStudents']);
                  setShowFilterModal(false);
                }}
              >
                Terapkan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentListPage;