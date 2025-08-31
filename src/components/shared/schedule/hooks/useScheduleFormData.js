// src/components/shared/schedule/hooks/useScheduleFormData.js - Form State Management

import { useState, useRef, useEffect } from "react"

const formatDateLocal = (date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const useScheduleFormData = (mode = "create", initialData = null, isOpen = false) => {
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
  const [participantSearch, setParticipantSearch] = useState("")
  const [hasShownUnsavedToast, setHasShownUnsavedToast] = useState(false)

  const editorRef = useRef(null)
  const photoInputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      try {
        if (mode === "edit" && initialData) {
          initializeEditMode(initialData)
        } else {
          initializeCreateMode(initialData)
        }
        resetFormState()
      } catch (error) {
        console.error("Error initializing form data:", error)
        setFallbackState()
      }
    }
  }, [isOpen, mode, initialData])

  const initializeEditMode = (data) => {
    let dates = []
    if (data.dates && data.dates.length > 0) {
      dates = data.dates.map((dateInfo) => ({
        ...dateInfo,
        timezone: dateInfo.timezone || "WIB",
      }))
    } else if (data.startDateTime) {
      const startDate = new Date(data.startDateTime)
      const endDate = new Date(data.endDateTime)

      dates = [
        {
          date: startDate.toISOString().split('T')[0],
          startTime: startDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          endTime: endDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timezone: "WIB",
        },
      ]
    }

    let locationValue = ""
    if (data.type === "counseling") {
      locationValue = data.location || data._originalBackendLocation || ""
    }

    const transformedData = {
      agenda: data.agenda || "",
      type: data.type || "counseling",
      description: data.description || "",
      notificationOffset: data.notificationOffset || 60,
      dates: dates.length > 0 ? dates : getDefaultDates(),
      location: data.type === "counseling" ? locationValue : "",
      customLocation: data.type !== "counseling" ? data.customLocation || data.location || "" : "",
      selectedPsychologist: data.selectedPsychologist || null,
      selectedParticipants: Array.isArray(data.selectedParticipants) ? data.selectedParticipants : [],
      multipleDate: dates.length > 1 || data.multipleDate || false,
      _originalBackendLocation: data.location,
    }

    setFormData(transformedData)

    if (editorRef.current && transformedData.description) {
      editorRef.current.innerHTML = transformedData.description
    }
  }

  const initializeCreateMode = (data) => {
    let defaultDates = getDefaultDates()

    if (data?.dates && Array.isArray(data.dates) && data.dates.length > 0) {
      defaultDates = data.dates.map((dateInfo) => {
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
    } else if (data?.startDateTime && data?.endDateTime) {
      const startDate = new Date(data.startDateTime)
      const endDate = new Date(data.endDateTime)

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
      multipleDate: data?.multipleDate || data?.draggedDays > 1 || defaultDates.length > 1,
    }

    setFormData(createModeData)

    if (editorRef.current) {
      editorRef.current.innerHTML = ""
    }
  }

  const getDefaultDates = () => [
    {
      date: formatDateLocal(new Date()),
      startTime: "09:00",
      endTime: "10:00",
      timezone: "WIB",
    },
  ]

  const resetFormState = () => {
    setDropdowns({})
    setParticipantSearch("")
    setHasShownUnsavedToast(false)
  }

  const setFallbackState = () => {
    setFormData({
      agenda: "",
      type: "counseling",
      dates: getDefaultDates(),
      notificationOffset: 60,
      selectedPsychologist: null,
      selectedParticipants: [],
      location: "",
      customLocation: "",
      description: "",
      multipleDate: false,
    })
    resetFormState()
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "selectedPsychologist" && formData.type === "counseling") {
      setFormData((prev) => ({ ...prev, selectedPsychologist: value, location: "" }))
      return
    }

    if (field === "multipleDate") {
      handleMultipleDateChange(value)
      return
    }

    if (field === "dates") {
      handleDatesChange(value)
      return
    }
  }

  const handleMultipleDateChange = (value) => {
    if (value) {
      const firstDate = formData.dates[0]
      const nextDay = new Date(firstDate.date)
      nextDay.setDate(nextDay.getDate() + 1)

      const secondDate = {
        ...firstDate,
        date: formatDateLocal(nextDay),
      }

      setFormData((prev) => ({
        ...prev,
        multipleDate: true,
        dates: [firstDate, secondDate],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        multipleDate: false,
        dates: [prev.dates[0]],
      }))
    }
  }

  const handleDatesChange = (value, timeOptions = []) => {
    const updatedDates = value.map((date) => {
      const startIndex = timeOptions.indexOf(date.startTime)
      const endIndex = timeOptions.indexOf(date.endTime)
      if (startIndex >= endIndex) {
        return {
          ...date,
          endTime: timeOptions[Math.min(startIndex + 1, timeOptions.length - 1)] || date.endTime,
        }
      }
      return date
    })
    setFormData((prev) => ({
      ...prev,
      dates: updatedDates,
      multipleDate: updatedDates.length > 1,
    }))
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

  const hasUnsavedChanges = () => {
    if (mode !== "edit" || !initialData) {
      return (
        formData.agenda.trim() !== "" ||
        formData.description.trim() !== "" ||
        formData.selectedParticipants.length > 0 ||
        formData.selectedPsychologist !== null
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

    return JSON.stringify(current) !== JSON.stringify(initial)
  }

  return {
    formData,
    setFormData,
    dropdowns,
    setDropdowns,
    participantSearch,
    setParticipantSearch,
    hasShownUnsavedToast,
    setHasShownUnsavedToast,
    editorRef,
    photoInputRef,
    fileInputRef,
    handleInputChange,
    toggleDropdown,
    hasUnsavedChanges,
  }
}