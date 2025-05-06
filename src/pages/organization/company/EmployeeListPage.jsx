import React, { useState, useRef, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../../../lib/api";
import api from "../../../lib/api";
import useDebounce from "../../../hooks/useDebounce";

const EmployeeListPage = () => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [sortConfigInput, setSortConfigInput] = useState({ key: null, direction: null });
  const debouncedSearchTerm = useDebounce(searchInput, 500);
  const [appliedSortConfig, setAppliedSortConfig] = useState({ key: null, direction: null });
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const observerRef = useRef(null);
  const helpIconRef = useRef(null);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  // Filter states
  const [filtersInput, setFiltersInput] = useState({
    department: null,
    position: null,
    gender: null,
    screeningStatus: null,
    counselingStatus: null
  });
  
  const [appliedFilters, setAppliedFilters] = useState({
    department: null,
    position: null,
    gender: null,
    screeningStatus: null,
    counselingStatus: null
  });

  // Get user profile data
  const { 
    data: userData,
    isLoading: userLoading
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/users/me");
        const userData = response?.data?.data;
        return userData || { fullName: "Pengguna" };
      } catch (error) {
        console.error('User profile API error:', error);
        return { fullName: "Pengguna" };
      }
    },
    staleTime: 1000 * 60 * 5
  });

  // Fetch total employee counts for the accurate totals display
  const { 
    data: totalCounts
  } = useQuery({
    queryKey: ['totalEmployeeCounts'],
    queryFn: async () => {
      try {
        // Get the total count from metadata to show accurate totals
        const response = await apiClient.get("/organizations/employees", { 
          params: { 
            page: 1,
            limit: 1
          } 
        });
        
        return {
          total: response.data?.metadata?.totalData || 0,
          female: response.data?.metadata?.femaleCount || 0,
          male: response.data?.metadata?.maleCount || 0
        };
      } catch (error) {
        console.error('Employee counts API error:', error);
        return { total: 0, female: 0, male: 0 };
      }
    },
    staleTime: 1000 * 60 * 5
  });

  // Fetch available departments and positions for filtering
  const { 
    data: departmentsData 
  } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        // This endpoint might need to be updated based on your API structure
        const response = await apiClient.get("/organizations/departments");
        return response.data?.data || [];
      } catch (error) {
        console.error('Departments API error:', error);
        // Fallback data in case the API isn't implemented yet
        return [
          { department: "IT", positions: ["Developer", "Designer", "Manager"] },
          { department: "Marketing", positions: ["Specialist", "Manager", "Coordinator"] },
          { department: "Finance", positions: ["Accountant", "Manager", "Analyst"] },
          { department: "Creative", positions: ["Designer", "Writer", "Director"] },
          { department: "HR", positions: ["Specialist", "Manager", "Recruiter"] }
        ];
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Process department data to get unique departments and positions
  const uniqueDepartmentData = React.useMemo(() => {
    if (!departmentsData || departmentsData.length === 0) {
      return {
        departments: ["Human Resources", "Finance", "Marketing", "Operations", "Information Technology", "Product Development", "Legal"],
        positions: ["Head", "Lead", "Manager", "Staff"]
      };
    }

    const uniqueDepartments = new Set();
    const uniquePositions = new Set();

    departmentsData.forEach(item => {
      if (item.department) {
        uniqueDepartments.add(item.department);
      }
      
      if (item.positions && Array.isArray(item.positions)) {
        item.positions.forEach(position => uniquePositions.add(position));
      }
    });

    return {
      departments: Array.from(uniqueDepartments),
      positions: Array.from(uniquePositions)
    };
  }, [departmentsData]);

  // Helper function to build filter params
  const buildFilterParams = () => {
    const params = {
      page: 1,
      limit: 10
    };

    if (debouncedSearchTerm) {
      params.search = debouncedSearchTerm;
    }

    if (appliedSortConfig.key && appliedSortConfig.direction) {
      params.sortBy = appliedSortConfig.key === "fullName" ? "name" : appliedSortConfig.key;
      params.sortOrder = appliedSortConfig.direction === 'ascending' ? 'asc' : 'desc';
    }

    if (appliedFilters.department) {
      params.department = appliedFilters.department;
    }

    if (appliedFilters.position) {
      params.position = appliedFilters.position;
    }

    if (appliedFilters.gender) {
      params.gender = appliedFilters.gender === 'L' ? 'male' : 'female';
    }

    if (appliedFilters.screeningStatus) {
      params.screening = appliedFilters.screeningStatus;
    }

    if (appliedFilters.counselingStatus !== null) {
      params.hasCounseled = appliedFilters.counselingStatus ? '1' : '0';
    }

    return params;
  };

  // Fetch employees data with infinite query
  const { 
    data: infiniteEmployeesData, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['infiniteEmployees', debouncedSearchTerm, appliedSortConfig, appliedFilters],
    queryFn: async ({ pageParam = 1 }) => {
      // Build query parameters
      const params = { ...buildFilterParams(), page: pageParam };

      try {
        const response = await apiClient.get(
          `/organizations/employees`, 
          { params }
        );
        
        const employeesData = response.data?.data?.employees || [];
        const metadata = response.data?.metadata || {
          totalPage: 1,
          totalData: 0,
          page: pageParam,
          limit: 10,
          hasNextPage: false
        };
        
        return {
          data: employeesData,
          metadata: metadata,
          pageParam
        };
      } catch (error) {
        console.error('Employees API error details:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.metadata.page;
      const totalPages = lastPage.metadata.totalPage;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: 1000 * 60 * 2
  });

  // Setup intersection observer for infinite scrolling with adjusted threshold
  const lastEmployeeElementRef = useCallback(node => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    if (isFetchingNextPage || !hasNextPage) return;
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px 100px 0px'
    });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Employee update mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Convert edit data to match the expected API structure
      const apiData = {
        fullName: data.fullName,
        profile: {
          employeeId: data.employeeId,
          department: data.department,
          position: data.position,
          gender: data.gender,
          age: parseInt(data.age) || 30,
          yearsOfService: parseInt(data.workDuration) || 2
        }
      };
      
      console.log("Sending update data:", apiData);
      
      return apiClient.patch(
        `/organizations/employees/${id}`,
        apiData
      );
    },
    onSuccess: (response) => {
      console.log("Update successful:", response);
      queryClient.invalidateQueries({ queryKey: ['infiniteEmployees'] });
      setEditingId(null);
      setEditData({});
      setHasChanges(false);
    },
    onError: (error) => {
      console.error("Error updating employee:", error.response?.data || error);
    },
  });

  // Process all loaded pages into a flat array of employees
  const allEmployees = infiniteEmployeesData
    ? infiniteEmployeesData.pages.flatMap(page => page.data)
    : [];

  // Employee counts display - calculate gender from loaded employees
  const employeeCounts = {
    // Use the total count from the API metadata for accurate totals
    total: totalCounts?.total || 0,
    
    // Calculate gender counts from the loaded employees data to match the list
    female: allEmployees.filter(employee => 
      employee.gender === "female" || employee.gender === "f"
    ).length,
    
    male: allEmployees.filter(employee => 
      employee.gender === "male" || employee.gender === "m"
    ).length
  };

  // Search handling
  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  // Sorting
  const requestSort = (key) => {
    let direction = "ascending";

    if (sortConfigInput.key === key && sortConfigInput.direction === "ascending") {
      direction = "descending";
    } else if (sortConfigInput.key === key && sortConfigInput.direction === "descending") {
      direction = null;
    }

    setSortConfigInput({ key, direction });
    setAppliedSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfigInput.key !== key) {
      return "sort";
    }
    return sortConfigInput.direction === "ascending" ? "arrow_upward" : "arrow_downward";
  };

  // Filter functions
  const handleFilterSelect = (filterType, value) => {
    // Toggle logic - if clicking the same value, unset it
    if (filtersInput[filterType] === value) {
      setFiltersInput(prev => ({ ...prev, [filterType]: null }));
    } else {
      setFiltersInput(prev => ({ ...prev, [filterType]: value }));
    }
  };

  // Apply filters
  const applyFilters = () => {
    setAppliedFilters(filtersInput);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    const resetFilters = {
      department: null,
      position: null,
      gender: null,
      screeningStatus: null,
      counselingStatus: null
    };
    
    setFiltersInput(resetFilters);
    setAppliedFilters(resetFilters);
  };

  // Edit functionality
  const startEditing = (id) => {
    if (editingId !== null) return;

    const employee = allEmployees.find((employee) => employee.id === id);
    if (!employee) return;
    
    setEditingId(id);
    setEditData({
      fullName: employee.fullName,
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.position,
      gender: employee.gender,
      age: employee.age || 0
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
    updateEmployeeMutation.mutate({ id, data: editData });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

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

  // Highlight search text
  const highlightText = (text) => {
    if (!searchInput || !text) return <span>{text}</span>;
    
    const parts = text.split(new RegExp(`(${searchInput})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) => 
          part.toLowerCase() === searchInput.toLowerCase() ? 
            <span key={index} className="font-bold bg-yellow-200">{part}</span> : 
            <span key={index}>{part}</span>
        )}
      </span>
    );
  };

  // Check if any filters are active
  const hasActiveFilters = appliedFilters.department || appliedFilters.position || 
                         appliedFilters.gender || appliedFilters.screeningStatus !== null || 
                         appliedFilters.counselingStatus !== null;

  // Render loading state
  if (isLoading && !isFetchingNextPage) {
    return (
      <div className="flex justify-center items-center h-full min-h-[80vh]">
        <div className="flex flex-col items-center">
          <span className="material-icons animate-spin text-[#488bbe] text-4xl mb-4">refresh</span>
          <p className="text-[#488bbe]">Memuat data karyawan...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="flex justify-center items-center h-full min-h-[80vh]">
        <div className="flex flex-col items-center text-center p-6">
          <span className="material-icons text-red-500 text-4xl mb-4">error_outline</span>
          <p className="text-red-500 font-semibold mb-2">Gagal memuat data karyawan</p>
          <p className="text-gray-600 mb-4">{error?.message || 'Terjadi kesalahan saat mengambil data.'}</p>
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
              Halo, {userData?.fullName || 'Pengguna'}
            </h1>
          </div>

          {/* Employee Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
              <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
              <div className="z-10 flex items-center w-full pl-3">
                <span className="material-icons text-[#3399E9] text-lg">groups</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{employeeCounts.total}</div>
                  <div className="text-xs text-[#488BBE]">Karyawan</div>
                </div>
              </div>
            </div>

            <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
              <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
              <div className="z-10 flex items-center w-full pl-3">
                <span className="material-icons text-[#FF86E1] text-lg">face_2</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{employeeCounts.female}</div>
                  <div className="text-xs text-[#488BBE]">Perempuan</div>
                </div>
              </div>
            </div>

            <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
              <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
              <div className="z-10 flex items-center w-full pl-3">
                <span className="material-icons text-[#FF7173] text-lg">face</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{employeeCounts.male}</div>
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
              type="text"
              placeholder="Cari Nama atau ID Karyawan..."
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

        {/* Employee Table */}
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
                      <span className="material-icons text-sm ml-1">{getSortIcon("fullName")}</span>
                    </div>
                  </th>
                  <th 
                    className="w-[120px] px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      DEPARTEMEN
                    </div>
                  </th>
                  <th className="w-[120px] px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider">
                    JABATAN
                  </th>
                  <th className="w-[120px] px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider">
                    JENIS KELAMIN
                  </th>
                  <th 
                    className="w-[100px] px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("age")}
                  >
                    <div className="flex items-center justify-center">
                      USIA
                      <span className="material-icons text-sm ml-1">{getSortIcon("age")}</span>
                    </div>
                  </th>
                  <th 
                    className="w-[120px] px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("workDuration")}
                  >
                    <div className="flex items-center justify-center">
                      LAMA BEKERJA
                      <span className="material-icons text-sm ml-1">{getSortIcon("workDuration")}</span>
                    </div>
                  </th>
                  <th className="w-[100px] px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider">
                    <div className="flex items-center justify-center relative group">
                      SKRINING
                      <span 
                        className="material-icons text-sm ml-1 text-gray-400 cursor-help" 
                        ref={helpIconRef}
                        onMouseEnter={() => setShowHelpTooltip(true)}
                        onMouseLeave={() => {
                          // Add delay before hiding tooltip
                          setTimeout(() => {
                            setShowHelpTooltip(false);
                          }, 300);
                        }}
                      >
                        help_outline
                      </span>
                      
                      {/* Tooltip with improved positioning and animation */}
                      <AnimatePresence>
                        {showHelpTooltip && (
                          <motion.div 
                            className="fixed bg-[#00000099] text-white text-xs rounded-md p-2.5 shadow-lg z-[1000]"
                            style={{ 
                              width: "150px",
                              top: helpIconRef.current ? helpIconRef.current.getBoundingClientRect().top - 80 : 0,
                              left: helpIconRef.current ? helpIconRef.current.getBoundingClientRect().left + 20 : 0,
                            }}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-center">
                                <span className="material-icons text-red-500 text-sm mr-1.5">warning</span>
                                <span>Berisiko</span>
                              </div>
                              <div className="flex items-center">
                                <span className="material-icons text-yellow-500 text-sm mr-1.5">error</span>
                                <span>Pengawasan</span>
                              </div>
                              <div className="flex items-center">
                                <span className="material-icons text-green-500 text-sm mr-1.5">check_circle</span>
                                <span>Stabil</span>
                              </div>
                              <div className="flex items-center">
                                <span className="material-icons text-gray-400 text-sm mr-1.5">remove</span>
                                <span style={{ whiteSpace: 'nowrap' }}>Belum Skrining</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </th>
                  <th className="w-[100px] px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider">
                    KONSELING
                  </th>
                  <th className="w-[80px] px-6 py-3 text-center">
                    {/* No text for action header, just empty space for edit buttons */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allEmployees.map((employee, index) => {
                  const screeningStatus = employee.screeningStatus || employee.screening || 'stable';
                  const screeningUI = getScreeningStatusUI(screeningStatus);
                  const counselingStatus = employee.counselingStatus !== undefined ? employee.counselingStatus : employee.isDoneCounseling;
                  const isLastElement = index === allEmployees.length - 1;
                  // Calculate work duration in years or months
                  const workDuration = employee.workDuration || "2 Tahun";
                  
                  return (
                    <tr 
                      key={employee.id}
                      className="hover:bg-gradient-to-r from-white via-[#488BBE20] to-white transition-all duration-300"
                      ref={isLastElement ? lastEmployeeElementRef : null}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="material-icons text-gray-500">person</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            {editingId === employee.id ? (
                              <input
                                type="text"
                                name="fullName"
                                value={editData.fullName}
                                onChange={handleEditChange}
                                className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-900">
                                {highlightText(employee.fullName)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === employee.id ? (
                          <select
                            name="department"
                            value={editData.department}
                            onChange={handleEditChange}
                            className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                          >
                            {uniqueDepartmentData.departments.map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-500">{employee.department}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === employee.id ? (
                          <select
                            name="position"
                            value={editData.position}
                            onChange={handleEditChange}
                            className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                          >
                            {uniqueDepartmentData.positions.map((pos) => (
                              <option key={pos} value={pos}>{pos}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-500">{employee.position}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === employee.id ? (
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
                            {employee.gender === 'male' || employee.gender === 'm' ? 'Laki-laki' : 'Perempuan'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {editingId === employee.id ? (
                          <input
                            type="number"
                            name="age"
                            value={editData.age}
                            onChange={handleEditChange}
                            className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-16 mx-auto"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">{employee.age || "36"}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {editingId === employee.id ? (
                          <input
                            type="text"
                            name="workDuration"
                            value={editData.workDuration || workDuration}
                            onChange={handleEditChange}
                            className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">
                            {workDuration}
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
                        <span className={`${counselingStatus ? "text-green-500" : "text-red-500"}`}>
                          {counselingStatus ? "Sudah" : "Belum"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {editingId === employee.id ? (
                          <div className="flex space-x-2 justify-center">
                            <button
                              className={`text-[#9BCA61] hover:text-green-700 ${!hasChanges || updateEmployeeMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                              onClick={() => hasChanges && saveEditing(employee.id)}
                              disabled={!hasChanges || updateEmployeeMutation.isPending}
                              aria-label="Save"
                            >
                              <span className="material-icons">
                                {updateEmployeeMutation.isPending ? "hourglass_empty" : "check_circle"}
                              </span>
                            </button>
                            <button 
                              className="text-[#EE4266] hover:text-red-700" 
                              onClick={cancelEditing} 
                              disabled={updateEmployeeMutation.isPending}
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
                            onClick={() => editingId === null && startEditing(employee.id)}
                            disabled={editingId !== null}
                            aria-label="Edit employee"
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
                <span className="material-icons animate-spin text-[#488bbe] text-xl">refresh</span>
                <span className="text-[#488bbe] text-sm">Memuat data tambahan...</span>
              </div>
            </div>
          )}
          
          {/* Infinite Scroll End Message */}
          {!hasNextPage && allEmployees.length > 0 && (
            <div className="py-4 text-center text-gray-500 text-sm">
              Semua data karyawan telah dimuat
            </div>
          )}
          
          {/* Empty State */}
          {allEmployees.length === 0 && !isLoading && (
            <div className="py-16 text-center">
              <span className="material-icons text-gray-400 text-5xl mb-4">business_center</span>
              <p className="text-gray-500">Tidak ada data karyawan yang tersedia</p>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal - Updated as per design */}
      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 bg-[#55555580] flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white rounded-xl shadow-lg w-[655px] max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="p-6 flex flex-col max-h-[90vh]">
                <div className="flex flex-col justify-start items-start gap-6 overflow-y-auto">
                  <div className="inline-flex justify-between items-center w-full">
                    <div className="text-[#488bbe] text-xl font-semibold">Filter</div>
                    <button 
                      onClick={() => setShowFilterModal(false)}
                      className="text-[#488bbe] hover:text-[#3399e9]"
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-col justify-start items-start gap-6 w-full">
                    {/* Department Selection */}
                    <div className="w-full flex flex-col justify-start items-start gap-3">
                      <div className="text-[#488bbe] text-sm font-normal">Departemen</div>
                      <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                        {uniqueDepartmentData.departments.map((dept) => (
                          <button
                            key={dept}
                            className={`h-7 px-2.5 py-1 ${filtersInput.department === dept ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                            onClick={() => handleFilterSelect('department', dept)}
                          >
                            <div className="text-center text-xs font-normal">{dept}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Position Selection */}
                    <div className="w-full flex flex-col justify-start items-start gap-3">
                      <div className="text-[#488bbe] text-sm font-normal">Jabatan</div>
                      <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                        {uniqueDepartmentData.positions.map((pos) => (
                          <button
                            key={pos}
                            className={`h-7 px-2.5 py-1 ${filtersInput.position === pos ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                            onClick={() => handleFilterSelect('position', pos)}
                          >
                            <div className="text-center text-xs font-normal">{pos}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Gender, Screening and Counseling - Displayed in a row */}
                    <div className="flex justify-start items-start gap-8 flex-wrap">
                      {/* Gender Selection */}
                      <div className="flex flex-col justify-start items-start gap-3">
                        <div className="text-[#488bbe] text-sm font-normal">Jenis Kelamin</div>
                        <div className="inline-flex justify-start items-center gap-2">
                          <button
                            className={`h-8 px-3 py-2 ${filtersInput.gender === 'L' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                            onClick={() => handleFilterSelect('gender', 'L')}
                          >
                            <div className="text-xs font-normal">L</div>
                          </button>
                          <button
                            className={`h-8 px-3 py-2 ${filtersInput.gender === 'P' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                            onClick={() => handleFilterSelect('gender', 'P')}
                          >
                            <div className="text-xs font-normal">P</div>
                          </button>
                        </div>
                      </div>
                      
                      {/* Screening Selection */}
                      <div className="flex flex-col justify-start items-start gap-3">
                        <div className="text-[#488bbe] text-sm font-normal">Skrining</div>
                        <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                          <button
                            className={`h-8 px-3 py-2 ${filtersInput.screeningStatus === 'at_risk' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-start items-center transition-colors`}
                            onClick={() => handleFilterSelect('screeningStatus', 'at_risk')}
                          >
                            <div className="text-xs font-normal">Berisiko</div>
                          </button>
                          <button
                            className={`h-8 px-3 py-2 ${filtersInput.screeningStatus === 'monitored' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                            onClick={() => handleFilterSelect('screeningStatus', 'monitored')}
                          >
                            <div className="text-xs font-normal">Pengawasan</div>
                          </button>
                          <button
                            className={`h-8 px-3 py-2 ${filtersInput.screeningStatus === 'stable' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                            onClick={() => handleFilterSelect('screeningStatus', 'stable')}
                          >
                            <div className="text-xs font-normal">Stabil</div>
                          </button>
                        </div>
                      </div>
                      
                      {/* Counseling Selection */}
                      <div className="flex flex-col justify-start items-start gap-3">
                        <div className="text-[#488bbe] text-sm font-normal">Konseling</div>
                        <div className="inline-flex justify-start items-center gap-2">
                          <button
                            className={`h-8 px-3 py-2 ${filtersInput.counselingStatus === true ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-start items-center transition-colors`}
                            onClick={() => handleFilterSelect('counselingStatus', true)}
                          >
                            <div className="text-xs font-normal">Sudah</div>
                          </button>
                          <button
                            className={`h-8 px-3 py-2 ${filtersInput.counselingStatus === false ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-start items-center transition-colors`}
                            onClick={() => handleFilterSelect('counselingStatus', false)}
                          >
                            <div className="text-xs font-normal">Belum</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Save Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    className="w-full h-[42px] px-7 py-2.5 bg-[#488bbe] rounded-full flex justify-center items-center"
                    onClick={applyFilters}
                  >
                    <div className="text-white text-sm font-semibold">Simpan</div>
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

export default EmployeeListPage;