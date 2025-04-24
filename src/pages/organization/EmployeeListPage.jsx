"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import Sidebar from "../../components/school/Sidebar"

const generateEmployeeData = (start, count) => {
  const departments = ["Creative", "Finance", "Marketing", "IT", "HR", "Operations", "Sales"]
  const positions = ["Staff", "Head", "Manager", "Assistant", "Supervisor", "Director"]
  const screeningStatuses = ["warning", "error", "success"]
  const counselingStatuses = ["Sudah", "Belum"]
  const genders = ["L", "P"]
  const ages = ["25 Tahun", "28 Tahun", "30 Tahun", "32 Tahun", "35 Tahun", "36 Tahun", "40 Tahun", "42 Tahun"]
  const workDurations = ["1 Tahun", "2 Tahun", "3 Tahun", "4 Tahun", "5 Tahun", "6 Tahun", "7 Tahun"]
  const employeeIds = Array.from({ length: count }, (_, i) => {
    const id = start + i
    return `EMP-${String(id).padStart(5, '0')}`
  })

  return Array.from({ length: count }, (_, i) => {
    const id = start + i
    const gender = genders[Math.floor(Math.random() * genders.length)]
    return {
      id,
      employeeId: employeeIds[i],
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

// Initial employee data
const initialEmployeeData = generateEmployeeData(1, 20)

const EmployeeListPage = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [employees, setEmployees] = useState([...initialEmployeeData])
  const [displayedEmployees, setDisplayedEmployees] = useState([...initialEmployeeData.slice(0, 10)])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hoveredEmployeeId, setHoveredEmployeeId] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const observerRef = useRef(null)
  const listContainerRef = useRef(null)

  const totalEmployees = employees.length
  const femaleEmployees = employees.filter((emp) => emp.gender === "P").length
  const maleEmployees = employees.filter((emp) => emp.gender === "L").length

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
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setPage(1)
    setDisplayedEmployees([])
  }

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setEmployees([...initialEmployeeData])
    } else {
      const filtered = initialEmployeeData.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setEmployees(filtered)
    }

    setDisplayedEmployees(employees.slice(0, 10))
  }, [searchTerm])

  const requestSort = (key) => {
    let direction = "ascending"

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      direction = null
    }

    setSortConfig({ key, direction })

    if (direction === null) {
      setEmployees([...initialEmployeeData])
      return
    }

    const sortedItems = [...employees].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "ascending" ? -1 : 1
      }
      if (a[key] > b[key]) {
        return direction === "ascending" ? 1 : -1
      }
      return 0
    })

    setEmployees(sortedItems)
    setDisplayedEmployees(sortedItems.slice(0, 10))
  }

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return "sort"
    }
    return sortConfig.direction === "ascending" ? "arrow_upward" : "arrow_downward"
  }

  const loadMoreEmployees = useCallback(() => {
    if (isLoading) return

    setIsLoading(true)

    setTimeout(() => {
      const nextPage = page + 1
      const startIndex = displayedEmployees.length
      const endIndex = startIndex + 10

      // Add more employees if needed
      if (employees.length < endIndex + 10) {
        const newEmployees = generateEmployeeData(employees.length + 1, 20)
        setEmployees((prev) => [...prev, ...newEmployees])
      }

      setDisplayedEmployees((prev) => [...prev, ...employees.slice(startIndex, endIndex)])
      setPage(nextPage)
      setIsLoading(false)
    }, 1000)
  }, [isLoading, page, employees, displayedEmployees.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreEmployees()
        }
      },
      { threshold: 0.5 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current)
      }
    }
  }, [loadMoreEmployees])

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
    const updatedEmployees = employees.map((emp) => {
      if (emp.id === id) {
        return { ...emp, ...editData }
      }
      return emp
    })

    setEmployees(updatedEmployees)

    // Update displayed employees
    const updatedDisplayed = displayedEmployees.map((emp) => {
      if (emp.id === id) {
        return { ...emp, ...editData }
      }
      return emp
    })

    setDisplayedEmployees(updatedDisplayed)
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
      {/* Header - Defined directly in the page */}
      <div
        className="fixed top-0 right-0 z-50 bg-white h-[60px] flex items-center justify-end px-6 shadow-sm"
        style={{ 
          left: isMobile ? (isSidebarOpen ? "240px" : "0") : (isSidebarOpen ? "240px" : "69px"), 
          transition: "left 0.3s ease" 
        }}
      >
        {isMobile && (
          <button 
            className="absolute left-4" 
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            <span className="material-icons text-[#8b8b8b]">
              {isSidebarOpen ? "close" : "menu"}
            </span>
          </button>
        )}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#8b8b8b] text-sm font-medium">ID / EN</span>
          </div>

          <div className="flex items-center">
            <span className="material-icons text-[#8b8b8b]">notifications</span>
          </div>
        </div>
      </div>

      <div className="flex">
        <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} onHoverChange={setSidebarHovered} />

        <div
          className="w-full min-h-screen transition-all duration-300 ease-in-out pt-[60px] bg-white"
          style={{
            marginLeft: isMobile ? (isSidebarOpen ? "240px" : "0") : (isSidebarOpen ? "240px" : "69px"),
          }}
        >
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

            {/* Employee Table with Fixed Header and Scrollable Body */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <div className="overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 280px)" }}>
                  {/* Fixed Table Header */}
                  <table className="min-w-full">
                    <thead className="bg-[#e8f5ff]">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 md:px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                          onClick={() => requestSort("name")}
                        >
                          <div className="flex items-center">
                            Nama
                            <span className="material-icons text-sm ml-1">{getSortIcon("name")}</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                          onClick={() => requestSort("employeeId")}
                        >
                          <div className="flex items-center">
                            ID Karyawan
                            <span className="material-icons text-sm ml-1">{getSortIcon("employeeId")}</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider whitespace-nowrap hidden md:table-cell"
                        >
                          Departemen
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider whitespace-nowrap hidden md:table-cell"
                        >
                          Jabatan
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider whitespace-nowrap"
                        >
                          Jenis Kelamin
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer whitespace-nowrap hidden md:table-cell"
                          onClick={() => requestSort("age")}
                        >
                          <div className="flex items-center">
                            Usia
                            <span className="material-icons text-sm ml-1">{getSortIcon("age")}</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer whitespace-nowrap hidden md:table-cell"
                          onClick={() => requestSort("workDuration")}
                        >
                          <div className="flex items-center">
                            Lama Bekerja
                            <span className="material-icons text-sm ml-1">{getSortIcon("workDuration")}</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider whitespace-nowrap"
                        >
                          Skrining
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider whitespace-nowrap hidden md:table-cell"
                        >
                          Konseling
                        </th>
                        <th
                          scope="col"
                          className="px-3 md:px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider whitespace-nowrap"
                        >
                          Aksi
                        </th>
                      </tr>
                    </thead>
                  </table>

                  {/* Scrollable Table Body */}
                  <div className="overflow-y-auto" ref={listContainerRef} style={{ maxHeight: "calc(100vh - 320px)" }}>
                    <table className="min-w-full">
                      <tbody className="bg-white divide-y divide-gray-200">
                        {displayedEmployees.map((employee) => (
                          <tr
                            key={employee.id}
                            className="hover:bg-gradient-to-r from-white via-[#488BBE20] to-white transition-all duration-300"
                          >
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                                  <img
                                    className="h-8 w-8 md:h-10 md:w-10 rounded-full"
                                    src={employee.image || "/placeholder.svg"}
                                    alt={employee.name}
                                  />
                                </div>
                                <div className="ml-3 md:ml-4">
                                  {editingId === employee.id ? (
                                    <input
                                      type="text"
                                      name="name"
                                      value={editData.name}
                                      onChange={handleEditChange}
                                      className="text-xs md:text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                                    />
                                  ) : (
                                    <div
                                      className={`text-xs md:text-sm font-medium ${hoveredEmployeeId === employee.id ? "text-[#488BBE] underline cursor-pointer" : "text-gray-900"}`}
                                      onMouseEnter={() => setHoveredEmployeeId(employee.id)}
                                      onMouseLeave={() => setHoveredEmployeeId(null)}
                                      title="Lihat Detail (Under Development)"
                                    >
                                      {employee.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              {editingId === employee.id ? (
                                <input
                                  type="text"
                                  name="employeeId"
                                  value={editData.employeeId}
                                  onChange={handleEditChange}
                                  className="text-xs md:text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                                />
                              ) : (
                                <div className="text-xs md:text-sm text-gray-500">{employee.employeeId}</div>
                              )}
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell">
                              {editingId === employee.id ? (
                                <input
                                  type="text"
                                  name="department"
                                  value={editData.department}
                                  onChange={handleEditChange}
                                  className="text-xs md:text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                                />
                              ) : (
                                <div className="text-xs md:text-sm text-gray-500">{employee.department}</div>
                              )}
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell">
                              {editingId === employee.id ? (
                                <input
                                  type="text"
                                  name="position"
                                  value={editData.position}
                                  onChange={handleEditChange}
                                  className="text-xs md:text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                                />
                              ) : (
                                <div className="text-xs md:text-sm text-gray-500">{employee.position}</div>
                              )}
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              {editingId === employee.id ? (
                                <select
                                  name="gender"
                                  value={editData.gender}
                                  onChange={handleEditChange}
                                  className="text-xs md:text-sm text-gray-500 border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="L">L</option>
                                  <option value="P">P</option>
                                </select>
                              ) : (
                                <div className="text-xs md:text-sm text-gray-500">{employee.gender}</div>
                              )}
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell">
                              {editingId === employee.id ? (
                                <input
                                  type="text"
                                  name="age"
                                  value={editData.age}
                                  onChange={handleEditChange}
                                  className="text-xs md:text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                                />
                              ) : (
                                <div className="text-xs md:text-sm text-gray-500">{employee.age}</div>
                              )}
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell">
                              {editingId === employee.id ? (
                                <input
                                  type="text"
                                  name="workDuration"
                                  value={editData.workDuration}
                                  onChange={handleEditChange}
                                  className="text-xs md:text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                                />
                              ) : (
                                <div className="text-xs md:text-sm text-gray-500">{employee.workDuration}</div>
                              )}
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full ${
                                  employee.screening.status === "warning"
                                    ? "bg-red-100"
                                    : employee.screening.status === "error"
                                      ? "bg-yellow-100"
                                      : "bg-green-100"
                                }`}
                              >
                                {employee.screening.status === "warning" && (
                                  <span className="material-icons text-sm md:text-base text-red-500">warning</span>
                                )}
                                {employee.screening.status === "error" && (
                                  <span className="material-icons text-sm md:text-base text-yellow-500">error</span>
                                )}
                                {employee.screening.status === "success" && (
                                  <span className="material-icons text-sm md:text-base text-green-500">check_circle</span>
                                )}
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-center hidden md:table-cell">
                              <span className={`${employee.counseling === "Sudah" ? "text-green-500" : "text-red-500"}`}>
                                {employee.counseling}
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 text-center">
                              {editingId === employee.id ? (
                                <div className="flex space-x-2 justify-center">
                                  <button
                                    className={`text-[#9BCA61] hover:text-green-700 ${!hasChanges ? "opacity-50 cursor-not-allowed" : ""}`}
                                    onClick={() => hasChanges && saveEditing(employee.id)}
                                    disabled={!hasChanges}
                                    aria-label="Save"
                                  >
                                    <span className="material-icons" style={{ fontSize: "20px" }}>
                                      check_circle
                                    </span>
                                  </button>
                                  <button className="text-[#EE4266] hover:text-red-700" onClick={cancelEditing} aria-label="Cancel">
                                    <span className="material-icons" style={{ fontSize: "20px" }}>
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
                                  <span className="material-icons text-sm md:text-base">edit</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Loading indicator for infinite scroll */}
                    {isLoading && (
                      <div className="flex justify-center items-center py-4" ref={observerRef}>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#488BBE]"></div>
                      </div>
                    )}

                    {/* Intersection observer target */}
                    {!isLoading && <div ref={observerRef} className="h-4"></div>}
                  </div>
                </div>
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