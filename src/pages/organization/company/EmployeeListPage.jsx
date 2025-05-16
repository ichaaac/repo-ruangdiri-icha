// src/pages/organization/company/EmployeeListPage.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import useDebounce from "../../../hooks/useDebounce";
import { useEmployeeData, useUserProfile, useDepartments } from "../../../hooks/useEmployeeData";
import { useEmployeeFilters } from "../../../hooks/useEmployeeFilter";
import EmployeeTable from "../../../components/organization/company/list/EmployeeTable";
import EmployeeFilters from "../../../components/organization/company/list/EmployeeFilters";

const EmployeeListPage = () => {
  const { data: userData } = useUserProfile();
  const resetEditModeRef = useRef(null);
  const [filtersChanged, setFiltersChanged] = useState(false);
  
  const {
    searchInput,
    setSearchInput,
    appliedSortConfig,
    requestSort,
    getSortIcon,
    filtersInput,
    setFiltersInput,
    appliedFilters,
    handleFilterSelect,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    showFilterModal,
    setShowFilterModal
  } = useEmployeeFilters();
  
  const debouncedSearchTerm = useDebounce(searchInput, 10);
  
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
  
  const { data: departmentsData } = useDepartments();

  // Reset filters tracking effect
  useEffect(() => {
    // Reset the flag after it's been consumed
    if (filtersChanged) {
      setTimeout(() => setFiltersChanged(false), 100);
    }
  }, [filtersChanged]);
  
  // Enhanced clearFilters function
  const handleClearFilters = () => {
    // Cancel edit mode before clearing filters
    if (resetEditModeRef.current) {
      resetEditModeRef.current();
    }
    
    // Clear the filters
    clearFilters();
    
    // Set flag to notify table component
    setFiltersChanged(true);
  };
  
  // Enhanced apply filters function
  const handleApplyFilters = () => {
    // Cancel edit mode before applying filters
    if (resetEditModeRef.current) {
      resetEditModeRef.current();
    }
    
    // Apply the filters
    applyFilters();
    
    // Set flag to notify table component
    setFiltersChanged(true);
  };
  
  const { departments, positions } = useMemo(() => {
    if (departmentsData) {
      return {
        departments: departmentsData.departments || [],
        positions: departmentsData.positions || []
      };
    }
    
    const uniqueDepts = new Set();
    const allPositions = new Set();
    
    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        if (emp.department) uniqueDepts.add(emp.department);
        if (emp.position) allPositions.add(emp.position);
      });
    }
    
    return {
      departments: Array.from(uniqueDepts).sort(),
      positions: Array.from(allPositions).sort()
    };
  }, [departmentsData, employees]);

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

      <div className="flex items-start justify-between px-6 mt-[44px]">
        <div className="mt-2">
          <h1 className="text-xl md:text-3xl font-extrabold text-[#488BBE]">
            Halo, {userData?.fullName || 'Pengguna'}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-[98px] h-[60px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-3">
                <span className="material-icons text-[#3399E9] text-lg pb-4">groups</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{totalData}</div>
                  <div className="text-xs text-[#488BBE]">Karyawan</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-[98px] h-[60px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-3">
                <span className="material-icons text-[#FF86E1] text-lg pb-4">face_2</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{genderCounts.female}</div>
                  <div className="text-xs text-[#488BBE]">Perempuan</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-[98px] h-[60px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-3">
                <span className="material-icons text-[#FF7173] text-lg pb-4">face</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{genderCounts.male}</div>
                  <div className="text-xs text-[#488BBE]">Laki Laki</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 mt-8">
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
                onClick={handleClearFilters}
              >
                <span className="material-icons mr-1 text-sm">close</span>
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        <div className="relative" style={{ zIndex: 1 }}>
          <EmployeeTable
            employees={employees || []}
            searchInput={debouncedSearchTerm}
            getSortIcon={getSortIcon}
            requestSort={requestSort}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            updateEmployee={updateEmployee}
            departmentOptions={departments}
            positionOptions={positions}
            resetEditMode={resetEditModeRef}
            filtersChanged={filtersChanged}
          />
        </div>
      </div>

      <AnimatePresence>
        {showFilterModal && (
          <EmployeeFilters
            showModal={showFilterModal}
            setShowModal={setShowFilterModal}
            filtersInput={filtersInput}
            setFiltersInput={setFiltersInput}
            handleFilterSelect={handleFilterSelect}
            applyFilters={handleApplyFilters}
            departments={departments}
            positions={positions}
            employees={employees}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default EmployeeListPage;