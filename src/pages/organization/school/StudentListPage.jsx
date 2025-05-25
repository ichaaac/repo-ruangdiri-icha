// src/pages/organization/school/StudentListPage.jsx - Parent Pages File
import React, { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import useDebounce from "../../../hooks/useDebounce";
import { useStudentData, useClassrooms } from "../../../hooks/useStudentData";
import { useStudentFilters } from "../../../hooks/useStudentFilter";
import StudentFilters from "../../../components/organization/school/list/StudentFilter";
import StudentTable from "../../../components/organization/school/list/StudentTable";
import { useAuth } from "../../../hooks/useAuth";

const StudentListPage = () => {
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
  } = useStudentFilters();
  
  // Very short debounce value to avoid perceived lag
  const debouncedSearchTerm = useDebounce(searchInput, 150);
  
  const {
    students,
    totalData,
    genderCounts,
    isLoading: isStudentsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
    updateStudent
  } = useStudentData(debouncedSearchTerm, appliedSortConfig, appliedFilters);
  
  // Fetch classrooms data for filtering 
  const { data: classroomsData, isLoading: isLoadingClassrooms } = useClassrooms();
  
  // Get classrooms and grades data from the API response
  const { classrooms, grades } = useMemo(() => {
    if (!classroomsData) {
      return {
        classrooms: [],
        grades: []
      };
    }
    
    // Use exact data returned from API
    return {
      // classroomsResult contains the classroom values (X, XI, XII)
      classrooms: classroomsData.classroomsResult || [],
      // gradesResult contains the grade values (A, B, C, D)
      grades: classroomsData.gradesResult || []
    };
  }, [classroomsData]);

  // Show error state if student data fetch fails
  if (isError) {
    return (
      <div className="flex justify-center items-center h-full min-h-[80vh]">
        <div className="flex flex-col items-center text-center p-6">
          <span className="material-icons text-red-500 text-4xl mb-4">error_outline</span>
          <p className="text-red-500 font-semibold mb-2">Gagal memuat data siswa</p>
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
      {/* Top bar with language and notifications */}
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
            Halo, {user?.fullName || ""}
          </h1>
        </div>

        {/* Stats cards */}
        <div className="flex flex-wrap gap-3">
          {/* Total students card */}
          <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-[98px] h-[60px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-3">
                <span className="material-icons text-[#3399E9] text-lg pb-5">groups</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">
                    {totalData}
                  </div>
                  <div className="text-xs text-[#488BBE]">Siswa</div>
                </div>
              </div>
            </div>
          </div>

          {/* Female students card */}
          <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-[98px] h-[60px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-3">
                <span className="material-icons text-[#FF86E1] text-lg pb-5">face_2</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">
                    {genderCounts.female}
                  </div>
                  <div className="text-xs text-[#488BBE]">Perempuan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Male students card */}
          <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px]">
            <div className="absolute inset-0 rounded-lg p-[1px] w-[98px] h-[60px]" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #488BBE)' }}>
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-3">
                <span className="material-icons text-[#FF7173] text-lg pb-5">face</span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-xl md:text-2xl font-bold text-[#488BBE]">
                    {genderCounts.male}
                  </div>
                  <div className="text-xs text-[#488BBE]">Laki-laki</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filter section */}
      <div className="px-4 md:px-8 pb-8 mt-8">
        <div className="flex flex-wrap items-center gap-4 mb-[21px]">
          {/* Search input */}
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center">
              <span className="material-icons text-[#8b8b8b]">search</span>
            </span>
            <input
              type="text"
              placeholder="Cari Nama atau NIS..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-full border border-[#d9d9d9] focus:outline-none focus:border-[#488bbe]"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center px-4 py-2 rounded-full text-[#8b8b8b] hover:bg-[#f7f7f9] transition-colors"
              onClick={() => setShowFilterModal(true)}
            >
              <span className="material-icons mr-2">filter_alt</span>
              <span>Filter</span>
            </button>
            
            {/* Always show clear filters button but disable when inactive */}
            <button 
              className={`flex items-center justify-center px-4 py-2 rounded-full ${
                hasActiveFilters 
                  ? 'text-[#488bbe] hover:bg-[#e8f5ff] cursor-pointer' 
                  : 'text-gray-400 cursor-not-allowed'
              } transition-colors`}
              onClick={hasActiveFilters ? clearFilters : undefined}
              disabled={!hasActiveFilters}
            >
              <span className="material-icons mr-1 text-sm">close</span>
              <span>Clear all</span>
            </button>
          </div>
        </div>

        {/* Student table - no loading state */}
        <StudentTable
          students={students || []}
          searchInput={debouncedSearchTerm}
          getSortIcon={getSortIcon}
          requestSort={requestSort}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          updateStudent={updateStudent}
          classroomOptions={classrooms}
          isLoading={false} // Always set to false to never show loading state
        />
      </div>

      {/* Filter modal - now passing correct props */}
      <AnimatePresence>
        {showFilterModal && (
          <StudentFilters
            showModal={showFilterModal}
            setShowModal={setShowFilterModal}
            filtersInput={filtersInput}
            handleFilterSelect={handleFilterSelect}
            applyFilters={applyFilters}
            grades={grades}
            classrooms={classrooms}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentListPage;