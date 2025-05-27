// src/components/shared/ListPage.jsx - Fixed List Page with Horizontal Scrollbar
import { useMemo, useRef, useState, useEffect, useCallback } from "react"
import { AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import useDebounce from "@/hooks/useDebounce"
import SharedTable from "./Table"
import clsx from "clsx"

// Custom Scrollbar Component for ListPage
const ListPageScrollbar = ({ tableRef }) => {
  const scrollbarRef = useRef(null)
  const thumbRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [scrollInfo, setScrollInfo] = useState({ scrollRatio: 0, thumbWidth: 100, maxScroll: 0, needsScrollbar: false })

  const updateScrollInfo = useCallback(() => {
    if (!tableRef.current) {
      setScrollInfo({ scrollRatio: 0, thumbWidth: 100, maxScroll: 0, needsScrollbar: false })
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = tableRef.current
    const maxScroll = scrollWidth - clientWidth
    const needsScrollbar = maxScroll > 10

    if (!needsScrollbar) {
      setScrollInfo({ scrollRatio: 0, thumbWidth: 100, maxScroll: 0, needsScrollbar: false })
      return
    }

    const scrollRatio = scrollLeft / maxScroll
    const visibleRatio = clientWidth / scrollWidth
    const thumbWidth = Math.max(visibleRatio * 100, 15)

    setScrollInfo({ scrollRatio, thumbWidth, maxScroll, needsScrollbar })
  }, [tableRef])

  useEffect(() => {
    const element = tableRef.current
    if (!element) return

    const handleScroll = () => updateScrollInfo()
    updateScrollInfo()

    element.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updateScrollInfo)

    // Observer for content changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateScrollInfo, 10)
    })
    resizeObserver.observe(element)

    return () => {
      element.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateScrollInfo)
      resizeObserver.disconnect()
    }
  }, [updateScrollInfo])

  const handleScrollbarClick = useCallback((e) => {
    if (!tableRef.current || !scrollbarRef.current || e.target === thumbRef.current) return

    const rect = scrollbarRef.current.getBoundingClientRect()
    const percentage = (e.clientX - rect.left) / rect.width
    const newScrollLeft = percentage * scrollInfo.maxScroll

    tableRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, scrollInfo.maxScroll))
  }, [scrollInfo.maxScroll, tableRef])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)

    const startX = e.clientX
    const startScrollLeft = tableRef.current?.scrollLeft || 0
    const scrollbarWidth = scrollbarRef.current?.offsetWidth || 1

    const handleMouseMove = (moveEvent) => {
      if (!tableRef.current) return

      const deltaX = moveEvent.clientX - startX
      const percentage = deltaX / scrollbarWidth
      const newScrollLeft = startScrollLeft + percentage * scrollInfo.maxScroll

      tableRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, scrollInfo.maxScroll))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }, [scrollInfo.maxScroll, tableRef])

  if (!scrollInfo.needsScrollbar) return null

  return (
    <div className="w-full h-4 px-3 sm:px-4 md:px-6 mb-2">
      <div
        ref={scrollbarRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 transition-colors"
        onClick={handleScrollbarClick}
      >
        <div
          ref={thumbRef}
          className={clsx(
            "absolute h-full bg-[#488BBE] rounded-full transition-all duration-150",
            isDragging ? "opacity-100 bg-[#3399e9]" : "opacity-80 hover:opacity-100 hover:bg-[#3399e9]"
          )}
          style={{
            width: `${scrollInfo.thumbWidth}%`,
            left: `${scrollInfo.scrollRatio * (100 - scrollInfo.thumbWidth)}%`,
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  )
}

/**
 * Complete Shared List Page Component with Horizontal Scrollbar
 * @param {Object} props
 * @param {string} props.type - "student" or "employee"
 * @param {Function} props.useDataHook - Custom hook for fetching data
 * @param {Function} props.useFiltersHook - Custom hook for managing filters
 * @param {Function} props.useOptionsHook - Custom hook for getting filter options
 * @param {React.Component} props.FiltersComponent - Filters modal component
 */
const SharedListPage = ({ type = "student", useDataHook, useFiltersHook, useOptionsHook, FiltersComponent }) => {
  const { user } = useAuth()
  const resetEditModeRef = useRef(null)
  const tableRef = useRef(null)
  const [filtersChanged, setFiltersChanged] = useState(false)

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

  const optionsHookResult = useOptionsHook ? useOptionsHook() : { data: null }
  const { data: optionsData } = optionsHookResult

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
        title: `Halo, ${user?.fullName || ""}`, // Company juga dapat greeting
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

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full min-h-[80vh] p-4">
        <div className="flex flex-col items-center text-center p-6 max-w-md">
          <span className="material-icons text-red-500 text-3xl sm:text-4xl mb-4">error_outline</span>
          <p className="text-red-500 font-semibold mb-2 text-sm sm:text-base">
            Gagal memuat data {type === "student" ? "siswa" : "karyawan"}
          </p>
          <p className="text-gray-600 mb-4 text-xs sm:text-sm">
            {error?.message || "Terjadi kesalahan saat mengambil data."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#488bbe] text-white rounded-full hover:bg-[#3399e9] text-xs sm:text-sm"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Top bar with language and notifications */}
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

      <div className="flex flex-col lg:flex-row items-start justify-between px-3 sm:px-4 md:px-6 mt-6 sm:mt-8 md:mt-[44px] gap-4">
        {config.title && (
          <div className="mt-2 w-full lg:w-auto">
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
              {config.title}
            </h1>
          </div>
        )}

        {/* Stats cards */}
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
          {/* Total card */}
          <div className="relative w-[80px] sm:w-[90px] md:w-[100px] lg:w-[120px] h-[50px] sm:h-[60px] md:h-[70px] lg:h-[80px]">
            <div
              className="absolute inset-0 rounded-lg p-[1px] w-full h-[40px] sm:h-[50px] md:h-[60px]"
              style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
            >
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-1 sm:pl-2 md:pl-3">
                <span className="material-icons text-[#3399E9] text-sm sm:text-base md:text-lg pb-2 sm:pb-3 md:pb-4">
                  {config.icons.total}
                </span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-[#488BBE]">
                    {totalData || 0}
                  </div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-[#488BBE]">{config.totalLabel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Female card */}
          <div className="relative w-[80px] sm:w-[90px] md:w-[100px] lg:w-[120px] h-[50px] sm:h-[60px] md:h-[70px] lg:h-[80px]">
            <div
              className="absolute inset-0 rounded-lg p-[1px] w-full h-[40px] sm:h-[50px] md:h-[60px]"
              style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
            >
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-1 sm:pl-2 md:pl-3">
                <span className="material-icons text-[#FF86E1] text-sm sm:text-base md:text-lg pb-2 sm:pb-3 md:pb-4">
                  {config.icons.female}
                </span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-[#488BBE]">
                    {genderCounts?.female || 0}
                  </div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-[#488BBE]">Perempuan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Male card */}
          <div className="relative w-[80px] sm:w-[90px] md:w-[100px] lg:w-[120px] h-[50px] sm:h-[60px] md:h-[70px] lg:h-[80px]">
            <div
              className="absolute inset-0 rounded-lg p-[1px] w-full h-[40px] sm:h-[50px] md:h-[60px]"
              style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
            >
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-1 sm:pl-2 md:pl-3">
                <span className="material-icons text-[#FF7173] text-sm sm:text-base md:text-lg pb-2 sm:pb-3 md:pb-4">
                  {config.icons.male}
                </span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-[#488BBE]">
                    {genderCounts?.male || 0}
                  </div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-[#488BBE]">Laki-laki</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filter section - with proper padding */}
      <div className="px-3 sm:px-4 md:px-6 mt-4 sm:mt-6 md:mt-8 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-[21px]">
          {/* Search input */}
          <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center">
              <span className="material-icons text-[#8b8b8b] text-base sm:text-lg md:text-xl">search</span>
            </span>
            <input
              type="text"
              placeholder={config.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 sm:pl-10 pr-4 py-2 w-full rounded-full border border-[#d9d9d9] focus:outline-none focus:border-[#488bbe] text-xs sm:text-sm md:text-base"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              className="flex items-center justify-center px-3 sm:px-4 py-2 rounded-full text-[#8b8b8b] hover:bg-[#f7f7f9] transition-colors text-xs sm:text-sm md:text-base flex-1 sm:flex-none"
              onClick={() => setShowFilterModal(true)}
            >
              <span className="material-icons mr-1 sm:mr-2 text-sm sm:text-base md:text-lg">filter_alt</span>
              <span>Filter</span>
            </button>

            <button
              className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-full ${
                hasActiveFilters
                  ? "text-[#488bbe] hover:bg-[#e8f5ff] cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
              } transition-colors text-xs sm:text-sm md:text-base flex-1 sm:flex-none`}
              onClick={hasActiveFilters ? handleClearFilters : undefined}
              disabled={!hasActiveFilters}
            >
              <span className="material-icons mr-1 text-xs sm:text-sm">close</span>
              <span>Clear all</span>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollbar - positioned above table */}
      <ListPageScrollbar tableRef={tableRef} />

      {/* Data table container with proper padding */}
      <div className="px-3 sm:px-4 md:px-6">
        {isLoading ? (
          <div className="py-6 sm:py-8 text-center">
            <span className="material-icons animate-spin text-[#488BBE] text-xl sm:text-2xl">refresh</span>
            <p className="text-[#488BBE] text-xs sm:text-sm mt-2">Loading...</p>
          </div>
        ) : (
          <SharedTable
            ref={tableRef}
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