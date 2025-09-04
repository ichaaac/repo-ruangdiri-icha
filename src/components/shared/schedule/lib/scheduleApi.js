// src/components/shared/schedule/lib/scheduleApi.js - COMPLETE FIXED VERSION

import { apiClient } from "../../../../lib/api.js"
import { getCurrentUserTimezone, parseDateTimeForDisplay } from "../../../../utils/timezoneUtils.js"

export const createScheduleApi = (organizationType = "school") => {
  
  // Get timezone display - now uses user's timezone
  const getTimezoneDisplay = (timezone) => {
    // Use provided timezone or fallback to user's timezone
    return timezone || getCurrentUserTimezone();
  }

  // Location display logic
  const getLocationDisplay = (schedule) => {
    if (schedule.type === "counseling") {
      const location = schedule.location;
      if (location === "online") {
        return "Zoom";
      } else if (location === "offline") {
        return "Offline";
      } else if (location === "organization" || location === "seed-in") {
        return "Sit-in";
      } else if (location) {
        return location;
      }
    } else {
      const customLocation = schedule.customLocation;
      if (customLocation) {
        return customLocation;
      }
    }
    
    return "TBD";
  };

  // Format counseling datetime
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
      return { date: 'TBD', time: 'TBD' };
    }
  };

  // FIXED: Transform schedule data using backend display values
  const transformScheduleData = (schedules, orgType) => {
    return schedules.map((schedule) => {
      // FIXED: Use backend display values if available, otherwise parse datetime
      let startDateTimeLocal, endDateTimeLocal, startTime, endTime, dateString;
      
      try {
        // Check if backend provides pre-calculated display values
        if (schedule.displayStartDateTime && schedule.displayEndDateTime) {
          console.log('Using backend display values:', {
            displayStart: schedule.displayStartDateTime,
            displayEnd: schedule.displayEndDateTime
          });
          
          // Parse backend display format "2025-09-06 21:30"
          const [startDateStr, startTimeStr] = schedule.displayStartDateTime.split(' ');
          const [endDateStr, endTimeStr] = schedule.displayEndDateTime.split(' ');
          
          dateString = startDateStr;
          startTime = startTimeStr;
          endTime = endTimeStr;
          
          // Create Date objects for compatibility (but we'll use the display times)
          startDateTimeLocal = new Date(`${startDateStr}T${startTimeStr}:00`);
          endDateTimeLocal = new Date(`${endDateStr}T${endTimeStr}:00`);
          
          if (isNaN(startDateTimeLocal.getTime()) || isNaN(endDateTimeLocal.getTime())) {
            throw new Error('Invalid display datetime format');
          }
        } else {
          // Fallback: Parse UTC timestamps 
          const startDateTime = schedule.startDateTime;
          const endDateTime = schedule.endDateTime;
          
          if (!startDateTime || !endDateTime) {
            console.error('Missing datetime values in schedule:', schedule);
            startDateTimeLocal = new Date();
            endDateTimeLocal = new Date(startDateTimeLocal.getTime() + 60 * 60 * 1000);
          } else {
            startDateTimeLocal = new Date(startDateTime);
            endDateTimeLocal = new Date(endDateTime);
            
            if (isNaN(startDateTimeLocal.getTime()) || isNaN(endDateTimeLocal.getTime())) {
              console.error('Invalid datetime format in schedule:', { startDateTime, endDateTime, schedule });
              startDateTimeLocal = new Date();
              endDateTimeLocal = new Date(startDateTimeLocal.getTime() + 60 * 60 * 1000);
            }
          }
          
          // Use JavaScript's time formatting as fallback
          startTime = startDateTimeLocal.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          endTime = endDateTimeLocal.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          dateString = startDateTimeLocal.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error parsing datetime in schedule:', error, schedule);
        startDateTimeLocal = new Date();
        endDateTimeLocal = new Date(startDateTimeLocal.getTime() + 60 * 60 * 1000);
        startTime = startDateTimeLocal.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        endTime = endDateTimeLocal.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        dateString = startDateTimeLocal.toISOString().split('T')[0];
      }
      
      const baseTransform = {
        ...schedule,
        displayName: schedule.agenda,
        startDateTime: startDateTimeLocal.toISOString(),
        endDateTime: endDateTimeLocal.toISOString(),
        startTime: startTime, // FIXED: Use parsed display time directly
        endTime: endTime, // FIXED: Use parsed display time directly
        locationDisplay: getLocationDisplay(schedule),
        participants: schedule.usersSchedules?.map((us) => ({
          ...us.user,
          role: us.user.role,
          displayRole: getDisplayRole(us.user.role, orgType),
          email: us.user.email,
          joinedAt: us.createdAt,
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
        timezoneDisplay: getTimezoneDisplay(schedule.originalTimezone || schedule.timezone || getCurrentUserTimezone()), // FIXED: Use original timezone
        attachmentCount: schedule.attachments?.length || 0,
        attachments: schedule.attachments || [],
        hasZoomMeeting: !!(schedule.zoomJoinUrl || schedule.zoomStartUrl),
        zoomJoinUrl: schedule.zoomJoinUrl || null,
        zoomStartUrl: schedule.zoomStartUrl || null,
        dates: [{
          date: dateString, // FIXED: Use parsed date string
          startTime: startTime, // FIXED: Use parsed start time
          endTime: endTime, // FIXED: Use parsed end time
          timezone: getTimezoneDisplay(schedule.originalTimezone || schedule.timezone || getCurrentUserTimezone()) // FIXED: Use original timezone
        }]
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
      const users = counseling.users || []
      const patient = users.find(user => user.role !== 'psychologist')
      const psychologist = users.find(user => user.role === 'psychologist')
      const screening = patient?.screening

      const dateTimeFormatted = formatCounselingDateTime(counseling.startDateTime);

      const baseTransform = {
        id: counseling.id,
        name: patient?.fullName || "Unknown",
        category: getCategoryLabel(screening?.screeningStatus),
        screeningStatus: screening?.screeningStatus || 'stable',
        date: dateTimeFormatted.date,
        time: dateTimeFormatted.time,
        status: "Scheduled",
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

  // Data validation helper for create
  const validateScheduleData = (data) => {
    const errors = [];
    
    console.log('=== validateScheduleData ===');
    console.log('Data to validate:', data);
    
    if (!data.agenda || data.agenda.trim().length === 0) {
      errors.push('Agenda is required');
    } else if (data.agenda.trim().length > 255) {
      errors.push('Agenda cannot exceed 255 characters');
    }
    
    if (data.description && data.description.length > 255) {
      errors.push('Description cannot exceed 255 characters');
    }
    
    if (!data.type || !['counseling', 'class', 'seminar', 'others'].includes(data.type)) {
      console.error('Invalid type:', data.type);
      errors.push(`Invalid schedule type: ${data.type}. Must be one of: counseling, class, seminar, others`);
    }
    
    if (!data.dates || !Array.isArray(data.dates) || data.dates.length === 0) {
      console.error('Invalid dates:', data.dates);
      errors.push('At least one date is required');
    } else {
      data.dates.forEach((dateItem, index) => {
        if (!dateItem.date) {
          errors.push(`Date is required for item ${index + 1}`);
        }
        if (!dateItem.startTime) {
          errors.push(`Start time is required for item ${index + 1}`);
        }
        if (!dateItem.endTime) {
          errors.push(`End time is required for item ${index + 1}`);
        }
      });
    }
    
    if (data.type === 'counseling') {
      if (!data.participants || !data.participants.psychologistId) {
        errors.push('Psychologist is required for counseling');
      }
      if (!data.participants || !data.participants.patientIds || data.participants.patientIds.length === 0) {
        errors.push('At least one patient is required for counseling');
      }
      if (!data.location) {
        errors.push('Location is required for counseling');
      }
    }
    
    console.log('Validation errors:', errors);
    return errors;
  };

  // Data validation helper for update
  const validateScheduleUpdateData = (data) => {
    const errors = [];
    
    if (data.hasOwnProperty('agenda')) {
      if (!data.agenda || data.agenda.trim().length === 0) {
        errors.push('Agenda cannot be empty');
      } else if (data.agenda.trim().length > 255) {
        errors.push('Agenda cannot exceed 255 characters');
      }
    }
    
    if (data.hasOwnProperty('description') && data.description && data.description.length > 255) {
      errors.push('Description cannot exceed 255 characters');
    }
    
    if (data.hasOwnProperty('type') && (!data.type || !['counseling', 'class', 'seminar', 'others'].includes(data.type))) {
      errors.push('Invalid schedule type');
    }
    
    if (data.hasOwnProperty('dates') && (!data.dates || !Array.isArray(data.dates) || data.dates.length === 0)) {
      errors.push('At least one date is required');
    }
    
    if (data.hasOwnProperty('participants')) {
      if (!data.participants || !data.participants.psychologistId) {
        errors.push('Psychologist is required for counseling');
      }
      if (!data.participants || !data.participants.patientIds || data.participants.patientIds.length === 0) {
        errors.push('At least one patient is required for counseling');
      }
    }
    
    if (data.hasOwnProperty('location') && !data.location) {
      errors.push('Location is required for counseling');
    }
    
    return errors;
  };

  // Return API methods
  return {
    async getSchedules(params = {}) {
      try {
        const userTimezone = getCurrentUserTimezone();
        
        const formattedParams = {
          from: params.from,
          to: params.to,
          timezone: userTimezone, // Use user's timezone
        }

        const response = await apiClient.get("/schedules", {
          params: formattedParams,
        })

        if (response.data?.status === "success") {
          const transformedData = transformScheduleData(response.data.data, organizationType);
          
          return {
            ...response,
            data: {
              ...response.data,
              data: transformedData,
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
        const userTimezone = getCurrentUserTimezone();
        
        const response = await apiClient.post("/schedules/check-exists", {
          date: params.date,
          startTime: params.startTime,
          endTime: params.endTime,
          timezone: userTimezone, // Use user's timezone
        })

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

    // UPDATED: createSchedule with user timezone
    async createSchedule(scheduleData) {
      try {
        console.log('=== createSchedule API call ===');
        console.log('Raw schedule data received:', scheduleData);

        const validationErrors = validateScheduleData(scheduleData);
        if (validationErrors.length > 0) {
          const errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
          console.error(errorMessage);
          throw new Error(errorMessage);
        }

        const userTimezone = getCurrentUserTimezone();

        // FIXED: Build payload with user timezone, no manual timezone conversion
        const transformedData = {
          agenda: scheduleData.agenda.trim(),
          description: (scheduleData.description || "").trim(),
          notificationOffset: scheduleData.notificationOffset || 60,
          type: scheduleData.type,
          timezone: userTimezone, // Add user's timezone to payload
          dates: scheduleData.dates.map((dateItem) => ({
            date: dateItem.date,
            startTime: dateItem.startTime,
            endTime: dateItem.endTime,
            timezone: userTimezone, // Use user's timezone instead of form timezone
          })),
        }

        console.log('Base transformed data:', transformedData);

        // Handle participants structure properly
        if (scheduleData.type === "counseling" && scheduleData.participants) {
          if (scheduleData.participants.psychologistId && scheduleData.participants.patientIds) {
            transformedData.participants = {
              psychologistId: scheduleData.participants.psychologistId,
              patientIds: scheduleData.participants.patientIds
            };
          } else if (scheduleData.selectedPsychologist && scheduleData.selectedParticipants) {
            transformedData.participants = {
              psychologistId: scheduleData.selectedPsychologist.id,
              patientIds: scheduleData.selectedParticipants.map(p => p.id)
            };
          }
          
          console.log('Added participants:', transformedData.participants);
        }

        // Location handling
        if (scheduleData.type === "counseling") {
          const standardLocations = ["online", "offline", "organization"];
          if (standardLocations.includes(scheduleData.location)) {
            transformedData.location = scheduleData.location;
          } else {
            transformedData.location = scheduleData.location; // Send actual location
          }
          console.log('Added location:', transformedData.location);
        } else {
          if (scheduleData.customLocation) {
            transformedData.customLocation = scheduleData.customLocation;
            console.log('Added customLocation:', transformedData.customLocation);
          }
        }

        console.log('Final payload to send:', transformedData);

        const response = await apiClient.post("/schedules", transformedData)
        
        console.log('Backend response:', response);
        
        if (response.data?.status === "success") {
          try {
            const scheduleArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            console.log('Schedule array to transform:', scheduleArray);
            
            const transformedResponse = transformScheduleData(scheduleArray, organizationType);
            console.log('Transformed response:', transformedResponse);
            
            return {
              ...response,
              data: {
                ...response.data,
                data: transformedResponse[0] || transformedResponse
              }
            };
          } catch (transformError) {
            console.error("Error transforming create response, using raw data:", transformError);
            return {
              ...response,
              data: {
                ...response.data,
                data: Array.isArray(response.data.data) ? response.data.data[0] : response.data.data
              }
            };
          }
        }
        
        return response
      } catch (error) {
        console.error("Error creating schedule:", error)
        throw error
      }
    },

    // UPDATED: updateSchedule with user timezone
    async updateSchedule(scheduleId, scheduleData) {
      try {
        console.log('=== updateSchedule API call ===');
        console.log('Schedule ID:', scheduleId);
        console.log('Update data received:', scheduleData);

        const validationErrors = validateScheduleUpdateData(scheduleData);
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }

        const userTimezone = getCurrentUserTimezone();
        const transformedData = {};

        if (scheduleData.hasOwnProperty('agenda')) {
          transformedData.agenda = scheduleData.agenda.trim();
        }

        if (scheduleData.hasOwnProperty('description')) {
          transformedData.description = (scheduleData.description || "").trim();
        }

        if (scheduleData.hasOwnProperty('notificationOffset')) {
          transformedData.notificationOffset = scheduleData.notificationOffset;
        }

        if (scheduleData.hasOwnProperty('type')) {
          transformedData.type = scheduleData.type;
        }

        // FIXED: Always include user timezone in dates
        if (scheduleData.hasOwnProperty('dates')) {
          transformedData.dates = scheduleData.dates.map((dateItem) => ({
            date: dateItem.date,
            startTime: dateItem.startTime,
            endTime: dateItem.endTime,
            timezone: userTimezone, // Use user's timezone instead of form timezone
          }));
          transformedData.timezone = userTimezone; // Add timezone to root level too
        }

        // Handle participants update
        if (scheduleData.hasOwnProperty('participants')) {
          if (scheduleData.participants.psychologistId && scheduleData.participants.patientIds) {
            transformedData.participants = {
              psychologistId: scheduleData.participants.psychologistId,
              patientIds: scheduleData.participants.patientIds
            };
          } else if (scheduleData.selectedPsychologist && scheduleData.selectedParticipants) {
            transformedData.participants = {
              psychologistId: scheduleData.selectedPsychologist.id,
              patientIds: scheduleData.selectedParticipants.map(p => p.id)
            };
          }
        }

        // Handle location update
        if (scheduleData.hasOwnProperty('location')) {
          const standardLocations = ["online", "offline", "organization"];
          if (standardLocations.includes(scheduleData.location)) {
            transformedData.location = scheduleData.location;
          } else {
            transformedData.location = scheduleData.location; // Send actual location
          }
        }

        if (scheduleData.hasOwnProperty('customLocation')) {
          transformedData.customLocation = scheduleData.customLocation;
        }

        console.log('Final payload sent to backend:', transformedData);

        const response = await apiClient.patch(`/schedules/${scheduleId}`, transformedData)
        
        console.log('Backend response:', response.data);

        if (response.data?.status === "success") {
          try {
            const transformedResponse = transformScheduleData([response.data.data], organizationType)[0];
            return {
              ...response,
              data: {
                ...response.data,
                data: transformedResponse
              }
            };
          } catch (transformError) {
            console.error("Error transforming update response, using raw data:", transformError);
            return {
              ...response,
              data: {
                ...response.data,
                data: response.data.data
              }
            };
          }
        }
        
        return response
      } catch (error) {
        console.error("Error updating schedule:", error)
        throw error
      }
    },

   async deleteSchedule(scheduleId) {
      try {
        console.log('Deleting schedule with ID:', scheduleId);
        const response = await apiClient.delete(`/schedules/${scheduleId}`);
        console.log('Delete response:', response);
        
        return {
          success: true,
          scheduleId: scheduleId,
          data: response.data
        };
      } catch (error) {
        console.error("Error deleting schedule:", error);
        
        if (error.response) {
          console.error("Delete error response:", error.response.data);
          throw new Error(error.response.data?.message || `HTTP ${error.response.status}: Failed to delete schedule`);
        } else if (error.request) {
          console.error("Delete error request:", error.request);
          throw new Error("Network error: Could not reach server");
        } else {
          console.error("Delete error message:", error.message);
          throw new Error(error.message || "Unknown error occurred while deleting schedule");
        }
      }
    },

    async getScheduleById(scheduleId) {
      try {
        const response = await apiClient.get(`/schedules/${scheduleId}`)

        if (response.data?.status === "success") {
          try {
            const transformedData = transformScheduleData([response.data.data], organizationType)[0];
            return {
              ...response,
              data: {
                ...response.data,
                data: transformedData,
              },
            }
          } catch (transformError) {
            console.error("Error transforming schedule detail, using raw data:", transformError);
            return {
              ...response,
              data: {
                ...response.data,
                data: response.data.data
              }
            };
          }
        }
        return response
      } catch (error) {
        console.error("Error fetching schedule by ID:", error)
        throw error
      }
    },

    // Upload attachments using bulk endpoint
    async uploadAttachments(scheduleIds, files) {
      try {
        console.log('=== uploadAttachments API call (BULK ENDPOINT) ===');
        console.log('Schedule IDs:', scheduleIds);
        console.log('Files:', files);
        
        if (!scheduleIds || (Array.isArray(scheduleIds) && scheduleIds.length === 0)) {
          throw new Error('Schedule IDs are required for attachment upload');
        }
        
        if (!files || files.length === 0) {
          throw new Error('No files provided for upload');
        }
        
        const formData = new FormData();
        
        const maxSize = 15 * 1024 * 1024; // 15MB per file
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain'
        ];
        
        for (const file of files) {
          if (file.size > maxSize) {
            throw new Error(`File ${file.name} exceeds 15MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
          }
          
          if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} is not allowed for ${file.name}`);
          }
          
          console.log(`Adding file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB, ${file.type})`);
          formData.append('files', file);
        }

        const idArray = Array.isArray(scheduleIds) ? scheduleIds : [scheduleIds];
        idArray.forEach((scheduleId) => {
          formData.append('scheduleIds', scheduleId);
        });

        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
          console.log(key, value instanceof File ? `File: ${value.name}` : value);
        }

        const response = await apiClient.post('/schedules/attachments', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        });

        console.log('Upload response:', response);
        
        if (response.data?.status === 'success') {
          console.log('Attachments uploaded successfully');
          return {
            success: true,
            data: response.data,
            message: `Successfully uploaded ${files.length} file(s) to ${idArray.length} schedule(s)`
          };
        } else {
          throw new Error(response.data?.message || 'Upload failed - unknown error');
        }
        
      } catch (error) {
        console.error("Error uploading attachments:", error);
        
        if (error.response) {
          console.error("Upload error response:", error.response.data);
          const errorMessage = error.response.data?.message || 
                             error.response.data?.error || 
                             `HTTP ${error.response.status}: Upload failed`;
          throw new Error(errorMessage);
        } else if (error.request) {
          console.error("Upload error request:", error.request);
          throw new Error("Network error: Could not upload files to server");
        } else {
          console.error("Upload error message:", error.message);
          throw new Error(error.message || "Unknown error occurred during upload");
        }
      }
    },

    async getScheduleAttachments(scheduleId) {
      try {
        const response = await apiClient.get(`/schedules/${scheduleId}/attachments`);
        return response;
      } catch (error) {
        console.error("Error fetching schedule attachments:", error);
        throw error;
      }
    },

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
        const response = await apiClient.get("/counselings/schedules/psychologist", { params })

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

    async getPsychologistLocations() {
      try {
        const response = await apiClient.get('/psychologists/locations');
        return response.data || [];
      } catch (error) {
        console.error("Error fetching psychologist locations:", error);
        return [];
      }
    },

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
    timeSlotDuration: 5,
    maxAttachmentSize: 15 * 1024 * 1024,
    allowedFileTypes: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ],
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
      defaultTimezone: getCurrentUserTimezone(),
    }
  } else {
    return {
      ...baseConfig,
      startHour: 8,
      endHour: 18,
      defaultLocations: ["organization", "online", "offline"],
      defaultTimezone: getCurrentUserTimezone(),
    }
  }
}