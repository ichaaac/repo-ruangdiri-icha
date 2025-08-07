// src/components/shared/schedule/SchedulePage.jsx

import { useState, useEffect, useCallback } from "react"
import { useOutletContext } from "react-router-dom"
import ScheduleGrid from "./ScheduleGrid"
import CounselingQueue from "./CounselingQueue"
import DatePicker from "./DatePicker"
import NotificationPanel from "./NotificationsPanel"
import CreateScheduleModal from "./CreateScheduleModal"
import EditScheduleModal from "./EditScheduleModal"
import ViewScheduleModal from "./ViewScheduleModal"
import { useSchedule } from "./hooks/useSchedule"
import TopRightControl from "../layout/TopRightControl"

const SchedulePage = ({ type = "school" }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [createModalData, setCreateModalData] = useState(null)
  const [editModalData, setEditModalData] = useState(null)
  const [viewScheduleData, setViewScheduleData] = useState(null)
  const [windowWidth, setWindowWidth] = useState(0)
  const [selectedDates, setSelectedDates] = useState([])
  const [editFromViewModal, setEditFromViewModal] = useState(false) // Track edit source

  const outletContext = useOutletContext() || {}
  const { sidebarExpanded = false } = outletContext

  const {
    selectedDate,
    selectedWeek,
    schedules,
    counselingQueue,
    notifications,
    loading,
    error,
    setSelectedDate,
    setSelectedWeek,
    createSchedule,
    handleEditSchedule,
    handleDeleteSchedule,
    refreshData,
    getSchedulesForDate,
    getScheduleAtTime,
  } = useSchedule(type)

  // Clear all modal states
  const clearAllModalStates = useCallback(() => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setIsViewModalOpen(false)
    setCreateModalData(null)
    setEditModalData(null)
    setViewScheduleData(null)
    setEditFromViewModal(false) // Reset this state

    if (window.closeAllModals) {
      delete window.closeAllModals
    }
  }, [])

  // Track window width for responsive calculations
  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth)
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  // Calculate available width
  const sidebarWidth = sidebarExpanded ? 257 : 80
  const paddingLeft = 20
  const paddingRight = 24
  const availableWidth = windowWidth - sidebarWidth - paddingLeft - paddingRight

  const isDesktop = availableWidth >= 1100

  const getLeftColumnWidth = () => {
    if (isDesktop) {
      const rightColumnSpace = 335
      const gap = 24
      const leftWidth = availableWidth - rightColumnSpace - gap
      return Math.max(808, leftWidth)
    }
    return Math.max(808, Math.min(availableWidth, 1000))
  }

  const getRightColumnWidth = () => {
    if (isDesktop) {
      return 335
    }
    return Math.min(335, Math.max(280, availableWidth))
  }

  const leftColumnWidth = getLeftColumnWidth()
  const rightColumnWidth = getRightColumnWidth()

  // Handle time slot selection for creating new schedule
  const handleTimeSlotSelect = useCallback(
    async (timeSlot) => {
      clearAllModalStates()

      setCreateModalData({
        startDateTime: timeSlot.startDateTime,
        endDateTime: timeSlot.endDateTime,
        day: timeSlot.day,
        dates: timeSlot.dates || [
          {
            date: timeSlot.startDateTime.toISOString().split("T")[0],
            startTime: timeSlot.startDateTime.toTimeString().slice(0, 5),
            endTime: timeSlot.endDateTime.toTimeString().slice(0, 5),
            timezone: "WIB",
          },
        ],
        draggedDays: timeSlot.draggedDays || 1,
      })
      setIsCreateModalOpen(true)
    },
    [clearAllModalStates],
  )

  // Handle schedule click to view details
  const handleScheduleClick = useCallback(
    (scheduleData) => {
      clearAllModalStates()
      setViewScheduleData(scheduleData)
      setIsViewModalOpen(true)
    },
    [clearAllModalStates],
  )

  // Edit handler for ViewScheduleModal
  const handleEditFromViewModal = useCallback((scheduleData) => {
    setIsViewModalOpen(false)
    setEditFromViewModal(true) // Set flag that edit is from view modal

    // Prepare edit data with better participants handling
    let psychologist = null
    let clients = []

    if (scheduleData.type === "counseling") {
      if (scheduleData.participants) {
        psychologist = scheduleData.participants.find((p) => p.role === "psychologist")
        clients = scheduleData.participants.filter((p) => p.role !== "psychologist")
      } else if (scheduleData.usersSchedules) {
        const psychSchedule = scheduleData.usersSchedules.find((us) => us.user.role === "psychologist")
        if (psychSchedule?.user) psychologist = psychSchedule.user

        clients = scheduleData.usersSchedules.filter((us) => us.user.role !== "psychologist").map((us) => us.user)
      }
    }

    let participants = null
    if (scheduleData.type === "counseling" && psychologist && clients.length > 0) {
      participants = {
        psychologistId: psychologist.id,
        patientIds: clients.map((client) => client.id),
      }
    }

    // Better dates handling
    let dates = []
    if (scheduleData.dates && scheduleData.dates.length > 0) {
      dates = scheduleData.dates.map((dateInfo) => ({
        ...dateInfo,
        timezone: dateInfo.timezone || "WIB",
      }))
    } else if (scheduleData.startDateTime) {
      const startDate = new Date(scheduleData.startDateTime)
      const endDate = new Date(scheduleData.endDateTime)

      dates = [
        {
          date: startDate.toISOString().split("T")[0],
          startTime: startDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          endTime: endDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timezone: "WIB",
        },
      ]
    }

    const editData = {
      id: scheduleData.id,
      agenda: scheduleData.agenda || "",
      type: scheduleData.type || "counseling",
      description: scheduleData.description || "",
      notificationOffset: scheduleData.notificationOffset || 60,
      dates:
        dates.length > 0
          ? dates
          : [
              {
                date: new Date().toISOString().split("T")[0],
                startTime: "09:00",
                endTime: "10:00",
                timezone: "WIB",
              },
            ],
      selectedPsychologist: psychologist,
      selectedParticipants: clients,
      participants: participants,
      location: scheduleData.location || "",
      customLocation: scheduleData.customLocation || "",
      multipleDate: dates.length > 1,
      originalData: scheduleData,
      _originalBackendLocation: scheduleData.location,
      attachments: scheduleData.attachments || [], // Pass existing attachments
    }

    setEditModalData(editData)
    setIsEditModalOpen(true)
  }, [])

  // Delete handler for ViewScheduleModal
  const handleDeleteFromViewModal = useCallback(
    async (scheduleData) => {
      try {
        await handleDeleteSchedule(scheduleData)
        clearAllModalStates()
      } catch (error) {
        throw error
      }
    },
    [handleDeleteSchedule, clearAllModalStates],
  )

  // Handle create modal form submission
  const handleCreateSubmit = useCallback(
    async (formData) => {
      try {
        const result = await createSchedule(formData)
        clearAllModalStates()
        return result
      } catch (error) {
        throw error
      }
    },
    [createSchedule, clearAllModalStates],
  )

  // Handle edit modal form submission
  const handleEditSubmit = useCallback(
    async (formData) => {
      try {
        const result = await handleEditSchedule(editModalData.id, formData)
        clearAllModalStates()
        return result
      } catch (error) {
        throw error
      }
    },
    [handleEditSchedule, editModalData, clearAllModalStates],
  )

  // Modal close handlers
  const handleCreateModalClose = useCallback(() => {
    setIsCreateModalOpen(false)
    setCreateModalData(null)
  }, [])

  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false)
    setEditModalData(null)
    // FIXED: If edit was from view modal, re-open view modal
    if (editFromViewModal && viewScheduleData) {
      setIsViewModalOpen(true)
      setEditFromViewModal(false) // Reset flag
    }
  }, [editFromViewModal, viewScheduleData])

  const handleViewModalClose = useCallback(() => {
    clearAllModalStates()
  }, [clearAllModalStates])

  // Handle date selection from DatePicker
  const handleDateSelect = (dates) => {
    setSelectedDates(dates)
    if (dates.length > 0) {
      setSelectedDate(dates[0])
    }
  }

  // Handle week selection
  const handleWeekSelect = (weekStart) => {
    setSelectedWeek(weekStart)
  }

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (isViewModalOpen || isCreateModalOpen || isEditModalOpen) {
          clearAllModalStates()
        }
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isViewModalOpen, isCreateModalOpen, isEditModalOpen, clearAllModalStates])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isCreateModalOpen || isEditModalOpen || isViewModalOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "unset"
      }
    }
  }, [isCreateModalOpen, isEditModalOpen, isViewModalOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.closeAllModals) {
        delete window.closeAllModals
      }
      document.body.style.overflow = "unset"
      clearAllModalStates()
    }
  }, [clearAllModalStates])

  return (
    <div className="relative bg-white min-h-screen w-full">
      <TopRightControl isAbsolute />
      <div
        className="transition-all duration-300"
        style={{
          paddingTop: "120px",
          paddingLeft: `${paddingLeft}px`,
          paddingRight: `${paddingRight}px`,
        }}
      >
        <div className="max-w-none mx-auto space-y-6">
          {/* MAIN LAYOUT */}
          <div
            className={`grid transition-all duration-300 ${
              isDesktop ? "grid-cols-[1fr_auto] gap-6" : "grid-cols-1 gap-6"
            }`}
          >
            {/* LEFT COLUMN - Schedule and Queue */}
            <div className="space-y-6 min-w-0 overflow-hidden">
              {/* Schedule Grid */}
              <div className="w-full">
                <ScheduleGrid
                  onTimeSlotSelect={handleTimeSlotSelect}
                  onScheduleClick={handleScheduleClick}
                  containerWidth={leftColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                  selectedDates={selectedDates}
                  schedules={schedules}
                  loading={loading.schedules}
                  getScheduleAtTime={getScheduleAtTime}
                  weekStartDate={selectedWeek}
                />
              </div>

              {/* Counseling Queue */}
              <div className="w-full">
                <CounselingQueue
                  containerWidth={leftColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                  queueData={counselingQueue}
                  loading={loading.queue}
                />
              </div>
            </div>

            {/* RIGHT COLUMN - DatePicker and Notifications */}
            <div className={`space-y-6 ${isDesktop ? "w-auto flex-shrink-0" : "w-full flex flex-col items-center"}`}>
              {/* DatePicker */}
              <div className="w-full flex justify-center">
                <DatePicker
                  containerWidth={rightColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                  selectedDate={selectedDate}
                  selectedDates={selectedDates}
                  onDateSelect={handleDateSelect}
                  onWeekSelect={handleWeekSelect}
                />
              </div>

              {/* Notification Panel */}
              <div className="w-full flex justify-center">
                <NotificationPanel
                  containerWidth={rightColumnWidth}
                  notifications={notifications}
                  loading={loading.notifications}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

<CreateScheduleModal
  isOpen={isCreateModalOpen}
  onClose={handleCreateModalClose}
  onSubmit={handleCreateSubmit}
  initialData={createModalData}
  loading={loading.submit}
  organizationType={type}
/>


      {/* Edit Schedule Modal */}
      <EditScheduleModal
  isOpen={isEditModalOpen}
  onClose={handleEditModalClose}
  onSubmit={handleEditSubmit}
  initialData={editModalData}
  loading={loading.submit}
  organizationType={type}
        onCancelReturnToView={
          editFromViewModal
            ? () => {
                setIsEditModalOpen(false)
                setIsViewModalOpen(true)
                setEditModalData(null) // Clear edit data
                setEditFromViewModal(false) // Reset flag
              }
            : null
        }
      />

      {/* View Schedule Modal */}
      <ViewScheduleModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        onEdit={handleEditFromViewModal}
        onDelete={handleDeleteFromViewModal}
        scheduleData={viewScheduleData}
        loading={loading.submit}
  organizationType={type}
      />
    </div>
  )
}

export default SchedulePage
