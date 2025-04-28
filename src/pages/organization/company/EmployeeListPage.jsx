"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import CompanySidebar from "../../../components/organization/company/CompanySidebar"
const generateEmployeeData = (count) => {
  const departments = ["Creative", "Finance", "Marketing", "IT", "HR", "Operations", "Sales"]
  const positions = ["Staff", "Head", "Manager", "Assistant", "Supervisor", "Director"]
  const screeningStatuses = ["warning", "error", "success"]
  const counselingStatuses = ["Sudah", "Belum"]
  const genders = ["L", "P"]
  const ages = ["25 Tahun", "28 Tahun", "30 Tahun", "32 Tahun", "35 Tahun", "36 Tahun", "40 Tahun", "42 Tahun"]
  const workDurations = ["1 Tahun", "2 Tahun", "3 Tahun", "4 Tahun", "5 Tahun", "6 Tahun", "7 Tahun"]

  return Array.from({ length: count }, (_, i) => {
    const id = i + 1
    const gender = genders[Math.floor(Math.random() * genders.length)]
    return {
      id,
      employeeId: `EMP-${String(id).padStart(5, '0')}`,
      name: `Employee ${id}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      position: positions[Math.floor(Math.random() * positions.length)],
      gender,
      age: ages[Math.floor(Math.random() * ages.length)],
      workDuration: workDurations[Math.floor(Math.random() * workDurations.length)],
      screening: { status: screeningStatuses[Math.floor(Math.random() * screeningStatuses.length)] },
      counseling: counselingStatuses[Math.floor(Math.random() * counselingStatuses.length)],
      image: `https://randomuser.me/api/portraits/${gender === "L" ? "men" : "women"}/${id % 70}.jpg`,
    }
  })
}

// Initial employee data - we generate more than needed to simulate backend data
const allEmployeeData = generateEmployeeData(50)

const EmployeeListPage = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [employees, setEmployees] = useState([...allEmployeeData])
  const [filteredEmployees, setFilteredEmployees] = useState([...allEmployeeData])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const totalEmployees = filteredEmployees.length
  const femaleEmployees = filteredEmployees.filter((emp) => emp.gender === "P").length
  const maleEmployees = filteredEmployees.filter((emp) => emp.gender === "L").length

  // Check for mobile screen on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Close sidebar on mobile automatically
      if (window.innerWidth < 768) {
        setSidebarExpanded(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Filter employees based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees([...allEmployeeData])
    } else {
      const filtered = allEmployeeData.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredEmployees(filtered)
    }
    
    // Reset to first page when search changes
    setCurrentPage(1)
  }, [searchTerm])

  // Calculate total pages
  useEffect(() => {
    setTotalPages(Math.ceil(filteredEmployees.length / pageSize))
  }, [filteredEmployees, pageSize])

  // Apply sorting
  useEffect(() => {
    let sortedEmployees = [...filteredEmployees]
    
    if (sortConfig.key !== null) {
      sortedEmployees.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }
    
    setEmployees(sortedEmployees)
  }, [filteredEmployees, sortConfig])

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return employees.slice(startIndex, endIndex)
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const requestSort = (key) => {
    let direction = "ascending"

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      direction = null
    }

    setSortConfig({ key, direction })
  }

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return "sort"
    }
    return sortConfig.direction === "ascending" ? "arrow_upward" : "arrow_downward"
  }

  // Pagination controls
  const goToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToLastPage = () => {
    if (currentPage !== totalPages) {
      setCurrentPage(totalPages)
    }
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Render page numbers (1, 2, 3, ...)
  const renderPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 3 // Show maximum 3 page numbers

    let startPage = Math.max(1, currentPage - 1)
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages)

    // Adjust start page if we're at the end to still show max visible pages
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`flex items-center justify-center w-8 h-8 ${
            i === currentPage
              ? "bg-[#4E9DD3] text-white rounded"
              : "text-[#6B7280] hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      )
    }

    return pageNumbers
  }

  // Edit functionality
  const startEditing = (id) => {
    if (editingId !== null) return // Prevent editing multiple rows

    const employee = employees.find((emp) => emp.id === id)
    setEditingId(id)
    setEditData({
      name: employee.name,
      department: employee.department,
      position: employee.position,
      gender: employee.gender,
      age: employee.age,
      workDuration: employee.workDuration,
      employeeId: employee.employeeId
    })
    setHasChanges(false)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditData({})
    setHasChanges(false)
  }

  const saveEditing = (id) => {
    if (!hasChanges) return // Prevent saving if no changes

    // In a real app, you would update the data in your backend
    const updatedEmployees = filteredEmployees.map((emp) => {
      if (emp.id === id) {
        return { ...emp, ...editData }
      }
      return emp
    })

    setFilteredEmployees(updatedEmployees)
    setEditingId(null)
    setEditData({})
    setHasChanges(false)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData((prev) => ({ ...prev, [name]: value }))
    setHasChanges(true)
  }

  // Determine effective sidebar state for content positioning
  const isSidebarOpen = sidebarExpanded || sidebarHovered

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <CompanySidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} onHoverChange={setSidebarHovered} />

        <div
          className="w-full min-h-screen transition-all duration-300 ease-in-out pt-4 bg-white"
          style={{
            marginLeft: isMobile ? (isSidebarOpen ? "240px" : "0") : (isSidebarOpen ? "240px" : "69px"),
          }}
        >
          {/* Language and notification controls directly in the page */}
          <div className="flex justify-end px-6 py-4 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[#8b8b8b] text-sm font-medium">ID / <span className="font-normal">EN</span></span>
              </div>

              <div className="flex items-center">
                <span className="material-icons text-[#8b8b8b] cursor-pointer hover:text-[#488BBE] transition-colors">notifications</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-10 w-full max-w-[1440px] mx-auto">
            {/* Page Header - Part of the header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
              <h1 className="text-xl md:text-3xl font-bold text-[#488bbe] mb-4 md:mb-0">
                Halo, PT Mencari Cinta Sejati
              </h1>

              <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-end">
                {/* Employee Stats - Part of the header */}
                <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#3399E9]">groups</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{totalEmployees}</div>
                    <div className="text-xs text-[#488BBE]">Karyawan</div>
                  </div>
                </div>

                <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#FF86E1]">face_2</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{femaleEmployees}</div>
                    <div className="text-xs text-[#488BBE]">Perempuan</div>
                  </div>
                </div>

                <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#FF7173]">face</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{maleEmployees}</div>
                    <div className="text-xs text-[#488BBE]">Laki Laki</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter - Part of the header */}
            <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
              <div className="relative flex-grow w-full md:max-w-md">
                <span className="absolute inset-y-0 left-3 flex items-center">
                  <span className="material-icons text-[#8b8b8b]">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Cari Nama atau ID Karyawan..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 w-full rounded-full border border-[#d9d9d9] focus:outline-none focus:border-[#488bbe]"
                />
              </div>

              {/* Global Filter Button - No background */}
              <button
                className="flex items-center justify-center px-4 py-2 rounded-full text-[#8b8b8b] hover:bg-[#f7f7f9] transition-colors w-full md:w-auto"
                onClick={() => setShowFilterModal(true)}
              >
                <span className="material-icons mr-2">filter_alt</span>
                <span>Filter</span>
              </button>
            </div>

            {/* Employee Table with Fixed Width Columns */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <thead className="bg-[#e8f5ff]">
                    <tr>
                      <th 
                        className="w-[200px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("name")}
                      >
                        <div className="flex items-center">
                          NAMA
                          <span className="material-icons text-sm ml-1">{getSortIcon("name")}</span>
                        </div>
                      </th>
                      <th 
                        className="w-[120px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("employeeId")}
                      >
                        <div className="flex items-center">
                          ID KARYAWAN
                          <span className="material-icons text-sm ml-1">{getSortIcon("employeeId")}</span>
                        </div>
                      </th>
                      <th className="w-[120px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        DEPARTEMEN
                      </th>
                      <th className="w-[100px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        JABATAN
                      </th>
                      <th className="w-[80px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        JENIS KELAMIN
                      </th>
                      <th 
                        className="w-[100px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("age")}
                      >
                        <div className="flex items-center">
                          USIA
                          <span className="material-icons text-sm ml-1">{getSortIcon("age")}</span>
                        </div>
                      </th>
                      <th 
                        className="w-[120px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("workDuration")}
                      >
                        <div className="flex items-center">
                          LAMA BEKERJA
                          <span className="material-icons text-sm ml-1">{getSortIcon("workDuration")}</span>
                        </div>
                      </th>
                      <th className="w-[100px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        SKRINING
                      </th>
                      <th className="w-[100px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        KONSELING
                      </th>
                      <th className="w-[80px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCurrentPageData().map((employee) => (
                      <tr 
                        key={employee.id}
                        className="hover:bg-gradient-to-r from-white via-[#488BBE20] to-white transition-all duration-300"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={employee.image || "/placeholder.svg"}
                                alt={employee.name}
                              />
                            </div>
                            <div className="ml-4">
                              {editingId === employee.id ? (
                                <input
                                  type="text"
                                  name="name"
                                  value={editData.name}
                                  onChange={handleEditChange}
                                  className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                                />
                              ) : (
                                <div className="text-sm font-medium text-gray-900">
                                  {employee.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === employee.id ? (
                            <input
                              type="text"
                              name="employeeId"
                              value={editData.employeeId}
                              onChange={handleEditChange}
                              className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <div className="text-sm text-gray-500">{employee.employeeId}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === employee.id ? (
                            <input
                              type="text"
                              name="department"
                              value={editData.department}
                              onChange={handleEditChange}
                              className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <div className="text-sm text-gray-500">{employee.department}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === employee.id ? (
                            <input
                              type="text"
                              name="position"
                              value={editData.position}
                              onChange={handleEditChange}
                              className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <div className="text-sm text-gray-500">{employee.position}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === employee.id ? (
                            <select
                              name="gender"
                              value={editData.gender}
                              onChange={handleEditChange}
                              className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="L">L</option>
                              <option value="P">P</option>
                            </select>
                          ) : (
                            <div className="text-sm text-gray-500">{employee.gender}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === employee.id ? (
                            <input
                              type="text"
                              name="age"
                              value={editData.age}
                              onChange={handleEditChange}
                              className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <div className="text-sm text-gray-500">{employee.age}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === employee.id ? (
                            <input
                              type="text"
                              name="workDuration"
                              value={editData.workDuration}
                              onChange={handleEditChange}
                              className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <div className="text-sm text-gray-500">{employee.workDuration}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                              employee.screening.status === "warning"
                                ? "bg-red-100"
                                : employee.screening.status === "error"
                                  ? "bg-yellow-100"
                                  : "bg-green-100"
                            }`}
                          >
                            {employee.screening.status === "warning" && (
                              <span className="material-icons text-red-500">warning</span>
                            )}
                            {employee.screening.status === "error" && (
                              <span className="material-icons text-yellow-500">error</span>
                            )}
                            {employee.screening.status === "success" && (
                              <span className="material-icons text-green-500">check_circle</span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`${employee.counseling === "Sudah" ? "text-green-500" : "text-red-500"}`}>
                            {employee.counseling}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {editingId === employee.id ? (
                            <div className="flex space-x-2 justify-center">
                              <button
                                className={`text-[#9BCA61] hover:text-green-700 ${!hasChanges ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={() => hasChanges && saveEditing(employee.id)}
                                disabled={!hasChanges}
                                aria-label="Save"
                              >
                                <span className="material-icons">
                                  check_circle
                                </span>
                              </button>
                              <button className="text-[#EE4266] hover:text-red-700" onClick={cancelEditing} aria-label="Cancel">
                                <span className="material-icons">
                                  cancel
                                </span>
                              </button>
                            </div>
                          ) : (
                            <button
                              className={`text-[#8b8b8b] hover:text-[#488bbe] ${editingId !== null ? "opacity-50 cursor-not-allowed" : ""}`}
                              onClick={() => editingId === null && startEditing(employee.id)}
                              disabled={editingId !== null}
                              aria-label="Edit employee"
                            >
                              <span className="material-icons">edit</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Customized Pagination - Directly in the page */}
              <div className="flex items-center justify-center bg-[#F0F2F5] py-2">
                {/* First page button */}
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center w-8 h-8 ${
                    currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-[#6B7280] hover:text-[#4E9DD3]"
                  }`}
                  aria-label="Go to first page"
                >
                  <span className="material-icons text-xl">first_page</span>
                </button>

                {/* Previous page button */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center w-8 h-8 ${
                    currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-[#6B7280] hover:text-[#4E9DD3]"
                  }`}
                  aria-label="Go to previous page"
                >
                  <span className="material-icons text-xl">chevron_left</span>
                </button>

                {/* Page numbers */}
                <div className="flex mx-1">
                  {renderPageNumbers()}
                </div>

                {/* Next page button */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center justify-center w-8 h-8 ${
                    currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-[#6B7280] hover:text-[#4E9DD3]"
                  }`}
                  aria-label="Go to next page"
                >
                  <span className="material-icons text-xl">chevron_right</span>
                </button>

                {/* Last page button */}
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center justify-center w-8 h-8 ${
                    currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-[#6B7280] hover:text-[#4E9DD3]"
                  }`}
                  aria-label="Go to last page"
                >
                  <span className="material-icons text-xl">last_page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-[#8DD0DEB2] flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-[#488bbe]">Filter</h2>
              <button onClick={() => setShowFilterModal(false)} aria-label="Close filter modal">
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departemen</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Departemen</option>
                  <option value="Creative">Creative</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Jabatan</option>
                  <option value="Staff">Staff</option>
                  <option value="Head">Head</option>
                  <option value="Manager">Manager</option>
                  <option value="Director">Director</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="all" className="form-radio" defaultChecked />
                    <span className="ml-2">Semua</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="L" className="form-radio" />
                    <span className="ml-2">Laki-laki</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="P" className="form-radio" />
                    <span className="ml-2">Perempuan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Skrining</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Status</option>
                  <option value="success">Aman</option>
                  <option value="error">Pengawasan</option>
                  <option value="warning">Beresiko</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Konseling</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Status</option>
                  <option value="Sudah">Sudah</option>
                  <option value="Belum">Belum</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                className="px-4 py-2 border border-[#488bbe] text-[#488bbe] rounded-full hover:bg-[#e8f5ff]"
                onClick={() => setShowFilterModal(false)}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-[#488bbe] text-white rounded-full hover:bg-[#3399e9]"
                onClick={() => setShowFilterModal(false)}
              >
                Terapkan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default EmployeeListPage