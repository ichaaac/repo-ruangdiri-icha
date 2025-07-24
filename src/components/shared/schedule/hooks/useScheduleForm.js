// src/components/shared/schedule/hooks/useScheduleForm.js - FIXED: Remove duration validation & fix attachments

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { parseScheduleDateTime } from "@/components/shared/schedule/utils/timezoneHandler";

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useScheduleForm = (mode = "create", initialData = null, isOpen = false) => {
  const [formData, setFormData] = useState(() => ({
    agenda: "",
    type: "counseling",
    dates: [{
      date: formatDateLocal(new Date()),
      startTime: "09:00",
      endTime: "10:00",
      timezone: "WIB"
    }],
    notificationOffset: 60,
    selectedPsychologist: null,
    selectedParticipants: [],
    location: "",
    customLocation: "",
    description: "",
    multipleDate: false,
  }));

  const [dropdowns, setDropdowns] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [psychologistLocations, setPsychologistLocations] = useState([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [hasShownUnsavedToast, setHasShownUnsavedToast] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  
  const editorRef = useRef(null);
  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Enhanced error message parser
  const parseErrorMessage = (message) => {
    if (!message) return 'An error occurred';
    
    const isoDatePattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)/g;
    const dateTimePattern = /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/g;
    
    let parsedMessage = message;
    
    parsedMessage = parsedMessage.replace(isoDatePattern, (match) => {
      try {
        const date = new Date(match);
        const dateStr = date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        return `${dateStr} ${timeStr}`;
      } catch (e) {
        return match;
      }
    });
    
    parsedMessage = parsedMessage.replace(dateTimePattern, (match) => {
      try {
        const date = new Date(match);
        const dateStr = date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        return `${dateStr} ${timeStr}`;
      } catch (e) {
        return match;
      }
    });
    
    return parsedMessage;
  };

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        let dates = [];
        if (initialData.dates && initialData.dates.length > 0) {
          dates = initialData.dates.map(dateInfo => ({
            ...dateInfo,
            timezone: dateInfo.timezone || "WIB"
          }));
        } else if (initialData.startDateTime) {
          const scheduleData = parseScheduleDateTime(
            initialData.startDateTime,
            initialData.endDateTime,
            initialData.timezone
          );
          
          dates = [{
            date: scheduleData.date,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            timezone: scheduleData.timezone || "WIB"
          }];
        }
        
        let locationValue = "";
        if (initialData.type === "counseling") {
          locationValue = initialData.location || initialData._originalBackendLocation || "";
        }
        
        const transformedData = {
          agenda: initialData.agenda || "",
          type: initialData.type || "counseling",
          description: initialData.description || "",
          notificationOffset: initialData.notificationOffset || 60,
          dates: dates.length > 0 ? dates : [{
            date: formatDateLocal(new Date()),
            startTime: "09:00",
            endTime: "10:00",
            timezone: "WIB"
          }],
          location: initialData.type === "counseling" ? locationValue : "",
          customLocation: initialData.type !== "counseling" ? (initialData.customLocation || initialData.location || "") : "",
          selectedPsychologist: initialData.selectedPsychologist || null,
          selectedParticipants: initialData.selectedParticipants || [],
          multipleDate: dates.length > 1 || initialData.multipleDate || false,
          _originalBackendLocation: initialData.location,
        };
        
        setFormData(transformedData);
        
        if (editorRef.current && transformedData.description) {
          editorRef.current.innerHTML = transformedData.description;
        }
      } else {
        let defaultDates = [{
          date: formatDateLocal(new Date()),
          startTime: "09:00",
          endTime: "10:00",
          timezone: "WIB"
        }];

        if (initialData?.dates && initialData.dates.length > 0) {
          defaultDates = initialData.dates.map((dateInfo) => {
            let dateString = dateInfo.date;
            if (dateInfo.date instanceof Date) {
              dateString = formatDateLocal(dateInfo.date);
            }
            
            return {
              date: dateString,
              startTime: dateInfo.startTime || "09:00",
              endTime: dateInfo.endTime || "10:00", 
              timezone: dateInfo.timezone || "WIB"
            };
          });
        } else if (initialData?.startDateTime && initialData?.endDateTime) {
          const startDate = new Date(initialData.startDateTime);
          const endDate = new Date(initialData.endDateTime);
          
          defaultDates = [{
            date: formatDateLocal(startDate),
            startTime: startDate.toTimeString().slice(0, 5),
            endTime: endDate.toTimeString().slice(0, 5),
            timezone: "WIB"
          }];
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
        };
        
        setFormData(createModeData);
        
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
      }
      
      setAttachments([]);
      setDropdowns({});
      setParticipantSearch("");
      setHasShownUnsavedToast(false);
      setPreviewAttachment(null);
    }
  }, [isOpen, mode, initialData]);

  // Event types and options
  const eventTypes = [
    { label: "Konseling", value: "counseling", textColor: "#9986FF" },
    { label: "Kelas", value: "class", textColor: "#3CE69E" },
    { label: "Seminar", value: "seminar", textColor: "#FF886D" },
    { label: "Lainnya", value: "others", textColor: "#979797" }
  ];

  const notificationOptions = [
    { label: "1 jam", value: 60 },
    { label: "12 jam", value: 720 },
    { label: "1 hari", value: 1440 },
    { label: "3 hari", value: 4320 }
  ];

  const timezoneOptions = [
    { label: "WIB", value: "WIB" },
    { label: "WITA", value: "WITA" },
    { label: "WIT", value: "WIT" }
  ];

  const fixedLocationOptions = [
    { label: "Online", value: "online" },
    { label: "Offline", value: "offline" },
    { label: "Seed-in", value: "organization" }
  ];

  // Generate time options
  const timeOptions = (() => {
    const times = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return times;
  })();

  // Fetch psychologist locations
  const { data: backendLocations = [] } = useQuery({
    queryKey: ['psychologist-locations'],
    queryFn: async () => {
      const response = await apiClient.get('/psychologists/locations');
      const locations = response.data || [];
      setPsychologistLocations(locations);
      return locations;
    },
    enabled: isOpen && formData.type === "counseling" && !formData.selectedPsychologist,
    staleTime: 5 * 60 * 1000
  });

  // Fetch psychologists
  const { data: psychologists = [], isLoading: loadingPsychologists } = useQuery({
    queryKey: ['psychologists', formData.location],
    queryFn: async () => {
      const response = await apiClient.get('/psychologists');
      return response.data?.data || response.data || [];
    },
    enabled: isOpen && formData.type === "counseling" && dropdowns.psychologist,
    staleTime: 2 * 60 * 1000
  });

  // Fetch participants
  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ['participants', participantSearch],
    queryFn: async () => {
      const params = { 
        limit: 100,
        ...(participantSearch && { search: participantSearch })
      };
      const response = await apiClient.get('/users', { params });
      return response.data?.data || [];
    },
    enabled: isOpen && formData.type === "counseling" && (dropdowns.participants1 || dropdowns.participants2),
    staleTime: 30 * 1000
  });

  // FIXED: Upload attachments mutation with proper endpoint and error handling
  const uploadAttachmentsMutation = useMutation({
    mutationFn: async ({ scheduleIds, files }) => {
      console.log('=== Uploading attachments ===');
      console.log('Schedule IDs:', scheduleIds);
      console.log('Files to upload:', files);
      
      // FIXED: Handle single schedule ID or multiple schedule IDs
      const idArray = Array.isArray(scheduleIds) ? scheduleIds : [scheduleIds];
      
      // FIXED: Upload to each schedule individually for better reliability
      const uploadPromises = idArray.map(async (scheduleId) => {
        const formData = new FormData();
        
        // Add files to form data
        files.forEach((file) => {
          console.log(`Adding file to schedule ${scheduleId}:`, file.name, file.size);
          formData.append('files', file);
        });
        
        console.log(`Uploading to schedule ${scheduleId}`);
        
        try {
          // FIXED: Use the correct endpoint for individual schedule
          const response = await apiClient.post(`/schedules/${scheduleId}/attachments`, formData, {
            headers: { 
              'Content-Type': 'multipart/form-data' 
            },
            timeout: 60000 // 60 second timeout for file uploads
          });
          
          console.log(`Upload response for schedule ${scheduleId}:`, response);
          return { scheduleId, success: true, data: response.data };
        } catch (error) {
          console.error(`Upload error for schedule ${scheduleId}:`, error);
          return { 
            scheduleId, 
            success: false, 
            error: error.response?.data?.message || error.message 
          };
        }
      });
      
      const results = await Promise.allSettled(uploadPromises);
      
      // Check if all uploads were successful
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      );
      
      const failed = results.filter(result => 
        result.status === 'rejected' || !result.value?.success
      );
      
      if (failed.length > 0) {
        console.error('Some uploads failed:', failed);
        throw new Error(`Failed to upload attachments to ${failed.length} schedule(s)`);
      }
      
      console.log(`Successfully uploaded attachments to ${successful.length} schedule(s)`);
      return { successful: successful.length, results };
    }
  });

  // FIXED: Form validation - Completely remove duration requirements
  const validateForm = () => {
    if (!formData.agenda.trim()) {
      toast.error("Agenda wajib diisi");
      return false;
    }
    
    // Date and time validation - REMOVED all duration checks
    for (let i = 0; i < formData.dates.length; i++) {
      const dateInfo = formData.dates[i];
      
      // Check if start time equals end time
      if (dateInfo.startTime === dateInfo.endTime) {
        toast.error(`Waktu mulai dan selesai tidak boleh sama pada tanggal ${dateInfo.date}`);
        return false;
      }
      
      // Check if start time is after end time
      const startMinutes = convertTimeToMinutes(dateInfo.startTime);
      const endMinutes = convertTimeToMinutes(dateInfo.endTime);
      
      if (startMinutes >= endMinutes) {
        toast.error(`Waktu mulai harus lebih awal dari waktu selesai pada tanggal ${dateInfo.date}`);
        return false;
      }
      
      // REMOVED: All minimum duration checks - allow any duration even 5 minutes
    }
    
    if (formData.type === "counseling") {
      if (!formData.selectedPsychologist) {
        toast.error("Psikolog wajib dipilih untuk konseling");
        return false;
      }
      if (formData.selectedParticipants.length === 0) {
        toast.error("Minimal satu partisipan harus ditambahkan untuk konseling");
        return false;
      }
      if (formData.selectedParticipants.length > 2) {
        toast.error("Maksimal dua klien untuk konseling");
        return false;
      }
      if (!formData.location.trim()) {
        toast.error("Lokasi wajib dipilih untuk konseling");
        return false;
      }
    }
    
    return true;
  };

  const convertTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Event handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'selectedPsychologist' && formData.type === "counseling") {
      setFormData(prev => ({ ...prev, selectedPsychologist: value, location: "" }));
      return;
    }
    
    if (field === 'dates') {
      const updatedDates = value.map(date => {
        const startIndex = timeOptions.indexOf(date.startTime);
        const endIndex = timeOptions.indexOf(date.endTime);
        if (startIndex >= endIndex) {
          return {
            ...date,
            endTime: timeOptions[Math.min(startIndex + 1, timeOptions.length - 1)]
          };
        }
        return date;
      });
      setFormData(prev => ({ 
        ...prev, 
        dates: updatedDates,
        multipleDate: updatedDates.length > 1
      }));
      return;
    }
  };

  const toggleDropdown = (dropdown) => {
    setDropdowns(prev => {
      const newState = {
        ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
        [dropdown]: !prev[dropdown]
      };
      
      if (dropdown.includes('participants') && prev[dropdown]) {
        setParticipantSearch("");
      }
      
      return newState;
    });
  };

  // Location options
  const getAvailableLocations = () => {
    if (formData.selectedPsychologist) {
      return fixedLocationOptions;
    } else {
      return psychologistLocations.map(location => ({ 
        label: location, 
        value: location 
      }));
    }
  };

  // FIXED: File handling with better validation and preview
  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    const maxSize = 15 * 1024 * 1024; // 15MB
    const maxTotalSize = 50 * 1024 * 1024; // 50MB total
    
    let currentTotalSize = attachments.reduce((sum, att) => sum + att.size, 0);
    const validFiles = [];
    
    // Check file types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    files.forEach(file => {
      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File ${file.name} terlalu besar. Maksimal 15MB per file.`);
        return;
      }
      
      // Validate total size
      if (currentTotalSize + file.size > maxTotalSize) {
        toast.error(`Total ukuran file melebihi batas 50MB`);
        return;
      }
      
      // Validate file type
      if (type === 'image' && !allowedImageTypes.includes(file.type)) {
        toast.error(`File ${file.name} bukan format gambar yang didukung`);
        return;
      }
      
      if (type === 'document' && !allowedDocTypes.includes(file.type)) {
        toast.error(`File ${file.name} bukan format dokumen yang didukung`);
        return;
      }
      
      // Check for duplicates
      const isDuplicate = attachments.some(att => 
        att.name === file.name && att.size === file.size
      );
      
      if (isDuplicate) {
        toast.error(`File ${file.name} sudah dipilih`);
        return;
      }
      
      const attachment = {
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: type,
        fileType: file.type
      };

      // Generate preview for images
      if (type === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target.result;
          setAttachments(prev => 
            prev.map(att => att.id === attachment.id ? { ...att, preview: e.target.result } : att)
          );
        };
        reader.readAsDataURL(file);
      }

      validFiles.push(attachment);
      currentTotalSize += file.size;
    });
    
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file berhasil dipilih`);
    }
    
    // Clear input
    e.target.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    toast.success("File dihapus dari daftar lampiran");
  };

  // Participant handlers
  const handleParticipantSelect = (participant, slotIndex = 0) => {
    const newParticipants = [...formData.selectedParticipants];
    
    if (!newParticipants.find(p => p.id === participant.id)) {
      if (slotIndex === 0 && !newParticipants[0]) {
        newParticipants[0] = participant;
      } else if (slotIndex === 1 && !newParticipants[1]) {
        newParticipants[1] = participant;
      } else if (!newParticipants[0]) {
        newParticipants[0] = participant;
      } else if (!newParticipants[1]) {
        newParticipants[1] = participant;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      selectedParticipants: newParticipants.filter(Boolean)
    }));
    
    setDropdowns(prev => ({ ...prev, participants1: false, participants2: false }));
    setParticipantSearch("");
  };

  const removeParticipant = (participantId) => {
    setFormData(prev => ({
      ...prev,
      selectedParticipants: prev.selectedParticipants.filter(p => p.id !== participantId)
    }));
  };

  // Date handlers
  const removeDateSlot = (index) => {
    const newDates = formData.dates.filter((_, i) => i !== index);
    handleInputChange('dates', newDates);
    
    if (newDates.length <= 1) {
      handleInputChange('multipleDate', false);
    }
  };

  const updateAdditionalDate = (index, field, value) => {
    const newDates = [...formData.dates];
    newDates[index] = { ...newDates[index], [field]: value };
    
    // FIXED: Don't auto-adjust times, allow any duration
    if (field === 'startTime') {
      const startTimeIndex = timeOptions.indexOf(value);
      const endTimeIndex = timeOptions.indexOf(newDates[index].endTime);
      
      // Only adjust if end time is before or equal to start time
      if (startTimeIndex >= endTimeIndex) {
        const newEndTimeIndex = Math.min(startTimeIndex + 1, timeOptions.length - 1);
        newDates[index].endTime = timeOptions[newEndTimeIndex];
      }
    }
    
    if (field === 'endTime') {
      const startTimeIndex = timeOptions.indexOf(newDates[index].startTime);
      const endTimeIndex = timeOptions.indexOf(value);
      
      // Only adjust if end time is before or equal to start time
      if (endTimeIndex <= startTimeIndex) {
        const newStartTimeIndex = Math.max(endTimeIndex - 1, 0);
        newDates[index].startTime = timeOptions[newStartTimeIndex];
      }
    }
    
    handleInputChange('dates', newDates);
  };

  // Unsaved changes detection
  const hasUnsavedChanges = () => {
    if (mode !== 'edit' || !initialData) {
      return formData.agenda.trim() !== '' || 
             formData.description.trim() !== '' ||
             formData.selectedParticipants.length > 0 ||
             formData.selectedPsychologist !== null ||
             attachments.length > 0;
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
    };

    const initial = {
      agenda: initialData.agenda || "",
      type: initialData.type || "counseling",
      description: initialData.description || "",
      notificationOffset: initialData.notificationOffset || 60,
      dates: initialData.dates || [],
      location: initialData.location || "",
      customLocation: initialData.customLocation || "",
      multipleDate: initialData.multipleDate || false,
    };

    return JSON.stringify(current) !== JSON.stringify(initial) || attachments.length > 0;
  };

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
  };
};