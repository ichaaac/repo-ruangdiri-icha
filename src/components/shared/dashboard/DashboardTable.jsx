// src/components/shared/dashboard/DashboardTable.jsx 

import React, { useCallback, useState, useRef, useEffect } from "react"

const TableHeader = ({ type = "student" }) => (
  <thead style={{ backgroundColor: "#E8F5FF" }}>
    <tr>
      <th
        className="px-5 py-3 text-left text-base leading-5 font-normal max-sm:px-4 max-sm:py-2 max-sm:text-sm"
        style={{ color: "#488BBE", width: "25%" }}
      >
        Nama
      </th>
      <th
        className="px-5 py-3 text-center text-base leading-5 font-normal max-sm:px-4 max-sm:py-2 max-sm:text-sm"
        style={{ color: "#488BBE", width: "20%" }}
      >
        {type === "student" ? "Kelas" : "Departemen"}
      </th>
      <th
        className="px-5 py-3 text-center text-base leading-5 font-normal max-sm:px-4 max-sm:py-2 max-sm:text-sm"
        style={{ color: "#488BBE", width: "15%" }}
      >
        Jenis Kelamin
      </th>
      <th
        className="px-5 py-3 text-center text-base leading-5 font-normal max-sm:px-4 max-sm:py-2 max-sm:text-sm"
        style={{ color: "#488BBE", width: "20%" }}
      >
        {type === "student" ? "NIS" : "Usia"}
      </th>
      <th
        className="px-5 py-3 text-center text-base leading-5 font-normal max-sm:px-4 max-sm:py-2 max-sm:text-sm"
        style={{ color: "#488BBE", width: "20%" }}
      >
      </th>
    </tr>
  </thead>
)

const TableRow = React.forwardRef(({ item, type = "student", config = {} }, ref) => {
  const commonCellClass = "px-5 py-4 text-base leading-5 text-zinc-500 max-sm:px-4 max-sm:py-3 max-sm:text-sm"

  // Format gender menjadi L/P
  const formatGender = (gender) => {
    if (gender === "male") return "L"
    if (gender === "female") return "P"
    return gender || "-"
  }

  // Handle detail click navigation
  const handleDetailClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const detailPath = type === "student" 
      ? "/organization/school/student" 
      : "/organization/company/employee"
    
    const url = `${detailPath}/${item.id}`
    window.open(url, "_blank")
  }

  return (
    <tr ref={ref} className="bg-white border-b border-gray-100">
      {/* Nama - Left aligned, clickable for detail */}
      <td className={commonCellClass} style={{ width: "25%" }}>
        <div 
          className="max-w-[180px] truncate cursor-pointer text-gray-900 hover:text-[#488BBE] transition-colors font-medium" 
          title={item.fullName || item.nama}
          onClick={handleDetailClick}
        >
          {item.fullName || item.nama || "-"}
        </div>
      </td>
      
      {/* Kelas/Departemen - Center aligned */}
      <td className={`${commonCellClass} text-center truncate`} style={{ width: "20%" }}>
        <div className="max-w-full" title={
          type === "student" 
            ? (item.classroom && item.grade ? `${item.classroom} - ${item.grade}` : item.classroom || item.kelas || "-")
            : item.department || "-"
        }>
          {type === "student" 
            ? (item.classroom && item.grade ? `${item.classroom} - ${item.grade}` : item.classroom || item.kelas || "-")
            : item.department || "-"
          }
        </div>
      </td>
      
      {/* Jenis Kelamin - Center aligned */}
      <td className={`${commonCellClass} text-center`} style={{ width: "15%" }}>
        {formatGender(item.gender || item.jenisKelamin)}
      </td>
      
      {/* NIS/Usia - Center aligned */}
      <td className={`${commonCellClass} text-center`} style={{ width: "20%" }}>
        {type === "student" ? item.nis || "-" : (item.age ? `${item.age} Tahun` : "-")}
      </td>
      
      {/* RESTORED: Action Button - Center aligned */}
      <td className={`${commonCellClass} text-center`} style={{ width: "20%" }}>
        <button
          className="transition-colors cursor-pointer font-medium text-[#488BBE] hover:text-[#3a7ba8] whitespace-nowrap"
          onClick={handleDetailClick}
        >
          Lihat Detail
        </button>
      </td>
    </tr>
  )
})

TableRow.displayName = "TableRow"

const DashboardTable = ({ 
  type = "student", 
  data = [], 
  isLoading = false, 
  title = "", 
  isFetchingNextPage = false, 
  hasNextPage = false, 
  fetchNextPage = () => {},
  config = {}
}) => {
  const observerRef = useRef(null)
  
  // Enhanced data handling - fix employee data extraction
  let itemsData = []
  
  if (Array.isArray(data)) {
    itemsData = data
  } else if (data && typeof data === 'object') {
    if (type === "student") {
      if (data.students) {
        itemsData = data.students
      } else if (data.data && data.data.students) {
        itemsData = data.data.students
      }
    } else if (type === "employee") {
      if (data.employees) {
        itemsData = data.employees
      } else if (data.data && data.data.employees) {
        itemsData = data.data.employees
      }
    }
    
    // Fallback - try to find any array
    if (itemsData.length === 0) {
      if (data.data && Array.isArray(data.data)) {
        itemsData = data.data
      } else if (Array.isArray(data.items)) {
        itemsData = data.items
      }
    }
  }

  // Linear gradient divider
  const LinearGradientDivider = () => (
    <tr style={{ height: "2px" }}>
      <td colSpan={5} className="p-0">
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
  
  // Infinite scroll callback
  const lastItemElementRef = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect()
      if (isFetchingNextPage || !hasNextPage) {
        return
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px 100px 0px" }
      )

      if (node) {
        observerRef.current.observe(node)
      }
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Show empty state only when truly no data
  if (!itemsData || itemsData.length === 0) {
    return (
      <div 
        className="flex justify-center items-center bg-white rounded-lg shadow-sm"
        style={{ minHeight: "200px" }}
      >
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <span className="material-icons text-3xl">inbox</span>
          <span className="text-sm">Tidak ada data untuk ditampilkan</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      {/* Table Container - Let it size naturally based on content */}
      <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="w-full border-collapse table-fixed">
          <TableHeader type={type} />
          <tbody>
            <LinearGradientDivider />
            {itemsData.map((item, index) => {
              const isLastElement = index === itemsData.length - 1
              
              return (
                <React.Fragment key={item.id || `${type}-${index}`}>
                  <TableRow 
                    item={item} 
                    type={type} 
                    config={config}
                    ref={isLastElement ? lastItemElementRef : null}
                  />
                  <LinearGradientDivider />
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Compact loading indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center items-center w-full py-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="material-icons text-sm animate-spin">refresh</span>
            <span>Memuat lebih banyak...</span>
          </div>
        </div>
      )}

      {/* More compact scroll hint */}
      {hasNextPage && !isFetchingNextPage && itemsData.length >= 10 && (
        <div className="flex justify-center items-center w-full py-2">
          <div className="text-gray-400 text-xs">
            Scroll untuk memuat data lebih banyak
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardTable