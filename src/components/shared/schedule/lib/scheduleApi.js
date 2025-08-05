// src/components/shared/schedule/lib/scheduleApi.js - FIXED ATTACHMENT UPLOADS

import { apiClient } from "../../../../lib/api.js"

export const createScheduleApi = (organizationType = "school") => {
  
  // Get timezone display
  const getTimezoneDisplay = (timezone) => {
    if (timezone === "WIB" || timezone === "WITA" || timezone === "WIT") {
      return timezone;
    }
    
    if (typeof timezone === 'string' && timezone.includes('+')) {
      const offset = timezone.split('+')[1];
      switch (offset) {
        case '07': return 'WIB';
        case '08': return 'WITA'; 
        case '09': return 'WIT';
        default: return 'WIB';
      }
    }
    
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
    
    return 'WIB';
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
        return "Seed-in";
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

  // FIXED: Transform schedule data with proper error handling
  const transformScheduleData = (schedules, orgType) => {
    return schedules.map((schedule) => {
      // FIXED: Validate and safely convert UTC times to local
      let startDateTimeLocal, endDateTimeLocal;
      
      try {
        // Handle various datetime formats from backend
        const startDateTime = schedule.startDateTime;
        const endDateTime = schedule.endDateTime;
        
        // Check if datetime values are valid
        if (!startDateTime || !endDateTime) {
          console.error('Missing datetime values in schedule:', schedule);
          // Use current time as fallback
          startDateTimeLocal = new Date();
          endDateTimeLocal = new Date(startDateTimeLocal.getTime() + 60 * 60 * 1000); // +1 hour
        } else {
          startDateTimeLocal = new Date(startDateTime);
          endDateTimeLocal = new Date(endDateTime);
          
          // Validate that the dates are actually valid
          if (isNaN(startDateTimeLocal.getTime()) || isNaN(endDateTimeLocal.getTime())) {
            console.error('Invalid datetime format in schedule:', { startDateTime, endDateTime, schedule });
            // Use current time as fallback
            startDateTimeLocal = new Date();
            endDateTimeLocal = new Date(startDateTimeLocal.getTime() + 60 * 60 * 1000); // +1 hour
          }
        }
      } catch (error) {
        console.error('Error parsing datetime in schedule:', error, schedule);
        // Use current time as fallback
        startDateTimeLocal = new Date();
        endDateTimeLocal = new Date(startDateTimeLocal.getTime() + 60 * 60 * 1000); // +1 hour
      }
      
      const baseTransform = {
        ...schedule,
        displayName: schedule.agenda,
        // FIXED: Safe ISO conversion with fallback
        startDateTime: startDateTimeLocal.toISOString(),
        endDateTime: endDateTimeLocal.toISOString(),
        startTime: startDateTimeLocal.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        endTime: endDateTimeLocal.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
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
        timezoneDisplay: getTimezoneDisplay(schedule.timezone || schedule.startDateTime),
        attachmentCount: schedule.attachments?.length || 0,
        attachments: schedule.attachments || [],
        hasZoomMeeting: !!(schedule.zoomJoinUrl || schedule.zoomStartUrl),
        zoomJoinUrl: schedule.zoomJoinUrl || null,
        zoomStartUrl: schedule.zoomStartUrl || null,
        dates: [{
          date: startDateTimeLocal.toISOString().split('T')[0],
          startTime: startDateTimeLocal.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          endTime: endDateTimeLocal.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          timezone: 'WIB'
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
    
    if (!data.agenda || data.agenda.trim().length === 0) {
      errors.push('Agenda is required');
    } else if (data.agenda.trim().length > 255) {
      errors.push('Agenda cannot exceed 255 characters');
    }
    
    if (data.description && data.description.length > 255) {
      errors.push('Description cannot exceed 255 characters');
    }
    
    if (!data.type || !['counseling', 'class', 'seminar', 'others'].includes(data.type)) {
      errors.push('Invalid schedule type');
    }
    
    if (!data.dates || !Array.isArray(data.dates) || data.dates.length === 0) {
      errors.push('At least one date is required');
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
    
    return errors;
  };

  // FIXED: Data validation helper for update - only validate changed fields
  const validateScheduleUpdateData = (data) => {
    const errors = [];
    
    // Only validate fields that are being updated
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
    
    // If participants are being updated, validate them
    if (data.hasOwnProperty('participants')) {
      if (!data.participants || !data.participants.psychologistId) {
        errors.push('Psychologist is required for counseling');
      }
      if (!data.participants || !data.participants.patientIds || data.participants.patientIds.length === 0) {
        errors.push('At least one patient is required for counseling');
      }
    }
    
    // If location is being updated for counseling, validate it
    if (data.hasOwnProperty('location') && !data.location) {
      errors.push('Location is required for counseling');
    }
    
    return errors;
  };

  // Return API methods
  return {
    async getSchedules(params = {}) {
      try {
        const formattedParams = {
          from: params.from,
          to: params.to,
          timezone: params.timezone || "WIB",
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
        const response = await apiClient.post("/schedules/check-exists", {
          date: params.date,
          startTime: params.startTime,
          endTime: params.endTime,
          timezone: params.timezone || "WIB",
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

    async createSchedule(scheduleData) {
      try {
        const validationErrors = validateScheduleData(scheduleData);
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }

        const transformedData = {
          agenda: scheduleData.agenda.trim(),
          description: (scheduleData.description || "").trim(),
          notificationOffset: scheduleData.notificationOffset,
          type: scheduleData.type,
          dates: scheduleData.dates.map((dateItem) => ({
            date: dateItem.date,
            startTime: dateItem.startTime,
            endTime: dateItem.endTime,
            timezone: dateItem.timezone || "WIB",
          })),
        }

        // Handle new participants structure
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
        }

        // Location handling
        if (scheduleData.type === "counseling") {
          const standardLocations = ["online", "offline", "organization"];
          if (standardLocations.includes(scheduleData.location)) {
            transformedData.location = scheduleData.location;
          } else {
            transformedData.location = "offline";
          }
        } else {
          transformedData.customLocation = scheduleData.customLocation;
        }

        if (scheduleData.id) {
          transformedData.id = scheduleData.id;
        }

        const response = await apiClient.post("/schedules", transformedData)
        
        // FIXED: Handle response transformation with better error handling
        if (response.data?.status === "success") {
          try {
            // Attempt to transform the response data
            const transformedResponse = transformScheduleData([response.data.data], organizationType)[0];
            return {
              ...response,
              data: {
                ...response.data,
                data: transformedResponse
              }
            };
          } catch (transformError) {
            console.error("Error transforming create response, using raw data:", transformError);
            // FIXED: Return raw response if transformation fails
            // The schedule was created successfully, just return without transformation
            return {
              ...response,
              data: {
                ...response.data,
                data: response.data.data // Use raw data from backend
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

    // FIXED: Updated updateSchedule to support selective updates
    async updateSchedule(scheduleId, scheduleData) {
      try {
        console.log('=== updateSchedule API call ===');
        console.log('Schedule ID:', scheduleId);
        console.log('Update data received:', scheduleData);

        // FIXED: Use selective validation for update
        const validationErrors = validateScheduleUpdateData(scheduleData);
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }

        // FIXED: Build payload with only provided fields (selective update)
        const transformedData = {};

        // Only include fields that are actually being updated
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

        if (scheduleData.hasOwnProperty('dates')) {
          transformedData.dates = scheduleData.dates.map((dateItem) => ({
            date: dateItem.date,
            startTime: dateItem.startTime,
            endTime: dateItem.endTime,
            timezone: dateItem.timezone || "WIB",
          }));
        }

        // Handle participants update (only if provided)
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

        // Handle location update (only if provided)
        if (scheduleData.hasOwnProperty('location')) {
          const standardLocations = ["online", "offline", "organization"];
          if (standardLocations.includes(scheduleData.location)) {
            transformedData.location = scheduleData.location;
          } else {
            transformedData.location = "offline";
          }
        }

        if (scheduleData.hasOwnProperty('customLocation')) {
          transformedData.customLocation = scheduleData.customLocation;
        }

        console.log('Final payload sent to backend:', transformedData);

        const response = await apiClient.patch(`/schedules/${scheduleId}`, transformedData)
        
        console.log('Backend response:', response.data);

        // FIXED: Handle response transformation with better error handling
        if (response.data?.status === "success") {
          try {
            // Attempt to transform the response data
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
            // FIXED: Return raw response if transformation fails
            // The schedule was updated successfully, just return without transformation
            return {
              ...response,
              data: {
                ...response.data,
                data: response.data.data // Use raw data from backend
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
        
        // Return success response
        return {
          success: true,
          scheduleId: scheduleId,
          data: response.data
        };
      } catch (error) {
        console.error("Error deleting schedule:", error);
        
        // Enhanced error handling
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

    // Get schedule detail by ID with proper error handling
    async getScheduleById(scheduleId) {
      try {
        const response = await apiClient.get(`/schedules/${scheduleId}`)

        if (response.data?.status === "success") {
          try {
            // Attempt to transform the response data
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
            // FIXED: Return raw response if transformation fails
            return {
              ...response,
              data: {
                ...response.data,
                data: response.data.data // Use raw data from backend
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

// FIXED: Upload attachments using correct bulk endpoint
    async uploadAttachments(scheduleIds, files) {
      try {
        console.log('=== uploadAttachments API call ===');
        console.log('Schedule IDs:', scheduleIds);
        console.log('Files:', files);
        
        // Validate inputs
        if (!scheduleIds || (Array.isArray(scheduleIds) && scheduleIds.length === 0)) {
          throw new Error('Schedule IDs are required for attachment upload');
        }
        
        if (!files || files.length === 0) {
          throw new Error('No files provided for upload');
        }
        
        const formData = new FormData();
        
        // Validate file sizes and types
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
          // Validate file size
          if (file.size > maxSize) {
            throw new Error(`File ${file.name} exceeds 15MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
          }
          
          // Validate file type
          if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} is not allowed for ${file.name}`);
          }
          
          console.log(`Adding file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB, ${file.type})`);
          formData.append('files', file);
        }

        // FIXED: Add scheduleIds to form data as shown in API example
        const idArray = Array.isArray(scheduleIds) ? scheduleIds : [scheduleIds];
        idArray.forEach((scheduleId) => {
          formData.append('scheduleIds', scheduleId);
        });

        // Log FormData contents for debugging
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
          console.log(key, value instanceof File ? `File: ${value.name}` : value);
        }

        // FIXED: Use the correct bulk endpoint
        const response = await apiClient.post('/schedules/attachments', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 second timeout for large files
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
        
        // Enhanced error handling
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

    // FIXED: Remove the individual upload method since we use bulk endpoint
    async uploadAttachmentsToMultipleSchedules(scheduleIds, files) {
      // Just use the main uploadAttachments method since it handles multiple schedules
      return this.uploadAttachments(scheduleIds, files);
    },

    // FIXED: Alternative bulk upload method for multiple schedules
    async uploadAttachmentsToMultipleSchedules(scheduleIds, files) {
      try {
        console.log('=== uploadAttachmentsToMultipleSchedules ===');
        console.log('Schedule IDs:', scheduleIds);
        console.log('Files:', files);
        
        // Upload to each schedule individually for better reliability
        const uploadResults = [];
        
        for (const scheduleId of scheduleIds) {
          try {
            const result = await this.uploadAttachments(scheduleId, files);
            uploadResults.push({
              scheduleId,
              success: true,
              data: result.data
            });
          } catch (error) {
            console.error(`Failed to upload to schedule ${scheduleId}:`, error);
            uploadResults.push({
              scheduleId,
              success: false,
              error: error.message
            });
          }
        }
        
        const successful = uploadResults.filter(r => r.success);
        const failed = uploadResults.filter(r => !r.success);
        
        if (failed.length === 0) {
          console.log(`Successfully uploaded to all ${successful.length} schedules`);
          return {
            success: true,
            results: uploadResults,
            message: `Successfully uploaded to all ${successful.length} schedule(s)`
          };
        } else if (successful.length > 0) {
          console.warn(`Partial success: ${successful.length} succeeded, ${failed.length} failed`);
          return {
            success: false,
            results: uploadResults,
            message: `Uploaded to ${successful.length} schedule(s), failed for ${failed.length} schedule(s)`
          };
        } else {
          console.error('All uploads failed');
          throw new Error(`Failed to upload to all ${failed.length} schedule(s)`);
        }
        
      } catch (error) {
        console.error("Error in bulk upload:", error);
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
      defaultTimezone: "WIB",
    }
  } else {
    return {
      ...baseConfig,
      startHour: 8,
      endHour: 18,
      defaultLocations: ["organization", "online", "offline"],
      defaultTimezone: "WIB",
    }
  }
}