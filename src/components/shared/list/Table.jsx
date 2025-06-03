
import React, { useState, useRef, useCallback, forwardRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, Transition } from "@headlessui/react"
import clsx from "clsx"


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
      {/* Menggunakan Menu.Button alih-alih Menu lagi */}
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
        {/* Menggunakan Menu.Items alih-alih Menu lagi */}
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
              /* Menggunakan Menu.Item alih-alih Menu */
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
        className="fixed bg-[#00000080] text-white text-xs rounded-md p-2.5 shadow-lg z-[9999]"
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

/**
 * FIXED: Responsive table that adapts to sidebar state and removes excessive whitespace
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
      resetEditMode,
      filtersChanged,
      isLoading = false,
      sidebarExpanded = false,
    },
    ref,
  ) => {
    const [editingId, setEditingId] = useState(null)
    const [editData, setEditData] = useState({})
    const [showHelpTooltip, setShowHelpTooltip] = useState(false)
    const [hoveredStatus, setHoveredStatus] = useState(null)
    const [showEditTooltip, setShowEditTooltip] = useState(null)
    const [clickedNames, setClickedNames] = useState(new Set())
    const [containerWidth, setContainerWidth] = useState(0)
    const helpIconRef = useRef(null)
    const observerRef = useRef(null)
    const contentRef = useRef(null)
    const [scrollRatio, setScrollRatio] = useState(0)

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

    useEffect(() => {
      const updateContainerWidth = () => {
        if (contentRef.current) {
          const sidebarWidth = sidebarExpanded ? 237 : 60
          const windowWidth = window.innerWidth
          const availableWidth = windowWidth - sidebarWidth - 48 // 48px for padding

          setContainerWidth(availableWidth)

          // Force table to recalculate layout
          if (contentRef.current) {
            contentRef.current.style.width = `${Math.max(availableWidth, 800)}px`
          }
        }
      }

      updateContainerWidth()

      // Listen for window resize
      window.addEventListener("resize", updateContainerWidth)

      // Force update after sidebar animation completes
      const timeoutId = setTimeout(updateContainerWidth, 350)

      return () => {
        window.removeEventListener("resize", updateContainerWidth)
        clearTimeout(timeoutId)
      }
    }, [sidebarExpanded])

    // ACCURATE scroll progress update
    const updateScrollProgress = useCallback(() => {
      if (!contentRef.current) return

      const { scrollLeft, scrollWidth, clientWidth } = contentRef.current
      const maxScroll = scrollWidth - clientWidth

      if (maxScroll > 0) {
        const ratio = scrollLeft / maxScroll
        setScrollRatio(ratio)
      } else {
        setScrollRatio(0)
      }
    }, [])

    // DOUBLE CLICK scroll behavior
    const handleDoubleClick = useCallback((e) => {
      // Don't trigger on fullName column or interactive elements
      const target = e.target
      if (
        target.closest("[data-name-column]") ||
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest('[role="button"]') ||
        target.closest(".dropdown")
      ) {
        return
      }

      if (!contentRef.current) return

      const { scrollLeft, scrollWidth, clientWidth } = contentRef.current
      const maxScroll = scrollWidth - clientWidth

      if (maxScroll <= 0) return

      // If at the end, scroll back to start. Otherwise, scroll to end.
      const targetScroll = scrollLeft >= maxScroll - 10 ? 0 : maxScroll

      contentRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      })
    }, [])

    // Setup scroll listener
    const setupScrollListener = useCallback(
      (element) => {
        if (!element) return

        const handleScroll = () => {
          updateScrollProgress()
        }

        element.addEventListener("scroll", handleScroll, { passive: true })

        // Initial update after DOM settles
        setTimeout(() => {
          if (element) {
            updateScrollProgress()
          }
        }, 100)

        // Return cleanup function
        return () => {
          element.removeEventListener("scroll", handleScroll)
        }
      },
      [updateScrollProgress],
    )

    // Ref callback to setup listeners
    const tableContainerRef = useCallback(
      (node) => {
        contentRef.current = node

        if (node) {
          // Setup scroll listener
          const cleanup = setupScrollListener(node)
          node._scrollCleanup = cleanup
        }
      },
      [setupScrollListener],
    )

    // Reset editing when filters change
    React.useEffect(() => {
      if (filtersChanged && editingId) {
        setEditingId(null)
        setEditData({})
      }
    }, [filtersChanged, editingId])

    // Expose reset method to parent
    React.useEffect(() => {
      if (resetEditMode && resetEditMode.current !== null) {
        resetEditMode.current = () => {
          setEditingId(null)
          setEditData({})
          setClickedNames(new Set())
        }
      }
    }, [resetEditMode])

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

    // Name click handler
    const handleNameClick = (id, e) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (editingId !== null) return

      if (clickedNames.has(id)) {
        window.open(`${config.detailPath}/${id}`, "_blank")
        setClickedNames(new Set())
      } else {
        setClickedNames(new Set([id]))
      }
    }

    // Start editing
    const startEditing = (id) => {
      if (editingId) return
      const item = data.find((d) => d.id === id)
      if (!item) return

      setEditingId(id)

      if (type === "student") {
        setEditData({
          fullName: item.fullName || "",
          classroom: item.classroom || "",
          grade: item.grade || "",
          gender: item.gender || "",
          nis: item.nis || "",
          iqScore: item.iqScore || 0,
        })
      } else {
        setEditData({
          fullName: item.fullName || "",
          department: item.department || "",
          position: item.position || "",
          gender: item.gender || "",
          age: item.age || 0,
          yearsOfService: item.yearsOfService || 0,
        })
      }
    }

    // Cancel editing
    const cancelEditing = () => {
      setEditingId(null)
      setEditData({})
    }

    // Save editing
    const saveEditing = (id) => {
      if (type === "student") {
        if (!editData.fullName?.trim()) return
        if (!editData.nis?.trim()) return
      } else {
        if (!editData.fullName?.trim()) return
      }

      const changedFields = {}
      const original = data.find((item) => item.id === id)

      if (!original) return

      Object.keys(editData).forEach((key) => {
        if (editData[key] !== original[key]) {
          changedFields[key] = editData[key]
        }
      })

      if (!Object.keys(changedFields).length) return

      // Process numeric fields
      if (type === "student" && changedFields.iqScore !== undefined) {
        changedFields.iqScore = Number.parseInt(changedFields.iqScore) || 0
      }

      if (type === "employee") {
        if (changedFields.age !== undefined) {
          changedFields.age = Number.parseInt(changedFields.age) || 0
        }
        if (changedFields.yearsOfService !== undefined) {
          changedFields.yearsOfService = Number.parseInt(changedFields.yearsOfService) || 0
        }
      }

      updateItem.mutate({ id, data: changedFields }, { onSuccess: cancelEditing })
    }

    // Handle edit change
    const handleEditChange = (e) => {
      const { name, value } = e.target
      let processedValue = value

      if (name === "fullName") {
        processedValue = value.substring(0, 70) // Limit to 70 characters
      } else if (type === "student" && name === "iqScore") {
        processedValue = value.replace(/[^0-9]/g, "").substring(0, 3)
      } else if (type === "employee" && (name === "age" || name === "yearsOfService")) {
        processedValue = value.replace(/[^0-9]/g, "").substring(0, 2)
      }

      setEditData((prev) => ({ ...prev, [name]: processedValue }))
    }

    const getScreeningStatusUI = (status) => {
      const statusMap = {
        at_risk: {
          icon: "warning",
          color: "text-red-500",
          text: "Berisiko",
          iconClass: clsx("material-icons", "text-[24px]", "leading-none", "align-middle", "mr-1.5", "text-red-500"),
        },
        monitored: {
          icon: "error",
          color: "text-yellow-500",
          text: "Pengawasan",
          iconClass: clsx("material-icons", "text-[24px]", "leading-none", "align-middle", "mr-1.5", "text-yellow-500"),
        },
        stable: {
          icon: "check_circle",
          color: "text-green-500",
          text: "Stabil",
          iconClass: clsx("material-icons", "text-[24px]", "leading-none", "align-middle", "mr-1.5", "text-green-500"),
        },
      }
    
      return statusMap[status] || statusMap.stable
    }
    
    

    const highlightText = (text) => {
      if (!searchInput || !text) return text

      const parts = text.split(new RegExp(`(${searchInput})`, "gi"))
      return parts.map((part, i) =>
        part.toLowerCase() === searchInput.toLowerCase() ? (
          <span key={i} className="font-bold bg-yellow-200">
            {part}
          </span>
        ) : (
          part
        ),
      )
    }

    const hasChanges =
      editingId &&
      editData.fullName?.trim() &&
      Object.keys(editData).some((key) => {
        const original = data.find((item) => item.id === editingId)
        return original && editData[key] !== original[key]
      })

    // FIXED: Calculate responsive table width based on sidebar state
    const getTableWidth = () => {
      const sidebarWidth = sidebarExpanded ? 237 : 60
      const availableWidth = window.innerWidth - sidebarWidth - 48

      if (availableWidth <= 768) return "100%" // Mobile
      if (availableWidth <= 1024) return "100%" // Tablet

      // Use available width but ensure minimum
      return `${Math.max(availableWidth, type === "student" ? 800 : 900)}px`
    }

    // Linear gradient divider
    const LinearGradientDivider = () => (
      <tr style={{ height: "2px" }}>
        <td colSpan={type === "student" ? 8 : 9} className="p-0">
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

    return (
      <div className="relative w-full">
        {/* VISUAL ONLY Custom Scrollbar - shows accurate progress */}
        <div className="relative w-full h-3 mb-2">
          <div className="relative h-1 bg-gray-200 rounded-full">
            <div
              className="absolute h-full bg-[#488BBE] rounded-full opacity-80"
              style={{
                width: "20%",
                left: `${scrollRatio * 80}%`,
              }}
            />
          </div>
        </div>

        {/* FIXED: Responsive container that reacts to sidebar changes */}
        <div
          ref={tableContainerRef}
          className="cursor-pointer select-none w-full"
          style={{
            width: getTableWidth(),
            maxWidth: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            transition: "width 0.3s ease-in-out", // Add smooth transition
          }}
          onDoubleClick={handleDoubleClick}
        >
          {/* Hide webkit scrollbar */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* FIXED: Responsive table with proper width calculation */}
          <table
            className="border-separate border-spacing-0 bg-white w-full"
            style={{
              width: getTableWidth(),
              minWidth: type === "student" ? "800px" : "900px", // Reduced minimum widths
              tableLayout: "auto", // Changed to auto for better responsiveness
            }}
          >
            <thead className="bg-[#E2F9FF]">
              <tr>
                {/* Name Column - REMOVED border-r */}
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
                  data-name-column="true"
                  style={{ minWidth: "200px" }}
                >
                  <div className="flex items-center gap-1">
                    <span>NAMA</span>
                    <span
                      className="material-icons text-sm cursor-pointer hover:text-[#3399e9] transition-colors"
                      onClick={() => requestSort("fullName")}
                    >
                      {getSortIcon("fullName")}
                    </span>
                  </div>
                </th>

                {/* Type-specific columns - REMOVED all border-r */}
                {type === "student" ? (
                  <>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
                      style={{ minWidth: "120px" }}
                    >
                      KELAS
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
                      style={{ minWidth: "120px" }}
                    >
                      JENIS KELAMIN
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:bg-[#D1F4FF] transition-colors"
                      onClick={() => requestSort("nis")}
                      style={{ minWidth: "120px" }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        NIS
                        <span className="material-icons text-sm">{getSortIcon("nis")}</span>
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:bg-[#D1F4FF] transition-colors"
                      onClick={() => requestSort("iqScore")}
                      style={{ minWidth: "120px" }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        SKOR IQ
                        <span className="material-icons text-sm">{getSortIcon("iqScore")}</span>
                      </div>
                    </th>
                  </>
                ) : (
                  <>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
                      style={{ minWidth: "150px" }}
                    >
                      DEPARTEMEN
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
                      style={{ minWidth: "150px" }}
                    >
                      JABATAN
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
                      style={{ minWidth: "120px" }}
                    >
                      JENIS KELAMIN
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:bg-[#D1F4FF] transition-colors"
                      onClick={() => requestSort("age")}
                      style={{ minWidth: "100px" }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        USIA
                        <span className="material-icons text-sm">{getSortIcon("age")}</span>
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:bg-[#D1F4FF] transition-colors"
                      onClick={() => requestSort("yearsOfService")}
                      style={{ minWidth: "150px" }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        LAMA BEKERJA
                        <span className="material-icons text-sm">{getSortIcon("yearsOfService")}</span>
                      </div>
                    </th>
                  </>
                )}

                {/* Common columns - REMOVED all border-r */}
                <th
                  className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
                  style={{ minWidth: "120px" }}
                >
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
                <th
                  className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap"
                  style={{ minWidth: "120px" }}
                >
                  KONSELING
                </th>
                <th className="px-4 py-3 text-center whitespace-nowrap" style={{ minWidth: "80px" }}></th>
              </tr>
            </thead>

            <tbody className="bg-white">
              <LinearGradientDivider />

              {data.map((item, index) => {
                const statusUI = getScreeningStatusUI(item.screeningStatus || "stable")
                const isLastElement = index === data.length - 1
                const isEditing = editingId === item.id
                const isClicked = clickedNames.has(item.id)

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className="bg-white hover:bg-gray-50 transition-colors"
                      ref={isLastElement ? lastItemElementRef : null}
                    >
                      {/* Name - REMOVED border-r */}
                      <td className="px-4 py-3 text-left whitespace-nowrap" data-name-column="true">
                        {isEditing ? (
                          <input
                            type="text"
                            name="fullName"
                            value={editData.fullName}
                            onChange={handleEditChange}
                            className="text-sm font-medium text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 w-full min-w-[200px] hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                          />
                        ) : (
                          <div
                            className={clsx(
                              "text-sm font-medium cursor-pointer truncate",
                              isClicked ? "text-[#488BBE] underline" : "text-gray-900",
                            )}
                            onClick={(e) => handleNameClick(item.id, e)}
                            title={item.fullName}
                          >
                            {highlightText(item.fullName)}
                          </div>
                        )}
                      </td>

                      {/* Rest of the columns with REMOVED border-r classes */}
                      {type === "student" ? (
                        <>
                          {/* Classroom - REMOVED border-r */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex gap-1 justify-center" style={{ zIndex: 9999 }}>
                                <CustomDropdown
                                  name="classroom"
                                  value={editData.classroom}
                                  onChange={handleEditChange}
                                  options={optionsData.classrooms || []}
                                  className="min-w-[50px] sm:min-w-[70px]"
                                />
                                <div className="flex items-center text-xs">-</div>
                                <CustomDropdown
                                  name="grade"
                                  value={editData.grade}
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

                          {/* Gender - REMOVED border-r */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="relative" style={{ zIndex: 999 }}>
                                <CustomDropdown
                                  name="gender"
                                  value={editData.gender}
                                  onChange={handleEditChange}
                                  options={[
                                    { value: "male", label: "L" },
                                    { value: "female", label: "P" },
                                  ]}
                                  className="w-12 sm:w-16"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">{item.gender === "male" ? "L" : "P"}</div>
                            )}
                          </td>

                          {/* NIS - REMOVED border-r */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="text"
                                name="nis"
                                value={editData.nis}
                                onChange={handleEditChange}
                                className="text-sm text-gray-600 border border-gray-300 rounded-md px-2 py-1 w-16 sm:w-24 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                              />
                            ) : (
                              <div className="text-sm text-gray-600">{highlightText(item.nis)}</div>
                            )}
                          </td>

                          {/* IQ Score - REMOVED border-r */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="text"
                                name="iqScore"
                                value={editData.iqScore}
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
                          {/* Department - REMOVED border-r */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="relative" style={{ zIndex: 999 }}>
                                <CustomDropdown
                                  name="department"
                                  value={editData.department}
                                  onChange={handleEditChange}
                                  options={optionsData.departments || []}
                                  className="min-w-[80px] sm:min-w-[150px]"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600 truncate" title={item.department}>
                                {item.department}
                              </div>
                            )}
                          </td>

                          {/* Position - REMOVED border-r */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="relative" style={{ zIndex: 999 }}>
                                <CustomDropdown
                                  name="position"
                                  value={editData.position}
                                  onChange={handleEditChange}
                                  options={optionsData.positions || []}
                                  className="min-w-[80px] sm:min-w-[120px]"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600 truncate" title={item.position}>
                                {item.position}
                              </div>
                            )}
                          </td>

                          {/* Gender - REMOVED border-r */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="relative" style={{ zIndex: 999 }}>
                                <CustomDropdown
                                  name="gender"
                                  value={editData.gender}
                                  onChange={handleEditChange}
                                  options={[
                                    { value: "male", label: "L" },
                                    { value: "female", label: "P" },
                                  ]}
                                  className="w-12 sm:w-16"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">{item.gender === "male" ? "L" : "P"}</div>
                            )}
                          </td>

                          {/* Age - REMOVED border-r */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="text"
                                  name="age"
                                  value={editData.age}
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

                          {/* Years of Service - REMOVED border-r */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="text"
                                  name="yearsOfService"
                                  value={editData.yearsOfService}
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

                      {/* Screening Status - REMOVED border-r */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={clsx(
                            "inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full cursor-pointer",
                            statusUI.bg,
                          )}
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

                      {/* Counseling Status - REMOVED border-r */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={clsx("text-sm", item.counselingStatus ? "text-[#6DAF31]" : "text-[#EE4266]")}>
                          {item.counselingStatus ? "Sudah" : "Belum"}
                        </span>
                      </td>

                      {/* FIXED: Actions - Proper button sizing and alignment */}
                      <td className="px-4 py-3 text-center relative whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className={clsx(
                                "w-8 h-8 flex items-center justify-center rounded-full text-[#EE4266] hover:text-[#b53434] hover:bg-red-50 transition-colors",
                                updateItem.isPending && "opacity-50 cursor-not-allowed",
                              )}
                              onClick={() => cancelEditing()}
                              disabled={updateItem.isPending}
                            >
                              <span className="material-icons text-lg">cancel</span>
                            </button>

                            <button
                              className={clsx(
                                "w-8 h-8 flex items-center justify-center rounded-full text-[#9BCA61] hover:text-[#6DAF31] hover:bg-green-50 transition-colors",
                                (!hasChanges || updateItem.isPending) && "opacity-50 cursor-not-allowed",
                              )}
                              onClick={() => hasChanges && saveEditing(item.id)}
                              disabled={!hasChanges || updateItem.isPending}
                            >
                              <span className="material-icons text-lg">check_circle</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#488BBE] hover:bg-blue-50 transition-colors relative"
                              onClick={() => startEditing(item.id)}
                              disabled={editingId !== null}
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
              className="fixed bg-[#00000080] text-white text-xs rounded px-2 py-1 whitespace-nowrap z-[9999] shadow-lg"
              style={{
                left: hoveredStatus.x,
                top: hoveredStatus.y - 10,
              }}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
            >
              {getScreeningStatusUI(hoveredStatus.status).text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator - REMOVED */}
        {/* {isFetchingNextPage && (
          <div className="py-4 text-center">
            <span className="material-icons animate-spin text-[#488BBE] text-base">refresh</span>
            <span className="text-[#488BBE] text-sm ml-2">Loading...</span>
          </div>
        )} */}

        {/* Empty state */}
        {data.length === 0 && !isFetchingNextPage && (
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
