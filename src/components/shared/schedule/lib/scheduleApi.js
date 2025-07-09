// src/components/shared/schedule/lib/scheduleApi.js - COMPLETELY FIXED VERSION

import { apiClient } from "../../../../lib/api.js"

export const createScheduleApi = (organizationType = "school") => {
  
  // Get timezone display - COMPLETELY FIXED with Day.js logic
  const getTimezoneDisplay = (timezone) => {
    // Handle direct timezone codes
    if (timezone === "WIB" || timezone === "WITA" || timezone === "WIT") {
      return timezone;
    }
    
    // Handle offset format (+07, +08, +09)
    if (typeof timezone === 'string' && timezone.includes('+')) {
      const offset = timezone.split('+')[1];
      switch (offset) {
        case '07': return 'WIB';
        case '08': return 'WITA'; 
        case '09': return 'WIT';
        default: return 'WIB';
      }
    }
    
    // Handle datetime with offset (2025-05-12 08:00:00+07)
    if (typeof timezone === 'string' && (timezone.includes('T') || timezone.includes(' '))) {
      const offsetMatch = timezone.match(/([+-]\d{2})/);
      if (offsetMatch) {
        const offset = offsetMatch[1].replace('+', '');
        switch (offset) {
          case '07': return 'WIB';
          case '08': return 'WITA';
          case '09': return 'WIT';
          default: return 'WIB';
        }
      }
    }
    
    // Default fallback - NO MORE ASIA/JAKARTA
    return 'WIB';
  }

  // Format counseling datetime - FIXED with proper Date handling
  const formatCounselingDateTime = (startDateTime) => {
    if (!startDateTime) {
      return { date: 'TBD', time: 'TBD' };
    }
    
    try {
      const date = new Date(startDateTime);
      if (isNaN(date.getTime())) {
        return { date: 'TBD', time: 'TBD' };
      }
      
      return {
        date: date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit", 
          year: "2-digit",
        }).replace(/\//g, "."),
        time: date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      };
    } catch (error) {
      console.error('Error formatting counseling datetime:', error);
      return { date: 'TBD', time: 'TBD' };
    }
  };

  // Transform schedule data from backend to frontend format - FIXED
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
        // Enhanced timezone display with fallbacks
        timezoneDisplay: getTimezoneDisplay(schedule.timezone || schedule.startDateTime),
        // Include attachment count
        attachmentCount: schedule.attachments?.length || 0,
        attachments: schedule.attachments || []
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

  // Transform counseling queue data - COMPLETELY FIXED for new API structure
  const transformCounselingData = (counselings, orgType) => {
    return counselings.map((counseling) => {
      // NEW API STRUCTURE: counseling has users array and other direct properties
      const users = counseling.users || []
      const patient = users.find(user => user.role !== 'psychologist')
      const psychologist = users.find(user => user.role === 'psychologist')
      const screening = patient?.screening

      // Use enhanced datetime formatting
      const dateTimeFormatted = formatCounselingDateTime(counseling.startDateTime);

      const baseTransform = {
        id: counseling.id,
        name: patient?.fullName || "Unknown",
        category: getCategoryLabel(screening?.screeningStatus),
        date: dateTimeFormatted.date,
        time: dateTimeFormatted.time,
        status: "Scheduled", // Default status since we don't have this field in new structure
        location: counseling.location || "TBD",
        counselorName: psychologist?.fullName || "Belum ditentukan",
      }

      if (orgType === "school") {
        return {
          ...baseTransform,
          studentId: patient?.profile?.studentId || patient?.email?.split('@')[0] || "-",
          grade: patient?.profile?.grade || "-",
          classroom: patient?.profile?.classroom || "-",
        }
      } else {
        return {
          ...baseTransform,
          employeeId: patient?.profile?.employeeId || patient?.email?.split('@')[0] || "-",
          department: patient?.profile?.department || "-",
          position: patient?.profile?.position || "-",
          workDuration: patient?.profile?.yearsOfService ? `${patient.profile.yearsOfService} tahun` : "-",
          urgency: screening?.screeningStatus === "at_risk" ? "Tinggi" : "Normal",
          requestedBy: patient?.profile?.supervisor || "Self-request",
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

  // Return API methods
  return {
    async getSchedules(params = {}) {
      try {
        const formattedParams = {
          from: params.from,
          to: params.to,
          timezone: params.timezone || "WIB", // FIXED: Always default to WIB
        }

        console.log("Fetching schedules with params:", formattedParams)

        const response = await apiClient.get("/schedules", {
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

        const response = await apiClient.post("/schedules/check-exists", {
          date: params.date,
          startTime: params.startTime,
          endTime: params.endTime,
          timezone: params.timezone || "WIB", // FIXED: Default to WIB
        })

        console.log("Check exists response:", response.data)

        if (response.data?.status === "success") {
          return {
            exists: false,
            available: true,
            message: "Jadwal tersedia"
          }
        } else if (response.data?.status === "fail") {
          return {
            exists: true,
            available: false,
            message: response.data?.message || "Jadwal sudah terisi"
          }
        }

        return response.data
      } catch (error) {
        console.error("Error checking schedule existence:", error)
        return {
          exists: false,
          available: true,
          message: "Tidak dapat memverifikasi ketersediaan jadwal"
        }
      }
    },

    async createSchedule(scheduleData) {
      try {
        // ENHANCED: Handle both location and customLocation + new participants format
        const transformedData = {
          agenda: scheduleData.agenda,
          description: scheduleData.description || "",
          notificationOffset: scheduleData.notificationOffset,
          type: scheduleData.type,
          dates: scheduleData.dates.map((dateItem) => ({
            date: dateItem.date,
            startTime: dateItem.startTime,
            endTime: dateItem.endTime,
            timezone: dateItem.timezone || "WIB", // FIXED: Ensure WIB default
          })),
        }

        // PARTICIPANTS HANDLING - NEW FORMAT
        if (scheduleData.type === "counseling" && scheduleData.userIds && scheduleData.userIds.length >= 2) {
          // Convert userIds to participants object format
          const psychologistId = scheduleData.userIds[0];
          const patientId = scheduleData.userIds[1];
          
          transformedData.participants = {
            psychologistId: psychologistId,
            patientId: patientId
          };
        } else if (scheduleData.participants) {
          // Direct participants object
          transformedData.participants = scheduleData.participants;
        }

        // LOCATION HANDLING - ENHANCED
        if (scheduleData.type === "counseling") {
          transformedData.location = scheduleData.location;
        } else {
          transformedData.customLocation = scheduleData.customLocation;
        }

        console.log("Creating schedule with data:", transformedData)

        const response = await apiClient.post("/schedules", transformedData)
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
          description: scheduleData.description || "",
          notificationOffset: scheduleData.notificationOffset,
          type: scheduleData.type,
          dates: scheduleData.dates?.map((dateItem) => ({
            date: dateItem.date,
            startTime: dateItem.startTime,
            endTime: dateItem.endTime,
            timezone: dateItem.timezone || "WIB", // FIXED: Ensure WIB default
          })),
        }

        // PARTICIPANTS HANDLING - NEW FORMAT
        if (scheduleData.type === "counseling" && scheduleData.userIds && scheduleData.userIds.length >= 2) {
          const psychologistId = scheduleData.userIds[0];
          const patientId = scheduleData.userIds[1];
          
          transformedData.participants = {
            psychologistId: psychologistId,
            patientId: patientId
          };
        } else if (scheduleData.participants) {
          transformedData.participants = scheduleData.participants;
        }

        // LOCATION HANDLING FOR UPDATE - ENHANCED
        if (scheduleData.type === "counseling") {
          transformedData.location = scheduleData.location;
        } else {
          transformedData.customLocation = scheduleData.customLocation;
        }

        console.log("Updating schedule with data:", transformedData)

        const response = await apiClient.patch(`/schedules/${scheduleId}`, transformedData)
        return response
      } catch (error) {
        console.error("Error updating schedule:", error)
        throw error
      }
    },

    async deleteSchedule(scheduleId) {
      try {
        const response = await apiClient.delete(`/schedules/${scheduleId}`)
        return response
      } catch (error) {
        console.error("Error deleting schedule:", error)
        throw error
      }
    },

    // Upload attachments to existing schedule
    async uploadAttachments(scheduleId, files) {
      try {
        const formData = new FormData();
        
        const maxSize = 15 * 1024 * 1024; // 15MB
        for (const file of files) {
          if (file.size > maxSize) {
            throw new Error(`File ${file.name} exceeds 15MB limit`);
          }
        }
        
        files.forEach(file => {
          formData.append('files', file);
        });

        console.log(`Uploading ${files.length} attachments to schedule ${scheduleId}`);

        const response = await apiClient.post(`/schedules/${scheduleId}/attachments`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        });

        return response;
      } catch (error) {
        console.error("Error uploading attachments:", error);
        throw error;
      }
    },

    // Get schedule attachments
    async getScheduleAttachments(scheduleId) {
      try {
        const response = await apiClient.get(`/schedules/${scheduleId}/attachments`);
        return response;
      } catch (error) {
        console.error("Error fetching schedule attachments:", error);
        throw error;
      }
    },

    // Delete schedule attachment
    async deleteAttachment(scheduleId, attachmentId) {
      try {
        const response = await apiClient.delete(`/schedules/${scheduleId}/attachments/${attachmentId}`);
        return response;
      } catch (error) {
        console.error("Error deleting attachment:", error);
        throw error;
      }
    },

    async getCounselingQueue(params = {}) {
      try {
        console.log("Fetching counseling queue...")

        const response = await apiClient.get("/counselings/schedules", { params })

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
        const response = await apiClient.get(`/schedules/${scheduleId}`)

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

    // Get psychologist locations for dropdown
    async getPsychologistLocations() {
      try {
        const response = await apiClient.get('/psychologists/locations');
        return response.data || [];
      } catch (error) {
        console.error("Error fetching psychologist locations:", error);
        return [];
      }
    },

    // Get psychologists with optional location filter
    async getPsychologists(params = {}) {
      try {
        const response = await apiClient.get('/psychologists', { params });
        
        if (response.data?.status === 'success') {
          return response.data.data || [];
        }
        
        return response.data?.data || response.data || [];
      } catch (error) {
        console.error("Error fetching psychologists:", error);
        return [];
      }
    },

    // Get users/participants with search
    async getUsers(params = {}) {
      try {
        const response = await apiClient.get('/users', { params });
        
        if (response.data?.status === 'success') {
          return response.data.data || [];
        }
        
        return response.data?.data || response.data || [];
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    }
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
    maxAttachmentSize: 15 * 1024 * 1024, // 15MB
    allowedFileTypes: ['image/*', '.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls'],
    // ENHANCED: Schedule stacking configuration
    enableScheduleStacking: true,
    maxStackedSchedules: 10,
    stackedScheduleHeight: 28,
    stackedScheduleMargin: 2,
  }

  if (organizationType === "school") {
    return {
      ...baseConfig,
      startHour: 7,
      endHour: 16,
      defaultLocations: ["offline", "online", "organization"],
      defaultTimezone: "WIB", // FIXED: WIB instead of Asia/Jakarta
    }
  } else {
    return {
      ...baseConfig,
      startHour: 8,
      endHour: 18,
      defaultLocations: ["organization", "online", "offline"],
      defaultTimezone: "WIB", // FIXED: WIB instead of Asia/Jakarta
    }
  }
}