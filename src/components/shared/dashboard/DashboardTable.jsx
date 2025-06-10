// src/components/shared/dashboard/DashboardTable.jsx

import React, { useCallback } from "react"

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

const TableRow = ({ item, type = "student" }) => {
  const commonCellClass = "px-5 py-4 text-base leading-5 text-zinc-500 max-sm:px-4 max-sm:py-3 max-sm:text-sm"

  // Format gender menjadi L/P
  const formatGender = (gender) => {
    if (gender === "male") return "L"
    if (gender === "female") return "P"
    return gender || "-"
  }

  return (
    <tr className="bg-white border-b border-gray-100">
      <td className={commonCellClass}>
        <div className="max-w-[200px] truncate" title={item.fullName || item.nama}>
          {item.fullName || item.nama || "-"}
        </div>
      </td>
      <td className={commonCellClass}>
        {type === "student" ? item.classroom || item.kelas || "-" : item.department || "-"}
      </td>
      <td className={`${commonCellClass} text-center`}>
        {" "}
        {/* Center align gender */}
        {formatGender(item.gender || item.jenisKelamin)}
      </td>
      <td className={commonCellClass}>{type === "student" ? item.nis || "-" : item.age || item.usia || "-"}</td>
      <td className={`${commonCellClass} max-sm:font-medium`}>
        <button
          className="transition-colors"
          style={{ color: "#488BBE" }}
          onMouseEnter={(e) => (e.target.style.color = "#3a7ba8")}
          onMouseLeave={(e) => (e.target.style.color = "#488BBE")}
        >
          Lihat Detail
        </button>
      </td>
    </tr>
  )
}

const DashboardTable = ({ 
  type = "student", 
  data = [], 
  isLoading = false, 
  title = "", 
  isFetchingNextPage = false, 
  hasNextPage = false, 
  fetchNextPage = () => {} 
}) => {
  const itemsData = Array.isArray(data) ? data : []
  
  // Infinite scroll callback - similar to SharedTable
  const lastItemRef = useCallback(
    (node) => {
      if (!node || !hasNextPage || isFetchingNextPage) return;
      
      // Create IntersectionObserver for this specific element
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            console.log("Last item visible, fetching next page");
            fetchNextPage();
          }
        },
        { threshold: 0.5, rootMargin: "0px 0px 300px 0px" }
      );
      
      observer.observe(node);
      
      // Cleanup
      return () => {
        observer.disconnect();
      };
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // Never show loading state - data should always be available
  if (itemsData.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <span className="material-icons text-3xl">inbox</span>
          <span className="text-sm">Tidak ada data untuk ditampilkan</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
          <TableHeader type={type} />
          <tbody>
            {itemsData.map((item, index) => {
              // Apply ref to last item for infinite scroll
              if (index === itemsData.length - 1) {
                return (
                  <React.Fragment key={item.id || index}>
                    <TableRow item={item} type={type} />
                    {/* Add a sentinel row for better detection */}
                    <tr ref={lastItemRef} style={{ height: "1px" }}><td colSpan="5"></td></tr>
                  </React.Fragment>
                );
              }
              return <TableRow key={item.id || index} item={item} type={type} />;
            })}
          </tbody>
        </table>
      </div>

      {/* Subtle loading indicator - only when fetching next page */}
      {isFetchingNextPage && (
        <div className="flex justify-center items-center w-full py-2">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="material-icons text-sm animate-spin">refresh</span>
            <span>Memuat lebih banyak...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardTable