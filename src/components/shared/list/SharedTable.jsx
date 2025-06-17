import React, { useState, useRef, useCallback, forwardRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, Transition } from "@headlessui/react"
import useDebounce from "@/hooks/useDebounce"
import clsx from "clsx"
import { 
  truncateText, 
  highlightSearchTerm, 
  getScreeningStatusInfo, 
  getCounselingStatusInfo,
  getGenderDisplay 
} from '../list/utils/listHelpers'

const CustomDropdown = ({ name, value, onChange, options, className = "", disabled = false }) => {
  const currentOption = options.find((opt) => (opt.value !== undefined ? opt.value : opt) === value)
  const displayValue = currentOption?.label || currentOption || value
  const menuButtonRef = useRef(null)
  const menuItemsRef = useRef(null)

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } })
  }

  const handleMenuOpen = () => {
    setTimeout(() => {
      if (menuItemsRef.current) {
        menuItemsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        })
      }
    }, 10)
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        ref={menuButtonRef}
        disabled={disabled}
        className={clsx(
          "w-full text-left px-2 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-md",
          "flex items-center justify-between gap-1 sm:gap-2",
          "transition-[border-color,box-shadow] duration-150 ease-in-out",
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white hover:border-[#488BBE] border-gray-300 focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE]",
          className,
        )}
        onClick={handleMenuOpen}
      >
        <span className="truncate">{displayValue}</span>
        <span className="material-icons text-gray-400 text-xs sm:text-sm">expand_more</span>
      </Menu.Button>

      <Transition
        as={React.Fragment}
        enter="transition duration-100 ease-out"
        enterFrom="transform opacity-0 scale-95 translate-y-1"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition duration-75 ease-in"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 translate-y-1"
      >
        <Menu.Items
          ref={menuItemsRef}
          static={false}
          className="absolute z-[9999] mt-2 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 focus:outline-none max-h-60 overflow-y-auto"
          style={{ backgroundColor: "white" }}
        >
          {options.map((option) => {
            const optionValue = option.value !== undefined ? option.value : option
            const optionLabel = option.label || option
            const isSelected = optionValue === value

            return (
              <Menu.Item key={optionValue}>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => handleSelect(optionValue)}
                    className={clsx(
                    "w-full text-left px-2 sm:px-3 py-2 text-xs sm:text-sm flex items-center justify-between",
                      "transition-colors duration-100",
                      active ? "bg-[#E2F9FF]" : "",
                      isSelected ? "bg-[#E2F9FF] text-[#488BBE] font-medium" : ""
                    )}
                    style={{ backgroundColor: active ? "#E2F9FF" : "white" }}
                  >
                    <span>{optionLabel}</span>
                    {isSelected && <span className="material-icons text-[#488BBE] text-xs sm:text-sm">check</span>}
                  </button>
                )}
              </Menu.Item>
            )
          })}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

// Help Tooltip Component
const HelpTooltip = ({ helpIconRef, showHelpTooltip }) => (
  <AnimatePresence>
    {showHelpTooltip && (
      <motion.div
        className="fixed bg-black/80 text-white text-xs rounded-md p-2.5 shadow-lg z-[9999]"
        style={{
          width: "150px",
          top: helpIconRef.current?.getBoundingClientRect().top - 80,
          left: helpIconRef.current?.getBoundingClientRect().left + 20,
        }}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
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
            <span className="material-icons text-sm font-bold text-[#535353] mr-2">remove</span>
            <span>Belum Skrining</span>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

// FIXED: Properly aligned action buttons with closer spacing
const FloatingActionButtons = ({ 
  isEditing, 
  hasChanges, 
  onCancel, 
  onSave, 
  isPending,
  scrollLeft = 0 
}) => {
  if (!isEditing) return null

  return (
    <div className="flex items-center justify-center gap-1" style={{
      transform: `translateX(${Math.min(scrollLeft * 0.3, 30)}px)`,
      transition: 'transform 0.1s ease-out'
    }}>
      <button
        className={clsx(
          "w-8 h-8 flex items-center justify-center rounded-full text-[#EE4266] hover:text-[#b53434] hover:bg-red-50 transition-colors",
          isPending && "opacity-50 cursor-not-allowed",
        )}
        onClick={onCancel}
        disabled={isPending}
      >
        <span className="material-icons text-lg">cancel</span>
      </button>

      <button
        className={clsx(
          "w-8 h-8 flex items-center justify-center rounded-full text-[#9BCA61] hover:text-[#6DAF31] hover:bg-green-50 transition-colors",
          (!hasChanges || isPending) && "opacity-50 cursor-not-allowed",
        )}
        onClick={onSave}
        disabled={!hasChanges || isPending}
      >
        <span className="material-icons text-lg">check_circle</span>
      </button>
    </div>
  )
}

/**
 * Enhanced SharedTable with integrated hooks
 */
const SharedTable = forwardRef(
  (
    {
      type = "student",
      data = [],
      searchInput = "",
      getSortIcon,
      requestSort,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      updateItem,
      optionsData = {},
      isLoading = false,
      sidebarExpanded = false,
      editHook, // ENHANCEMENT: Use edit hook directly
    },
    ref,
  ) => {
    const [showHelpTooltip, setShowHelpTooltip] = useState(false)
    const [hoveredStatus, setHoveredStatus] = useState(null)
    const [showEditTooltip, setShowEditTooltip] = useState(null)
    const [scrollLeft, setScrollLeft] = useState(0) // ENHANCEMENT: Track scroll for floating buttons
    const helpIconRef = useRef(null)
    const observerRef = useRef(null)
    const contentRef = useRef(null)

    const tableConfig = {
      student: {
        emptyIcon: "school",
        emptyText: "Tidak ada data siswa.",
        detailPath: "/organization/school/student",
      },
      employee: {
        emptyIcon: "business_center",
        emptyText: "Tidak ada data karyawan.",
        detailPath: "/organization/company/employee",
      },
    }

    const config = tableConfig[type]

    // ENHANCEMENT: Track scroll position for floating buttons
    useEffect(() => {
      const handleScroll = () => {
        if (contentRef.current) {
          setScrollLeft(contentRef.current.scrollLeft)
        }
      }

      if (contentRef.current) {
        contentRef.current.addEventListener('scroll', handleScroll, { passive: true })
        return () => contentRef.current?.removeEventListener('scroll', handleScroll)
      }
    }, [])

    // Simplified sidebar width calculation
    useEffect(() => {
      const updateTableLayout = () => {
        if (contentRef.current) {
          contentRef.current.style.width = 'auto'
          setTimeout(() => {
            if (contentRef.current) {
              contentRef.current.style.width = '100%'
            }
          }, 10)
        }
      }

      updateTableLayout()
      const timeoutId = setTimeout(updateTableLayout, 350)
      return () => clearTimeout(timeoutId)
    }, [sidebarExpanded])

    // Ref callback to expose table ref to parent
    const tableContainerRef = useCallback(
      (node) => {
        contentRef.current = node
        
        if (ref) {
          if (typeof ref === 'function') {
            ref(node)
          } else {
            ref.current = node
          }
        }
      },
      [ref],
    )

    // Infinite scroll observer
    const lastItemElementRef = useCallback(
      (node) => {
        if (observerRef.current) observerRef.current.disconnect()
        if (isFetchingNextPage || !hasNextPage) return

        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasNextPage) fetchNextPage()
          },
          { threshold: 0.1, rootMargin: "0px 0px 100px 0px" },
        )

        if (node) observerRef.current.observe(node)
      },
      [isFetchingNextPage, hasNextPage, fetchNextPage],
    )

    const handleNameClick = (id, e) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
    
      if (editHook?.editingItemId !== null) return
    
      window.open(`${config.detailPath}/${id}`, "_blank")
    }

    // ENHANCEMENT: Use edit hook methods
    const startEditing = (id) => {
      if (editHook?.editingItemId) return
      const item = data.find((d) => d.id === id)
      if (!item) return

      editHook?.startEditing(id, item)
    }

    const cancelEditing = () => {
      editHook?.stopEditing()
    }

    const saveEditing = (id) => {
      if (!editHook?.validateData()) return

      const original = data.find((item) => item.id === id)
      if (!original) return

      const changes = editHook?.getChanges(original)
      if (!Object.keys(changes).length) return

      // Process numeric fields
      if (type === "student" && changes.iqScore !== undefined) {
        changes.iqScore = Number.parseInt(changes.iqScore) || 0
      }

      if (type === "employee") {
        if (changes.age !== undefined) {
          changes.age = Number.parseInt(changes.age) || 0
        }
        if (changes.yearsOfService !== undefined) {
          changes.yearsOfService = Number.parseInt(changes.yearsOfService) || 0
        }
      }

      updateItem.mutate({ id, data: changes }, { 
        onSuccess: () => editHook?.stopEditing() 
      })
    }

    // Handle edit field change
    const handleEditChange = (e) => {
      const { name, value } = e.target
      editHook?.updateField(name, value)
    }

    const debouncedSearchInput = useDebounce(searchInput, 7000)
    const isDebouncingSearch = searchInput !== debouncedSearchInput
    
    // Check if has changes using edit hook
    const hasChanges = editHook?.hasUnsavedChanges() && editHook?.editData?.fullName?.trim()

    // Linear gradient divider
    const LinearGradientDivider = () => (
      <tr style={{ height: "1px" }}>
        <td colSpan={type === "student" ? 8 : 9} className="p-0">
          <div
            style={{
              height: "1px",
              background: "linear-gradient(to right, rgba(255,255,255,0), rgba(72,139,190,0.2) 20%, rgba(72,139,190,0.4) 50%, rgba(72,139,190,0.2) 80%, rgba(255,255,255,0))",
            }}
          />
        </td>
      </tr>
    )

    return (
      <div className="relative w-full">
        <div
          ref={tableContainerRef}
          className="w-full overflow-x-auto"
          style={{
            overflowY: "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <table
            className="border-separate border-spacing-0 bg-white w-full"
            style={{
              minWidth: type === "student" ? "800px" : "900px",
              width: "100%",
            }}
          >
       <thead className="bg-[#E2F9FF]">
  <tr>
    {/* Name Column */}
    <th
      className="px-3 py-2 text-left text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
      data-name-column="true"
      style={{ minWidth: "200px" }}
    >
      <div className="flex items-center gap-1">
        <span>NAMA</span>
        <span
          className="material-icons text-sm text-gray-400 cursor-pointer hover:text-[#3399e9] transition-colors"
          onClick={() => requestSort("fullName")}
        >
          {getSortIcon("fullName")}
        </span>
      </div>
    </th>

    {/* Type-specific columns */}
    {type === "student" ? (
      <>
        <th className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "120px" }}>
          KELAS
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "120px" }}>
          JENIS KELAMIN
        </th>
        <th
          className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
          style={{ minWidth: "120px" }}
        >
          <div className="flex items-center justify-center gap-1">
            <span>NIS</span>
            <span 
              className="material-icons text-sm text-gray-400 cursor-pointer hover:text-[#3399e9] transition-colors"
              onClick={() => requestSort("nis")}
            >
              {getSortIcon("nis")}
            </span>
          </div>
        </th>
        <th
          className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
          style={{ minWidth: "120px" }}
        >
          <div className="flex items-center justify-center gap-1">
            <span>SKOR IQ</span>
            <span 
              className="material-icons text-sm text-gray-400 cursor-pointer hover:text-[#3399e9] transition-colors"
              onClick={() => requestSort("iqScore")}
            >
              {getSortIcon("iqScore")}
            </span>
          </div>
        </th>
      </>
    ) : (
      <>
        <th className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "150px" }}>
          DEPARTEMEN
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "150px" }}>
          JABATAN
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "120px" }}>
          JENIS KELAMIN
        </th>
        <th
          className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
          style={{ minWidth: "100px" }}
        >
          <div className="flex items-center justify-center gap-1">
            <span>USIA</span>
            <span
              className="material-icons text-sm text-gray-400 cursor-pointer hover:text-[#3399e9] transition-colors"
              onClick={() => requestSort("age")}
            >
              {getSortIcon("age")}
            </span>
          </div>
        </th>
        <th
          className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
          style={{ minWidth: "150px" }}
        >
          <div className="flex items-center justify-center gap-1">
            <span>LAMA BEKERJA</span>
            <span
              className="material-icons text-sm text-gray-400 cursor-pointer hover:text-[#3399e9] transition-colors"
              onClick={() => requestSort("yearsOfService")}
            >
              {getSortIcon("yearsOfService")}
            </span>
          </div>
        </th>
      </>
    )}

    {/* Common columns */}
    <th className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "120px" }}>
      <div className="flex items-center justify-center">
        SKRINING
        <span
          className="material-icons text-sm ml-1 text-gray-400 cursor-help opacity-70 hover:opacity-100 transition-opacity"
          ref={helpIconRef}
          onMouseEnter={() => setShowHelpTooltip(true)}
          onMouseLeave={() => setShowHelpTooltip(false)}
        >
          help_outline
        </span>
        <HelpTooltip helpIconRef={helpIconRef} showHelpTooltip={showHelpTooltip} />
      </div>
    </th>
    <th className="px-3 py-2 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "120px" }}>
      KONSELING
    </th>
    <th className="px-3 py-2 text-center whitespace-nowrap" style={{ minWidth: "80px" }}></th>
  </tr>
</thead>

            <tbody className="bg-white">
              <LinearGradientDivider />

              {data.map((item, index) => {
                const statusUI = getScreeningStatusInfo(item.screeningStatus || "stable")
                // FIXED: Use hasCounseling boolean instead of counselingStatus
                const counselingUI = getCounselingStatusInfo(item.hasCounseling)
                const isLastElement = index === data.length - 1
                const isEditing = editHook?.isEditingItem(item.id)

                return (
                  <React.Fragment key={item.id}>
                    <tr className="bg-white relative" ref={isLastElement ? lastItemElementRef : null}>
                      {/* Name - FIXED: Remove highlighting */}
                      <td className="px-3 py-2 text-left whitespace-nowrap" data-name-column="true">
                        {isEditing ? (
                          <input
                            type="text"
                            name="fullName"
                            value={editHook?.editData?.fullName || ""}
                            onChange={handleEditChange}
                            className="text-sm font-medium text-gray-900 border border-gray-300 rounded-md px-2 py-1 w-full min-w-[200px] hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                          />
                        ) : (
                          <div
                            className="text-sm font-medium cursor-pointer text-gray-900 hover:text-[#488BBE] transition-colors"
                            onClick={(e) => handleNameClick(item.id, e)}
                            title={item.fullName}
                          >
                            {truncateText(item.fullName, 30)}
                          </div>
                        )}
                      </td>

                      {/* Type-specific columns */}
                      {type === "student" ? (
                        <>
                          {/* Classroom */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex gap-1 justify-center" style={{ zIndex: 9999 }}>
                                <CustomDropdown
                                  name="classroom"
                                  value={editHook?.editData?.classroom || ""}
                                  onChange={handleEditChange}
                                  options={optionsData.classrooms || []}
                                  className="min-w-[50px] sm:min-w-[70px]"
                                />
                                <div className="flex items-center text-xs">-</div>
                                <CustomDropdown
                                  name="grade"
                                  value={editHook?.editData?.grade || ""}
                                  onChange={handleEditChange}
                                  options={["A", "B", "C", "D"]}
                                  className="min-w-[35px] sm:min-w-[50px]"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                {item.classroom && item.grade
                                  ? `${item.classroom} - ${item.grade}`
                                  : item.classroom || "-"}
                              </div>
                            )}
                          </td>

                          {/* Gender */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="relative" style={{ zIndex: 999 }}>
                                <CustomDropdown
                                  name="gender"
                                  value={editHook?.editData?.gender || ""}
                                  onChange={handleEditChange}
                                  options={[
                                    { value: "male", label: "L" },
                                    { value: "female", label: "P" },
                                  ]}
                                  className="w-12 sm:w-16"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">{getGenderDisplay(item.gender)}</div>
                            )}
                          </td>

                          {/* NIS - FIXED: Remove highlighting */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="text"
                                name="nis"
                                value={editHook?.editData?.nis || ""}
                                onChange={handleEditChange}
                                className="text-sm text-gray-600 border border-gray-300 rounded-md px-2 py-1 w-16 sm:w-24 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                              />
                            ) : (
                              <div className="text-sm text-gray-600">{item.nis}</div>
                            )}
                          </td>

                          {/* IQ Score */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="text"
                                name="iqScore"
                                value={editHook?.editData?.iqScore || ""}
                                onChange={handleEditChange}
                                className="text-sm text-gray-600 border border-gray-300 rounded-md px-2 py-1 w-12 sm:w-16 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                                maxLength="3"
                                inputMode="numeric"
                              />
                            ) : (
                              <div className="text-sm text-gray-600">{item.iqScore || "-"}</div>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Department */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="relative" style={{ zIndex: 999 }}>
                                <CustomDropdown
                                  name="department"
                                  value={editHook?.editData?.department || ""}
                                  onChange={handleEditChange}
                                  options={optionsData.departments || []}
                                  className="min-w-[80px] sm:min-w-[150px]"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600 truncate" title={item.department}>
                                {truncateText(item.department, 20)}
                              </div>
                            )}
                          </td>

                          {/* Position */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="relative" style={{ zIndex: 999 }}>
                                <CustomDropdown
                                  name="position"
                                  value={editHook?.editData?.position || ""}
                                  onChange={handleEditChange}
                                  options={optionsData.positions || []}
                                  className="min-w-[80px] sm:min-w-[120px]"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600 truncate" title={item.position}>
                                {truncateText(item.position, 20)}
                              </div>
                            )}
                          </td>

                          {/* Gender */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="relative" style={{ zIndex: 999 }}>
                                <CustomDropdown
                                  name="gender"
                                  value={editHook?.editData?.gender || ""}
                                  onChange={handleEditChange}
                                  options={[
                                    { value: "male", label: "L" },
                                    { value: "female", label: "P" },
                                  ]}
                                  className="w-12 sm:w-16"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">{getGenderDisplay(item.gender)}</div>
                            )}
                          </td>

                          {/* Age */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="text"
                                  name="age"
                                  value={editHook?.editData?.age || ""}
                                  onChange={handleEditChange}
                                  className="text-sm text-gray-600 border border-gray-300 rounded-md px-2 py-1 w-8 sm:w-12 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                                  maxLength="2"
                                  inputMode="numeric"
                                />
                                <span className="text-[10px] sm:text-sm text-gray-600">Thn</span>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                {item.age} <span className="hidden sm:inline">Tahun</span>
                                <span className="sm:hidden">Thn</span>
                              </div>
                            )}
                          </td>

                          {/* Years of Service */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="text"
                                  name="yearsOfService"
                                  value={editHook?.editData?.yearsOfService || ""}
                                  onChange={handleEditChange}
                                  className="text-sm text-gray-600 border border-gray-300 rounded-md px-2 py-1 w-8 sm:w-12 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                                  maxLength="2"
                                  inputMode="numeric"
                                />
                                <span className="text-[10px] sm:text-sm text-gray-600">Thn</span>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                {item.yearsOfService} <span className="hidden sm:inline">Tahun</span>
                                <span className="sm:hidden">Thn</span>
                              </div>
                            )}
                          </td>
                        </>
                      )}

                      {/* Screening Status */}
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full cursor-pointer"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setHoveredStatus({
                              status: item.screeningStatus || "stable",
                              x: rect.right + 10,
                              y: rect.top + rect.height / 2,
                            })
                          }}
                          onMouseLeave={() => setHoveredStatus(null)}
                        >
                          <span className={statusUI.iconClass}>{statusUI.icon}</span>
                        </span>
                      </td>

                      {/* Counseling Status */}
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span className={clsx("text-sm", counselingUI.color)}>
                          {counselingUI.text}
                        </span>
                      </td>

                      {/* Actions - FIXED: Closer button spacing */}
                      <td className="px-3 py-2 text-center relative whitespace-nowrap">
                        {isEditing ? (
                          <FloatingActionButtons
                            isEditing={isEditing}
                            hasChanges={hasChanges}
                            onCancel={cancelEditing}
                            onSave={() => saveEditing(item.id)}
                            isPending={updateItem.isPending}
                            scrollLeft={scrollLeft}
                          />
                        ) : (
                          <div className="flex items-center justify-center">
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#488BBE] hover:bg-blue-50 transition-colors relative"
                              onClick={() => startEditing(item.id)}
                              disabled={editHook?.editingItemId !== null}
                              onMouseEnter={() => setShowEditTooltip(item.id)}
                              onMouseLeave={() => setShowEditTooltip(null)}
                            >
                              <span className="material-icons text-lg">edit</span>
                              {showEditTooltip === item.id && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap shadow-lg z-[9999]">
                                  Edit
                                </div>
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    <LinearGradientDivider />
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Status tooltip */}
        <AnimatePresence>
          {hoveredStatus && (
            <motion.div
              className="fixed bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-[9999] shadow-lg"
              style={{
                left: hoveredStatus.x,
                top: hoveredStatus.y - 10,
              }}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
            >
              {getScreeningStatusInfo(hoveredStatus.status).text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {data.length === 0 && !isFetchingNextPage && !isDebouncingSearch && (
          <div className="text-center py-8">
            <span className="material-icons text-gray-400 text-4xl">{config.emptyIcon}</span>
            <p className="text-gray-500 mt-2 text-sm">{config.emptyText}</p>
          </div>
        )}
      </div>
    )
  },
)

SharedTable.displayName = "SharedTable"

export default SharedTable