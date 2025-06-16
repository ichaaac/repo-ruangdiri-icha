// src/components/shared/list/SharedTable.jsx - Updated to use edit hook
import React, { forwardRef, useCallback, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, Transition } from "@headlessui/react"
import useDebounce from "@/hooks/useDebounce"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import clsx from "clsx"
import {
  truncateText,
  highlightSearchTerm,
  getScreeningStatusInfo,
  getCounselingStatusInfo,
  calculateTableWidth
} from "@/components/list/utils"

const CustomDropdown = ({ name, value, onChange, options, className = "", disabled = false }) => {
  const currentOption = options.find((opt) => (opt.value !== undefined ? opt.value : opt) === value)
  const displayValue = currentOption?.label || currentOption || value

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } })
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
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
        <Menu.Items className="absolute z-[9999] mt-2 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 focus:outline-none max-h-60 overflow-y-auto">
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

const HelpTooltip = ({ showHelpTooltip }) => (
  <AnimatePresence>
    {showHelpTooltip && (
      <motion.div
        className="fixed bg-[#00000080] text-white text-xs rounded-md p-2.5 shadow-lg z-[9999]"
        style={{
          width: "150px",
          top: "10px",
          right: "10px",
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

const LinearGradientDivider = ({ colSpan }) => (
  <tr style={{ height: "2px" }}>
    <td colSpan={colSpan} className="p-0">
      <div
        style={{
          height: "2px",
          background:
            "linear-gradient(to right, rgba(255,255,255,0), rgba(72,139,190,0.3) 20%, rgba(72,139,190,0.6) 50%, rgba(72,139,190,0.3) 80%, rgba(255,255,255,0))",
          margin: "0",
        }}
      />
    </td>
  </tr>
)

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
      editHook
    },
    ref,
  ) => {
    const debouncedSearchInput = useDebounce(searchInput, 300)
    const isDebouncingSearch = searchInput !== debouncedSearchInput
    const contentRef = useRef(null)
    const [showHelpTooltip, setShowHelpTooltip] = useState(false)
    const [hoveredStatus, setHoveredStatus] = useState(null)
    const [showEditTooltip, setShowEditTooltip] = useState(null)
    const [hoveredNames, setHoveredNames] = useState(new Set())

    // Use the infinite scroll hook
    useInfiniteScroll({
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
    })

    const tableConfig = {
      student: {
        emptyIcon: "school",
        emptyText: "Tidak ada data siswa.",
        detailPath: "/organization/school/student",
        colSpan: 8
      },
      employee: {
        emptyIcon: "business_center", 
        emptyText: "Tidak ada data karyawan.",
        detailPath: "/organization/company/employee",
        colSpan: 9
      },
    }

    const config = tableConfig[type]

    // Handle name click
    const handleNameClick = useCallback((id, e) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (editHook?.editingItemId !== null) return
      window.open(`${config.detailPath}/${id}`, "_blank")
    }, [editHook?.editingItemId, config.detailPath])

    // Handle name hover
    const handleNameHover = useCallback((id, isHovering) => {
      setHoveredNames(prev => {
        const newSet = new Set(prev)
        if (isHovering) {
          newSet.add(id)
        } else {
          newSet.delete(id)
        }
        return newSet
      })
    }, [])

    // Handle status hover
    const handleStatusHover = useCallback((status, rect, isHovering) => {
      if (isHovering) {
        setHoveredStatus({
          status,
          x: rect.right + 10,
          y: rect.top + rect.height / 2,
        })
      } else {
        setHoveredStatus(null)
      }
    }, [])

    // Handle sort click - only on icon
    const handleSortClick = useCallback((e, key) => {
      e.preventDefault()
      e.stopPropagation()
      requestSort(key)
    }, [requestSort])

    // Table container ref
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

    return (
      <div className="relative w-full">
        <div
          ref={tableContainerRef}
          className="cursor-pointer select-none w-full"
          style={{
            width: calculateTableWidth(sidebarExpanded, type),
            maxWidth: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            transition: "width 0.3s ease-in-out",
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
              width: calculateTableWidth(sidebarExpanded, type),
              minWidth: type === "student" ? "800px" : "900px",
              tableLayout: "auto",
            }}
          >
            <thead className="bg-[#E2F9FF]">
              <tr>
                {/* Name Column */}
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
                  data-name-column="true"
                  style={{ minWidth: "200px" }}
                >
                  <div className="flex items-center gap-1">
                    <span>NAMA</span>
                    <span
                      className="material-icons text-sm cursor-pointer hover:text-[#3399e9] transition-colors"
                      onClick={(e) => handleSortClick(e, "fullName")}
                    >
                      {getSortIcon("fullName")}
                    </span>
                  </div>
                </th>

                {/* Type-specific columns */}
                {type === "student" ? (
                  <>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "120px" }}>
                      KELAS
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "120px" }}>
                      JENIS KELAMIN
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap hover:bg-[#D1F4FF] transition-colors" style={{ minWidth: "120px" }}>
                      <div className="flex items-center justify-center gap-1">
                        NIS
                        <span className="material-icons text-sm cursor-pointer" onClick={(e) => handleSortClick(e, "nis")}>
                          {getSortIcon("nis")}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap hover:bg-[#D1F4FF] transition-colors" style={{ minWidth: "120px" }}>
                      <div className="flex items-center justify-center gap-1">
                        SKOR IQ
                        <span className="material-icons text-sm cursor-pointer" onClick={(e) => handleSortClick(e, "iqScore")}>
                          {getSortIcon("iqScore")}
                        </span>
                      </div>
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "150px" }}>
                      DEPARTEMEN
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "150px" }}>
                      JABATAN
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "120px" }}>
                      JENIS KELAMIN
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap hover:bg-[#D1F4FF] transition-colors" style={{ minWidth: "100px" }}>
                      <div className="flex items-center justify-center gap-1">
                        USIA
                        <span className="material-icons text-sm cursor-pointer" onClick={(e) => handleSortClick(e, "age")}>
                          {getSortIcon("age")}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap hover:bg-[#D1F4FF] transition-colors" style={{ minWidth: "150px" }}>
                      <div className="flex items-center justify-center gap-1">
                        LAMA BEKERJA
                        <span className="material-icons text-sm cursor-pointer" onClick={(e) => handleSortClick(e, "yearsOfService")}>
                          {getSortIcon("yearsOfService")}
                        </span>
                      </div>
                    </th>
                  </>
                )}

                {/* Common columns */}
                <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "120px" }}>
                  <div className="flex items-center justify-center">
                    SKRINING
                    <span
                      className="material-icons text-sm ml-1 text-gray-400 cursor-help opacity-70 hover:opacity-100 transition-opacity"
                      onMouseEnter={() => setShowHelpTooltip(true)}
                      onMouseLeave={() => setShowHelpTooltip(false)}
                    >
                      help_outline
                    </span>
                    <HelpTooltip showHelpTooltip={showHelpTooltip} />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap" style={{ minWidth: "120px" }}>
                  KONSELING
                </th>
                <th className="px-4 py-3 text-center whitespace-nowrap" style={{ minWidth: "80px" }}></th>
              </tr>
            </thead>

            <tbody className="bg-white">
              <LinearGradientDivider colSpan={config.colSpan} />

              {data.map((item, index) => {
                const statusUI = getScreeningStatusInfo(item.screeningStatus || "stable")
                const isEditing = editHook?.isEditingItem(item.id)
                const isNameHovered = hoveredNames.has(item.id)

                return (
                  <React.Fragment key={item.id}>
                    <tr className="bg-white hover:bg-gray-50 transition-colors">
                      {/* Name with truncation and hover */}
                      <td className="px-4 py-3 text-left whitespace-nowrap" data-name-column="true">
                        {isEditing ? (
                          <input
                            type="text"
                            name="fullName"
                            value={editHook.editData.fullName}
                            onChange={(e) => editHook.updateField('fullName', e.target.value)}
                            className="text-sm font-medium text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 w-full min-w-[200px] hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                          />
                        ) : (
                          <div
                            className={clsx(
                              "text-sm font-medium cursor-pointer transition-colors",
                              isNameHovered ? "text-[#488BBE] underline" : "text-gray-900",
                            )}
                            onClick={(e) => handleNameClick(item.id, e)}
                            onMouseEnter={() => handleNameHover(item.id, true)}
                            onMouseLeave={() => handleNameHover(item.id, false)}
                            title={item.fullName}
                          >
                            {highlightSearchTerm(truncateText(item.fullName), searchInput)}
                          </div>
                        )}
                      </td>

                      {/* Type-specific columns - simplified rendering */}
                      {type === "student" ? (
                        <>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.classroom && item.grade ? `${item.classroom} - ${item.grade}` : item.classroom || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-600">{item.gender === "male" ? "L" : "P"}</div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-600">{highlightSearchTerm(item.nis, searchInput)}</div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-600">{item.iqScore || "-"}</div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-600 truncate" title={item.department}>
                              {item.department}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-600 truncate" title={item.position}>
                              {item.position}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-600">{item.gender === "male" ? "L" : "P"}</div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.age} <span className="hidden sm:inline">Tahun</span><span className="sm:hidden">Thn</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.yearsOfService} <span className="hidden sm:inline">Tahun</span><span className="sm:hidden">Thn</span>
                            </div>
                          </td>
                        </>
                      )}

                      {/* Screening Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full cursor-pointer"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            handleStatusHover(item.screeningStatus || "stable", rect, true)
                          }}
                          onMouseLeave={() => handleStatusHover(null, null, false)}
                        >
                          <span className={statusUI.iconClass}>{statusUI.icon}</span>
                        </span>
                      </td>

                      {/* Counseling Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={clsx("text-sm", item.counselingStatus ? "text-[#6DAF31]" : "text-[#EE4266]")}>
                          {item.counselingStatus ? "Sudah" : "Belum"}
                        </span>
                      </td>

                      {/* Edit Actions */}
                      <td className="px-4 py-3 text-center relative whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#488BBE] hover:bg-blue-50 transition-colors relative"
                            onClick={() => editHook?.startEditing(item.id, item)}
                            disabled={editHook?.editingItemId !== null}
                            onMouseEnter={() => setShowEditTooltip(item.id)}
                            onMouseLeave={() => setShowEditTooltip(null)}
                          >
                            <span className="material-icons text-lg">edit</span>
                            {showEditTooltip === item.id && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#00000080] text-white text-xs rounded whitespace-nowrap shadow-lg z-[9999]">
                                Edit
                              </div>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    <LinearGradientDivider colSpan={config.colSpan} />
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
              className="fixed bg-[#00000080] text-white text-xs rounded px-2 py-1 whitespace-nowrap z-[9999] shadow-lg"
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
            <span className="material-icons text-gray-400 text-5xl">{config.emptyIcon}</span>
            <p className="text-gray-500 mt-2 text-base">{config.emptyText}</p>
          </div>
        )}
      </div>
    )
  },
)

SharedTable.displayName = "SharedTable"

export default SharedTable