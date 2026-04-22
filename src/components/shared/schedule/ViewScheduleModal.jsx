// src/components/shared/schedule/ViewScheduleModal.jsx

import { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createScheduleApi } from "./lib/scheduleApi"

const FONT = "Plus Jakarta Sans, sans-serif"

const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]

const InfoCard = ({ icon, iconBg, label, children }) => (
  <div style={{ backgroundColor: "#F8FAFC", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span className="material-icons" style={{ fontSize: 20, color: "inherit" }}>{icon}</span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 12, color: "#9CA3AF", fontFamily: FONT, margin: 0, lineHeight: "16px" }}>{label}</p>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937", fontFamily: FONT, marginTop: 2 }}>{children}</div>
    </div>
  </div>
)

const ViewScheduleModal = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  scheduleData: initialScheduleData,
  loading = false,
  organizationType = "school",
}) => {
  const [downloadingAttachment, setDownloadingAttachment] = useState(null)
  const [scheduleData, setScheduleData] = useState(initialScheduleData)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()

  const scheduleApi = createScheduleApi(organizationType)

  const isScheduleInPast = () => {
    if (!scheduleData?.startDateTime) return false
    return new Date(scheduleData.startDateTime) < new Date(Date.now() - 5 * 60 * 1000)
  }

  const isWithin24Hours = () => {
    if (!scheduleData?.startDateTime || scheduleData.type !== "counseling") return false
    return new Date(scheduleData.startDateTime) < new Date(Date.now() + 24 * 60 * 60 * 1000)
  }

  const isEditDisabled = () => isScheduleInPast() || (scheduleData.type === "counseling" && isWithin24Hours())

  const { data: detailedScheduleData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["schedule-detail", initialScheduleData?.id],
    queryFn: async () => {
      if (!initialScheduleData?.id) return null
      const response = await scheduleApi.getScheduleById(initialScheduleData.id)
      if (response.data?.status === "success") return response.data.data
      return response.data?.data || null
    },
    enabled: !!initialScheduleData?.id && isOpen,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    networkMode: "always",
    useErrorBoundary: false,
  })

  useEffect(() => {
    if (detailedScheduleData) setScheduleData(detailedScheduleData)
    else if (initialScheduleData) setScheduleData(initialScheduleData)
  }, [detailedScheduleData, initialScheduleData])

  useEffect(() => {
    if (isOpen) {
      window.closeAllModals = () => onClose()
    }
    return () => { if (window.closeAllModals) delete window.closeAllModals }
  }, [isOpen, onClose])

  if (!isOpen || !scheduleData) return null

  // --- Data helpers ---
  const getDatesFromSchedule = () => {
    if (scheduleData.dates?.length > 0) {
      return scheduleData.dates.map((d) => ({ ...d, timezone: d.timezone || "WIB" }))
    }
    if (scheduleData.startDateTime) {
      const s = new Date(scheduleData.startDateTime)
      const e = new Date(scheduleData.endDateTime)
      return [{
        date: s.toISOString().split("T")[0],
        startTime: s.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        endTime: e.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        timezone: "WIB",
      }]
    }
    return []
  }
  const dates = getDatesFromSchedule()

  const formatDateLong = (dateString) => {
    if (!dateString) return ""
    const d = new Date(dateString)
    return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
  }

  const getPsychologist = () => {
    if (scheduleData.type !== "counseling") return null
    if (scheduleData.participants) {
      const p = scheduleData.participants.find((p) => p.role === "psychologist")
      if (p) return p
    }
    if (scheduleData.usersSchedules) {
      const ps = scheduleData.usersSchedules.find((us) => us.user.role === "psychologist")
      if (ps?.user) return ps.user
    }
    return null
  }

  const getLocationText = () => {
    if (scheduleData.type === "counseling") {
      const loc = scheduleData.location
      if (loc === "online") return "Daring (Zoom)"
      if (loc === "offline") return "Luring"
      if (loc === "organization" || loc === "seed-in") return "Sit-in"
      if (loc) return loc
    }
    return scheduleData.customLocation || "Lokasi tidak ditentukan"
  }

  const getZoomLink = () => scheduleData.zoomJoinUrl || scheduleData.zoomStartUrl || null

  // --- Attachment helpers ---
  const getAttachmentUrl = (attachment) => {
    if (!attachment.fileUrl) return null
    if (attachment.fileUrl.startsWith("http")) return attachment.fileUrl
    const uploadUrl = import.meta.env.VITE_UPLOAD_URL || import.meta.env.VITE_API_URL || ""
    return `${uploadUrl}${attachment.fileUrl}`
  }

  const handleAttachmentClick = async (attachment) => {
    const url = getAttachmentUrl(attachment)
    if (!url) { toast.error("URL file tidak ditemukan"); return }
    if (attachment.fileType?.startsWith("image/")) {
      window.open(url, "_blank", "width=800,height=600,scrollbars=yes")
    } else {
      try {
        setDownloadingAttachment(attachment.id)
        const link = document.createElement("a")
        link.href = url
        link.download = attachment.originalName || "attachment"
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (err) {
        toast.error("Gagal mengunduh file")
      } finally {
        setDownloadingAttachment(null)
      }
    }
  }

  const handleFileUpload = async (files) => {
    if (!files?.length || !scheduleData?.id) return
    const validTypes = ["image/jpeg", "image/jpg", "image/png"]
    const validFiles = Array.from(files).filter((f) => validTypes.includes(f.type))
    if (!validFiles.length) { toast.error("Format file harus JPG, JPEG, atau PNG"); return }

    setUploading(true)
    try {
      await scheduleApi.uploadAttachments(scheduleData.id, validFiles)
      toast.success("File berhasil diunggah")
      setUploadedFiles((prev) => [...prev, ...validFiles.map((f) => f.name)])
      queryClient.invalidateQueries({ queryKey: ["schedule-detail", scheduleData.id] })
      queryClient.invalidateQueries({ queryKey: ["schedules"] })
    } catch {
      toast.error("Gagal mengunggah file")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFileUpload(e.dataTransfer.files)
  }

  // --- Actions ---
  const handleEdit = () => {
    if (loading || isLoadingDetail) return
    if (isEditDisabled()) {
      toast.error(isScheduleInPast() ? "Tidak dapat mengedit jadwal yang sudah berlalu" : "Tidak dapat mengedit konseling kurang dari 24 jam")
      return
    }
    onEdit?.(scheduleData)
  }

  const handleDelete = () => {
    if (!onDelete || loading || isLoadingDetail) return
    toast("Apakah Anda yakin ingin menghapus jadwal ini?", {
      description: "Tindakan ini tidak dapat dibatalkan.",
      action: {
        label: "Ya, Hapus",
        onClick: () => {
          if (isScheduleInPast()) { toast.error("Tidak dapat menghapus jadwal yang sudah berlalu"); return }
          onDelete(scheduleData)
        },
        className: "!bg-red-600 hover:!bg-red-700 !text-white !border-red-600",
      },
      cancel: { label: "Batal", onClick: () => {} },
      duration: 10000,
      position: "top-center",
    })
  }

  const psychologist = getPsychologist()
  const zoomLink = getZoomLink()
  const isOnline = scheduleData.location === "online"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[480px] mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" style={{ fontFamily: FONT }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 12px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1F2937", margin: 0 }}>Detail Data</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <span className="material-icons" style={{ fontSize: 22, color: "#9CA3AF" }}>close</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "8px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Agenda */}
          <InfoCard icon="event_note" iconBg="#FFEAEA" label="Agenda">
            <span style={{ color: "#1F2937" }}>{scheduleData.agenda || "Konseling"}</span>
          </InfoCard>

          {/* Tanggal */}
          {dates.map((dateInfo, i) => (
            <InfoCard key={i} icon="calendar_today" iconBg="#E0F2FE" label="Tanggal">
              <span style={{ color: "#1F2937" }}>{formatDateLong(dateInfo.date)}</span>
            </InfoCard>
          ))}

          {/* Jam Mulai & Jam Selesai side by side */}
          {dates.length > 0 && (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-icons" style={{ fontSize: 20, color: "#22C55E" }}>schedule</span>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: "16px" }}>Jam Mulai</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1F2937", margin: 0, marginTop: 2 }}>{dates[0].startTime}</p>
                </div>
              </div>
              <div style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-icons" style={{ fontSize: 20, color: "#F97316" }}>schedule</span>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: "16px" }}>Jam Selesai</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1F2937", margin: 0, marginTop: 2 }}>{dates[0].endTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* Psikolog */}
          {scheduleData.type === "counseling" && (
            <InfoCard icon="person" iconBg="#F3E8FF" label="Psikolog">
              <span style={{ color: "#1F2937" }}>{psychologist?.fullName || psychologist?.email || "-"}</span>
            </InfoCard>
          )}

          {/* Lokasi */}
          <InfoCard icon="location_on" iconBg="#E0F2FE" label="Lokasi">
            <span style={{ color: "#1F2937" }}>{getLocationText()}</span>
          </InfoCard>

          {/* Link Zoom */}
          {isOnline && (
            <div style={{ backgroundColor: "#F8FAFC", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-icons" style={{ fontSize: 20, color: "#3B82F6" }}>link</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: "16px" }}>Link Zoom</p>
                {zoomLink ? (
                  <a href={zoomLink} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 500, color: "#3B82F6", textDecoration: "none", wordBreak: "break-all", display: "block", marginTop: 2, lineHeight: "140%" }}>
                    {zoomLink}
                  </a>
                ) : (
                  <p style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic", margin: 0, marginTop: 2 }}>Link belum tersedia</p>
                )}
              </div>
            </div>
          )}

          {/* Existing Attachments */}
          {scheduleData.attachments?.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 500, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-icons" style={{ fontSize: 18, color: "#9CA3AF" }}>attach_file</span>
                File Lampiran
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {scheduleData.attachments.map((att, i) => (
                  <button key={att.id || i} onClick={() => handleAttachmentClick(att)}
                    disabled={downloadingAttachment === att.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
                      backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8,
                      cursor: "pointer", fontSize: 13, color: "#374151", fontFamily: FONT,
                    }}>
                    <span className="material-icons" style={{ fontSize: 16, color: "#6B7280" }}>
                      {att.fileType?.startsWith("image/") ? "image" : "description"}
                    </span>
                    <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {att.originalName || `File ${i + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload File */}
          <div style={{ marginTop: 4 }}>
            <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 500, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span className="material-icons" style={{ fontSize: 18, color: "#9CA3AF" }}>upload_file</span>
              Unggah File
            </p>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                border: "2px dashed #FECACA", borderRadius: 12, padding: "24px 16px",
                backgroundColor: "#FFF5F5", textAlign: "center", cursor: uploading ? "not-allowed" : "pointer",
                transition: "border-color 0.2s",
              }}
            >
              <span className="material-icons" style={{ fontSize: 32, color: "#E8655B", display: "block", marginBottom: 8 }}>cloud_upload</span>
              <p style={{ fontSize: 13, color: "#6B7280", margin: 0, fontFamily: FONT }}>
                {uploading ? "Mengunggah..." : "Klik untuk unggah file atau drag & drop"}
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0 0", fontFamily: FONT, fontWeight: 500 }}>
                Format File: JPG, JPEG, PNG
              </p>
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" multiple hidden
                onChange={(e) => handleFileUpload(e.target.files)} />
            </div>
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {uploadedFiles.map((name, i) => (
                  <span key={i} style={{ fontSize: 12, color: "#22C55E", backgroundColor: "#F0FDF4", padding: "4px 8px", borderRadius: 6 }}>
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={handleDelete} disabled={loading}
              style={{
                width: 48, height: 48, borderRadius: 12, border: "1.5px solid #EF4444",
                backgroundColor: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <span className="material-icons" style={{ fontSize: 20, color: "#EF4444" }}>delete</span>
            </button>
            <button onClick={handleEdit} disabled={loading || isEditDisabled()}
              style={{
                flex: 1, height: 48, borderRadius: 12, border: "none",
                backgroundColor: isEditDisabled() ? "#D1D5DB" : "#488BBA",
                color: "#FFFFFF", fontSize: 14, fontWeight: 600, cursor: isEditDisabled() ? "not-allowed" : "pointer",
                fontFamily: FONT, transition: "opacity 0.2s",
              }}>
              {loading ? "Loading..." : "Edit"}
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {(loading || isLoadingDetail) && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#488BBA]" />
              <span style={{ color: "#488BBA", fontWeight: 500 }}>Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewScheduleModal
