import { useState, useMemo } from "react"
import { useSearchParams, useNavigate, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../../lib/api"
import { getCurrentDateInfo } from "../../../lib/date"
import { useDashboard, usePdfReport } from "../../../hooks/useDashboardMetrics"
import SummaryCard from "./SummaryCard"

const REPORT_TYPES = {
  "belum-skrining": {
    key: "not_screened",
    title: "Belum Skrining",
    subtitle: "Berikut daftar yang belum melakukan skrining kesehatan mental pada periode ini.",
    cardId: "not_screened",
  },
  "berisiko": {
    key: "at_risk",
    title: "Berisiko",
    subtitle: "Berikut daftar yang terindikasi memiliki risiko berdasarkan hasil skrining.",
    cardId: "at_risk",
  },
  "belum-konseling": {
    key: "not_counseled",
    title: "Belum Konseling",
    subtitle: "Berikut daftar yang belum melakukan sesi konseling pada periode ini.",
    cardId: "not_counseled",
  },
}

const CARD_TO_TYPE_PARAM = {
  not_screened: "belum-skrining",
  at_risk: "berisiko",
  not_counseled: "belum-konseling",
}

const ITEMS_PER_PAGE = 10

const formatGender = (gender) => {
  if (gender === "male") return "L"
  if (gender === "female") return "P"
  return gender || "-"
}

const DetailLaporanPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const typeParam = searchParams.get("type") || "belum-skrining"
  const reportConfig = REPORT_TYPES[typeParam] || REPORT_TYPES["belum-skrining"]

  const isSchool = location.pathname.includes("/school")
  const type = isSchool ? "student" : "employee"
  const entityName = isSchool ? "Siswa" : "Karyawan"
  const basePath = isSchool ? "/organization/school" : "/organization/company"

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const currentDate = getCurrentDateInfo()

  // Data summary dari API (sama seperti dashboard) — this is the source of truth for counts
  const { metrics, isLoading: metricsLoading } = useDashboard(type)
  const summary = metrics?.summary || {}

  // Check if summary says there's data for the active type
  const summaryCountForActiveType = (() => {
    switch (reportConfig.cardId) {
      case "not_screened": return summary.notScreened?.count || 0
      case "at_risk": return summary.atRisk?.count || 0
      case "not_counseled": return summary.notCounseled?.count || 0
      default: return 0
    }
  })()

  // Only fetch table data if summary says count > 0 (list endpoint filter is broader than summary)
  const { data: rawResponse, isLoading: tableLoading } = useQuery({
    queryKey: ["detailLaporan", type, reportConfig.key, currentDate.year, currentDate.month, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("year", currentDate.year)
      params.append("month", currentDate.month)
      params.append("page", currentPage.toString())
      params.append("limit", ITEMS_PER_PAGE.toString())

      if (reportConfig.key === "not_screened") {
        params.append("screeningStatus", "not_screened")
      } else if (reportConfig.key === "at_risk") {
        params.append("screeningStatus", "at_risk")
      } else if (reportConfig.key === "not_counseled") {
        params.append("counselingStatus", "0")
      }

      const endpoint = type === "student"
        ? "/organizations/students/period"
        : "/organizations/employees/period"

      const res = await apiClient.get(`${endpoint}?${params}`)
      return res.data
    },
    staleTime: 2 * 60 * 1000,
    enabled: !metricsLoading && summaryCountForActiveType > 0,
  })

  // Extract items and metadata from response
  const { items: allItems, metadata } = useMemo(() => {
    if (!rawResponse) return { items: [], metadata: { totalData: 0, totalPages: 1 } }

    const entityKey = type === "student" ? "students" : "employees"
    let items = []
    let meta = { totalData: 0, totalPages: 1, hasNextPage: false }

    // Format 1: { data: { students: [...], metadata: {...} } }
    if (rawResponse?.data?.[entityKey]) {
      items = rawResponse.data[entityKey]
      meta = rawResponse.data?.metadata || meta
    }
    // Format 2: { students: [...], metadata: {...} } (no data wrapper)
    else if (rawResponse?.[entityKey]) {
      items = rawResponse[entityKey]
      meta = rawResponse?.metadata || meta
    }
    // Format 3: { data: [...] }
    else if (Array.isArray(rawResponse?.data)) {
      items = rawResponse.data
      meta = rawResponse?.metadata || meta
    }

    // Calculate totalPages from metadata
    if (meta.totalData && !meta.totalPages) {
      meta.totalPages = Math.ceil(meta.totalData / ITEMS_PER_PAGE)
    }

    return { items: Array.isArray(items) ? items : [], metadata: meta }
  }, [rawResponse, type])

  // If summary says count is 0, don't show list data (list endpoint filter is broader)
  const effectiveItems = summaryCountForActiveType === 0 ? [] : allItems

  // Filter client-side berdasarkan search (only for current page data)
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return effectiveItems
    return effectiveItems.filter((item) =>
      (item.fullName || item.nama || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [effectiveItems, searchQuery])

  // Use server-side pagination - totalPages from metadata
  const totalPages = summaryCountForActiveType === 0
    ? 1
    : Math.max(1, metadata.totalPages || Math.ceil(metadata.totalData / ITEMS_PER_PAGE) || 1)
  // Data is already paginated from server, no need to slice
  const paginatedData = filteredData

  // PDF download
  const { downloadPdfReport } = usePdfReport()

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleCloseLaporan = () => {
    navigate(`${basePath}/dashboard`)
  }

  const handleSwitchReport = (cardId) => {
    const param = CARD_TO_TYPE_PARAM[cardId]
    if (param && param !== typeParam) {
      navigate(`${basePath}/detail-laporan?type=${param}`)
      setSearchQuery("")
      setCurrentPage(1)
    }
  }

  const handleDownloadPdf = () => {
    downloadPdfReport(type, reportConfig.key, {
      totalCount: metadata.totalData || 100,
    })
  }

  const allCards = [
    {
      title: `${entityName} Belum Skrining`,
      count: summary.notScreened?.count || 0,
      total: summary.notScreened?.total || 0,
      icon: "group",
      cardId: "not_screened",
      variant: "blue",
    },
    {
      title: `${entityName} Berisiko`,
      count: summary.atRisk?.count || 0,
      total: summary.atRisk?.total || 0,
      icon: "error_outline",
      cardId: "at_risk",
      variant: "pink",
    },
    {
      title: `${entityName} Belum Konseling`,
      count: summary.notCounseled?.count || 0,
      total: summary.notCounseled?.total || 0,
      icon: "schedule",
      cardId: "not_counseled",
      variant: "neutral",
    },
  ]

  // Pagination button style helper
  const pageButtonStyle = (isActive = false, isDisabled = false) => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 500,
    border: "none",
    cursor: isDisabled ? "default" : "pointer",
    backgroundColor: isActive ? "#E8655B" : "transparent",
    color: isDisabled ? "#CBD5E1" : isActive ? "#fff" : "#64748B",
  })

  const renderPagination = () => {
    const pages = []

    // Show: 1, 2, 3 ... lastPage format
    if (totalPages <= 5) {
      // Show all pages if 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button key={i} onClick={() => setCurrentPage(i)} style={pageButtonStyle(i === currentPage)}>
            {i}
          </button>
        )
      }
    } else {
      // Always show page 1
      pages.push(
        <button key={1} onClick={() => setCurrentPage(1)} style={pageButtonStyle(1 === currentPage)}>
          1
        </button>
      )

      // Show pages around current
      if (currentPage > 3) {
        pages.push(<span key="dots1" style={{ color: "#64748B", padding: "0 4px" }}>...</span>)
      }

      // Middle pages
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(
            <button key={i} onClick={() => setCurrentPage(i)} style={pageButtonStyle(i === currentPage)}>
              {i}
            </button>
          )
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push(<span key="dots2" style={{ color: "#64748B", padding: "0 4px" }}>...</span>)
      }

      // Always show last page
      pages.push(
        <button key={totalPages} onClick={() => setCurrentPage(totalPages)} style={pageButtonStyle(totalPages === currentPage)}>
          {totalPages}
        </button>
      )
    }

    return pages
  }

  const isLoading = metricsLoading || tableLoading

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center" style={{ gap: 16 }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#488BBE]" />
          <p style={{ color: "#488BBE", fontSize: 14, fontWeight: 500 }}>Memuat data laporan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-white">
      <div style={{ padding: "0 40px", paddingTop: 32 }}>
        {/* Breadcrumb */}
        <nav className="flex items-center" style={{ gap: 8, marginBottom: 24 }}>
          <button
            onClick={handleCloseLaporan}
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: "#6F7480",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Dashboard
          </button>
          <span style={{ fontSize: 16, color: "#6F7480" }}>/</span>
          <span style={{ fontSize: 16, fontWeight: 500, color: "#E8655B" }}>
            Detail Laporan
          </span>
        </nav>

        {/* Summary Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 20, marginBottom: 32 }}
        >
          {allCards.map((card) => {
            const isActive = card.cardId === reportConfig.cardId
            return (
              <SummaryCard
                key={card.cardId}
                title={card.title}
                count={card.count}
                total={card.total}
                icon={card.icon}
                variant={card.variant}
                isActive={isActive}
                isInactive={!isActive}
                actionLabel={isActive ? "Tutup Laporan" : "Lihat Laporan"}
                onLihatLaporan={() => {
                  if (isActive) {
                    handleCloseLaporan()
                  } else {
                    handleSwitchReport(card.cardId)
                  }
                }}
              />
            )
          })}
        </div>

        {/* Title + Subtitle */}
        <div style={{ marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: "#0B0F1A",
              lineHeight: "120%",
              margin: 0,
            }}
          >
            Detail Laporan {entityName} {reportConfig.title}
          </h2>
          <p
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: "#6F7480",
              lineHeight: "140%",
              marginTop: 4,
            }}
          >
            {reportConfig.subtitle}
          </p>
        </div>

        {/* Search + Download Bar */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
          style={{ gap: 12, marginBottom: 20 }}
        >
          <div
            className="flex items-center"
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: "10px 16px",
              gap: 8,
              width: "100%",
              maxWidth: 360,
            }}
          >
            <span className="material-icons-outlined" style={{ color: "#94A3B8", fontSize: 20 }}>
              search
            </span>
            <input
              type="text"
              placeholder={`Cari Nama ${entityName}...`}
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                border: "none",
                outline: "none",
                background: "none",
                fontSize: 14,
                fontWeight: 400,
                color: "#0F172B",
                width: "100%",
              }}
            />
          </div>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center"
            style={{
              backgroundColor: "#E8655B",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              gap: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              height: 44,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>picture_as_pdf</span>
            Unduh Laporan
          </button>
        </div>

        {/* Table */}
        <div
          style={{
            border: "1px solid #ECEEF0",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#ECF9FC" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 14, fontWeight: 500, color: "#488BBE", width: "30%" }}>
                  Nama
                </th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 14, fontWeight: 500, color: "#488BBE", width: "20%" }}>
                  {type === "student" ? "Kelas" : "Departemen"}
                </th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 14, fontWeight: 500, color: "#488BBE", width: "18%" }}>
                  Jenis Kelamin
                </th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 14, fontWeight: 500, color: "#488BBE", width: "18%" }}>
                  {type === "student" ? "NIS" : "Usia"}
                </th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 14, fontWeight: 500, color: "#488BBE", width: "14%" }}>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}
                  >
                    <span className="material-icons" style={{ fontSize: 32, display: "block", marginBottom: 8 }}>
                      inbox
                    </span>
                    {searchQuery
                      ? `Tidak ditemukan ${entityName.toLowerCase()} dengan nama "${searchQuery}"`
                      : "Tidak ada data untuk ditampilkan"}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={item.id || index}
                    style={{ borderBottom: "1px solid #F1F5F9" }}
                  >
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 400, color: "#1E293B" }}>
                      {item.fullName || item.nama || "-"}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 400, color: "#64748B", textAlign: "center" }}>
                      {type === "student"
                        ? (item.grade && item.classroom ? `${item.grade} - ${item.classroom}` : item.grade || item.kelas || "-")
                        : (item.department || "-")}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 400, color: "#64748B", textAlign: "center" }}>
                      {formatGender(item.gender || item.jenisKelamin)}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 400, color: "#64748B", textAlign: "center" }}>
                      {type === "student"
                        ? (item.nis || "-")
                        : (item.age ? `${item.age} Tahun` : "-")}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "center" }}>
                      <button
                        onClick={handleDownloadPdf}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Download PDF"
                      >
                        <img
                          src="/icon/pdf.svg"
                          alt="Download PDF"
                          style={{ width: 24, height: 24 }}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex justify-end items-center"
            style={{ gap: 8, paddingBottom: 40 }}
          >
            {/* First page << */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              style={pageButtonStyle(false, currentPage <= 1)}
            >
              «
            </button>

            {/* Previous page < */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={pageButtonStyle(false, currentPage <= 1)}
            >
              ‹
            </button>

            {renderPagination()}

            {/* Next page > */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={pageButtonStyle(false, currentPage >= totalPages)}
            >
              ›
            </button>

            {/* Last page >> */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              style={pageButtonStyle(false, currentPage >= totalPages)}
            >
              »
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailLaporanPage
