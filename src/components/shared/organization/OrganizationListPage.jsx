// src/components/shared/organization/OrganizationListPage.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import useDebounce from "../../../hooks/useDebounce";
import OrganizationTable from "./OrganizationTable";
import OrganizationFilters from "./OrganizationFilters";
import { useAuth } from "../../../hooks/useAuth";

const OrganizationListPage = ({
  organizationType = "school",
  useDataHook,
  useOptionsHook,
  useFiltersHook
}) => {
  const resetEditModeRef = useRef(null);
  const [filtersChanged, setFiltersChanged] = useState(false);
  
  // Use the auth hook directly for user data 
  const { user } = useAuth();
  
  const {
    searchInput,
    setSearchInput,
    appliedSortConfig,
    requestSort,
    getSortIcon,
    filtersInput,
    appliedFilters,
    handleFilterSelect,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    showFilterModal,
    setShowFilterModal
  } = useFiltersHook();
  
  // Very short debounce value to avoid perceived lag
  const debouncedSearchTerm = useDebounce(searchInput, 150);
  
  const {
    data: items,
    totalData,
    genderCounts,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
    updateMutation
  } = useDataHook(debouncedSearchTerm, appliedSortConfig, appliedFilters);
  
  // Fetch options data (classrooms/departments)
  const optionsData = useOptionsHook();
  
  // Get options based on organization type
  const { primaryOptions, secondaryOptions } = useMemo(() => {
    if (organizationType === "school") {
      if (!optionsData?.data) {
        return { primaryOptions: [], secondaryOptions: [] };
      }
      return {
        primaryOptions: optionsData.data.classroomsResult || [],
        secondaryOptions: optionsData.data.gradesResult || []
      };
    } else {
      // Company
      return {
        primaryOptions: optionsData?.data?.departments || [],
        secondaryOptions: optionsData?.data?.positions || []
      };
    }
  }, [optionsData, organizationType]);

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

  // Organization-specific text
  const text = {
    school: {
      title: "Halo",
      itemName: "Siswa",
      itemNamePlural: "Siswa",
      searchPlaceholder: "Cari Nama atau NIS...",
      genderFemale: "Perempuan",
      genderMale: "Laki-laki"
    },
    company: {
      title: "Halo",
      itemName: "Karyawan",
      itemNamePlural: "Karyawan",
      searchPlaceholder: "Cari Nama atau ID Karyawan...",
      genderFemale: "Perempuan",
      genderMale: "Laki Laki"
    }
  };

  const currentText = text[organizationType];

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full min-h-[80vh]">
        <div className="flex flex-col items-center text-center p-6">
          <span className="material-icons text-red-500 text-4xl mb-4">error_outline</span>
          <p className="text-red-500 font-semibold mb-2">Gagal memuat data {currentText.itemName.toLowerCase()}</p>
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
      {/* Top bar with language and notifications - Responsive */}
      <div className="flex items-center justify-end px-4 md:px-6 pt-6 md:pt-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#8b8b8b] text-xs md:text-sm font-medium">ID / EN</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-[#8b8b8b] text-lg md:text-base">notifications</span>
          </div>
        </div>
      </div>

      {/* Header section - Responsive */}
      <div className="flex flex-col md:flex-row items-start justify-between px-4 md:px-6 mt-6 md:mt-[44px] gap-4">
        <div className="mt-0 md:mt-2">
          <h1 className="text-lg md:text-xl lg:text-3xl font-extrabold text-[#488BBE]">
            {currentText.title}, {user?.fullName || ""}
          </h1>
        </div>

        {/* Stats cards - Responsive */}
        <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
          {/* Total card */}
          <div className="relative w-[calc(33.333%-0.5rem)] md:w-[100px] lg:w-[120px] h-[60px] md:h-[70px] lg:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] md:h-[60px]" 
                 style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 md:pl-3">
                <span className="material-icons text-[#3399E9] text-sm md:text-lg pb-3 md:pb-5">groups</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-base md:text-xl lg:text-2xl font-bold text-[#488BBE]">
                    {totalData}
                  </div>
                  <div className="text-[10px] md:text-xs text-[#488BBE]">{currentText.itemNamePlural}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Female card */}
          <div className="relative w-[calc(33.333%-0.5rem)] md:w-[100px] lg:w-[120px] h-[60px] md:h-[70px] lg:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] md:h-[60px]" 
                 style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 md:pl-3">
                <span className="material-icons text-[#FF86E1] text-sm md:text-lg pb-3 md:pb-5">face_2</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-base md:text-xl lg:text-2xl font-bold text-[#488BBE]">
                    {genderCounts.female}
                  </div>
                  <div className="text-[10px] md:text-xs text-[#488BBE]">{currentText.genderFemale}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Male card */}
          <div className="relative w-[calc(33.333%-0.5rem)] md:w-[100px] lg:w-[120px] h-[60px] md:h-[70px] lg:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] md:h-[60px]" 
                 style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 md:pl-3">
                <span className="material-icons text-[#FF7173] text-sm md:text-lg pb-3 md:pb-5">face</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-base md:text-xl lg:text-2xl font-bold text-[#488BBE]">
                    {genderCounts.male}
                  </div>
                  <div className="text-[10px] md:text-xs text-[#488BBE]">{currentText.genderMale}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filter section - Responsive */}
      <div className="px-4 md:px-8 pb-8 mt-6 md:mt-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 mb-4 md:mb-[21px]">
          {/* Search input - Responsive */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center">
              <span className="material-icons text-[#8b8b8b] text-lg md:text-base">search</span>
            </span>
            <input
              type="text"
              placeholder={currentText.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-full border border-[#d9d9d9] focus:outline-none focus:border-[#488bbe] text-sm md:text-base"
            />
          </div>

          {/* Filter buttons - Responsive */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center px-3 md:px-4 py-2 rounded-full text-[#8b8b8b] hover:bg-[#f7f7f9] transition-colors text-sm md:text-base"
              onClick={() => setShowFilterModal(true)}
            >
              <span className="material-icons mr-1 md:mr-2 text-lg md:text-base">filter_alt</span>
              <span>Filter</span>
            </button>
            
            {/* Always show clear filters button but disable when inactive */}
            <button 
              className={`flex items-center justify-center px-3 md:px-4 py-2 rounded-full text-sm md:text-base ${
                hasActiveFilters 
                  ? 'text-[#488bbe] hover:bg-[#e8f5ff] cursor-pointer' 
                  : 'text-gray-400 cursor-not-allowed'
              } transition-colors`}
              onClick={hasActiveFilters ? handleClearFilters : undefined}
              disabled={!hasActiveFilters}
            >
              <span className="material-icons mr-1 text-xs md:text-sm">close</span>
              <span>Clear all</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <OrganizationTable
          organizationType={organizationType}
          data={items || []}
          searchInput={debouncedSearchTerm}
          getSortIcon={getSortIcon}
          requestSort={requestSort}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          updateItem={updateMutation}
          primaryOptions={primaryOptions}
          secondaryOptions={secondaryOptions}
          isLoading={false}
          resetEditMode={resetEditModeRef}
          filtersChanged={filtersChanged}
        />
      </div>

      {/* Filter modal */}
      <AnimatePresence>
        {showFilterModal && (
          <OrganizationFilters
            organizationType={organizationType}
            showModal={showFilterModal}
            setShowModal={setShowFilterModal}
            filtersInput={filtersInput}
            handleFilterSelect={handleFilterSelect}
            applyFilters={handleApplyFilters}
            primaryOptions={primaryOptions}
            secondaryOptions={secondaryOptions}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default OrganizationListPage;