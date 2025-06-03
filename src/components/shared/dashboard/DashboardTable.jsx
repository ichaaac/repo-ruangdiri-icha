// src/components/shared/dashboard/DashboardTable.jsx - Simplified version for dashboard tabs
import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"

const DashboardTable = ({
  type = "student",
  data = [],
  isLoading = false,
  onClose,
  title = "",
  hasNextPage = false,
  fetchNextPage = () => {},
  isFetchingNextPage = false,
}) => {
  const [selectedItem, setSelectedItem] = useState(null)
  const observerRef = useRef(null)
  const tableRef = useRef(null)

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

  const handleItemSelect = (item) => {
    setSelectedItem(item.id === selectedItem ? null : item)
  }

  const handleDetailClick = (id) => {
    const detailPath = `${config.detailPath}/${id}`
    window.open(detailPath, "_blank")
  }

  // Get screening status UI elements
  const getScreeningStatusUI = (status) => {
    switch (status) {
      case "at_risk":
        return {
          icon: "warning",
          color: "text-red-500",
          text: "Beresiko",
        }
      case "monitored":
        return {
          icon: "error",
          color: "text-yellow-500",
          text: "Pengawasan",
        }
      case "stable":
        return {
          icon: "check_circle",
          color: "text-green-500",
          text: "Stabil",
        }
      default:
        return {
          icon: "remove",
          color: "text-gray-400",
          text: "Belum Skrining",
        }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center bg-[#f5f5f7] p-3 font-medium">
          <h3 className="text-[#488BBE] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-[#EE4266] hover:opacity-80 transition-opacity">
            <span className="material-icons">cancel</span>
          </button>
        </div>
        <div className="flex justify-center items-center p-8">
          <span className="material-icons animate-spin text-[#488BBE] text-2xl">refresh</span>
          <span className="text-[#488BBE] text-sm ml-2">Memuat data...</span>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center bg-[#f5f5f7] p-3 font-medium">
          <h3 className="text-[#488BBE] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-[#EE4266] hover:opacity-80 transition-opacity">
            <span className="material-icons">cancel</span>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center p-8">
          <span className="material-icons text-gray-400 text-4xl mb-2">
            {type === "student" ? "school" : "business_center"}
          </span>
          <p className="text-gray-500 text-sm">Tidak ada data {type === "student" ? "siswa" : "karyawan"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="flex justify-between items-center bg-[#f5f5f7] p-3 font-medium">
        <h3 className="text-[#488BBE] font-semibold">{title}</h3>
        <button onClick={onClose} className="text-[#EE4266] hover:opacity-80 transition-opacity">
          <span className="material-icons">cancel</span>
        </button>
      </div>

      {/* Simplified table */}
      <div className="overflow-x-auto" ref={tableRef}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#488BBE] uppercase tracking-wider">
                Nama
              </th>
              {type === "student" ? (
                <>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider">
                    Jenis Kelamin
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider">
                    NIS
                  </th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider">
                    Departemen
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider">
                    Jenis Kelamin
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider">
                    Usia
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#488BBE] uppercase tracking-wider">
                Tindakan
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => {
              const statusUI = getScreeningStatusUI(item.screeningStatus || "stable")
              const isLastElement = index === data.length - 1

              return (
                <motion.tr
                  key={item.id}
                  ref={isLastElement ? lastItemElementRef : null}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleItemSelect(item)}
                  className={clsx(
                    "cursor-pointer transition-colors hover:bg-gray-50",
                    selectedItem === item.id ? "bg-blue-50" : "bg-white"
                  )}
                >
                  {/* Name */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={`https://i.pravatar.cc/32?u=${item.id}`}
                          alt={item.fullName}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="ml-3 text-sm font-medium text-gray-900 truncate max-w-[150px]" title={item.fullName}>
                        {item.fullName}
                      </div>
                    </div>
                  </td>

                  {/* Type-specific columns */}
                  {type === "student" ? (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {item.classroom && item.grade ? `${item.classroom} ${item.grade}` : item.classroom || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {item.gender === "male" ? "L" : "P"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {item.nis || "-"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600 truncate max-w-[150px]" title={item.department}>
                        {item.department || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {item.gender === "male" ? "L" : "P"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {item.age || "-"}
                      </td>
                    </>
                  )}

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <span className={`material-icons text-sm ${statusUI.color}`}>{statusUI.icon}</span>
                      <span className="ml-1 text-xs text-gray-700">{statusUI.text}</span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDetailClick(item.id)
                      }}
                      className="text-[#488BBE] hover:underline text-sm"
                    >
                      Lihat Detail
                    </button>
                  </td>
                </motion.tr>
              )
            })}
            {isFetchingNextPage && (
              <tr>
                <td colSpan={type === "student" ? 6 : 5} className="px-4 py-3 text-center">
                  <div className="flex justify-center items-center">
                    <span className="material-icons animate-spin text-[#488BBE] text-sm">refresh</span>
                    <span className="text-[#488BBE] text-xs ml-2">Memuat data...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DashboardTable