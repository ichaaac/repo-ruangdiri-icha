"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import SchoolSidebar from "../../components/school/SchoolSidebar"

const generateStudentData = (count) => {
  const classes = ["10A", "10B", "10C", "11A", "11B", "11C", "12A", "12B", "12C"]
  const majors = ["IPA", "IPS", "Bahasa", "Unggulan"]
  const screeningStatuses = ["warning", "error", "success"]
  const counselingStatuses = ["Sudah", "Belum"]
  const genders = ["L", "P"]
  const iqScores = [90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140]

  // Generate a sequence of NIS (Nomor Induk Siswa)
  const nisNumbers = Array.from({ length: count }, (_, i) => {
    const id = i + 1
    return `${(new Date()).getFullYear() - 5}${String(id).padStart(6, '0')}`
  })

  return Array.from({ length: count }, (_, i) => {
    const id = i + 1
    const gender = genders[Math.floor(Math.random() * genders.length)]
    return {
      id,
      name: `Student ${id}`,
      nis: nisNumbers[i],
      class: classes[Math.floor(Math.random() * classes.length)],
      major: majors[Math.floor(Math.random() * majors.length)],
      gender,
      iqScore: iqScores[Math.floor(Math.random() * iqScores.length)],
      screening: { status: screeningStatuses[Math.floor(Math.random() * screeningStatuses.length)] },
      counseling: counselingStatuses[Math.floor(Math.random() * counselingStatuses.length)],
      image: `https://randomuser.me/api/portraits/${gender === "L" ? "men" : "women"}/${id % 70}.jpg`,
    }
  })
}

// Initial student data - we generate more than needed to simulate backend data
const allStudentData = generateStudentData(50)

const StudentListPage = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [students, setStudents] = useState([...allStudentData])
  const [filteredStudents, setFilteredStudents] = useState([...allStudentData])
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

  const totalStudents = filteredStudents.length
  const femaleStudents = filteredStudents.filter((student) => student.gender === "P").length
  const maleStudents = filteredStudents.filter((student) => student.gender === "L").length

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

  // Filter students based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStudents([...allStudentData])
    } else {
      const filtered = allStudentData.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.nis.includes(searchTerm)
      )
      setFilteredStudents(filtered)
    }
    
    // Reset to first page when search changes
    setCurrentPage(1)
  }, [searchTerm])

  // Calculate total pages
  useEffect(() => {
    setTotalPages(Math.ceil(filteredStudents.length / pageSize))
  }, [filteredStudents, pageSize])

  // Apply sorting
  useEffect(() => {
    let sortedStudents = [...filteredStudents]
    
    if (sortConfig.key !== null) {
      sortedStudents.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }
    
    setStudents(sortedStudents)
  }, [filteredStudents, sortConfig])

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return students.slice(startIndex, endIndex)
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
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max pages to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)
      
      // Calculate start and end of page numbers to show
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)
      
      // Add dots if there's a gap after first page
      if (startPage > 2) {
        pageNumbers.push('...')
      }
      
      // Add pages in the middle
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }
      
      // Add dots if there's a gap before last page
      if (endPage < totalPages - 1) {
        pageNumbers.push('...')
      }
      
      // Always include last page
      pageNumbers.push(totalPages)
    }
    
    return pageNumbers
  }

  // Edit functionality
  const startEditing = (id) => {
    if (editingId !== null) return // Prevent editing multiple rows

    const student = students.find((student) => student.id === id)
    setEditingId(id)
    setEditData({
      name: student.name,
      nis: student.nis,
      class: student.class,
      gender: student.gender,
      iqScore: student.iqScore
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
    const updatedStudents = filteredStudents.map((student) => {
      if (student.id === id) {
        return { ...student, ...editData }
      }
      return student
    })

    setFilteredStudents(updatedStudents)
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
        <SchoolSidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} onHoverChange={setSidebarHovered} />

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
                Halo, SMA Veteran 007
              </h1>

              <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-end">
                {/* Student Stats - Part of the header */}
                <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#3399E9]">groups</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{totalStudents}</div>
                    <div className="text-xs text-[#488BBE]">Siswa</div>
                  </div>
                </div>

                <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#FF86E1]">face_2</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{femaleStudents}</div>
                    <div className="text-xs text-[#488BBE]">Perempuan</div>
                  </div>
                </div>

                <div className="relative w-[100px] md:w-[120px] h-[70px] md:h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#FF7173]">face</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-xl md:text-2xl font-bold text-[#488BBE]">{maleStudents}</div>
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
                  placeholder="Cari Nama atau NIS..."
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

            {/* Student Table with Fixed Width Columns */}
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
                        className="w-[120px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider"
                      >
                        KELAS
                      </th>
                      <th className="w-[120px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        JENIS KELAMIN
                      </th>
                      <th 
                        className="w-[120px] px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("nis")}
                      >
                        <div className="flex items-center">
                          NIS
                          <span className="material-icons text-sm ml-1">{getSortIcon("nis")}</span>
                        </div>
                      </th>
                      <th className="w-[100px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        SKRINING
                      </th>
                      <th className="w-[100px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        KONSELING
                      </th>
                      <th 
                        className="w-[100px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("iqScore")}
                      >
                        <div className="flex items-center justify-center">
                          SKOR IQ
                          <span className="material-icons text-sm ml-1">{getSortIcon("iqScore")}</span>
                        </div>
                      </th>
                      <th className="w-[80px] px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCurrentPageData().map((student) => (
                      <tr 
                        key={student.id}
                        className="hover:bg-gradient-to-r from-white via-[#488BBE20] to-white transition-all duration-300"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={student.image || "/placeholder.svg"}
                                alt={student.name}
                              />
                            </div>
                            <div className="ml-4">
                              {editingId === student.id ? (
                                <input
                                  type="text"
                                  name="name"
                                  value={editData.name}
                                  onChange={handleEditChange}
                                  className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                                />
                              ) : (
                                <div className="text-sm font-medium text-gray-900">
                                  {student.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === student.id ? (
                            <input
                              type="text"
                              name="class"
                              value={editData.class}
                              onChange={handleEditChange}
                              className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <div className="text-sm text-gray-500">{student.class}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === student.id ? (
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
                            <div className="text-sm text-gray-500">{student.gender}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === student.id ? (
                            <input
                              type="text"
                              name="nis"
                              value={editData.nis}
                              onChange={handleEditChange}
                              className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <div className="text-sm text-gray-500">{student.nis}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                              student.screening.status === "warning"
                                ? "bg-red-100"
                                : student.screening.status === "error"
                                  ? "bg-yellow-100"
                                  : "bg-green-100"
                            }`}
                          >
                            {student.screening.status === "warning" && (
                              <span className="material-icons text-red-500">warning</span>
                            )}
                            {student.screening.status === "error" && (
                              <span className="material-icons text-yellow-500">error</span>
                            )}
                            {student.screening.status === "success" && (
                              <span className="material-icons text-green-500">check_circle</span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`${student.counseling === "Sudah" ? "text-green-500" : "text-red-500"}`}>
                            {student.counseling}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {editingId === student.id ? (
                            <input
                              type="number"
                              name="iqScore"
                              value={editData.iqScore}
                              onChange={handleEditChange}
                              className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <div className="text-sm text-gray-500">{student.iqScore}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {editingId === student.id ? (
                            <div className="flex space-x-2 justify-center">
                              <button
                                className={`text-[#9BCA61] hover:text-green-700 ${!hasChanges ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={() => hasChanges && saveEditing(student.id)}
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
                              onClick={() => editingId === null && startEditing(student.id)}
                              disabled={editingId !== null}
                              aria-label="Edit student"
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

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Menampilkan <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> s/d <span className="font-medium">{Math.min(currentPage * pageSize, totalStudents)}</span> dari <span className="font-medium">{totalStudents}</span> siswa
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <span className="material-icons text-[18px]">chevron_left</span>
                      </button>
                      
                      {getPageNumbers().map((pageNumber, index) => (
                        pageNumber === '...' ? (
                          <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        ) : (
                          <button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                              currentPage === pageNumber ? 'bg-[#488BBE] text-white' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      ))}
                      
                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <span className="material-icons text-[18px]">chevron_right</span>
                      </button>
                    </nav>
                  </div>
                </div>
                
                {/* Mobile pagination */}
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1 ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Sebelumnya
                  </button>
                  <div className="text-sm text-gray-700 py-2">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Selanjutnya
                  </button>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Kelas</option>
                  <option value="10A">10A</option>
                  <option value="10B">10B</option>
                  <option value="10C">10C</option>
                  <option value="11A">11A</option>
                  <option value="11B">11B</option>
                  <option value="11C">11C</option>
                  <option value="12A">12A</option>
                  <option value="12B">12B</option>
                  <option value="12C">12C</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skor IQ</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-1/2 p-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-1/2 p-2 border border-gray-300 rounded-md"
                  />
                </div>
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

export default StudentListPage