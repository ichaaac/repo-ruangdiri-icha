// src/components/shared/ListPage.jsx - Fixed to match existing hooks
import React, { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import useDebounce from "@/hooks/useDebounce";

/**
 * Reusable List Page Component - Adapted to work with existing hooks
 * @param {Object} props
 * @param {string} props.type - "student" or "employee"
 * @param {string} props.title - Page title (e.g., "Halo, [Name]")
 * @param {string} props.searchPlaceholder - Search input placeholder
 * @param {Object} props.statsConfig - Configuration for stats cards
 * @param {Function} props.useDataHook - Custom hook for fetching data
 * @param {Function} props.useFiltersHook - Custom hook for managing filters
 * @param {Function} props.useOptionsHook - Custom hook for getting filter options
 * @param {React.Component} props.TableComponent - Table component to render
 * @param {React.Component} props.FiltersComponent - Filters modal component
 * @param {Object} props.icons - Icons configuration for stats
 */
const ListPage = ({
  type = "student",
  title,
  searchPlaceholder,
  statsConfig,
  useDataHook,
  useFiltersHook, 
  useOptionsHook,
  TableComponent,
  FiltersComponent,
  icons = {}
}) => {
  const { user } = useAuth();
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
  } = useFiltersHook();
  
  const debouncedSearchTerm = useDebounce(searchInput, 150);
  
  
  // Call the data hook - this returns different properties based on type
  const hookResult = useDataHook(debouncedSearchTerm, appliedSortConfig, appliedFilters);
  
  
  // Extract data based on hook structure - adapt to your existing hooks
  let listData, totalData, genderCounts, updateFunction;
  
  if (type === "student") {
    // For student hook that returns { students, totalData, genderCounts, updateStudent, ... }
    listData = hookResult.students || [];
    totalData = hookResult.totalData || 0;
    genderCounts = hookResult.genderCounts || { male: 0, female: 0 };
    updateFunction = hookResult.updateStudent;
  } else {
    // For employee hook that might return { data, totalData, genderCounts, updateItem, ... }
    listData = hookResult.data || hookResult.employees || [];
    totalData = hookResult.totalData || 0;
    genderCounts = hookResult.genderCounts || { male: 0, female: 0 };
    updateFunction = hookResult.updateItem || hookResult.updateEmployee;
  }
  
  const {
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch
  } = hookResult;
  

  
  const { data: optionsData } = useOptionsHook ? useOptionsHook() : { data: null };

  // Reset filters tracking effect
  useEffect(() => {
    if (filtersChanged) {
      setTimeout(() => setFiltersChanged(false), 100);
    }
  }, [filtersChanged]);
  
  // Enhanced clearFilters function
  const handleClearFilters = () => {
    if (resetEditModeRef.current) {
      resetEditModeRef.current();
    }
    clearFilters();
    setFiltersChanged(true);
  };
  
  // Enhanced apply filters function
  const handleApplyFilters = () => {
    if (resetEditModeRef.current) {
      resetEditModeRef.current();
    }
    applyFilters();
    setFiltersChanged(true);
  };
  
  // Process options data based on type
  const optionsForFilters = useMemo(() => {
    if (type === "employee" && optionsData) {
      return {
        departments: optionsData.departments || [],
        positions: optionsData.positions || []
      };
    } else if (type === "student" && optionsData) {
      // Adapt to your classrooms hook structure
      return {
        classrooms: optionsData.classroomsResult || optionsData.classNumbers || [],
        grades: optionsData.gradesResult || ['A', 'B', 'C', 'D']
      };
    }
    
    // Fallback to extracting from data
    const uniqueOptions = { departments: new Set(), positions: new Set(), classrooms: new Set(), grades: new Set() };
    
    if (listData && listData.length > 0) {
      listData.forEach(item => {
        if (type === "employee") {
          if (item.department) uniqueOptions.departments.add(item.department);
          if (item.position) uniqueOptions.positions.add(item.position);
        } else if (type === "student") {
          if (item.classroom) uniqueOptions.classrooms.add(item.classroom);
          if (item.grade) uniqueOptions.grades.add(item.grade);
        }
      });
    }
    
    return {
      departments: Array.from(uniqueOptions.departments).sort(),
      positions: Array.from(uniqueOptions.positions).sort(),
      classrooms: Array.from(uniqueOptions.classrooms).sort(),
      grades: Array.from(uniqueOptions.grades).sort()
    };
  }, [optionsData, listData, type]);

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full min-h-[80vh] p-4">
        <div className="flex flex-col items-center text-center p-6 max-w-md">
          <span className="material-icons text-red-500 text-4xl mb-4">error_outline</span>
          <p className="text-red-500 font-semibold mb-2">Gagal memuat data {type === "student" ? "siswa" : "karyawan"}</p>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">{error?.message || 'Terjadi kesalahan saat mengambil data.'}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#488bbe] text-white rounded-full hover:bg-[#3399e9] text-sm sm:text-base"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }


  return (
    <>
      {/* Top bar with language and notifications */}
      <div className="flex items-center justify-end px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#8b8b8b] text-xs sm:text-sm font-medium">ID / EN</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-[#8b8b8b] text-lg sm:text-xl">notifications</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start justify-between px-4 sm:px-6 mt-8 sm:mt-[44px] gap-4">
        <div className="mt-2 w-full lg:w-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words">
            {title || `Halo, ${user?.fullName || ""}`}
          </h1>
        </div>

        {/* Stats cards */}
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
          {/* Total card */}
          <div className="relative w-[90px] sm:w-[100px] md:w-[120px] h-[60px] sm:h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] sm:h-[60px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
                <span className="material-icons text-[#3399E9] text-base sm:text-lg pb-3 sm:pb-4">{icons.total || "groups"}</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#488BBE]">{totalData || 0}</div>
                  <div className="text-[10px] sm:text-xs text-[#488BBE]">{statsConfig?.totalLabel || "Total"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Female card */}
          <div className="relative w-[90px] sm:w-[100px] md:w-[120px] h-[60px] sm:h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] sm:h-[60px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
                <span className="material-icons text-[#FF86E1] text-base sm:text-lg pb-3 sm:pb-4">{icons.female || "face_2"}</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#488BBE]">{genderCounts?.female || 0}</div>
                  <div className="text-[10px] sm:text-xs text-[#488BBE]">Perempuan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Male card */}
          <div className="relative w-[90px] sm:w-[100px] md:w-[120px] h-[60px] sm:h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] sm:h-[60px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
                <span className="material-icons text-[#FF7173] text-base sm:text-lg pb-3 sm:pb-4">{icons.male || "face"}</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#488BBE]">{genderCounts?.male || 0}</div>
                  <div className="text-[10px] sm:text-xs text-[#488BBE]">Laki-laki</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filter section */}
      <div className="px-4 sm:px-6 md:px-8 pb-8 mt-6 sm:mt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-[21px]">
          {/* Search input */}
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center">
              <span className="material-icons text-[#8b8b8b] text-lg sm:text-xl">search</span>
            </span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-full border border-[#d9d9d9] focus:outline-none focus:border-[#488bbe] text-sm sm:text-base"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              className="flex items-center justify-center px-3 sm:px-4 py-2 rounded-full text-[#8b8b8b] hover:bg-[#f7f7f9] transition-colors text-sm sm:text-base flex-1 sm:flex-none"
              onClick={() => setShowFilterModal(true)}
            >
              <span className="material-icons mr-1 sm:mr-2 text-base sm:text-lg">filter_alt</span>
              <span>Filter</span>
            </button>
            
            <button 
              className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-full ${
                hasActiveFilters 
                  ? 'text-[#488bbe] hover:bg-[#e8f5ff] cursor-pointer' 
                  : 'text-gray-400 cursor-not-allowed'
              } transition-colors text-sm sm:text-base flex-1 sm:flex-none`}
              onClick={hasActiveFilters ? handleClearFilters : undefined}
              disabled={!hasActiveFilters}
            >
              <span className="material-icons mr-1 text-sm">close</span>
              <span>Clear all</span>
            </button>
          </div>
        </div>

        {/* Data table */}
        <div className="relative" style={{ zIndex: 1 }}>
          {isLoading ? (
            <div className="py-8 text-center">
              <span className="material-icons animate-spin text-[#488BBE] text-2xl">refresh</span>
              <p className="text-[#488BBE] text-sm mt-2">Loading...</p>
            </div>
          ) : (
            <TableComponent
              data={listData}
              searchInput={debouncedSearchTerm}
              getSortIcon={getSortIcon}
              requestSort={requestSort}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              updateItem={updateFunction}
              optionsData={optionsForFilters}
              resetEditMode={resetEditModeRef}
              filtersChanged={filtersChanged}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Filter modal */}
      <AnimatePresence>
        {showFilterModal && (
          <FiltersComponent
            showModal={showFilterModal}
            setShowModal={setShowFilterModal}
            filtersInput={filtersInput}
            setFiltersInput={setFiltersInput}
            handleFilterSelect={handleFilterSelect}
            applyFilters={handleApplyFilters}
            optionsData={optionsForFilters}
            data={listData}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ListPage;