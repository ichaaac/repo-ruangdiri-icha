"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import Sidebar from "../../components/school/Sidebar"

const generateStudentData = (start, count) => {
  const classes = ["10A", "10B", "10C", "11A", "11B", "11C", "12A", "12B", "12C"]
  const majors = ["IPA", "IPS", "Bahasa", "Unggulan"]
  const screeningStatuses = ["warning", "error", "success"]
  const counselingStatuses = ["Sudah", "Belum"]
  const genders = ["L", "P"]
  const ages = ["14 Tahun", "15 Tahun", "16 Tahun", "17 Tahun", "18 Tahun", "19 Tahun"]
  const semesters = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6"]

  return Array.from({ length: count }, (_, i) => {
    const id = start + i
    const gender = genders[Math.floor(Math.random() * genders.length)]
    return {
      id,
      name: `Student ${id}`,
      class: classes[Math.floor(Math.random() * classes.length)],
      major: majors[Math.floor(Math.random() * majors.length)],
      gender,
      age: ages[Math.floor(Math.random() * ages.length)],
      semester: semesters[Math.floor(Math.random() * semesters.length)],
      screening: { status: screeningStatuses[Math.floor(Math.random() * screeningStatuses.length)] },
      counseling: counselingStatuses[Math.floor(Math.random() * counselingStatuses.length)],
      image: `https://randomuser.me/api/portraits/${gender === "L" ? "men" : "women"}/${id % 70}.jpg`,
      nis: Math.floor(10000000 + Math.random() * 90000000).toString()
    }
  })
}

// Initial student data
const initialStudentData = generateStudentData(1, 20)

const StudentListPage = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [students, setStudents] = useState([...initialStudentData])
  const [displayedStudents, setDisplayedStudents] = useState([...initialStudentData.slice(0, 10)])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hoveredStudentId, setHoveredStudentId] = useState(null)
  const observerRef = useRef(null)
  const listContainerRef = useRef(null)

  const totalStudents = students.length
  const femaleStudents = students.filter((student) => student.gender === "P").length
  const maleStudents = students.filter((student) => student.gender === "L").length
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setPage(1)
    setDisplayedStudents([])
  }

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setStudents([...initialStudentData])
    } else {
      const filtered = initialStudentData.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.nis.includes(searchTerm)
      )
      setStudents(filtered)
    }

    setDisplayedStudents(students.slice(0, 10))
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
      setStudents([...initialStudentData])
      return
    }

    const sortedItems = [...students].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "ascending" ? -1 : 1
      }
      if (a[key] > b[key]) {
        return direction === "ascending" ? 1 : -1
      }
      return 0
    })

    setStudents(sortedItems)
    setDisplayedStudents(sortedItems.slice(0, 10))
  }

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return "sort"
    }
    return sortConfig.direction === "ascending" ? "arrow_upward" : "arrow_downward"
  }

  const loadMoreStudents = useCallback(() => {
    if (isLoading) return

    setIsLoading(true)

    setTimeout(() => {
      const nextPage = page + 1
      const startIndex = displayedStudents.length
      const endIndex = startIndex + 10

      // Add more students if needed
      if (students.length < endIndex + 10) {
        const newStudents = generateStudentData(students.length + 1, 20)
        setStudents((prev) => [...prev, ...newStudents])
      }

      setDisplayedStudents((prev) => [...prev, ...students.slice(startIndex, endIndex)])
      setPage(nextPage)
      setIsLoading(false)
    }, 1000)
  }, [isLoading, page, students, displayedStudents.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreStudents()
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
  }, [loadMoreStudents])

  // Edit functionality
  const startEditing = (id) => {
    if (editingId !== null) return // Prevent editing multiple rows

    const student = students.find((student) => student.id === id)
    setEditingId(id)
    setEditData({
      name: student.name,
      class: student.class,
      major: student.major,
      gender: student.gender,
      age: student.age,
      semester: student.semester,
      nis: student.nis
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
    const updatedStudents = students.map((student) => {
      if (student.id === id) {
        return { ...student, ...editData }
      }
      return student
    })

    setStudents(updatedStudents)

    // Update displayed students
    const updatedDisplayed = displayedStudents.map((student) => {
      if (student.id === id) {
        return { ...student, ...editData }
      }
      return student
    })

    setDisplayedStudents(updatedDisplayed)
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
        style={{ left: isSidebarOpen ? "240px" : "69px", transition: "left 0.3s ease" }}
      >
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
            marginLeft: isSidebarOpen ? "240px" : "69px",
          }}
        >
          <div className="p-6 md:p-10 w-full max-w-[1440px] mx-auto">
            {/* Page Header - Part of the header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-[#488bbe] mb-4 md:mb-0">
                Halo, SMA Veteran 007
              </h1>

              <div className="flex flex-wrap gap-4">
                {/* Student Stats - Part of the header */}
                <div className="relative w-[120px] h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#3399E9]">groups</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-2xl font-bold text-[#488BBE]">{totalStudents}</div>
                    <div className="text-xs text-[#488BBE]">Siswa</div>
                  </div>
                </div>

                <div className="relative w-[120px] h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#FF86E1]">face_2</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-2xl font-bold text-[#488BBE]">{femaleStudents}</div>
                    <div className="text-xs text-[#488BBE]">Perempuan</div>
                  </div>
                </div>

                <div className="relative w-[120px] h-[80px] flex items-center justify-center">
                  <img src="/population-group-bg.svg" alt="Background" className="absolute inset-0 w-full h-full" />
                  <div className="absolute top-2 right-2">
                    <span className="material-icons text-[#FF7173]">face</span>
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-2xl font-bold text-[#488BBE]">{maleStudents}</div>
                    <div className="text-xs text-[#488BBE]">Laki Laki</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter - Part of the header */}
            <div className="flex items-center mb-6 gap-3">
              <div className="relative flex-grow max-w-md">
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
                className="flex items-center justify-center px-4 py-2 rounded-full text-[#8b8b8b] hover:bg-[#f7f7f9] transition-colors"
                onClick={() => setShowFilterModal(true)}
              >
                <span className="material-icons mr-2">filter_alt</span>
                <span>Filter</span>
              </button>
            </div>

            {/* Student Table with Fixed Header and Scrollable Body */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 280px)" }}>
                {/* Fixed Table Header */}
                <table className="min-w-full">
                  <thead className="bg-[#e8f5ff]">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("name")}
                      >
                        <div className="flex items-center">
                          Nama
                          <span className="material-icons text-sm ml-1">{getSortIcon("name")}</span>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("nis")}
                      >
                        <div className="flex items-center">
                          NIS
                          <span className="material-icons text-sm ml-1">{getSortIcon("nis")}</span>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("class")}
                      >
                        <div className="flex items-center">
                          Kelas
                          <span className="material-icons text-sm ml-1">{getSortIcon("class")}</span>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider"
                      >
                        Jurusan
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider"
                      >
                        Jenis Kelamin
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("age")}
                      >
                        <div className="flex items-center">
                          Usia
                          <span className="material-icons text-sm ml-1">{getSortIcon("age")}</span>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-[#488bbe] uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("semester")}
                      >
                        <div className="flex items-center">
                          Semester
                          <span className="material-icons text-sm ml-1">{getSortIcon("semester")}</span>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider"
                      >
                        Skrining
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider"
                      >
                        Konseling
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-[#488bbe] uppercase tracking-wider"
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
                      {displayedStudents.map((student) => (
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
                                  <div
                                    className={`text-sm font-medium ${hoveredStudentId === student.id ? "text-[#488BBE] underline cursor-pointer" : "text-gray-900"}`}
                                    onMouseEnter={() => setHoveredStudentId(student.id)}
                                    onMouseLeave={() => setHoveredStudentId(null)}
                                    title="Lihat Detail (Under Development)"
                                  >
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
                                name="nis"
                                value={editData.nis}
                                onChange={handleEditChange}
                                className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                              />
                            ) : (
                              <div className="text-sm text-gray-500">{student.nis}</div>
                            )}
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
                              <input
                                type="text"
                                name="major"
                                value={editData.major}
                                onChange={handleEditChange}
                                className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                              />
                            ) : (
                              <div className="text-sm text-gray-500">{student.major}</div>
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
                                name="age"
                                value={editData.age}
                                onChange={handleEditChange}
                                className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                              />
                            ) : (
                              <div className="text-sm text-gray-500">{student.age}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingId === student.id ? (
                              <input
                                type="text"
                                name="semester"
                                value={editData.semester}
                                onChange={handleEditChange}
                                className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                              />
                            ) : (
                              <div className="text-sm text-gray-500">{student.semester}</div>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {editingId === student.id ? (
                              <div className="flex space-x-2 justify-center">
                                <button
                                  className={`text-[#9BCA61] hover:text-green-700 ${!hasChanges ? "opacity-50 cursor-not-allowed" : ""}`}
                                  onClick={() => hasChanges && saveEditing(student.id)}
                                  disabled={!hasChanges}
                                >
                                  <span className="material-icons" style={{ fontSize: "24px" }}>
                                    check_circle
                                  </span>
                                </button>
                                <button className="text-[#EE4266] hover:text-red-700" onClick={cancelEditing}>
                                  <span className="material-icons" style={{ fontSize: "24px" }}>
                                    cancel
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <button
                                className={`text-[#8b8b8b] hover:text-[#488bbe] ${editingId !== null ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={() => editingId === null && startEditing(student.id)}
                                disabled={editingId !== null}
                              >
                                <span className="material-icons">edit</span>
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

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-[#8DD0DEB2] flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-xl p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#488bbe]">Filter</h2>
              <button onClick={() => setShowFilterModal(false)}>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Semua Jurusan</option>
                  <option value="IPA">IPA</option>
                  <option value="IPS">IPS</option>
                  <option value="Bahasa">Bahasa</option>
                  <option value="Unggulan">Unggulan</option>
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

export default StudentListPage