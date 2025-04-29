import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import SchoolSidebar from "../../../components/organization/school/SchoolSidebar";

const StudentListPage = () => {
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close sidebar on mobile automatically
      if (mobile) {
        setSidebarExpanded(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch students data
  const { 
    data: studentsData, 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['students', currentPage, pageSize, searchTerm, sortConfig],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Add sorting if applicable
      if (sortConfig.key && sortConfig.direction) {
        params.append('sortBy', sortConfig.key);
        params.append('sortDirection', sortConfig.direction === 'ascending' ? 'asc' : 'desc');
      }

      const response = await axios.get(
        `${API_URL}/organizations/students?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data?.status !== 'success') {
        throw new Error(response.data?.message || 'Failed to fetch students');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  // Student update mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      return axios.patch(
        `${API_URL}/organizations/students/${id}`,
        data,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setEditingId(null);
      setEditData({});
      setHasChanges(false);
    },
    onError: (error) => {
      console.error("Error updating student:", error);
    },
  });

  // Calculate student statistics
  const totalStudents = studentsData?.data?.length || 0;
  const femaleStudents = studentsData?.data?.filter(student => student.gender === "f").length || 0;
  const maleStudents = studentsData?.data?.filter(student => student.gender === "m").length || 0;

  const totalPages = studentsData?.metadata?.totalPage || 1;

  // Pagination controls
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max pages to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);
      
      // Calculate start and end of page numbers to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Add dots if there's a gap after first page
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add pages in the middle
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add dots if there's a gap before last page
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always include last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Search handling
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
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

    const student = studentsData.data.find((student) => student.id === id);
    setEditingId(id);
    setEditData({
      fullName: student.fullName,
      nis: student.nis,
      classroom: student.classroom,
      gender: student.gender,
      iqScore: student.iqScore
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
  if (isLoading) {
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['students'] })}
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
                    {studentsData?.data?.map((student) => {
                      const screeningUI = getScreeningStatusUI(student.screening);
                      
                      return (
                        <tr 
                          key={student.id}
                          className="hover:bg-gradient-to-r from-white via-[#488BBE20] to-white transition-all duration-300"
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
                                <option value="m">Laki-laki</option>
                                <option value="f">Perempuan</option>
                              </select>
                            ) : (
                              <div className="text-sm text-gray-500">
                                {student.gender === 'm' ? 'Laki-laki' : 'Perempuan'}
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
                            <span className={`${student.isDoneCounseling ? "text-green-500" : "text-red-500"}`}>
                              {student.isDoneCounseling ? "Sudah" : "Belum"}
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

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Menampilkan <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> s/d <span className="font-medium">{Math.min(currentPage * pageSize, studentsData?.metadata?.totalData || 0)}</span> dari <span className="font-medium">{studentsData?.metadata?.totalData || 0}</span> siswa
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <span className="material-icons text-[18px]">chevron_left</span>
                      </button>
                      
                      {getPageNumbers().map((pageNumber, index) => (
                        pageNumber === '...' ? (
                          <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        ) : (
                          <button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                              currentPage === pageNumber ? 'bg-[#488BBE] text-white' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      ))}
                      
                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <span className="material-icons text-[18px]">chevron_right</span>
                      </button>
                    </nav>
                  </div>
                </div>
                
                {/* Mobile pagination */}
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1 ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Sebelumnya
                  </button>
                  <div className="text-sm text-gray-700 py-2">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
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
                    <input type="radio" name="gender" value="L" className="form-radio" />
                    <span className="ml-2">Laki-laki</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="P" className="form-radio" />
                    <span className="ml-2">Perempuan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Skrining</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Status</option>
                  <option value="success">Aman</option>
                  <option value="error">Pengawasan</option>
                  <option value="warning">Beresiko</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Konseling</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Status</option>
                  <option value="Sudah">Sudah</option>
                  <option value="Belum">Belum</option>
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
                onClick={() => setShowFilterModal(false)}
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