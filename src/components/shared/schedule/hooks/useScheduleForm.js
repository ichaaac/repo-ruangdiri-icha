// src/components/shared/schedule/hooks/useScheduleForm.js - FIXED ATTACHMENT UPLOAD

import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import dayjs from "dayjs"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { parseScheduleDateTime } from "../utils/timezoneHandler"
import { createScheduleApi } from "../lib/scheduleApi"

const formatDateLocal = (date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const useScheduleForm = (mode = "create", initialData = null, isOpen = false) => {
  const [formData, setFormData] = useState(() => ({
    agenda: "",
    type: "counseling",
    dates: [
      {
        date: formatDateLocal(new Date()),
        startTime: "09:00",
        endTime: "10:00",
        timezone: "WIB",
      },
    ],
    notificationOffset: 60,
    selectedPsychologist: null,
    selectedParticipants: [],
    location: "",
    customLocation: "",
    description: "",
    multipleDate: false,
  }))

  const [dropdowns, setDropdowns] = useState({})
  const [attachments, setAttachments] = useState([])
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const [psychologistLocations, setPsychologistLocations] = useState([])
  const [participantSearch, setParticipantSearch] = useState("")
  const [hasShownUnsavedToast, setHasShownUnsavedToast] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)

  const editorRef = useRef(null)
  const photoInputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Enhanced error message parser
  const parseErrorMessage = (message) => {
    if (!message) return "An error occurred"

    const isoDatePattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)/g
    const dateTimePattern = /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/g

    let parsedMessage = message

    parsedMessage = parsedMessage.replace(isoDatePattern, (match) => {
      try {
        const date = new Date(match)
        const dateStr = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        const timeStr = date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        return `${dateStr} ${timeStr}`
      } catch (e) {
        return match
      }
    })

    parsedMessage = parsedMessage.replace(dateTimePattern, (match) => {
      try {
        const date = new Date(match)
        const dateStr = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        const timeStr = date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        return `${dateStr} ${timeStr}`
      } catch (e) {
        return match
      }
    })

    return parsedMessage
  }

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      try {
        if (mode === "edit" && initialData) {
          let dates = []
          if (initialData.dates && initialData.dates.length > 0) {
            dates = initialData.dates.map((dateInfo) => ({
              ...dateInfo,
              timezone: dateInfo.timezone || "WIB",
            }))
          } else if (initialData.startDateTime) {
            const scheduleData = parseScheduleDateTime(
              initialData.startDateTime,
              initialData.endDateTime,
              initialData.timezone,
            )

            dates = [
              {
                date: scheduleData.date,
                startTime: scheduleData.startTime,
                endTime: scheduleData.endTime,
                timezone: scheduleData.timezone || "WIB",
              },
            ]
          }

          let locationValue = ""
          if (initialData.type === "counseling") {
            locationValue = initialData.location || initialData._originalBackendLocation || ""
          }

          const transformedData = {
            agenda: initialData.agenda || "",
            type: initialData.type || "counseling",
            description: initialData.description || "",
            notificationOffset: initialData.notificationOffset || 60,
            dates:
              dates.length > 0
                ? dates
                : [
                    {
                      date: formatDateLocal(new Date()),
                      startTime: "09:00",
                      endTime: "10:00",
                      timezone: "WIB",
                    },
                  ],
            location: initialData.type === "counseling" ? locationValue : "",
            customLocation:
              initialData.type !== "counseling" ? initialData.customLocation || initialData.location || "" : "",
            selectedPsychologist: initialData.selectedPsychologist || null,
            selectedParticipants: Array.isArray(initialData.selectedParticipants) ? initialData.selectedParticipants : [],
            multipleDate: dates.length > 1 || initialData.multipleDate || false,
            _originalBackendLocation: initialData.location,
          }

          setFormData(transformedData)

          // FIXED: Handle existing attachments from initialData
          if (initialData.attachments && Array.isArray(initialData.attachments) && initialData.attachments.length > 0) {
            const existingAttachments = initialData.attachments.map(att => ({
              ...att,
              id: att.id || `existing-${Date.now()}-${Math.random()}`,
              isExisting: true,
              name: att.originalName || att.fileName || `File ${att.id}`,
              size: att.fileSize || 0,
              type: att.fileType?.startsWith('image/') ? 'image' : 'document',
              fileType: att.fileType || 'application/octet-stream',
              downloadUrl: att.fileUrl || ''
            }))
            setAttachments(existingAttachments)
          } else {
            setAttachments([])
          }

          if (editorRef.current && transformedData.description) {
            editorRef.current.innerHTML = transformedData.description
          }
        } else {
          let defaultDates = [
            {
              date: formatDateLocal(new Date()),
              startTime: "09:00",
              endTime: "10:00",
              timezone: "WIB",
            },
          ]

          if (initialData?.dates && Array.isArray(initialData.dates) && initialData.dates.length > 0) {
            defaultDates = initialData.dates.map((dateInfo) => {
              let dateString = dateInfo.date
              if (dateInfo.date instanceof Date) {
                dateString = formatDateLocal(dateInfo.date)
              }

              return {
                date: dateString,
                startTime: dateInfo.startTime || "09:00",
                endTime: dateInfo.endTime || "10:00",
                timezone: dateInfo.timezone || "WIB",
              }
            })
          } else if (initialData?.startDateTime && initialData?.endDateTime) {
            const startDate = new Date(initialData.startDateTime)
            const endDate = new Date(initialData.endDateTime)

            defaultDates = [
              {
                date: formatDateLocal(startDate),
                startTime: startDate.toTimeString().slice(0, 5),
                endTime: endDate.toTimeString().slice(0, 5),
                timezone: "WIB",
              },
            ]
          }

          const createModeData = {
            agenda: "",
            type: "counseling",
            dates: defaultDates,
            notificationOffset: 60,
            selectedPsychologist: null,
            selectedParticipants: [],
            location: "",
            customLocation: "",
            description: "",
            multipleDate: initialData?.multipleDate || initialData?.draggedDays > 1 || defaultDates.length > 1,
          }

          setFormData(createModeData)
          setAttachments([])

          if (editorRef.current) {
            editorRef.current.innerHTML = ""
          }
        }

        setDropdowns({})
        setParticipantSearch("")
        setHasShownUnsavedToast(false)
        setPreviewAttachment(null)
      } catch (error) {
        console.error("Error initializing form data:", error)
        toast.error("Gagal memuat form, silakan coba lagi")
        
        // Fallback to safe default state
        setFormData({
          agenda: "",
          type: "counseling",
          dates: [
            {
              date: formatDateLocal(new Date()),
              startTime: "09:00",
              endTime: "10:00",
              timezone: "WIB",
            },
          ],
          notificationOffset: 60,
          selectedPsychologist: null,
          selectedParticipants: [],
          location: "",
          customLocation: "",
          description: "",
          multipleDate: false,
        })
        setAttachments([])
        setDropdowns({})
        setParticipantSearch("")
        setHasShownUnsavedToast(false)
        setPreviewAttachment(null)
      }
    }
  }, [isOpen, mode, initialData])

  // Event types and options
  const eventTypes = [
    { label: "Konseling", value: "counseling", textColor: "#9986FF" },
    { label: "Kelas", value: "class", textColor: "#3CE69E" },
    { label: "Seminar", value: "seminar", textColor: "#FF886D" },
    { label: "Lainnya", value: "others", textColor: "#979797" },
  ]

  const notificationOptions = [
    { label: "1 jam", value: 60 },
    { label: "12 jam", value: 720 },
    { label: "1 hari", value: 1440 },
    { label: "3 hari", value: 4320 },
  ]

  const timezoneOptions = [
    { label: "WIB", value: "WIB" },
    { label: "WITA", value: "WITA" },
    { label: "WIT", value: "WIT" },
  ]

  const fixedLocationOptions = [
    { label: "Online", value: "online" },
    { label: "Offline", value: "offline" },
    { label: "Seed-in", value: "organization" },
  ]

  // Generate time options
  const timeOptions = (() => {
    const times = []
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        times.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`)
      }
    }
    return times
  })()

  // Fetch psychologist locations
  const { data: backendLocations = [] } = useQuery({
    queryKey: ["psychologist-locations"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/psychologists/locations")
        const data = response.data || []
        
        // FIXED: Handle various response formats and ensure we get strings
        let locations = []
        
        if (Array.isArray(data)) {
          locations = data.map(item => {
            if (typeof item === 'string') {
              return item
            } else if (typeof item === 'object' && item !== null) {
              // Handle object with locations array
              if (item.locations && Array.isArray(item.locations)) {
                return item.locations[0] || item.address || JSON.stringify(item)
              }
              // Handle simple object
              return item.name || item.label || item.value || JSON.stringify(item)
            }
            return String(item)
          }).filter(Boolean) // Remove empty values
        } else if (typeof data === 'object' && data !== null) {
          // If data is an object, try to extract locations
          if (data.locations && Array.isArray(data.locations)) {
            locations = data.locations.map(String).filter(Boolean)
          } else {
            locations = [JSON.stringify(data)]
          }
        }
        
        console.log("Processed psychologist locations:", locations)
        setPsychologistLocations(locations)
        return locations
      } catch (error) {
        console.error("Error fetching psychologist locations:", error)
        toast.error("Gagal memuat lokasi psikolog")
        setPsychologistLocations([])
        return []
      }
    },
    enabled: isOpen && formData.type === "counseling" && !formData.selectedPsychologist,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Fetch psychologists
  const { data: psychologists = [], isLoading: loadingPsychologists } = useQuery({
    queryKey: ["psychologists", formData.location],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/psychologists")
        const data = response.data?.data || response.data || []
        
        // FIXED: Ensure data is always an array with proper structure
        if (!Array.isArray(data)) {
          console.warn("Psychologists API returned non-array data:", data)
          return []
        }
        
        // Ensure each psychologist has required fields
        return data.map(psychologist => ({
          ...psychologist,
          id: psychologist.id || `psych-${Date.now()}-${Math.random()}`,
          fullName: psychologist.fullName || psychologist.name || 'Unknown Psychologist',
          email: psychologist.email || 'no-email@example.com'
        }))
      } catch (error) {
        console.error("Error fetching psychologists:", error)
        toast.error("Gagal memuat data psikolog")
        return []
      }
    },
    enabled: isOpen && formData.type === "counseling" && dropdowns.psychologist,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  // Fetch participants
  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ["participants", participantSearch],
    queryFn: async () => {
      try {
        const params = {
          limit: 100,
          ...(participantSearch && { search: participantSearch }),
        }
        const response = await apiClient.get("/users", { params })
        const data = response.data?.data || []
        
        // FIXED: Ensure data is always an array with proper structure  
        if (!Array.isArray(data)) {
          console.warn("Participants API returned non-array data:", data)
          return []
        }
        
        // Ensure each participant has required fields
        return data.map(participant => ({
          ...participant,
          id: participant.id || `participant-${Date.now()}-${Math.random()}`,
          fullName: participant.fullName || participant.name || 'Unknown Participant',
          email: participant.email || 'no-email@example.com'
        }))
      } catch (error) {
        console.error("Error fetching participants:", error)
        toast.error("Gagal memuat data partisipan")
        return []
      }
    },
    enabled: isOpen && formData.type === "counseling" && (dropdowns.participants1 || dropdowns.participants2),
    staleTime: 30 * 1000,
    retry: 1,
  })

  // FIXED: Upload attachments mutation using correct bulk endpoint
  const uploadAttachmentsMutation = useMutation({
    mutationFn: async ({ scheduleIds, files }) => {
      console.log("=== Uploading attachments ===")
      console.log("Schedule IDs:", scheduleIds)
      console.log("Files to upload:", files)

      // FIXED: Validate inputs
      if (!scheduleIds || (Array.isArray(scheduleIds) && scheduleIds.length === 0)) {
        throw new Error('Schedule IDs are required for attachment upload');
      }
      
      if (!files || files.length === 0) {
        throw new Error('No files provided for upload');
      }

      // FIXED: Use the scheduleApi uploadAttachments method which handles the correct endpoint
      const scheduleApi = createScheduleApi('school'); // Use appropriate organization type
      
      try {
        const result = await scheduleApi.uploadAttachments(scheduleIds, files);
        return result;
      } catch (error) {
        console.error('Failed to upload attachments:', error);
        throw error;
      }
    },
  })

  // FIXED: Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async ({ scheduleId, attachmentId }) => {
      console.log("=== Deleting attachment ===")
      console.log("Schedule ID:", scheduleId)
      console.log("Attachment ID:", attachmentId)

      try {
        const response = await apiClient.delete(`/schedules/${scheduleId}/attachments/${attachmentId}`)
        console.log("Delete attachment response:", response)
        return { scheduleId, attachmentId, success: true, data: response.data }
      } catch (error) {
        console.error("Delete attachment error:", error)
        throw new Error(error.response?.data?.message || error.message || "Failed to delete attachment")
      }
    },
  })

  // FIXED: Form validation - Fix timezone issues and past time detection
  const validateForm = () => {
    const now = dayjs() // Current local time

    if (!formData.agenda.trim()) {
      toast.error("Agenda wajib diisi")
      return false
    }

    // Date and time validation
    for (let i = 0; i < formData.dates.length; i++) {
      const dateInfo = formData.dates[i]
      
      // FIXED: Parse datetime properly considering local timezone
      const scheduleDateTime = dayjs(`${dateInfo.date} ${dateInfo.startTime}`, 'YYYY-MM-DD HH:mm')

      console.log('=== VALIDATION DEBUG ===')
      console.log('Current time (now):', now.format('YYYY-MM-DD HH:mm:ss'))
      console.log('Schedule datetime:', scheduleDateTime.format('YYYY-MM-DD HH:mm:ss'))
      console.log('Is schedule before now?:', scheduleDateTime.isBefore(now))
      console.log('Time difference (minutes):', scheduleDateTime.diff(now, 'minute'))

      // FIXED: Only prevent schedules that are more than 5 minutes in the past
      // This accounts for small timezone differences and processing delays
   if (mode === 'create' && scheduleDateTime.isBefore(now.subtract(5, 'minute'))) {
        toast.error(`Tidak dapat mengatur jadwal di masa lalu (${scheduleDateTime.format('DD/MM/YYYY HH:mm')})`)
        return false
      }

      // Check if start time equals end time
      if (dateInfo.startTime === dateInfo.endTime) {
        toast.error(`Waktu mulai dan selesai tidak boleh sama pada tanggal ${dateInfo.date}`)
        return false
      }

      // Check if start time is after end time
      const startMinutes = convertTimeToMinutes(dateInfo.startTime)
      const endMinutes = convertTimeToMinutes(dateInfo.endTime)

      if (startMinutes >= endMinutes) {
        toast.error(`Waktu mulai harus lebih awal dari waktu selesai pada tanggal ${dateInfo.date}`)
        return false
      }
    }

    // FIXED: Specific validation for counseling schedules less than 24 hours from now (edit mode only)
    if (mode === "edit" && formData.type === "counseling" && initialData?.startDateTime) {
      const originalScheduleStart = dayjs(initialData.startDateTime)
      const twentyFourHoursFromNow = now.add(24, "hour")

      if (originalScheduleStart.isBefore(twentyFourHoursFromNow)) {
        toast.error("Tidak dapat mengedit jadwal konseling yang kurang dari 24 jam dari sekarang.")
        return false
      }
    }

    if (formData.type === "counseling") {
      if (!formData.selectedPsychologist) {
        toast.error("Psikolog wajib dipilih untuk konseling")
        return false
      }
      if (formData.selectedParticipants.length === 0) {
        toast.error("Minimal satu partisipan harus ditambahkan untuk konseling")
        return false
      }
      if (formData.selectedParticipants.length > 2) {
        toast.error("Maksimal dua klien untuk konseling")
        return false
      }
      if (!formData.location.trim()) {
        toast.error("Lokasi wajib dipilih untuk konseling")
        return false
      }
    }

    return true
  }

  const convertTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    return hours * 60 + minutes
  }

  // Event handlers
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "selectedPsychologist" && formData.type === "counseling") {
      setFormData((prev) => ({ ...prev, selectedPsychologist: value, location: "" }))
      return
    }

    if (field === "dates") {
      const updatedDates = value.map((date) => {
        const startIndex = timeOptions.indexOf(date.startTime)
        const endIndex = timeOptions.indexOf(date.endTime)
        if (startIndex >= endIndex) {
          return {
            ...date,
            endTime: timeOptions[Math.min(startIndex + 1, timeOptions.length - 1)],
          }
        }
        return date
      })
      setFormData((prev) => ({
        ...prev,
        dates: updatedDates,
        multipleDate: updatedDates.length > 1,
      }))
      return
    }
  }

  const toggleDropdown = (dropdown) => {
    setDropdowns((prev) => {
      const newState = {
        ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
        [dropdown]: !prev[dropdown],
      }

      if (dropdown.includes("participants") && prev[dropdown]) {
        setParticipantSearch("")
      }

      return newState
    })
  }

  // Location options
  const getAvailableLocations = () => {
    if (formData.selectedPsychologist) {
      return fixedLocationOptions
    } else {
      // FIXED: Ensure we return proper array of objects, not raw strings
      return (psychologistLocations || []).map((location) => {
        // Handle case where location might be an object with nested properties
        if (typeof location === 'object' && location !== null) {
          // If location is an object like {locations: [...], address: "..."}
          if (location.locations && Array.isArray(location.locations)) {
            // Return the first location from the array, or use address as fallback
            const locationValue = location.locations[0] || location.address || 'Unknown';
            return {
              label: locationValue,
              value: locationValue,
            };
          } else if (location.name || location.label || location.value) {
            // Handle standard location object
            return {
              label: location.name || location.label || location.value,
              value: location.value || location.name || location.label,
            };
          } else {
            // Convert object to string representation
            const locationStr = JSON.stringify(location);
            return {
              label: locationStr,
              value: locationStr,
            };
          }
        } else {
          // Handle simple string locations
          return {
            label: String(location),
            value: String(location),
          };
        }
      }).filter(location => location.label && location.value); // Filter out invalid entries
    }
  }

  // FIXED: File handling with better validation and preview
  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files)
    const maxSize = 15 * 1024 * 1024 // 15MB
    const maxTotalSize = 50 * 1024 * 1024 // 50MB total

    let currentTotalSize = attachments.reduce((sum, att) => sum + att.size, 0)
    const validFiles = []

    // Check file types
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    const allowedDocTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ]

    files.forEach((file) => {
      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File ${file.name} terlalu besar. Maksimal 15MB per file.`)
        return
      }

      // Validate total size
      if (currentTotalSize + file.size > maxTotalSize) {
        toast.error(`Total ukuran file melebihi batas 50MB`)
        return
      }

      // Validate file type
      if (type === "image" && !allowedImageTypes.includes(file.type)) {
        toast.error(`File ${file.name} bukan format gambar yang didukung`)
        return
      }

      if (type === "document" && !allowedDocTypes.includes(file.type)) {
        toast.error(`File ${file.name} bukan format dokumen yang didukung`)
        return
      }

      // Check for duplicates
      const isDuplicate = attachments.some((att) => att.name === file.name && att.size === file.size)

      if (isDuplicate) {
        toast.error(`File ${file.name} sudah dipilih`)
        return
      }

      const attachment = {
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: type,
        fileType: file.type,
      }

      // Generate preview for images
      if (type === "image" && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          attachment.preview = e.target.result
          setAttachments((prev) =>
            prev.map((att) => (att.id === attachment.id ? { ...att, preview: e.target.result } : att)),
          )
        }
        reader.readAsDataURL(file)
      }

      validFiles.push(attachment)
      currentTotalSize += file.size
    })

    if (validFiles.length > 0) {
      setAttachments((prev) => [...prev, ...validFiles])
      toast.success(`${validFiles.length} file berhasil dipilih`)
    }

    // Clear input
    e.target.value = ""
  }

  const removeAttachment = (attachmentId) => {
    const attachmentToRemove = attachments.find(att => att.id === attachmentId)
    
    if (!attachmentToRemove) {
      toast.error("Attachment tidak ditemukan")
      return
    }

    // FIXED: Handle removing existing attachments vs new attachments
    if (attachmentToRemove.isExisting && initialData?.id) {
      // For existing attachments, call delete API
      toast("Hapus lampiran dari server?", {
        description: `Lampiran "${attachmentToRemove.name}" akan dihapus secara permanen.`,
        action: {
          label: "Ya, Hapus",
          onClick: async () => {
            try {
              await deleteAttachmentMutation.mutateAsync({
                scheduleId: initialData.id,
                attachmentId: attachmentToRemove.id
              })
              
              // Remove from local state after successful deletion
              setAttachments((prev) => prev.filter((att) => att.id !== attachmentId))
              toast.success("Lampiran berhasil dihapus dari server")
            } catch (error) {
              console.error("Failed to delete attachment:", error)
              toast.error("Gagal menghapus lampiran", {
                description: error.message || "Terjadi kesalahan saat menghapus lampiran"
              })
            }
          },
          className: "!bg-red-600 hover:!bg-red-700 !text-white !border-red-600 hover:!border-red-700 !ml-auto"
        },
        cancel: {
          label: "Batal",
          onClick: () => {
            // Do nothing
          },
          className: "!bg-transparent hover:!bg-gray-100 !text-gray-700 !border !border-gray-300 hover:!border-gray-400"
        },
        duration: 10000,
        className: "!bg-white !border !border-gray-200 !shadow-lg",
        position: "top-center"
      })
    } else {
      // For new attachments, just remove from local state
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId))
      toast.success("File dihapus dari daftar lampiran")
    }
  }

  // Participant handlers
  const handleParticipantSelect = (participant, slotIndex = 0) => {
    const newParticipants = [...formData.selectedParticipants]

    if (!newParticipants.find((p) => p.id === participant.id)) {
      if (slotIndex === 0 && !newParticipants[0]) {
        newParticipants[0] = participant
      } else if (slotIndex === 1 && !newParticipants[1]) {
        newParticipants[1] = participant
      } else if (!newParticipants[0]) {
        newParticipants[0] = participant
      } else if (!newParticipants[1]) {
        newParticipants[1] = participant
      }
    }

    setFormData((prev) => ({
      ...prev,
      selectedParticipants: newParticipants.filter(Boolean),
    }))

    setDropdowns((prev) => ({ ...prev, participants1: false, participants2: false }))
    setParticipantSearch("")
  }

  const removeParticipant = (participantId) => {
    setFormData((prev) => ({
      ...prev,
      selectedParticipants: prev.selectedParticipants.filter((p) => p.id !== participantId),
    }))
  }

  // Date handlers
  const removeDateSlot = (index) => {
    const newDates = formData.dates.filter((_, i) => i !== index)
    handleInputChange("dates", newDates)

    if (newDates.length <= 1) {
      handleInputChange("multipleDate", false)
    }
  }

  const updateAdditionalDate = (index, field, value) => {
    const newDates = [...formData.dates]
    newDates[index] = { ...newDates[index], [field]: value }

    // FIXED: Don't auto-adjust times, allow any duration
    if (field === "startTime") {
      const startTimeIndex = timeOptions.indexOf(value)
      const endTimeIndex = timeOptions.indexOf(newDates[index].endTime)

      // Only adjust if end time is before or equal to start time
      if (startTimeIndex >= endTimeIndex) {
        const newEndTimeIndex = Math.min(startTimeIndex + 1, timeOptions.length - 1)
        newDates[index].endTime = timeOptions[newEndTimeIndex]
      }
    }

    if (field === "endTime") {
      const startTimeIndex = timeOptions.indexOf(newDates[index].startTime)
      const endTimeIndex = timeOptions.indexOf(value)

      // Only adjust if end time is before or equal to start time
      if (endTimeIndex <= startTimeIndex) {
        const newStartTimeIndex = Math.max(endTimeIndex - 1, 0)
        newDates[index].startTime = timeOptions[newStartTimeIndex]
      }
    }

    handleInputChange("dates", newDates)
  }

  // Unsaved changes detection
  const hasUnsavedChanges = () => {
    if (mode !== "edit" || !initialData) {
      return (
        formData.agenda.trim() !== "" ||
        formData.description.trim() !== "" ||
        formData.selectedParticipants.length > 0 ||
        formData.selectedPsychologist !== null ||
        attachments.length > 0
      )
    }

    const current = {
      agenda: formData.agenda,
      type: formData.type,
      description: formData.description,
      notificationOffset: formData.notificationOffset,
      dates: formData.dates,
      location: formData.location,
      customLocation: formData.customLocation,
      multipleDate: formData.multipleDate,
    }

    const initial = {
      agenda: initialData.agenda || "",
      type: initialData.type || "counseling",
      description: initialData.description || "",
      notificationOffset: initialData.notificationOffset || 60,
      dates: initialData.dates || [],
      location: initialData.location || "",
      customLocation: initialData.customLocation || "",
      multipleDate: initialData.multipleDate || false,
    }

    return JSON.stringify(current) !== JSON.stringify(initial) || attachments.length > 0
  }

  return {
    // Form state
    formData,
    dropdowns,
    attachments,
    uploadingAttachments,
    participantSearch,
    hasShownUnsavedToast,
    previewAttachment,

    // Refs
    editorRef,
    photoInputRef,
    fileInputRef,

    // Setters
    setFormData,
    setDropdowns,
    setAttachments,
    setUploadingAttachments,
    setParticipantSearch,
    setHasShownUnsavedToast,
    setPreviewAttachment,

    // Options and constants
    eventTypes,
    notificationOptions,
    timezoneOptions,
    fixedLocationOptions,
    timeOptions,

    // Query data
    psychologists,
    participants,
    loadingPsychologists,
    loadingParticipants,
    getAvailableLocations,

    // Handlers
    handleInputChange,
    toggleDropdown,
    handleFileSelect,
    removeAttachment,
    handleParticipantSelect,
    removeParticipant,
    removeDateSlot,
    updateAdditionalDate,

    // Validation and utilities
    validateForm,
    hasUnsavedChanges,
    parseErrorMessage,

    // Mutations
    uploadAttachmentsMutation,
    deleteAttachmentMutation,
  }
}