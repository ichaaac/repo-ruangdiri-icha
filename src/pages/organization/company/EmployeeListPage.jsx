// src/pages/organization/company/EmployeeListPage.jsx
import React, { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import useDebounce from "../../../hooks/useDebounce";
import { useEmployeeData, useUserProfile, useDepartments } from "../../../hooks/useEmployeeData";
import { useEmployeeFilters } from "../../../hooks/useEmployeeFilter";
import EmployeeTable from "../../../components/organization/company/list/EmployeeTable";
import EmployeeFilters from "../../../components/organization/company/list/EmployeeFilters";

const EmployeeListPage = () => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // User profile
  const { data: userData, isLoading: userLoading } = useUserProfile();
  
  // Filters and sorting
  const {
    searchInput,
    setSearchInput,
    sortConfigInput,
    appliedSortConfig,
    requestSort,
    getSortIcon,
    filtersInput,
    appliedFilters,
    handleFilterSelect,
    applyFilters,
    clearFilters,
    hasActiveFilters
  } = useEmployeeFilters();
  
  // Debounced search with useEffect version
  const debouncedSearchTerm = useDebounce(searchInput, 500);
  
  // Departments data
  const { data: departmentsData } = useDepartments();
  
  // Process department data
  const { departments, positions } = useMemo(() => {
    if (!departmentsData || departmentsData.length === 0) {
      return {
        departments: ["Human Resources", "Finance", "Marketing"],
        positions: ["Head", "Lead", "Manager", "Staff"]
      };
    }

    const uniqueDepartments = new Set();
    const uniquePositions = new Set();

    departmentsData.forEach(item => {
      if (item.department) uniqueDepartments.add(item.department);
      if (item.positions && Array.isArray(item.positions)) {
        item.positions.forEach(position => uniquePositions.add(position));
      }
    });

    return {
      departments: Array.from(uniqueDepartments),
      positions: Array.from(uniquePositions)
    };
  }, [departmentsData]);
  
  // Employee data
  const {
    employees,
    totalData,
    genderCounts,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
    updateEmployee
  } = useEmployeeData(debouncedSearchTerm, appliedSortConfig, appliedFilters);

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
      {/* Header with ID/EN switch */}
      <div className="flex items-center justify-end px-6 pt-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#8b8b8b] text-sm font-medium">ID / EN</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-[#8b8b8b]">notifications</span>
          </div>
        </div>
      </div>

      {/* Population boxes - moved 44px below the ID/EN switch */}
      <div className="flex justify-end px-6 mt-[44px]">
        <div className="flex flex-wrap gap-3">
          {/* Total Employees */}
          <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px]">
            <div  className="absolute inset-0 rounded-lg p-[1px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-3">
                <span className="material-icons text-[#3399E9] text-lg">groups</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{totalData}</div>
                  <div className="text-xs text-[#488BBE]">Karyawan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Female Employees */}
          <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-3">
                <span className="material-icons text-[#FF86E1] text-lg">face_2</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{genderCounts.female}</div>
                  <div className="text-xs text-[#488BBE]">Perempuan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Male Employees */}
          <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-3">
                <span className="material-icons text-[#FF7173] text-lg">face</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{genderCounts.male}</div>
                  <div className="text-xs text-[#488BBE]">Laki Laki</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 md:px-8 pb-8 mt-8">
        {/* User greeting */}
      <div className="mb-[36px]">
          <h1 className="text-xl md:text-3xl font-extrabold text-[#488BBE]">
            Halo, {userData?.fullName || 'Pengguna'}
          </h1>
        </div>

        {/* Search and Filter Row */}
        <div className="flex flex-wrap items-center gap-4 mb-[21px]">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center">
              <span className="material-icons text-[#8b8b8b]">search</span>
            </span>
            <input
              type="text"
              placeholder="Cari Nama atau ID Karyawan..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
        <EmployeeTable
          employees={employees}
          searchInput={searchInput}
          getSortIcon={getSortIcon}
          requestSort={requestSort}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          updateEmployee={updateEmployee}
          departmentOptions={departments}
          positionOptions={positions}
        />
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <EmployeeFilters
            showModal={showFilterModal}
            setShowModal={setShowFilterModal}
            filtersInput={filtersInput}
            handleFilterSelect={handleFilterSelect}
            applyFilters={applyFilters}
            departmentOptions={departments}
            positionOptions={positions}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default EmployeeListPage;