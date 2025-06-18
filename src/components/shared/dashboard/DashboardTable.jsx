// src/components/shared/dashboard/DashboardTable.jsx - Fixed infinite scroll and dynamic height

import React, { useCallback, useState, useRef, useEffect } from "react"

const TableHeader = ({ type = "student" }) => (
  <thead style={{ backgroundColor: "#E8F5FF" }}>
    <tr>
      <th
        className="px-5 py-3 text-left text-base leading-5 font-normal max-sm:px-4 max-sm:py-2 max-sm:text-sm"
        style={{ color: "#488BBE" }}
      >
        Nama
      </th>
      <th
        className="px-5 py-3 text-left text-base leading-5 font-normal max-sm:px-4 max-sm:py-2 max-sm:text-sm"
        style={{ color: "#488BBE" }}
      >
        {type === "student" ? "Kelas" : "Departemen"}
      </th>
      <th
        className="px-5 py-3 text-center text-base leading-5 font-normal max-sm:px-4 max-sm:py-2 max-sm:text-sm"
        style={{ color: "#488BBE" }}
      >
        Jenis Kelamin
      </th>
      <th
        className="px-5 py-3 text-left text-base leading-5 font-normal max-sm:px-4 max-sm:py-2 max-sm:text-sm"
        style={{ color: "#488BBE" }}
      >
        {type === "student" ? "NIS" : "Usia"}
      </th>
      <th
        className="px-5 py-3 text-left text-base leading-5 font-normal max-sm:px-4 max-sm:py-2 max-sm:text-sm"
        style={{ color: "#488BBE" }}
      ></th>
    </tr>
  </thead>
)

const TableRow = React.forwardRef(({ item, type = "student", config = {}, clickedNames, setClickedNames }, ref) => {
  const commonCellClass = "px-5 py-4 text-base leading-5 text-zinc-500 max-sm:px-4 max-sm:py-3 max-sm:text-sm"

  // Format gender menjadi L/P
  const formatGender = (gender) => {
    if (gender === "male") return "L"
    if (gender === "female") return "P"
    return gender || "-"
  }

  // Handle detail click navigation
  const handleDetailClick = () => {
    const id = item.id
    if (clickedNames.has(id)) {
      // Open detail page
      window.open(`${config.detailPath}/${id}`, "_blank")
      setClickedNames(new Set())
    } else {
      // First click - prepare for navigation
      setClickedNames(new Set([id]))
    }
  }

  return (
    <tr ref={ref} className="bg-white border-b border-gray-100">
      <td className={commonCellClass}>
        <div className="max-w-[200px] truncate" title={item.fullName || item.nama}>
          {item.fullName || item.nama || "-"}
        </div>
      </td>
      <td className={commonCellClass}>
        {type === "student" ? item.classroom || item.kelas || "-" : item.department || "-"}
      </td>
      <td className={`${commonCellClass} text-center`}>
        {formatGender(item.gender || item.jenisKelamin)}
      </td>
      <td className={commonCellClass}>{type === "student" ? item.nis || "-" : item.age || item.usia || "-"}</td>
      <td className={`${commonCellClass} max-sm:font-medium`}>
        <button
          className="transition-colors cursor-pointer"
          style={{ color: "#488BBE" }}
          onMouseEnter={(e) => (e.target.style.color = "#3a7ba8")}
          onMouseLeave={(e) => (e.target.style.color = "#488BBE")}
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
  config = {} // Add config prop for detail navigation
}) => {
  const [clickedNames, setClickedNames] = useState(new Set())
  const observerRef = useRef(null)
  const itemsData = Array.isArray(data) ? data : []

  // Linear gradient divider like in Table.jsx
  const LinearGradientDivider = () => (
    <tr style={{ height: "2px" }}>
      <td colSpan={type === "student" ? 5 : 5} className="p-0">
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
  
  // Infinite scroll callback - exactly like SharedTable.jsx
  const lastItemElementRef = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect()
      if (isFetchingNextPage || !hasNextPage) {
        console.log("Dashboard infinite scroll: skipping observer setup", { isFetchingNextPage, hasNextPage })
        return
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            console.log("Dashboard table: Last item visible, fetching next page", { hasNextPage, isFetchingNextPage })
            fetchNextPage()
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px 100px 0px" }
      )

      if (node) {
        console.log("Dashboard infinite scroll: setting up observer on node", node)
        observerRef.current.observe(node)
      }
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  // Debug logs for infinite scroll
  useEffect(() => {
    console.log("Dashboard table data updated:", { 
      dataLength: itemsData.length, 
      hasNextPage, 
      isFetchingNextPage,
      itemsData: itemsData.slice(0, 3) // First 3 items for debugging
    })
  }, [itemsData.length, hasNextPage, isFetchingNextPage, itemsData])

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Dynamic height calculation based on data
  const calculateMinHeight = () => {
    if (itemsData.length === 0) return "200px"
    
    // Base height for header + minimum padding
    const baseHeight = 100
    // Approximate row height (including dividers)
    const rowHeight = 60
    const totalHeight = baseHeight + (itemsData.length * rowHeight)
    
    // Minimum height to prevent too small containers
    const minHeight = Math.max(300, totalHeight)
    // Maximum height to prevent too large containers
    const maxHeight = 800
    
    return `${Math.min(minHeight, maxHeight)}px`
  }

  // Never show loading state - data should always be available
  if (itemsData.length === 0) {
    return (
      <div 
        className="flex justify-center items-center"
        style={{ minHeight: "300px" }}
      >
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <span className="material-icons text-3xl">inbox</span>
          <span className="text-sm">Tidak ada data untuk ditampilkan</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="flex flex-col gap-6 w-full"
      style={{ minHeight: calculateMinHeight() }}
    >
      {/* Table Container with Dynamic Height */}
      <div 
        className="w-full overflow-x-auto bg-white rounded-lg shadow-sm"
        style={{ 
          minHeight: calculateMinHeight(),
          transition: "min-height 0.3s ease-in-out"
        }}
      >
        <table className="w-full border-collapse">
          <TableHeader type={type} />
          <tbody>
            <LinearGradientDivider />
            {itemsData.map((item, index) => {
              const isLastElement = index === itemsData.length - 1
              
              return (
                <React.Fragment key={item.id || index}>
                  <TableRow 
                    item={item} 
                    type={type} 
                    config={config}
                    clickedNames={clickedNames}
                    setClickedNames={setClickedNames}
                    ref={isLastElement ? lastItemElementRef : null}
                  />
                  <LinearGradientDivider />
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Loading indicator for infinite scroll */}
      {isFetchingNextPage && (
        <div className="flex justify-center items-center w-full py-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="material-icons text-sm animate-spin">refresh</span>
            <span>Memuat lebih banyak...</span>
          </div>
        </div>
      )}

      {/* Show when has more data to load */}
      {hasNextPage && !isFetchingNextPage && itemsData.length >= 10 && (
        <div className="flex justify-center items-center w-full py-2">
          <div className="text-gray-400 text-xs">
            Scroll ke bawah untuk memuat data lebih banyak
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardTable