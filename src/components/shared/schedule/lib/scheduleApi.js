// src/components/shared/schedule/lib/scheduleApi.js

import { apiClient } from "../../../../lib/api.js"

/**
 * Enhanced API client for schedule-related operations
 * Uses existing base API client with interceptors and auth handling
 */
export const createScheduleApi = (organizationType = "school") => {
  const transformScheduleData = (schedules, orgType) => {
    return schedules.map((schedule) => {
      const baseTransform = {
        ...schedule,
        displayName: schedule.agenda,
        participants:
          schedule.usersSchedules?.map((us) => ({
            ...us.user,
            role: us.user.role,
            displayRole: getDisplayRole(us.user.role, orgType),
            ...(orgType === "school"
              ? {
                  studentId: us.user.profile?.studentId,
                  grade: us.user.profile?.grade,
                  classroom: us.user.profile?.classroom,
                }
              : {
                  employeeId: us.user.profile?.employeeId,
                  department: us.user.profile?.department,
                  position: us.user.profile?.position,
                }),
          })) || [],
      }

      // Add organization-specific metadata
      if (orgType === "school") {
        return {
          ...baseTransform,
          isClassSchedule: schedule.type === "class",
          isCounselingSchedule: schedule.type === "counseling",
          requiresClassroom: ["class", "seminar"].includes(schedule.type),
        }
      } else {
        return {
          ...baseTransform,
          isMeeting: schedule.type === "meeting",
          isCounselingSchedule: schedule.type === "counseling",
          isTraining: schedule.type === "training",
          requiresMeetingRoom: ["meeting", "training", "seminar"].includes(schedule.type),
          priority: schedule.usersSchedules?.some((us) => ["manager", "director", "ceo"].includes(us.user.role))
            ? "high"
            : "normal",
        }
      }
    })
  }

  const transformQueueData = (queueData, orgType) => {
    return queueData.map((item) => {
      const user = item.usersSchedules?.[0]?.user
      const screening = user?.screenings?.[0]

      const baseTransform = {
        ...item,
        name: user?.fullName || "Unknown",
        category: getCategoryLabel(screening?.screeningStatus),
        date: new Date(item.startDateTime)
          .toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })
          .replace(/\//g, "."),
        time: new Date(item.startDateTime).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        status: user?.counselings?.length > 0 ? "Kontinuasi" : "Pertama",
        counselorName:
          item.usersSchedules?.find((us) => us.user.role === "counselor")?.user?.fullName || "Belum ditentukan",
      }

      if (orgType === "school") {
        return {
          ...baseTransform,
          studentId: user?.profile?.studentId || "-",
          grade: user?.profile?.grade || "-",
          classroom: user?.profile?.classroom || "-",
        }
      } else {
        return {
          ...baseTransform,
          employeeId: user?.profile?.employeeId || "-",
          department: user?.profile?.department || "-",
          position: user?.profile?.position || "-",
          workDuration: user?.profile?.yearsOfService ? `${user.profile.yearsOfService} tahun` : "-",
          urgency: screening?.screeningStatus === "at_risk" ? "Tinggi" : "Normal",
          requestedBy: user?.profile?.supervisor || "Self-request",
        }
      }
    })
  }

  const getDisplayRole = (role, orgType) => {
    if (orgType === "school") {
      const schoolRoles = {
        student: "Siswa",
        teacher: "Guru",
        counselor: "Konselor",
        principal: "Kepala Sekolah",
        admin: "Admin",
      }
      return schoolRoles[role] || "Staff"
    } else {
      const companyRoles = {
        employee: "Karyawan",
        manager: "Manager",
        hr: "HR",
        counselor: "Konselor",
        director: "Direktur",
        ceo: "CEO",
      }
      return companyRoles[role] || "Staff"
    }
  }

  const getCategoryLabel = (status) => {
    const labels = {
      at_risk: "Berisiko",
      monitored: "Pengawasan",
      stable: "Stabil",
    }
    return labels[status] || "Normal"
  }

  // Helper function to format date to YYYY-MM-DD
  const formatDateForAPI = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Return enhanced API methods (using existing apiClient)
  return {
    async getSchedules(params = {}) {
      try {
        // Format dates to simple YYYY-MM-DD format
        const formattedParams = {
          ...params,
          timezone: params.timezone || "Asia/Jakarta",
        }

        // Convert ISO datetime strings to simple date format
        if (params.from) {
          formattedParams.from = formatDateForAPI(params.from)
        }
        if (params.to) {
          formattedParams.to = formatDateForAPI(params.to)
        }

        console.log("Fetching schedules with params:", formattedParams)

        const response = await apiClient.get("/schedules", { params: formattedParams })

        if (response.data?.status === "success") {
          return {
            ...response,
            data: {
              ...response.data,
              data: transformScheduleData(response.data.data, organizationType),
            },
          }
        }
        return response
      } catch (error) {
        console.error("Error fetching schedules:", error)
        throw error
      }
    },

    async createSchedule(scheduleData) {
      try {
        // Transform dates array to match API format
        const transformedDates = scheduleData.dates.map((dateItem) => {
          const dateStr = dateItem.date
          const startTime = dateItem.startTime
          const endTime = dateItem.endTime

          // Create full datetime strings
          const startDateTime = new Date(`${dateStr}T${startTime}:00.000Z`)
          const endDateTime = new Date(`${dateStr}T${endTime}:00.000Z`)

          return {
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
          }
        })

        const transformedData = {
          agenda: scheduleData.agenda,
          location: scheduleData.location || getDefaultLocation(organizationType),
          description: scheduleData.description,
          notificationOffset: scheduleData.notificationOffset,
          type: scheduleData.type,
          timezone: scheduleData.timezone,
          userEmails: scheduleData.userEmails,
          dates: transformedDates,
        }

        console.log("Creating schedule with data:", transformedData)

        return await apiClient.post("/schedules", transformedData)
      } catch (error) {
        console.error("Error creating schedule:", error)
        throw error
      }
    },

    async updateSchedule(scheduleId, scheduleData) {
      try {
        // Transform dates array to match API format
        const transformedDates = scheduleData.dates.map((dateItem) => {
          const dateStr = dateItem.date
          const startTime = dateItem.startTime
          const endTime = dateItem.endTime

          // Create full datetime strings
          const startDateTime = new Date(`${dateStr}T${startTime}:00.000Z`)
          const endDateTime = new Date(`${dateStr}T${endTime}:00.000Z`)

          return {
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
          }
        })

        const transformedData = {
          agenda: scheduleData.agenda,
          location: scheduleData.location || getDefaultLocation(organizationType),
          description: scheduleData.description,
          notificationOffset: scheduleData.notificationOffset,
          type: scheduleData.type,
          timezone: scheduleData.timezone,
          userEmails: scheduleData.userEmails,
          dates: transformedDates,
        }

        return await apiClient.patch(`/schedules/${scheduleId}`, transformedData)
      } catch (error) {
        console.error("Error updating schedule:", error)
        throw error
      }
    },

    async deleteSchedule(scheduleId) {
      try {
        return await apiClient.delete(`/schedules/${scheduleId}`)
      } catch (error) {
        console.error("Error deleting schedule:", error)
        throw error
      }
    },

    async checkScheduleExists(params) {
      try {
        const formattedParams = {
          ...params,
          date: formatDateForAPI(params.date),
        }

        return await apiClient.post("/schedules/check-exists", formattedParams)
      } catch (error) {
        console.error("Error checking schedule existence:", error)
        throw error
      }
    },

    async getCounselingQueue(params = {}) {
      try {
        const response = await apiClient.get("/counselings", { params })

        if (response.data?.status === "success") {
          return {
            ...response,
            data: {
              ...response.data,
              data: transformQueueData(response.data.data, organizationType),
            },
          }
        }
        return response
      } catch (error) {
        console.error("Error fetching counseling queue:", error)
        throw error
      }
    },
  }
}

const getDefaultLocation = (orgType) => {
  return orgType === "school" ? "Ruang Kelas" : "Meeting Room"
}

/**
 * Get configuration for organization type
 */
export const getScheduleConfig = (organizationType) => {
  const baseConfig = {
    showMiniCalendar: true,
    showNotifications: true,
    showCounselingQueue: true,
    maxNotifications: 5,
    maxQueueItems: 5,
    enableDragDrop: true,
    enableScheduleEdit: true,
    enableScheduleDelete: true,
    timeSlotDuration: 60,
  }

  if (organizationType === "school") {
    return {
      ...baseConfig,
      startHour: 7,
      endHour: 16,
      defaultLocations: ["Ruang Kelas", "Laboratorium", "Perpustakaan", "Aula", "Ruang Konseling", "Online/Daring"],
    }
  } else {
    return {
      ...baseConfig,
      startHour: 8,
      endHour: 18,
      defaultLocations: [
        "Meeting Room A",
        "Meeting Room B",
        "Conference Hall",
        "Training Room",
        "Counseling Room",
        "Online/Virtual",
      ],
    }
  }
}
