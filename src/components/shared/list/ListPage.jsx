"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import useDebounce from "@/hooks/useDebounce"
import SharedTable from "./Table"

/**
 * Responsive Shared List Page Component
 */
const SharedListPage = ({ type = "student", useDataHook, useFiltersHook, useOptionsHook, FiltersComponent }) => {
  const { user } = useAuth()
  const resetEditModeRef = useRef(null)
  const [filtersChanged, setFiltersChanged] = useState(false)

  const optionsHookResult = useOptionsHook ? useOptionsHook() : { data: null }
  const { data: optionsData } = optionsHookResult

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
    setShowFilterModal,
  } = useFiltersHook()

  const debouncedSearchTerm = useDebounce(searchInput, 150)

  // Call the data hook
  const hookResult = useDataHook(debouncedSearchTerm, appliedSortConfig, appliedFilters)

  // Extract data based on hook structure
  let listData, totalData, genderCounts, updateFunction

  if (type === "student") {
    listData = hookResult.students || []
    totalData = hookResult.totalData || 0
    genderCounts = hookResult.genderCounts || { male: 0, female: 0 }
    updateFunction = hookResult.updateStudent
  } else {
    listData = hookResult.data || hookResult.employees || []
    totalData = hookResult.totalData || 0
    genderCounts = hookResult.genderCounts || { male: 0, female: 0 }
    updateFunction = hookResult.updateItem || hookResult.updateEmployee
  }

  const { isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } = hookResult

  // Process options data based on type
  const optionsForFilters = useMemo(() => {
    if (type === "employee" && optionsData) {
      return {
        departments: optionsData.departments || [],
        positions: optionsData.positions || [],
      }
    } else if (type === "student" && optionsData) {
      return {
        classrooms: optionsData.classrooms || optionsData.classNumbers || [],
        grades: optionsData.gradesResult || ["A", "B", "C", "D"],
      }
    }

    // Fallback to extracting from data
    const uniqueOptions = { departments: new Set(), positions: new Set(), classrooms: new Set(), grades: new Set() }

    if (listData && listData.length > 0) {
      listData.forEach((item) => {
        if (type === "employee") {
          if (item.department) uniqueOptions.departments.add(item.department)
          if (item.position) uniqueOptions.positions.add(item.position)
        } else if (type === "student") {
          if (item.classroom) uniqueOptions.classrooms.add(item.classroom)
          if (item.grade) uniqueOptions.grades.add(item.grade)
        }
      })
    }

    return {
      departments: Array.from(uniqueOptions.departments).sort(),
      positions: Array.from(uniqueOptions.positions).sort(),
      classrooms: Array.from(uniqueOptions.classrooms).sort(),
      grades: Array.from(uniqueOptions.grades).sort(),
    }
  }, [optionsData, listData, type])

  // Configure based on type
  const config = useMemo(() => {
    if (type === "student") {
      return {
        title: `Halo, ${user?.fullName || ""}`,
        searchPlaceholder: "Cari Nama atau NIS...",
        totalLabel: "Siswa",
        icons: {
          total: "groups",
          female: "face_2",
          male: "face",
        },
      }
    } else {
      return {
        title: `Halo, ${user?.fullName || ""}`,
        searchPlaceholder: "Cari Nama atau ID Karyawan...",
        totalLabel: "Karyawan",
        icons: {
          total: "groups",
          female: "face_2",
          male: "face",
        },
      }
    }
  }, [type, user])

  // Reset filters tracking effect
  useEffect(() => {
    if (filtersChanged) {
      setTimeout(() => setFiltersChanged(false), 100)
    }
  }, [filtersChanged])

  // Enhanced clearFilters function
  const handleClearFilters = () => {
    if (resetEditModeRef.current) {
      resetEditModeRef.current()
    }
    clearFilters()
    setFiltersChanged(true)
  }

  // Enhanced apply filters function
  const handleApplyFilters = () => {
    if (resetEditModeRef.current) {
      resetEditModeRef.current()
    }
    applyFilters()
    setFiltersChanged(true)
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full min-h-[80vh] p-4">
        <div className="flex flex-col items-center text-center p-6 max-w-md">
          <span className="material-icons text-red-500 text-4xl mb-4">error_outline</span>
          <p className="text-red-500 font-semibold mb-2">
            Gagal memuat data {type === "student" ? "siswa" : "karyawan"}
          </p>
          <p className="text-gray-600 mb-4 text-sm">{error?.message || "Terjadi kesalahan saat mengambil data."}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#488bbe] text-white rounded-full hover:bg-[#3399e9]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen">
      {/* Top bar with language and notifications - Responsive */}
      <div className="flex items-center justify-end px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-8">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[#8b8b8b] text-xs sm:text-sm font-medium">ID / EN</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-[#8b8b8b] text-lg sm:text-xl">notifications</span>
          </div>
        </div>
      </div>

      {/* Header with title and stats - Responsive */}
      <div className="flex flex-col lg:flex-row items-start justify-between px-3 sm:px-4 md:px-6 mt-6 sm:mt-8 md:mt-[44px] gap-4 sm:gap-6">
        {config.title && (
          <div className="w-full lg:w-auto">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
              {config.title}
            </h1>
          </div>
        )}

        {/* Responsive Stats cards */}
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
          {/* Total card */}
          <div className="relative w-[80px] sm:w-[100px] md:w-[120px] h-[50px] sm:h-[60px] md:h-[80px]">
            <div
              className="absolute inset-0 rounded-lg p-[1px] w-full h-[40px] sm:h-[50px] md:h-[60px]"
              style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
            >
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
                <span className="material-icons text-[#3399E9] text-sm sm:text-lg pb-2 sm:pb-3">
                  {config.icons.total}
                </span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-sm sm:text-lg md:text-2xl font-bold text-[#488BBE]">{totalData || 0}</div>
                  <div className="text-[8px] sm:text-xs text-[#488BBE]">{config.totalLabel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Female card */}
          <div className="relative w-[80px] sm:w-[100px] md:w-[120px] h-[50px] sm:h-[60px] md:h-[80px]">
            <div
              className="absolute inset-0 rounded-lg p-[1px] w-full h-[40px] sm:h-[50px] md:h-[60px]"
              style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
            >
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
                <span className="material-icons text-[#FF86E1] text-sm sm:text-lg pb-2 sm:pb-3">
                  {config.icons.female}
                </span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-sm sm:text-lg md:text-2xl font-bold text-[#488BBE]">
                    {genderCounts?.female || 0}
                  </div>
                  <div className="text-[8px] sm:text-xs text-[#488BBE]">Perempuan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Male card */}
          <div className="relative w-[80px] sm:w-[100px] md:w-[120px] h-[50px] sm:h-[60px] md:h-[80px]">
            <div
              className="absolute inset-0 rounded-lg p-[1px] w-full h-[40px] sm:h-[50px] md:h-[60px]"
              style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
            >
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
                <span className="material-icons text-[#FF7173] text-sm sm:text-lg pb-2 sm:pb-3">
                  {config.icons.male}
                </span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-sm sm:text-lg md:text-2xl font-bold text-[#488BBE]">
                    {genderCounts?.male || 0}
                  </div>
                  <div className="text-[8px] sm:text-xs text-[#488BBE]">Laki-laki</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filter section - Responsive */}
      <div className="px-3 sm:px-4 md:px-6 mt-4 sm:mt-6 md:mt-8 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-[21px]">
          {/* Search input - Responsive */}
          <div className="relative w-full sm:max-w-xs md:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center">
              <span className="material-icons text-[#8b8b8b] text-lg sm:text-xl">search</span>
            </span>
            <input
              type="text"
              placeholder={config.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 sm:pl-10 pr-4 py-2 w-full rounded-full border border-[#d9d9d9] focus:outline-none focus:border-[#488bbe] text-sm sm:text-base"
            />
          </div>

          {/* Filter buttons - Responsive */}
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
                  ? "text-[#488bbe] hover:bg-[#e8f5ff] cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
              } transition-colors text-sm sm:text-base flex-1 sm:flex-none`}
              onClick={hasActiveFilters ? handleClearFilters : undefined}
              disabled={!hasActiveFilters}
            >
              <span className="material-icons mr-1 text-xs sm:text-sm">close</span>
              <span>Clear all</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data table - Table.jsx handles its own scrollbar and responsiveness */}
      <div className="px-3 sm:px-4 md:px-6">
        {isLoading ? (
          <div className="py-6 sm:py-8 text-center">
            <span className="material-icons animate-spin text-[#488BBE] text-xl sm:text-2xl">refresh</span>
            <p className="text-[#488BBE] text-sm mt-2">Loading...</p>
          </div>
        ) : (
          <SharedTable
            type={type}
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
    </div>
  )
}

export default SharedListPage
