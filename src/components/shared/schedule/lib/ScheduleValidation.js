// src/components/shared/schedule/lib/scheduleValidation.js

export const validateScheduleData = (data) => {
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
  
  // Allow 'others' as valid type
  if (!data.type || !['counseling', 'class', 'seminar', 'others'].includes(data.type)) {
    console.error('Invalid type:', data.type);
    errors.push(`Invalid schedule type: ${data.type}. Must be one of: counseling, class, seminar, others`);
  }
  
  // Better dates validation
  if (!data.dates || !Array.isArray(data.dates) || data.dates.length === 0) {
    console.error('Invalid dates:', data.dates);
    errors.push('At least one date is required');
  } else {
    // Validate each date object
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

export const validateScheduleUpdateData = (data) => {
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

export const validateFileUpload = (files) => {
  const errors = [];
  const maxSize = 15 * 1024 * 1024; // 15MB
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (!files || files.length === 0) {
    errors.push('No files provided for upload');
    return errors;
  }

  files.forEach((file, index) => {
    if (file.size > maxSize) {
      errors.push(`File ${index + 1} exceeds 15MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File ${index + 1} has unsupported type: ${file.type}`);
    }
  });

  return errors;
};