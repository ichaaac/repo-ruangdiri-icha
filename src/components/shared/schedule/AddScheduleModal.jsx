// src/components/shared/schedule/AddScheduleModal.jsx - FIXED LOCATION HANDLING

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { 
  getTimezoneDisplay, 
  parseScheduleDateTime, 
  createDateTimeWithOffset 
} from "@/components/shared/schedule/utils/timezoneHandler";

// BEST PRACTICE: Utility untuk format tanggal tanpa timezone conversion
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Attachment Preview Modal Component
const AttachmentPreviewModal = ({ attachment, isOpen, onClose }) => {
  if (!isOpen || !attachment) return null;

  const isImage = attachment.type === 'image' || attachment.file?.type?.startsWith('image/');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[10000]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 z-10"
        >
          <span className="material-icons text-[24px]">close</span>
        </button>
        
        <div className="bg-white rounded-lg p-4 max-w-full max-h-full overflow-auto">
          <div className="flex items-center gap-3 mb-4 border-b pb-3">
            <span className="material-icons text-[#488BBA] text-[20px]">
              {isImage ? 'image' : 'description'}
            </span>
            <div>
              <div className="font-medium text-gray-900">{attachment.name}</div>
              <div className="text-sm text-gray-500">
                {(attachment.file?.size ? (attachment.file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size')}
              </div>
            </div>
          </div>
          
          {isImage ? (
            <img 
              src={attachment.preview} 
              alt={attachment.name}
              className="max-w-full max-h-[70vh] object-contain rounded"
              style={{ minHeight: '200px' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
              <span className="material-icons text-[64px] text-gray-400 mb-4">description</span>
              <div className="text-lg font-medium text-gray-700 mb-2">{attachment.name}</div>
              <div className="text-gray-500 mb-4">
                File will be uploaded when you submit the form
              </div>
              <div className="text-sm text-gray-400">
                Preview not available for this file type
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// FIXED: Location mapping helpers - simplified
const isStandardLocation = (locationValue) => {
  return ["online", "offline", "organization"].includes(locationValue);
};

const AddScheduleModal = ({
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  loading = false,
  mode = "create", // "create" or "edit"
  fromViewModal = false // New prop to track if opened from ViewScheduleModal
}) => {
  const [formData, setFormData] = useState(() => ({
    agenda: "",
    type: "counseling",
    dates: [{
      date: formatDateLocal(new Date()), // FIXED: Use local date formatting
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

  // FIXED: Helper function to parse error messages with datetime  
  const parseErrorMessage = (message) => {
    if (!message) return 'An error occurred';
    
    // Parse ISO datetime patterns in error messages
    const isoDatePattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/g;
    
    let parsedMessage = message.replace(isoDatePattern, (match) => {
      try {
        const date = new Date(match);
        // Format to readable Indonesian format
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
        return match; // Return original if parsing fails
      }
    });
    
    return parsedMessage;
  };

  // FIXED: Initialize form data properly with enhanced location handling
  useEffect(() => {
    if (isOpen) {
      console.log('=== AddScheduleModal Initialization ===');
      console.log('Mode:', mode);
      console.log('Initial data:', initialData);
      
      if (mode === "edit" && initialData) {
        console.log('Initializing edit mode with data:', initialData);
        
        // Parse dates properly
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
        
        // FIXED: Enhanced location handling for edit mode
        let locationValue = "";
        if (initialData.type === "counseling") {
          // Use original backend location for editing
          locationValue = initialData.location || initialData._originalBackendLocation || "";
          
          console.log('Location handling for edit:', {
            originalBackend: initialData.location,
            mappedForEdit: locationValue,
            hasPsychologist: !!initialData.selectedPsychologist
          });
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
          // FIXED: Use mapped location value for counseling
          location: initialData.type === "counseling" ? locationValue : "",
          customLocation: initialData.type !== "counseling" ? (initialData.customLocation || initialData.location || "") : "",
          selectedPsychologist: initialData.selectedPsychologist || null,
          selectedParticipants: initialData.selectedParticipants || [],
          multipleDate: dates.length > 1 || initialData.multipleDate || false,
          // Store original backend location for reference
          _originalBackendLocation: initialData.location,
        };
        
        console.log('Setting form data for edit:', transformedData);
        setFormData(transformedData);
        
        if (editorRef.current && transformedData.description) {
          editorRef.current.innerHTML = transformedData.description;
        }
      } else {
        // FIXED: Proper initialization for create mode from ScheduleGrid data
        let defaultDates = [{
          date: formatDateLocal(new Date()), // FIXED: Use local date formatting for default
          startTime: "09:00",
          endTime: "10:00",
          timezone: "WIB"
        }];

        // FIXED: Handle initialData from ScheduleGrid properly with detailed logging
        if (initialData?.dates && initialData.dates.length > 0) {
          console.log('Received dates from ScheduleGrid:', initialData.dates);
          
          // Validate each date object and ensure local formatting
          defaultDates = initialData.dates.map((dateInfo, index) => {
            console.log(`Processing date ${index}:`, dateInfo);
            
            // If date is a Date object, format it properly
            let dateString = dateInfo.date;
            if (dateInfo.date instanceof Date) {
              dateString = formatDateLocal(dateInfo.date);
            }
            
            const processedDate = {
              date: dateString,
              startTime: dateInfo.startTime || "09:00",
              endTime: dateInfo.endTime || "10:00", 
              timezone: dateInfo.timezone || "WIB"
            };
            
            console.log(`Processed date ${index}:`, processedDate);
            return processedDate;
          });
          
          console.log('All processed dates for form:', defaultDates);
        } else if (initialData?.startDateTime && initialData?.endDateTime) {
          // FIXED: Handle direct DateTime objects from ScheduleGrid
          console.log('Received DateTime objects from ScheduleGrid');
          console.log('startDateTime:', initialData.startDateTime);
          console.log('endDateTime:', initialData.endDateTime);
          
          const startDate = new Date(initialData.startDateTime);
          const endDate = new Date(initialData.endDateTime);
          
          defaultDates = [{
            date: formatDateLocal(startDate), // FIXED: Use local date formatting
            startTime: startDate.toTimeString().slice(0, 5),
            endTime: endDate.toTimeString().slice(0, 5),
            timezone: "WIB"
          }];
          
          console.log('Converted to date format:', defaultDates);
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
        
        console.log('Setting form data for create mode:', createModeData);
        setFormData(createModeData);
        
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
      }
      
      // Reset other state
      setAttachments([]);
      setDropdowns({});
      setParticipantSearch("");
      setHasShownUnsavedToast(false);
      setPreviewAttachment(null);
      
      console.log('====================================');
    }
  }, [isOpen, mode, initialData]);

  // Event types
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

  // FIXED: Standard location options for dropdown
  const fixedLocationOptions = [
    { label: "Online", value: "online" },
    { label: "Offline", value: "offline" },
    { label: "Seed-in", value: "organization" }
  ];

  // FIXED: Generate time options matching ScheduleGrid (06:00-23:55 with 5-minute intervals)
  const timeOptions = (() => {
    const times = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return times;
  })();

  // FIXED: Fetch psychologist locations - only when no psychologist selected
  const { data: backendLocations = [] } = useQuery({
    queryKey: ['psychologist-locations'],
    queryFn: async () => {
      const response = await apiClient.get('/psychologists/locations');
      const locations = response.data || [];
      setPsychologistLocations(locations);
      console.log('Backend locations loaded:', locations);
      return locations;
    },
    enabled: isOpen && formData.type === "counseling" && !formData.selectedPsychologist,
    staleTime: 5 * 60 * 1000
  });

  // FIXED: Location options based on psychologist selection
  const getAvailableLocations = () => {
    if (formData.selectedPsychologist) {
      // If psychologist selected, show standard options
      return fixedLocationOptions;
    } else {
      // If no psychologist selected, show only backend locations
      return psychologistLocations.map(location => ({ 
        label: location, 
        value: location 
      }));
    }
  };

  // Fetch psychologists with location filtering
  const { data: psychologists = [], isLoading: loadingPsychologists } = useQuery({
    queryKey: ['psychologists', formData.location],
    queryFn: async () => {
      // FIXED: Only filter by backend location when location is "offline"
      const params = {};
      
      // If location is "offline", we might want to filter by backend locations
      // But for now, we'll fetch all psychologists and let user select
      
      console.log('Fetching psychologists with params:', params);
      const response = await apiClient.get('/psychologists', { params });
      return response.data?.data || response.data || [];
    },
    enabled: isOpen && formData.type === "counseling" && dropdowns.psychologist,
    staleTime: 2 * 60 * 1000
  });

  // Fetch participants with search
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

  // Upload attachments mutation
  const uploadAttachmentsMutation = useMutation({
    mutationFn: async ({ scheduleIds, files }) => {
      const formData = new FormData();
      
      files.forEach(file => formData.append('files', file));
      
      const scheduleIdsString = Array.isArray(scheduleIds) ? scheduleIds.join(',') : scheduleIds;
      formData.append('scheduleIds', scheduleIdsString);
      
      console.log(`Uploading ${files.length} files to schedules: ${scheduleIdsString}`);
      
      return await apiClient.post('/schedules/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onError: (error, { scheduleIds }) => {
      console.error(`Failed to upload attachments to schedules ${scheduleIds}:`, error);
    }
  });

  // Event handlers
  const handleInputChange = (field, value) => {
    console.log(`Changing ${field} to:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // FIXED: Clear location when psychologist changes
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

  // FIXED: Enhanced file handling with preview
  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    const maxSize = 15 * 1024 * 1024;
    let totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
    const validFiles = [];
    
    files.forEach(file => {
      if (totalSize + file.size > maxSize) {
        toast.error(`Total file size exceeds 15MB limit`);
        return;
      }
      
      const attachment = {
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: type
      };

      // Create preview for images
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
      totalSize += file.size;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const openAttachmentPreview = (attachment) => {
    setPreviewAttachment(attachment);
  };

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

  const removeDateSlot = (index) => {
    const newDates = formData.dates.filter((_, i) => i !== index);
    handleInputChange('dates', newDates);
    
    if (newDates.length <= 1) {
      handleInputChange('multipleDate', false);
    }
  };

  // FIXED: Update date with proper time validation
  const updateAdditionalDate = (index, field, value) => {
    const newDates = [...formData.dates];
    newDates[index] = { ...newDates[index], [field]: value };
    
    if (field === 'startTime') {
      const startTimeIndex = timeOptions.indexOf(value);
      const endTimeIndex = timeOptions.indexOf(newDates[index].endTime);
      
      if (startTimeIndex >= endTimeIndex) {
        const newEndTimeIndex = Math.min(startTimeIndex + 1, timeOptions.length - 1);
        newDates[index].endTime = timeOptions[newEndTimeIndex];
      }
    }
    
    if (field === 'endTime') {
      const startTimeIndex = timeOptions.indexOf(newDates[index].startTime);
      const endTimeIndex = timeOptions.indexOf(value);
      
      if (endTimeIndex <= startTimeIndex) {
        const newStartTimeIndex = Math.max(endTimeIndex - 1, 0);
        newDates[index].startTime = timeOptions[newStartTimeIndex];
      }
    }
    
    handleInputChange('dates', newDates);
  };

  const validateForm = () => {
    if (!formData.agenda.trim()) {
      toast.error("Agenda wajib diisi");
      return false;
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
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // FIXED: Build payload with new participants structure and fixed location handling
    const submitData = {
      agenda: formData.agenda,
      type: formData.type,
      description: formData.description,
      notificationOffset: formData.notificationOffset,
      dates: formData.dates
    };

    console.log('=== Submit Data Debug ===');
    console.log('Form dates:', formData.dates);
    
    // Validate dates
    submitData.dates.forEach((date, index) => {
      console.log(`Date ${index}:`, date);
      console.log(`  - Date: ${date.date}`);
      console.log(`  - Start time: ${date.startTime}`);
      console.log(`  - End time: ${date.endTime}`);
      console.log(`  - Timezone: ${date.timezone}`);
    });

    // FIXED: Participants structure - new format with patientIds array
    if (formData.type === "counseling") {
      if (formData.selectedPsychologist && formData.selectedParticipants.length > 0) {
        submitData.participants = {
          psychologistId: formData.selectedPsychologist.id,
          patientIds: formData.selectedParticipants.map(participant => participant.id)
        };
        
        console.log('Participants payload:', submitData.participants);
      }
    }

    // FIXED: Location handling - send "offline" for custom backend locations, keep standard as-is
    if (formData.type === "counseling") {
      // Check if it's a standard location
      const isStandardLocation = fixedLocationOptions.find(opt => opt.value === formData.location);
      
      if (isStandardLocation) {
        // Send standard location as-is
        submitData.location = formData.location;
      } else {
        // For backend custom locations, send "offline" but keep original in description or notes
        submitData.location = "offline";
        // Optionally store the actual location name for reference
        submitData.actualLocationName = formData.location;
      }
      
      console.log('Location mapping:', {
        frontendValue: formData.location,
        sentToBackend: submitData.location,
        actualLocationName: submitData.actualLocationName
      });
    } else {
      submitData.customLocation = formData.customLocation;
    }

    if (mode === "edit" && initialData?.id) {
      submitData.id = initialData.id;
    }
    
    console.log('Final submit payload:', submitData);
    console.log('========================');
    
    try {
      const result = await onSubmit(submitData);
      
      // FIXED: Handle attachments only after successful schedule creation/update
      if (result?.data && attachments.length > 0) {
        setUploadingAttachments(true);
        
        try {
          let scheduleIds = [];
          
          if (Array.isArray(result.data)) {
            scheduleIds = result.data.map(schedule => schedule.id);
          } else if (result.data.ids && Array.isArray(result.data.ids)) {
            scheduleIds = result.data.ids;
          } else if (result.data.id) {
            scheduleIds = [result.data.id];
          }
          
          console.log('Uploading attachments to schedule IDs:', scheduleIds);
          
          if (scheduleIds.length > 0) {
            await uploadAttachmentsMutation.mutateAsync({
              scheduleIds,
              files: attachments.map(a => a.file)
            });
            
            if (scheduleIds.length === 1) {
              toast.success(`Schedule ${mode === 'edit' ? 'updated' : 'created'} and attachments uploaded successfully`);
            } else {
              toast.success(`${scheduleIds.length} schedules created and attachments uploaded to all schedules successfully`);
            }
          } else {
            console.warn('No valid schedule IDs found for attachment upload');
            toast.success(`Schedule ${mode === 'edit' ? 'updated' : 'created'} successfully, but no attachments uploaded`);
          }
          
        } catch (error) {
          console.error("Attachment upload error:", error);
          
          const scheduleCount = Array.isArray(result.data) ? result.data.length : 1;
          const scheduleText = scheduleCount > 1 ? `${scheduleCount} schedules` : 'Schedule';
          
          toast.error(`${scheduleText} ${mode === 'edit' ? 'updated' : 'created'} but failed to upload attachments`, {
            action: {
              label: "Retry Upload",
              onClick: () => {
                toast.info("Please try uploading attachments manually");
              }
            }
          });
        } finally {
          setUploadingAttachments(false);
        }
      } else if (result?.data) {
        const scheduleCount = Array.isArray(result.data) ? result.data.length : 1;
        const scheduleText = scheduleCount > 1 ? `${scheduleCount} schedules` : 'Schedule';
        toast.success(`${scheduleText} ${mode === 'edit' ? 'updated' : 'created'} successfully`);
      }
      
    } catch (error) {
      console.error('Error submitting schedule:', error);
      
      // FIXED: Parse error message for better user experience
      const parsedMessage = parseErrorMessage(error.message);
      toast.error(parsedMessage);
    }
  };

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

  const handleCancel = () => {
    if (hasUnsavedChanges() && !hasShownUnsavedToast) {
      setHasShownUnsavedToast(true);
      
      toast("Ada perubahan yang belum disimpan. Yakin ingin membatalkan?", {
        action: {
          label: "Ya, Batalkan",
          onClick: () => {
            setHasShownUnsavedToast(false);
            onClose();
          },
          className: "!bg-[#EE4266] hover:!bg-[#d63854] !text-white !border-[#EE4266] hover:!border-[#d63854] !ml-auto"
        },
        cancel: {
          label: "Tetap Edit",
          onClick: () => {
            setHasShownUnsavedToast(false);
          },
          className: "!bg-transparent hover:!bg-gray-100 !text-[#EE4266] !border !border-[#EE4266] hover:!border-[#d63854]"
        },
        duration: 10000,
        className: "!bg-white !border !border-gray-200 !shadow-lg",
        onDismiss: () => setHasShownUnsavedToast(false),
        position: "top-center"
      });
    } else if (!hasUnsavedChanges()) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedEventType = eventTypes.find(type => type.value === formData.type) || eventTypes[0];
  const showParticipants = formData.type === "counseling";

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
        onClick={(e) => e.target === e.currentTarget && handleCancel()}
      >
        <div className="bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
          
          {/* Header */}
          <div className="flex justify-end items-center p-6">
            {fromViewModal && (
              <button
                onClick={() => {
                  // FIXED: Close all modals when X is clicked from ViewSchedule
                  if (window.closeAllModals) {
                    window.closeAllModals();
                  } else {
                    onClose();
                  }
                }}
                disabled={loading}
                className="text-[#EE4266] hover:text-[#d63854] transition-colors disabled:opacity-50"
              >
                <span className="material-icons text-[20px]">close</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            
            {/* Agenda & Type */}
            <div className="flex gap-4 items-center">
              <span className="material-icons text-[#488BBA] text-[25px]">list_alt</span>
              <div className="flex-1 relative">
                {!formData.agenda.trim() && (
                  <span className="absolute left-2 top-3 text-[#EE4266] text-sm pointer-events-none z-10">*</span>
                )}
                <input
                  type="text"
                  value={formData.agenda}
                  onChange={(e) => handleInputChange('agenda', e.target.value)}
                  placeholder="Masukkan agenda"
                  disabled={loading}
                  className={`w-full pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                    formData.agenda.trim() ? 'pl-3' : 'pl-6'
                  }`}
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => !loading && toggleDropdown('type')}
                  disabled={loading}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md min-w-[120px] focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                >
                  <span style={{ color: selectedEventType.textColor }} className="font-medium">
                    {selectedEventType.label}
                  </span>
                  <span className="material-icons text-gray-400 ml-2">keyboard_arrow_down</span>
                </button>
                {dropdowns.type && !loading && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                    {eventTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          handleInputChange('type', type.value);
                          toggleDropdown('type');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                      >
                        <span style={{ color: type.textColor }} className="font-medium">
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date & Time section */}
            <div className="flex gap-4 items-start">
              <span className="material-icons text-[#488BBA] text-[25px] mt-1">schedule</span>
              <div className="flex-1 space-y-3">
                {formData.dates.map((dateInfo, index) => (
                  <div key={index} className="flex gap-2 items-center flex-wrap">
                    <input
                      type="date"
                      value={dateInfo.date}
                      onChange={(e) => {
                        console.log(`Changing date ${index} to:`, e.target.value);
                        const newDates = [...formData.dates];
                        newDates[index] = { ...newDates[index], date: e.target.value };
                        handleInputChange('dates', newDates);
                      }}
                      disabled={loading}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                    />
                    
                    <select
                      value={dateInfo.startTime}
                      onChange={(e) => updateAdditionalDate(index, 'startTime', e.target.value)}
                      disabled={loading}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>

                    <span className="text-[#488BBA]">-</span>

                    <select
                      value={dateInfo.endTime}
                      onChange={(e) => updateAdditionalDate(index, 'endTime', e.target.value)}
                      disabled={loading}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>

                    <select
                      value={dateInfo.timezone}
                      onChange={(e) => updateAdditionalDate(index, 'timezone', e.target.value)}
                      disabled={loading}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                    >
                      {timezoneOptions.map((tz) => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>

                    {index > 0 && (
                      <button
                        onClick={() => removeDateSlot(index)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                      >
                        <span className="material-icons text-sm">close</span>
                      </button>
                    )}
                  </div>
                ))}

                {/* Multiple Date indicator */}
                {formData.dates.length > 1 && (
                  <div className="flex gap-2 items-center text-sm">
                    <div className="w-4 h-4 bg-[#535353] rounded-sm"></div>
                    <span className="text-[#535353]">Multiple Date</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notification */}
            <div className="flex gap-4 items-center">
              <span className="material-icons text-[#488BBA] text-[25px]">notifications_active</span>
              <select
                value={formData.notificationOffset}
                onChange={(e) => handleInputChange('notificationOffset', parseInt(e.target.value))}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
              >
                {notificationOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Participants - Only for Counseling */}
            {showParticipants && (
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <span className="material-icons text-[#488BBA] text-[25px] mt-1">account_circle</span>
                  <div className="flex-1">
                    
                    <div className="flex flex-col gap-4">
                      
                      {/* Psychologist Field */}
                      <div>
                        <div className="relative">
                          {!formData.selectedPsychologist && (
                            <span className="absolute left-2 top-3 text-[#EE4266] text-sm pointer-events-none z-10">*</span>
                          )}
                          <button
                            onClick={() => !loading && toggleDropdown('psychologist')}
                            disabled={loading}
                            className={`relative w-full py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                              formData.selectedPsychologist ? 'px-3 py-2' : 'pl-6'
                            }`}
                            style={{ minHeight: '42px' }}
                          >
                            {!formData.selectedPsychologist ? (
                              <span className="text-gray-500">
                                Email/nama Psikolog
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 py-1">
                                <div className="px-2.5 py-1 bg-[#eeeeee] rounded-[5px] flex items-center gap-2 max-w-full">
                                  <div className="text-[#535353] text-sm font-normal truncate">
                                    {formData.selectedPsychologist.fullName}
                                  </div>
                                  <button
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      // FIXED: Clear location when psychologist removed
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        selectedPsychologist: null,
                                        location: "" // Clear location to show backend locations
                                      })); 
                                    }}
                                    disabled={loading}
                                    className="w-4 h-4 flex items-center justify-center text-[#535353] hover:text-gray-700 shrink-0"
                                  >
                                    <span className="material-icons text-xs">close</span>
                                  </button>
                                </div>
                              </div>
                            )}
                            <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-sm">keyboard_arrow_down</span>
                          </button>
                          {dropdowns.psychologist && !loading && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                              {loadingPsychologists ? (
                                <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                              ) : psychologists.length > 0 ? (
                                psychologists.map((psychologist) => (
                                  <button
                                    key={psychologist.id}
                                    onClick={() => {
                                      // FIXED: Clear location when psychologist changes  
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        selectedPsychologist: psychologist,
                                        location: "" // Clear location to force reselection
                                      }));
                                      toggleDropdown('psychologist');
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100"
                                  >
                                    <div className="font-medium text-sm truncate">{psychologist.fullName}</div>
                                    <div className="text-xs text-gray-500 truncate">{psychologist.email}</div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 text-center text-gray-500 text-sm">Tidak ada psikolog ditemukan</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Participant 1 Field */}
                      <div>
                        <div className="relative">
                          {!formData.selectedParticipants[0] && (
                            <span className="absolute left-2 top-3 text-[#EE4266] text-sm pointer-events-none z-10">*</span>
                          )}
                          <button
                            onClick={() => !loading && formData.selectedParticipants.length < 2 && toggleDropdown('participants1')}
                            disabled={loading || (formData.selectedParticipants.length >= 2 && !formData.selectedParticipants[0])}
                            className={`relative w-full py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                              formData.selectedParticipants[0] ? 'px-3 py-2' : 'pl-6'
                            }`}
                            style={{ minHeight: '42px' }}
                          >
                            {!formData.selectedParticipants[0] ? (
                              <span className="text-gray-500">
                                Email/nama Klien 1
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 py-1">
                                <div className="px-2.5 py-1 bg-[#eeeeee] rounded-[5px] flex items-center gap-2 max-w-full">
                                  <div className="text-[#535353] text-sm font-normal truncate">
                                    {formData.selectedParticipants[0].fullName}
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeParticipant(formData.selectedParticipants[0].id); }}
                                    disabled={loading}
                                    className="w-4 h-4 flex items-center justify-center text-[#535353] hover:text-gray-700 shrink-0"
                                  >
                                    <span className="material-icons text-xs">close</span>
                                  </button>
                                </div>
                              </div>
                            )}
                            <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-sm">keyboard_arrow_down</span>
                          </button>
                          {dropdowns.participants1 && !loading && (formData.selectedParticipants.length < 2 || !formData.selectedParticipants[0]) && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                              <div className="p-2 border-b">
                                <input
                                  type="text"
                                  placeholder="Cari nama atau email..."
                                  value={participantSearch}
                                  onChange={(e) => setParticipantSearch(e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#488BBA]"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              {loadingParticipants ? (
                                <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                              ) : participants.length > 0 ? (
                                participants
                                  .filter(p => !formData.selectedParticipants.find(sp => sp.id === p.id))
                                  .map((participant) => (
                                    <button
                                      key={participant.id}
                                      onClick={() => handleParticipantSelect(participant, 0)}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-100"
                                    >
                                      <div className="font-medium text-sm truncate">{participant.fullName}</div>
                                      <div className="text-xs text-gray-500 truncate">{participant.email}</div>
                                    </button>
                                  ))
                              ) : (
                                <div className="p-3 text-center text-gray-500 text-sm">
                                  {participantSearch ? 'Tidak ada hasil pencarian' : 'Tidak ada partisipan ditemukan'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Participant 2 Field (Optional) */}
                      <div>
                        <div className="relative">
                          <button
                            onClick={() => !loading && formData.selectedParticipants.length < 2 && toggleDropdown('participants2')}
                            disabled={loading || (formData.selectedParticipants.length >= 2 && !formData.selectedParticipants[1])}
                            className={`relative w-full py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                              formData.selectedParticipants[1] ? 'px-3 py-2' : 'pl-6'
                            }`}
                            style={{ minHeight: '42px' }}
                          >
                            {!formData.selectedParticipants[1] ? (
                              <span className="text-gray-500">
                                Email/nama Klien 2 (Opsional)
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 py-1">
                                <div className="px-2.5 py-1 bg-[#eeeeee] rounded-[5px] flex items-center gap-2 max-w-full">
                                  <div className="text-[#535353] text-sm font-normal truncate">
                                    {formData.selectedParticipants[1].fullName}
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeParticipant(formData.selectedParticipants[1].id); }}
                                    disabled={loading}
                                    className="w-4 h-4 flex items-center justify-center text-[#535353] hover:text-gray-700 shrink-0"
                                  >
                                    <span className="material-icons text-xs">close</span>
                                  </button>
                                </div>
                              </div>
                            )}
                            <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-sm">keyboard_arrow_down</span>
                          </button>
                          {dropdowns.participants2 && !loading && (formData.selectedParticipants.length < 2 || !formData.selectedParticipants[1]) && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                              <div className="p-2 border-b">
                                <input
                                  type="text"
                                  placeholder="Cari nama atau email..."
                                  value={participantSearch}
                                  onChange={(e) => setParticipantSearch(e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#488BBA]"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              {loadingParticipants ? (
                                <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                              ) : participants.length > 0 ? (
                                participants
                                  .filter(p => !formData.selectedParticipants.find(sp => sp.id === p.id))
                                  .map((participant) => (
                                    <button
                                      key={participant.id}
                                      onClick={() => handleParticipantSelect(participant, 1)}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-100"
                                    >
                                      <div className="font-medium text-sm truncate">{participant.fullName}</div>
                                      <div className="text-xs text-gray-500 truncate">{participant.email}</div>
                                    </button>
                                  ))
                              ) : (
                                <div className="p-3 text-center text-gray-500 text-sm">
                                  {participantSearch ? 'Tidak ada hasil pencarian' : 'Tidak ada partisipan ditemukan'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location for Counseling - FIXED: Always show standard options */}
                <div className="flex gap-4 items-center">
                  <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
                  <select
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                  >
                    <option value="">Pilih Lokasi</option>
                    {getAvailableLocations().map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Custom Location - for non-counseling - FIXED: Only for non-counseling */}
            {!showParticipants && (
              <div className="flex gap-4 items-center">
                <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
                <textarea
                  value={formData.customLocation}
                  onChange={(e) => handleInputChange('customLocation', e.target.value)}
                  placeholder="Masukkan lokasi"
                  disabled={loading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 resize-none min-h-[42px]"
                  rows="2"
                />
              </div>
            )}

            {/* Description & Attachments */}
            <div className="flex gap-4 items-start">
              <span className="material-icons text-[#488BBA] text-[25px] mt-1">description</span>
              <div className="flex-1">
                <div className="border border-gray-300 rounded-md min-h-[100px] p-3">
                  <div
                    ref={editorRef}
                    contentEditable={!loading}
                    onInput={() => {
                      if (editorRef.current) {
                        const content = editorRef.current.innerHTML;
                        // FIXED: Check character limit for description (255 chars for HTML content)
                        if (content.length <= 255) {
                          handleInputChange('description', content);
                        } else {
                          // Truncate content if it exceeds limit
                          const truncated = content.substring(0, 255);
                          editorRef.current.innerHTML = truncated;
                          handleInputChange('description', truncated);
                        }
                      }
                    }}
                    className="outline-none resize-none min-h-[60px] focus:ring-2 focus:ring-[#488BBA] rounded p-1"
                    style={{ wordBreak: 'break-word' }}
                    suppressContentEditableWarning={true}
                    data-placeholder="Masukkan deskripsi"
                  />
                  
                  {/* FIXED: Enhanced Attachment Preview */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="relative group">
                          <button
                            onClick={() => openAttachmentPreview(attachment)}
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs transition-colors"
                            title="Click to preview"
                          >
                            <span className="material-icons text-xs">
                              {attachment.type === 'image' ? 'image' : 'description'}
                            </span>
                            <span className="max-w-20 truncate">{attachment.name}</span>
                          </button>
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove attachment"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                      onChange={(e) => handleFileSelect(e, 'document')}
                      className="hidden"
                      disabled={loading}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="flex items-center justify-center hover:text-[#488BBA] transition-colors"
                      title="Upload Files"
                    >
                      <span className="material-icons text-gray-400" style={{ fontSize: '18px' }}>attach_file</span>
                    </button>
                    
                    <input
                      ref={photoInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'image')}
                      className="hidden"
                      disabled={loading}
                    />
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={loading}
                      className="flex items-center justify-center hover:text-[#488BBA] transition-colors"
                      title="Upload Photos"
                    >
                      <span className="material-icons text-gray-400" style={{ fontSize: '18px' }}>add_photo_alternate</span>
                    </button>
                    
                    {uploadingAttachments && (
                      <span className="text-xs text-blue-500">Uploading...</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="text-xs text-gray-600">
                    <span className="text-[#EE4266]">*</span> Wajib diisi
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-6 py-2 text-[#488BBA] border border-[#488BBA] rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !formData.agenda || (showParticipants && (!formData.selectedPsychologist || formData.selectedParticipants.length === 0))}
                      className="px-6 py-2 bg-[#488BBA] text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                    >
                      {loading ? 'Menyimpan...' : (mode === "edit" ? 'Update' : 'Tambah')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#488BBA]"></div>
                <span className="text-[#488BBA] font-medium">Menyimpan...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        attachment={previewAttachment}
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </>
  );
};

export default AddScheduleModal;