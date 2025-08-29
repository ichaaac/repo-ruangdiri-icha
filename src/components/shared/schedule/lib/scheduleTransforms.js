// src/components/shared/schedule/lib/scheduleTransforms.js

// Get timezone display
export const getTimezoneDisplay = (timezone) => {
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
};

// Location display logic
export const getLocationDisplay = (schedule) => {
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
export const formatCounselingDateTime = (startDateTime) => {
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

// Get display role
export const getDisplayRole = (role, orgType) => {
  if (orgType === "school") {
    const schoolRoles = {
      student: "Siswa",
      teacher: "Guru",
      psychologist: "Konselor",
      principal: "Kepala Sekolah",
      admin: "Admin",
    };
    return schoolRoles[role] || "Staff";
  } else {
    const companyRoles = {
      employee: "Karyawan",
      manager: "Manager",
      hr: "HR",
      psychologist: "Konselor",
      director: "Direktur",
      ceo: "CEO",
    };
    return companyRoles[role] || "Staff";
  }
};

// Get category label
export const getCategoryLabel = (status) => {
  const labels = {
    at_risk: "Berisiko",
    monitored: "Pengawasan",
    stable: "Stabil",
  };
  return labels[status] || "Normal";
};

// Transform schedule data with proper error handling
export const transformScheduleData = (schedules, orgType) => {
  return schedules.map((schedule) => {
    // Validate and safely convert UTC times to local
    let startDateTimeLocal, endDateTimeLocal;
    
    try {
      const startDateTime = schedule.startDateTime;
      const endDateTime = schedule.endDateTime;
      
      if (!startDateTime || !endDateTime) {
        console.error('Missing datetime values in schedule:', schedule);
        startDateTimeLocal = new Date();
        endDateTimeLocal = new Date(startDateTimeLocal.getTime() + 60 * 60 * 1000); // +1 hour
      } else {
        startDateTimeLocal = new Date(startDateTime);
        endDateTimeLocal = new Date(endDateTime);
        
        if (isNaN(startDateTimeLocal.getTime()) || isNaN(endDateTimeLocal.getTime())) {
          console.error('Invalid datetime format in schedule:', { startDateTime, endDateTime, schedule });
          startDateTimeLocal = new Date();
          endDateTimeLocal = new Date(startDateTimeLocal.getTime() + 60 * 60 * 1000); // +1 hour
        }
      }
    } catch (error) {
      console.error('Error parsing datetime in schedule:', error, schedule);
      startDateTimeLocal = new Date();
      endDateTimeLocal = new Date(startDateTimeLocal.getTime() + 60 * 60 * 1000); // +1 hour
    }
    
    const baseTransform = {
      ...schedule,
      displayName: schedule.agenda,
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
    };

    if (orgType === "school") {
      return {
        ...baseTransform,
        isClassSchedule: schedule.type === "class",
        isCounselingSchedule: schedule.type === "counseling",
        requiresClassroom: ["class", "seminar"].includes(schedule.type),
      };
    } else {
      return {
        ...baseTransform,
        isCounselingSchedule: schedule.type === "counseling",
        isTraining: schedule.type === "training",
        requiresMeetingRoom: ["training", "seminar"].includes(schedule.type),
        priority: schedule.usersSchedules?.some((us) => ["manager", "director", "ceo"].includes(us.user.role))
          ? "high"
          : "normal",
      };
    }
  });
};

// Transform counseling queue data
export const transformCounselingData = (counselings, orgType) => {
  return counselings.map((counseling) => {
    const users = counseling.users || [];
    const patient = users.find(user => user.role !== 'psychologist');
    const psychologist = users.find(user => user.role === 'psychologist');
    const screening = patient?.screening;

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
    };

    if (orgType === "school") {
      return {
        ...baseTransform,
        studentId: patient?.profile?.studentId || patient?.email?.split('@')[0] || "-",
        grade: patient?.profile?.grade || "-",
        classroom: patient?.profile?.classroom || "-",
      };
    } else {
      return {
        ...baseTransform,
        employeeId: patient?.profile?.employeeId || patient?.email?.split('@')[0] || "-",
        department: patient?.profile?.department || "-",
        position: patient?.profile?.position || "-",
        workDuration: patient?.profile?.yearsOfService ? `${patient.profile.yearsOfService} tahun` : "-",
        urgency: screening?.screeningStatus === "at_risk" ? "Tinggi" : "Normal",
        requestedBy: patient?.profile?.supervisor || "Self-request",
      };
    }
  });
};