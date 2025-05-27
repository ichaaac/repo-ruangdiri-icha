"use client"

import React, { useState, useRef, useCallback, useEffect, forwardRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, Transition } from "@headlessui/react"
import clsx from "clsx"

// Custom Dropdown Component
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
          modal={false}
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
                      active && "bg-[#E2F9FF]",
                      isSelected && "bg-[#E2F9FF] text-[#488BBE] font-medium",
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

// SIMPLE Custom Scrollbar Component - GUARANTEED TO WORK
const SimpleScrollbar = ({ contentRef, className = "" }) => {
  const scrollbarRef = useRef(null)
  const thumbRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [scrollRatio, setScrollRatio] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const updateScrollbar = useCallback(() => {
    if (!contentRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = contentRef.current
    const maxScroll = scrollWidth - clientWidth

    console.log("Scrollbar update:", { scrollLeft, scrollWidth, clientWidth, maxScroll })

    // Show scrollbar if there's any overflow
    setIsVisible(maxScroll > 5)
    if (maxScroll > 0) {
      setScrollRatio(scrollLeft / maxScroll)
    }
  }, [contentRef])

  const handleScrollbarClick = useCallback(
    (e) => {
      if (!contentRef.current || !scrollbarRef.current || e.target === thumbRef.current) return

      const rect = scrollbarRef.current.getBoundingClientRect()
      const percentage = (e.clientX - rect.left) / rect.width
      const maxScroll = contentRef.current.scrollWidth - contentRef.current.clientWidth

      contentRef.current.scrollLeft = percentage * maxScroll
    },
    [contentRef],
  )

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(true)

      const startX = e.clientX
      const startScrollLeft = contentRef.current.scrollLeft
      const scrollbarWidth = scrollbarRef.current.offsetWidth
      const maxScroll = contentRef.current.scrollWidth - contentRef.current.clientWidth

      const handleMouseMove = (e) => {
        const deltaX = e.clientX - startX
        const percentage = deltaX / scrollbarWidth
        contentRef.current.scrollLeft = startScrollLeft + percentage * maxScroll
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [contentRef],
  )

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    // Add scroll listener
    content.addEventListener("scroll", updateScrollbar)

    // Initial update
    setTimeout(updateScrollbar, 100)

    // Add resize observer
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateScrollbar, 50)
    })
    resizeObserver.observe(content)

    // Also observe the table inside
    const table = content.querySelector("table")
    if (table) {
      resizeObserver.observe(table)
    }

    return () => {
      content.removeEventListener("scroll", updateScrollbar)
      resizeObserver.disconnect()
    }
  }, [contentRef, updateScrollbar])

  // ALWAYS show for debugging - remove this later
  // if (!isVisible) return null

  return (
    <div className={clsx("relative w-full h-4 px-3 sm:px-4 mb-2 bg-gray-50 rounded", className)}>
      <div className="text-xs text-gray-500 mb-1">
        Custom Scrollbar {isVisible ? "(Active)" : "(Hidden)"} - Ratio: {scrollRatio.toFixed(2)}
      </div>
      <div
        ref={scrollbarRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 transition-colors"
        onClick={handleScrollbarClick}
      >
        <div
          ref={thumbRef}
          className={clsx(
            "absolute h-full bg-[#488BBE] rounded-full transition-opacity",
            isDragging ? "opacity-100" : "opacity-80 hover:opacity-100",
          )}
          style={{
            width: "20%",
            left: `${scrollRatio * 80}%`,
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
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
 * SIMPLE Responsive Shared Table Component with GUARANTEED Working Scrollbar
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
    },
    ref,
  ) => {
    const [editingId, setEditingId] = useState(null)
    const [editData, setEditData] = useState({})
    const [showHelpTooltip, setShowHelpTooltip] = useState(false)
    const [hoveredStatus, setHoveredStatus] = useState(null)
    const [showEditTooltip, setShowEditTooltip] = useState(null)
    const [clickedNames, setClickedNames] = useState(new Set())
    const helpIconRef = useRef(null)
    const observerRef = useRef(null)
    const contentRef = useRef(null) // Internal ref for scrollbar

    // Configure table based on type with VERY LARGE minWidth to GUARANTEE scrollbar
    const tableConfig = {
      student: {
        minWidth: 2500, // VERY LARGE to guarantee overflow
        emptyIcon: "school",
        emptyText: "Tidak ada data siswa.",
        detailPath: "/organization/school/student",
      },
      employee: {
        minWidth: 2800, // VERY LARGE to guarantee overflow
        emptyIcon: "business_center",
        emptyText: "Tidak ada data karyawan.",
        detailPath: "/organization/company/employee",
      },
    }

    const config = tableConfig[type]

    // Reset editing when filters change
    useEffect(() => {
      if (filtersChanged && editingId) {
        setEditingId(null)
        setEditData({})
      }
    }, [filtersChanged, editingId])

    // Expose reset method to parent
    useEffect(() => {
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

      if (type === "student" && name === "iqScore") {
        processedValue = value.replace(/[^0-9]/g, "").substring(0, 3)
      } else if (type === "employee" && (name === "age" || name === "yearsOfService")) {
        processedValue = value.replace(/[^0-9]/g, "").substring(0, 2)
      }

      setEditData((prev) => ({ ...prev, [name]: processedValue }))
    }

    // Helper functions
    const getScreeningStatusUI = (status) => {
      const statusMap = {
        at_risk: { bg: "bg-red-100", icon: "warning", color: "text-red-500", text: "Berisiko" },
        monitored: { bg: "bg-yellow-100", icon: "error", color: "text-yellow-500", text: "Pengawasan" },
        stable: { bg: "bg-green-100", icon: "check_circle", color: "text-green-500", text: "Stabil" },
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

    // Linear gradient divider
    const LinearGradientDivider = () => (
      <tr style={{ height: "1px" }}>
        <td colSpan={type === "student" ? 8 : 9} className="p-0">
          <div
            style={{
              height: "1px",
              backgroundImage: "linear-gradient(to right, #FFFFFF, #488BBE40, #FFFFFF)",
            }}
          />
        </td>
      </tr>
    )

    return (
      <div className="relative w-full">
        {/* Simple Custom Scrollbar positioned above table */}
        <SimpleScrollbar contentRef={contentRef} className="mb-2" />

        {/* GUARANTEED OVERFLOW Table container */}
        <div
          ref={contentRef}
          className="w-full border-2 border-red-300 rounded-lg bg-blue-50"
          style={{
            overflowX: "scroll", // FORCE scroll always
            overflowY: "hidden",
            maxWidth: "100%",
            height: "auto",
          }}
        >
          {/* Debug info */}
          <div className="text-xs text-red-600 p-2 bg-yellow-100">
            Container Debug: This should ALWAYS have horizontal scroll. Table minWidth: {config.minWidth}px
          </div>

          {/* Inner wrapper to FORCE horizontal scroll */}
          <div style={{ minWidth: "3000px", width: "max-content", backgroundColor: "#f0f9ff" }}>
            <table className="w-full border-separate border-spacing-0" style={{ minWidth: `${config.minWidth}px` }}>
              <thead className="bg-[#E2F9FF]">
                <tr>
                  {/* Name Column - ONLY icon is clickable, not the whole header */}
                  <th className="px-2 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>NAMA</span>
                      <span
                        className="material-icons text-xs sm:text-sm cursor-pointer hover:text-[#3399e9] transition-colors"
                        onClick={() => requestSort("fullName")}
                      >
                        {getSortIcon("fullName")}
                      </span>
                    </div>
                  </th>

                  {/* Type-specific columns with responsive text */}
                  {type === "student" ? (
                    <>
                      <th className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                        KELAS
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                        <span className="hidden sm:inline">JENIS KELAMIN</span>
                        <span className="sm:hidden">GENDER</span>
                      </th>
                      <th
                        className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:bg-[#D1F4FF] transition-colors"
                        onClick={() => requestSort("nis")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          NIS
                          <span className="material-icons text-xs sm:text-sm">{getSortIcon("nis")}</span>
                        </div>
                      </th>
                      <th
                        className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:bg-[#D1F4FF] transition-colors"
                        onClick={() => requestSort("iqScore")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="hidden sm:inline">SKOR IQ</span>
                          <span className="sm:hidden">IQ</span>
                          <span className="material-icons text-xs sm:text-sm">{getSortIcon("iqScore")}</span>
                        </div>
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                        <span className="hidden sm:inline">DEPARTEMEN</span>
                        <span className="sm:hidden">DEPT</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                        JABATAN
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                        <span className="hidden sm:inline">JENIS KELAMIN</span>
                        <span className="sm:hidden">GENDER</span>
                      </th>
                      <th
                        className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:bg-[#D1F4FF] transition-colors"
                        onClick={() => requestSort("age")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          USIA
                          <span className="material-icons text-xs sm:text-sm">{getSortIcon("age")}</span>
                        </div>
                      </th>
                      <th
                        className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:bg-[#D1F4FF] transition-colors"
                        onClick={() => requestSort("yearsOfService")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="hidden sm:inline">LAMA BEKERJA</span>
                          <span className="sm:hidden">MASA KERJA</span>
                          <span className="material-icons text-xs sm:text-sm">{getSortIcon("yearsOfService")}</span>
                        </div>
                      </th>
                    </>
                  )}

                  {/* Common columns */}
                  <th className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      SKRINING
                      <span
                        className="material-icons text-xs sm:text-sm ml-1 text-gray-400 cursor-help opacity-70 hover:opacity-100 transition-opacity"
                        ref={helpIconRef}
                        onMouseEnter={() => setShowHelpTooltip(true)}
                        onMouseLeave={() => setShowHelpTooltip(false)}
                      >
                        help_outline
                      </span>
                      <HelpTooltip helpIconRef={helpIconRef} showHelpTooltip={showHelpTooltip} />
                    </div>
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-center text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                    KONSELING
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-center whitespace-nowrap w-12 sm:w-16"></th>

                  {/* EXTRA COLUMNS TO FORCE OVERFLOW */}
                  <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                    EXTRA COL 1
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                    EXTRA COL 2
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                    EXTRA COL 3
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                    EXTRA COL 4
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                    EXTRA COL 5
                  </th>
                </tr>
              </thead>

              <tbody>
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
                        {/* Name - Responsive */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-left whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              name="fullName"
                              value={editData.fullName}
                              onChange={handleEditChange}
                              className="text-xs sm:text-sm font-medium text-gray-900 border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 w-full min-w-[120px] sm:min-w-[200px] hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                            />
                          ) : (
                            <div
                              className={clsx(
                                "text-xs sm:text-sm font-medium cursor-pointer max-w-[120px] sm:max-w-none truncate",
                                isClicked ? "text-[#488BBE] underline" : "text-gray-900",
                              )}
                              onClick={(e) => handleNameClick(item.id, e)}
                              title={item.fullName}
                            >
                              {highlightText(item.fullName)}
                            </div>
                          )}
                        </td>

                        {/* Type-specific columns with responsive design */}
                        {type === "student" ? (
                          <>
                            {/* Classroom - Responsive */}
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                              {isEditing ? (
                                <div className="flex gap-1 justify-center" style={{ zIndex: 9000 }}>
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
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {item.classroom && item.grade
                                    ? `${item.classroom} - ${item.grade}`
                                    : item.classroom || "-"}
                                </div>
                              )}
                            </td>

                            {/* Gender - Responsive */}
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                              {isEditing ? (
                                <div className="relative" style={{ zIndex: 9000 }}>
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
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {item.gender === "male" ? "L" : "P"}
                                </div>
                              )}
                            </td>

                            {/* NIS - Responsive */}
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  name="nis"
                                  value={editData.nis}
                                  onChange={handleEditChange}
                                  className="text-xs sm:text-sm text-gray-600 border border-gray-300 rounded-md px-1 sm:px-2 py-1 w-16 sm:w-24 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                                />
                              ) : (
                                <div className="text-xs sm:text-sm text-gray-600">{highlightText(item.nis)}</div>
                              )}
                            </td>

                            {/* IQ Score - Responsive */}
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  name="iqScore"
                                  value={editData.iqScore}
                                  onChange={handleEditChange}
                                  className="text-xs sm:text-sm text-gray-600 border border-gray-300 rounded-md px-1 sm:px-2 py-1 w-12 sm:w-16 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                                  maxLength="3"
                                  inputMode="numeric"
                                />
                              ) : (
                                <div className="text-xs sm:text-sm text-gray-600">{item.iqScore || "-"}</div>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Department - Responsive */}
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                              {isEditing ? (
                                <div className="relative" style={{ zIndex: 9000 }}>
                                  <CustomDropdown
                                    name="department"
                                    value={editData.department}
                                    onChange={handleEditChange}
                                    options={optionsData.departments || []}
                                    className="min-w-[80px] sm:min-w-[150px]"
                                  />
                                </div>
                              ) : (
                                <div
                                  className="text-xs sm:text-sm text-gray-600 max-w-[80px] sm:max-w-none truncate"
                                  title={item.department}
                                >
                                  {item.department}
                                </div>
                              )}
                            </td>

                            {/* Position - Responsive */}
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                              {isEditing ? (
                                <div className="relative" style={{ zIndex: 9000 }}>
                                  <CustomDropdown
                                    name="position"
                                    value={editData.position}
                                    onChange={handleEditChange}
                                    options={optionsData.positions || []}
                                    className="min-w-[80px] sm:min-w-[120px]"
                                  />
                                </div>
                              ) : (
                                <div
                                  className="text-xs sm:text-sm text-gray-600 max-w-[80px] sm:max-w-none truncate"
                                  title={item.position}
                                >
                                  {item.position}
                                </div>
                              )}
                            </td>

                            {/* Gender - Responsive */}
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                              {isEditing ? (
                                <div className="relative" style={{ zIndex: 9000 }}>
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
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {item.gender === "male" ? "L" : "P"}
                                </div>
                              )}
                            </td>

                            {/* Age - Responsive */}
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="text"
                                    name="age"
                                    value={editData.age}
                                    onChange={handleEditChange}
                                    className="text-xs sm:text-sm text-gray-600 border border-gray-300 rounded-md px-1 sm:px-2 py-1 w-8 sm:w-12 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                                    maxLength="2"
                                    inputMode="numeric"
                                  />
                                  <span className="text-[10px] sm:text-sm text-gray-600">Thn</span>
                                </div>
                              ) : (
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {item.age} <span className="hidden sm:inline">Tahun</span>
                                  <span className="sm:hidden">Thn</span>
                                </div>
                              )}
                            </td>

                            {/* Years of Service - Responsive */}
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="text"
                                    name="yearsOfService"
                                    value={editData.yearsOfService}
                                    onChange={handleEditChange}
                                    className="text-xs sm:text-sm text-gray-600 border border-gray-300 rounded-md px-1 sm:px-2 py-1 w-8 sm:w-12 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                                    maxLength="2"
                                    inputMode="numeric"
                                  />
                                  <span className="text-[10px] sm:text-sm text-gray-600">Thn</span>
                                </div>
                              ) : (
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {item.yearsOfService} <span className="hidden sm:inline">Tahun</span>
                                  <span className="sm:hidden">Thn</span>
                                </div>
                              )}
                            </td>
                          </>
                        )}

                        {/* Screening Status - Responsive */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
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
                            <span className={clsx("material-icons text-xs sm:text-base", statusUI.color)}>
                              {statusUI.icon}
                            </span>
                          </span>
                        </td>

                        {/* Counseling Status - Responsive */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                          <span
                            className={clsx(
                              "text-xs sm:text-sm",
                              item.counselingStatus ? "text-[#6DAF31]" : "text-[#EE4266]",
                            )}
                          >
                            {item.counselingStatus ? "Sudah" : "Belum"}
                          </span>
                        </td>

                        {/* Actions - Responsive */}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center relative whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex space-x-1 sm:space-x-2 justify-center">
                              <button
                                className={clsx(
                                  "text-[#EE4266] hover:text-[#b53434] transition-colors",
                                  updateItem.isPending && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => cancelEditing()}
                                disabled={updateItem.isPending}
                              >
                                <span className="material-icons text-sm sm:text-base">cancel</span>
                              </button>

                              <button
                                className={clsx(
                                  "text-[#9BCA61] hover:text-[#6DAF31] transition-colors",
                                  (!hasChanges || updateItem.isPending) && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => hasChanges && saveEditing(item.id)}
                                disabled={!hasChanges || updateItem.isPending}
                              >
                                <span className="material-icons text-sm sm:text-base">check_circle</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              className="text-gray-400 hover:text-[#488BBE] transition-colors relative"
                              onClick={() => startEditing(item.id)}
                              disabled={editingId !== null}
                              onMouseEnter={() => setShowEditTooltip(item.id)}
                              onMouseLeave={() => setShowEditTooltip(null)}
                            >
                              <span className="material-icons text-sm sm:text-base">edit</span>
                              {showEditTooltip === item.id && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#00000080] text-white text-xs rounded whitespace-nowrap shadow-lg z-[9999]">
                                  Edit
                                </div>
                              )}
                            </button>
                          )}
                        </td>

                        {/* EXTRA COLUMNS TO FORCE OVERFLOW */}
                        <td className="px-4 py-3 text-center text-xs text-gray-500">Extra 1</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">Extra 2</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">Extra 3</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">Extra 4</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">Extra 5</td>
                      </tr>
                      <LinearGradientDivider />
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
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

        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div className="py-4 text-center">
            <span className="material-icons animate-spin text-[#488BBE] text-sm sm:text-base">refresh</span>
            <span className="text-[#488BBE] text-xs sm:text-sm ml-2">Loading...</span>
          </div>
        )}

        {/* Empty state */}
        {data.length === 0 && !isFetchingNextPage && (
          <div className="text-center py-6 sm:py-8">
            <span className="material-icons text-gray-400 text-3xl sm:text-5xl">{config.emptyIcon}</span>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">{config.emptyText}</p>
          </div>
        )}
      </div>
    )
  },
)

SharedTable.displayName = "SharedTable"

export default SharedTable
