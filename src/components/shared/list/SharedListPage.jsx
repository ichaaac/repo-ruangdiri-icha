// src/components/shared/list/SharedListPage.jsx 
import { useState, useRef } from "react"
import { AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { useList } from "./hooks/useList" 
import SharedTable from "./SharedTable"
import FloatingTableScrollbar from "./FloatingTableScrollBar"
import TopRightControl from "../layout/TopRightControl"
// import ChatWidget from "../chats/ChatWidget"

const SharedListPage = ({
  type = "student",
  FiltersComponent,
  sidebarExpanded = false,
}) => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const tableRef = useRef(null)  
  const { data, filters, sort, edit, options } = useList(type, searchTerm)
  const [filtersInput, setFiltersInput] = useState(filters.filters)

  const config = {
    student: {
      title: `Halo, ${user?.fullName || ""}`,
      searchPlaceholder: "Cari Nama atau NIS...",
      totalLabel: "Siswa",
      icons: {
        total: "groups",
        female: "face_2",
        male: "face",
      },
    },
    employee: {
      title: `Halo, ${user?.fullName || ""}`,
      searchPlaceholder: "Cari Nama atau ID Karyawan...",
      totalLabel: "Karyawan",
      icons: {
        total: "groups",
        female: "face_2",
        male: "face",
      },
    },
  }

  const currentConfig = config[type]

// Handle filter operations
  const handleFilterSelect = (filterType, value) => {
    // Special handling for dependent filters
    if (type === "student" && filterType === "classroom") {
      setFiltersInput(prev => ({
        ...prev,
        [filterType]: prev[filterType] === value ? null : value,
        grade: null // Clear grade when classroom changes
      }))
    } else {
      setFiltersInput(prev => ({
        ...prev,
        [filterType]: prev[filterType] === value ? null : value
      }))
    }
  }

  const handleApplyFilters = () => {
    Object.entries(filtersInput).forEach(([key, value]) => {
      filters.updateFilter(key, value)
    })
    setShowFilterModal(false)
  }

  const handleClearFilters = () => {
    const emptyFilters = type === "student" 
      ? {
          classroom: null,
          grade: null,
          gender: null,
          screeningStatus: null,
          counselingStatus: null
        }
      : {
          department: null,
          position: null,
          gender: null,
          screeningStatus: null,
          counselingStatus: null
        }
    
    setFiltersInput(emptyFilters)
    filters.clearAllFilters()
  }

  const handleOpenFilterModal = () => {
    setFiltersInput(filters.filters)
    setShowFilterModal(true)
  }

  if (data.isError) {
    return (
      <div className="flex justify-center items-center h-full min-h-[80vh] p-4">
        <div className="flex flex-col items-center text-center p-6 max-w-md">
          <span className="material-icons text-red-500 text-3xl sm:text-4xl mb-4">error_outline</span>
          <p className="text-red-500 font-semibold mb-2 text-sm sm:text-base">
            Gagal memuat data {type === "student" ? "siswa" : "karyawan"}
          </p>
          <p className="text-gray-600 mb-4 text-xs sm:text-sm">
            {data.error?.message || "Terjadi kesalahan saat mengambil data."}
          </p>
          <button
            onClick={() => data.refetch()}
            className="px-4 py-2 bg-[#488bbe] text-white rounded-full hover:bg-[#3399e9] text-xs sm:text-sm"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden">

      {/* Title and Stats */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-2 sm:px-4 lg:px-6 mt-6 sm:mt-8 pt-[72px] gap-4 lg:gap-6">
        {currentConfig.title && (
          <div className="w-full lg:w-auto">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
              {currentConfig.title}
            </h1>
          </div>
        )}

        <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
          {/* Total Stats */}
          <div className="relative w-[90px] sm:w-[110px] lg:w-[120px] h-[60px] sm:h-[70px] lg:h-[80px]">
            <div
              className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] sm:h-[60px] lg:h-[70px]"
              style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
            >
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
                <span className="material-icons text-[#3399E9] text-base sm:text-lg pb-2 sm:pb-3">
                  {currentConfig.icons.total}
                </span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#488BBE]">{data.totalData || 0}</div>
                  <div className="text-[10px] sm:text-xs text-[#488BBE]">{currentConfig.totalLabel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Female Stats */}
          <div className="relative w-[90px] sm:w-[110px] lg:w-[120px] h-[60px] sm:h-[70px] lg:h-[80px]">
            <div
              className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] sm:h-[60px] lg:h-[70px]"
              style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
            >
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
                <span className="material-icons text-[#FF86E1] text-base sm:text-lg pb-2 sm:pb-3">
                  {currentConfig.icons.female}
                </span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#488BBE]">
                    {data.genderCounts?.female || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#488BBE]">Perempuan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Male Stats */}
          <div className="relative w-[90px] sm:w-[110px] lg:w-[120px] h-[60px] sm:h-[70px] lg:h-[80px]">
            <div
              className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] sm:h-[60px] lg:h-[70px]"
              style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
            >
              <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
                <span className="material-icons text-[#FF7173] text-base sm:text-lg pb-2 sm:pb-3">
                  {currentConfig.icons.male}
                </span>
                <div className="flex flex-col items-center ml-auto mr-auto">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#488BBE]">
                    {data.genderCounts?.male || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#488BBE]">Laki-laki</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="px-2 sm:px-4 lg:px-6 mt-9 mb-[21px]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
          <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center">
              <span className="material-icons text-[#8b8b8b] text-base sm:text-lg">search</span>
            </span>
            <input
              type="text"
              placeholder={currentConfig.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 pr-4 py-2 w-full rounded-full border border-[#d9d9d9] focus:outline-none focus:border-[#488bbe] text-xs sm:text-sm md:text-base"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              className="flex items-center justify-center px-3 sm:px-4 py-2 rounded-full text-[#8b8b8b] hover:bg-[#f7f7f9] transition-colors text-xs sm:text-sm flex-1 sm:flex-none"
              onClick={handleOpenFilterModal}
            >
              <span className="material-icons mr-1 sm:mr-2 text-sm sm:text-base">filter_alt</span>
              <span>Filter</span>
            </button>

            <button
              className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-full ${
                filters.areFiltersActive
                  ? "text-[#488bbe] hover:bg-[#e8f5ff] cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
              } transition-colors text-xs sm:text-sm flex-1 sm:flex-none`}
              onClick={filters.areFiltersActive ? handleClearFilters : undefined}
              disabled={!filters.areFiltersActive}
            >
              <span className="material-icons mr-1 text-xs sm:text-sm">close</span>
              <span>Clear all</span>
            </button>
          </div>
        </div>
      </div>

      {/* ENHANCEMENT: Table with integrated hooks */}
      <div className="px-2 sm:px-4 lg:px-6">
        <SharedTable
          ref={tableRef}
          type={type}
          data={data.data}
          searchInput={searchTerm}
          getSortIcon={sort.getSortIcon}
          requestSort={sort.requestSort}
          fetchNextPage={data.fetchNextPage}
          hasNextPage={data.hasNextPage}
          isFetchingNextPage={data.isFetchingNextPage}
          updateItem={data.updateItem}
          optionsData={options.data || {}}
          isLoading={data.isLoading}
          sidebarExpanded={sidebarExpanded}
          editHook={edit} // ENHANCEMENT: Pass edit hook directly
        />
      </div>

      {/* ENHANCEMENT: Stable FloatingTableScrollbar */}
      <FloatingTableScrollbar 
        tableRef={tableRef}
        sidebarExpanded={sidebarExpanded} 
      />

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilterModal && FiltersComponent && (
          <FiltersComponent
            showModal={showFilterModal}
            setShowModal={setShowFilterModal}
            filtersInput={filtersInput}
            setFiltersInput={setFiltersInput}
            handleFilterSelect={handleFilterSelect}
            applyFilters={handleApplyFilters}
            optionsData={options.data || {}}
            data={data.data}
          />
        )}
      </AnimatePresence>

      {/* 🔥 ChatWidget Implementation
      <ChatWidget 
        position="custom"
      className="chat-widget-list-page"
      /> */}
    </div>
  )
}

export default SharedListPage