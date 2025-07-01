// src/components/shared/schedule/lib/scheduleApi.js - Fixed Backend Integration

import { apiClient } from "../../../../lib/api.js"

export const createScheduleApi = (organizationType = "school") => {
  // Transform schedule data from backend to frontend format
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
            email: us.user.email,
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
        // Add timezone display
        timezoneDisplay: getTimezoneDisplay(schedule.timezone),
      }

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
          isCounselingSchedule: schedule.type === "counseling",
          isTraining: schedule.type === "training",
          requiresMeetingRoom: ["training", "seminar"].includes(schedule.type),
          priority: schedule.usersSchedules?.some((us) => ["manager", "director", "ceo"].includes(us.user.role))
            ? "high"
            : "normal",
        }
      }
    })
  }

  // Transform counseling queue data
  const transformCounselingData = (counselings, orgType) => {
    return counselings.map((counseling) => {
      const user = counseling.user
      const screening = user?.screenings?.[0]

      const baseTransform = {
        id: counseling.id,
        name: user?.fullName || "Unknown",
        category: getCategoryLabel(screening?.screeningStatus),
        date: new Date(counseling.scheduledAt || counseling.createdAt)
          .toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })
          .replace(/\//g, "."),
        time: new Date(counseling.scheduledAt || counseling.createdAt).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        status: counseling.status || "Pending",
        location: counseling.location || "TBD",
        counselorName: counseling.psychologist?.fullName || "Belum ditentukan",
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
        psychologist: "Konselor",
        principal: "Kepala Sekolah",
        admin: "Admin",
      }
      return schoolRoles[role] || "Staff"
    } else {
      const companyRoles = {
        employee: "Karyawan",
        manager: "Manager",
        hr: "HR",
        psychologist: "Konselor",
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

  // Get timezone display
  const getTimezoneDisplay = (timezone) => {
    const timezoneMap = {
      "Asia/Jakarta": "WIB",
      "Asia/Makassar": "WITA",
      "Asia/Jayapura": "WIT",
    }
    return timezoneMap[timezone] || "WIB"
  }

  // Return API methods
  return {
    async getSchedules(params = {}) {
      try {
        const formattedParams = {
          from: params.from,
          to: params.to,
          timezone: params.timezone || "Asia/Jakarta",
        }

        console.log("Fetching schedules with params:", formattedParams)

        const response = await apiClient.get("/v1/schedules", {
          params: formattedParams,
        })

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

    async checkScheduleExists(params) {
      try {
        console.log("Checking schedule availability:", params)

        const response = await apiClient.post("/v1/schedules/check-exists", {
          date: params.date,
          startTime: params.startTime,
          endTime: params.endTime,
          timezone: params.timezone,
        })

        return response
      } catch (error) {
        console.error("Error checking schedule existence:", error)
        throw error
      }
    },

    async createSchedule(scheduleData) {
      try {
        // Transform frontend data to backend format
        const transformedData = {
          agenda: scheduleData.agenda,
          location: scheduleData.location,
          description: scheduleData.description || "",
          notificationOffset: scheduleData.notificationOffset,
          type: scheduleData.type,
          userIds: scheduleData.userIds || [], // Backend expects userIds
          dates: scheduleData.dates.map((dateItem) => ({
            date: dateItem.date,
            startTime: dateItem.startTime,
            endTime: dateItem.endTime,
            timezone: dateItem.timezone,
          })),
        }

        console.log("Creating schedule with data:", transformedData)

        const response = await apiClient.post("/v1/schedules", transformedData)
        return response
      } catch (error) {
        console.error("Error creating schedule:", error)
        throw error
      }
    },

    async updateSchedule(scheduleId, scheduleData) {
      try {
        const transformedData = {
          agenda: scheduleData.agenda,
          location: scheduleData.location,
          description: scheduleData.description || "",
          notificationOffset: scheduleData.notificationOffset,
          type: scheduleData.type,
          userIds: scheduleData.userIds || [],
          dates: scheduleData.dates?.map((dateItem) => ({
            date: dateItem.date,
            startTime: dateItem.startTime,
            endTime: dateItem.endTime,
            timezone: dateItem.timezone,
          })),
        }

        console.log("Updating schedule with data:", transformedData)

        const response = await apiClient.patch(`/v1/schedules/${scheduleId}`, transformedData)
        return response
      } catch (error) {
        console.error("Error updating schedule:", error)
        throw error
      }
    },

    async deleteSchedule(scheduleId) {
      try {
        const response = await apiClient.delete(`/v1/schedules/${scheduleId}`)
        return response
      } catch (error) {
        console.error("Error deleting schedule:", error)
        throw error
      }
    },

    async getCounselingQueue(params = {}) {
      try {
        console.log("Fetching counseling queue...")

        const response = await apiClient.get("/v1/counselings", { params })

        if (response.data?.status === "success") {
          return {
            ...response,
            data: {
              ...response.data,
              data: transformCounselingData(response.data.data, organizationType),
            },
          }
        }
        return response
      } catch (error) {
        console.error("Error fetching counseling queue:", error)
        throw error
      }
    },

    async getScheduleById(scheduleId) {
      try {
        const response = await apiClient.get(`/v1/schedules/${scheduleId}`)

        if (response.data?.status === "success") {
          return {
            ...response,
            data: {
              ...response.data,
              data: transformScheduleData([response.data.data], organizationType)[0],
            },
          }
        }
        return response
      } catch (error) {
        console.error("Error fetching schedule by ID:", error)
        throw error
      }
    },
  }
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
    timeSlotDuration: 5, // 5 minutes intervals
  }

  if (organizationType === "school") {
    return {
      ...baseConfig,
      startHour: 7,
      endHour: 16,
      defaultLocations: ["offline", "online", "organization"],
    }
  } else {
    return {
      ...baseConfig,
      startHour: 8,
      endHour: 18,
      defaultLocations: ["organization", "online", "offline"],
    }
  }
}
