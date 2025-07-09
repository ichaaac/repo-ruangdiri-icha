// src/components/shared/schedule/AddScheduleModal.jsx - FIXED VERSION

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { 
  getTimezoneDisplay, 
  parseScheduleDateTime, 
  createDateTimeWithOffset 
} from "@/components/shared/schedule/utils/timezoneHandler";

const AddScheduleModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  loading = false,
  mode = "create" // "create" or "edit"
}) => {
  const [formData, setFormData] = useState(() => ({
    agenda: "",
    type: "counseling",
    dates: [{
      date: new Date().toISOString().split('T')[0],
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
  
  const editorRef = useRef(null);
  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // FIXED: Initialize form when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
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
        
        // FIXED: Proper state initialization for edit mode
        const transformedData = {
          agenda: initialData.agenda || "",
          type: initialData.type || "counseling",
          description: initialData.description || "",
          notificationOffset: initialData.notificationOffset || 60,
          dates: dates.length > 0 ? dates : [{
            date: new Date().toISOString().split('T')[0],
            startTime: "09:00",
            endTime: "10:00",
            timezone: "WIB"
          }],
          location: initialData.type === "counseling" ? (initialData.location || "") : "",
          customLocation: initialData.type !== "counseling" ? (initialData.customLocation || initialData.location || "") : "",
          selectedPsychologist: initialData.selectedPsychologist || null,
          selectedParticipants: initialData.selectedParticipants || [],
          multipleDate: dates.length > 1 || initialData.multipleDate || false,
        };
        
        console.log('Setting form data for edit:', transformedData);
        setFormData(transformedData);
        
        // Set description in editor
        if (editorRef.current && transformedData.description) {
          editorRef.current.innerHTML = transformedData.description;
        }
      } else {
        // Reset for create mode
        const defaultDates = initialData?.dates || [{
          date: new Date().toISOString().split('T')[0],
          startTime: "09:00",
          endTime: "10:00",
          timezone: "WIB"
        }];
        
        setFormData({
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
        });
        
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
      }
      
      // Reset other state
      setAttachments([]);
      setDropdowns({});
      setParticipantSearch("");
      setHasShownUnsavedToast(false);
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

  const fixedLocationOptions = [
    { label: "Online", value: "online" },
    { label: "Offline", value: "offline" },
    { label: "Seed-in", value: "organization" }
  ];

  // Generate time options
  const timeOptions = (() => {
    const times = [];
    for (let hour = 6; hour < 22; hour++) {
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
      console.log('Backend locations loaded:', locations);
      return locations;
    },
    enabled: isOpen && formData.type === "counseling" && !formData.selectedPsychologist,
    staleTime: 5 * 60 * 1000
  });

  // Get available locations logic
  const getAvailableLocations = () => {
    if (formData.selectedPsychologist) {
      const baseOptions = [...fixedLocationOptions];
      
      if (formData.location && !fixedLocationOptions.find(opt => opt.value === formData.location)) {
        baseOptions.unshift({ label: formData.location, value: formData.location });
      }
      
      return baseOptions;
    } else {
      return psychologistLocations.map(loc => ({ label: loc, value: loc }));
    }
  };

  // Fetch psychologists with location filtering
  const { data: psychologists = [], isLoading: loadingPsychologists } = useQuery({
    queryKey: ['psychologists', formData.location],
    queryFn: async () => {
      const isBackendLocation = formData.location && 
        !fixedLocationOptions.find(opt => opt.value === formData.location);
      
      const params = isBackendLocation ? { location: formData.location } : {};
      
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

  // FIXED: Upload attachments mutation with new API structure
  const uploadAttachmentsMutation = useMutation({
    mutationFn: async ({ scheduleIds, files }) => {
      const formData = new FormData();
      
      files.forEach(file => formData.append('files', file));
      
      // FIXED: New API structure - scheduleIds as comma-separated string
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
    
    if (field === 'location') {
      const isBackendLocation = !fixedLocationOptions.find(opt => opt.value === value);
      if (isBackendLocation && formData.selectedPsychologist) {
        console.log('Location changed to backend location, resetting psychologist');
        setFormData(prev => ({ ...prev, selectedPsychologist: null }));
      }
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
      
      validFiles.push({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: type
      });
      totalSize += file.size;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
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
    
    // Build payload with new participants structure
    const submitData = {
      agenda: formData.agenda,
      type: formData.type,
      description: formData.description,
      notificationOffset: formData.notificationOffset,
      dates: formData.dates
    };

    // NEW PARTICIPANTS STRUCTURE for counseling
    if (formData.type === "counseling") {
      if (formData.selectedPsychologist && formData.selectedParticipants.length > 0) {
        submitData.participants = {
          psychologistId: formData.selectedPsychologist.id,
          patientId: formData.selectedParticipants[0].id
        };
      }
    }

    // Handle location
    if (formData.type === "counseling") {
      const isBackendLocation = formData.location && 
        !fixedLocationOptions.find(opt => opt.value === formData.location);
      
      if (isBackendLocation) {
        submitData.location = "offline";
        submitData.originalLocationName = formData.location;
        console.log(`Backend location "${formData.location}" selected, sending "offline" as payload`);
      } else {
        submitData.location = formData.location;
        console.log(`Fixed location "${formData.location}" selected, sending as is`);
      }
    } else {
      submitData.customLocation = formData.customLocation;
    }

    if (mode === "edit" && initialData?.id) {
      submitData.id = initialData.id;
    }
    
    console.log('Submitting payload:', submitData);
    
    try {
      const result = await onSubmit(submitData);
      
      // FIXED: Handle attachments with new API structure
      if (result?.data && attachments.length > 0) {
        setUploadingAttachments(true);
        
        try {
          let scheduleIds = [];
          
          // Extract schedule IDs from different response formats
          if (Array.isArray(result.data)) {
            scheduleIds = result.data.map(schedule => schedule.id);
          } else if (result.data.ids && Array.isArray(result.data.ids)) {
            scheduleIds = result.data.ids;
          } else if (result.data.id) {
            scheduleIds = [result.data.id];
          }
          
          console.log('Uploading attachments to schedule IDs:', scheduleIds);
          
          if (scheduleIds.length > 0) {
            // FIXED: Use new API structure with scheduleIds array
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
    }
  };

  const hasUnsavedChanges = () => {
    if (mode !== 'edit' || !initialData) {
      return formData.agenda.trim() !== '' || 
             formData.description.trim() !== '' ||
             formData.selectedParticipants.length > 0 ||
             formData.selectedPsychologist !== null;
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

    return JSON.stringify(current) !== JSON.stringify(initial);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges() && !hasShownUnsavedToast) {
      setHasShownUnsavedToast(true);
      toast("Ada perubahan yang belum disimpan. Yakin ingin membatalkan?", {
        action: {
          label: "Ya, batalkan",
          onClick: () => {
            setHasShownUnsavedToast(false);
            onClose();
          },
          className: "!bg-[#EE4266] hover:!bg-[#d63854] !text-white !border-[#EE4266] hover:!border-[#d63854]"
        },
        cancel: {
          label: "Tetap edit",
          onClick: () => {
            setHasShownUnsavedToast(false);
          },
          className: "!bg-transparent hover:!bg-gray-100 !text-[#EE4266] !border !border-[#EE4266] hover:!border-[#d63854]"
        },
        duration: 10000,
        className: "!bg-white !border !border-gray-200 !shadow-lg",
        onDismiss: () => setHasShownUnsavedToast(false)
      });
    } else if (!hasUnsavedChanges()) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedEventType = eventTypes.find(type => type.value === formData.type) || eventTypes[0];
  const showParticipants = formData.type === "counseling";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div className="bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-end items-center p-6">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <span className="material-icons text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Agenda & Type */}
          <div className="flex gap-4 items-center">
            <span className="material-icons text-[#488BBA] text-[25px]">list_alt</span>
            <div className="flex-1 relative">
              {/* FIXED: Hide mandatory indicator when field has value */}
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

          {/* Date & Time with TIMEZONE DISPLAY */}
          <div className="flex gap-4 items-start">
            <span className="material-icons text-[#488BBA] text-[25px] mt-1">schedule</span>
            <div className="flex-1 space-y-3">
              {formData.dates.map((dateInfo, index) => (
                <div key={index} className="flex gap-2 items-center flex-wrap">
                  <input
                    type="date"
                    value={dateInfo.date}
                    onChange={(e) => {
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

                  <div className="text-xs text-gray-500 px-2">
                    {getTimezoneDisplay(dateInfo.timezone)}
                  </div>

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

              {formData.dates.length > 1 && (
                <div className="flex gap-2 items-center text-sm">
                  <div className="flex shrink-0 w-4 h-4 bg-[#535353] border border-[#535353] rounded-sm">
                    <span className="material-icons text-white text-xs leading-none">check</span>
                  </div>
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

          {/* FIXED: Participants - Only for Counseling with proper styling */}
          {showParticipants && (
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="material-icons text-[#488BBA] text-[25px] mt-1">account_circle</span>
                <div className="flex-1">
                  
                  <div className="flex flex-col gap-4">
                    
                    {/* FIXED: Psychologist Field with improved card styling */}
                    <div>
                      <div className="relative">
                        {/* FIXED: Hide mandatory indicator when psychologist selected */}
                        {!formData.selectedPsychologist && (
                          <span className="absolute left-2 top-3 text-[#EE4266] text-sm pointer-events-none z-10">*</span>
                        )}
                        <button
                          onClick={() => !loading && toggleDropdown('psychologist')}
                          disabled={loading}
                          className={`relative w-full py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                            formData.selectedPsychologist ? 'px-3 py-2' : formData.selectedPsychologist ? 'pl-3' : 'pl-6'
                          }`}
                          style={{ minHeight: '42px' }}
                        >
                          {!formData.selectedPsychologist ? (
                            <span className="text-gray-500">
                              Email/nama Psikolog
                            </span>
                          ) : (
                            /* FIXED: Card styling - proper positioning inside field */
                            <div className="flex items-center gap-2 py-1">
                              <div className="px-2.5 py-1 bg-[#eeeeee] rounded-[5px] flex items-center gap-2 max-w-full">
                                <div className="text-[#535353] text-sm font-normal truncate">
                                  {formData.selectedPsychologist.fullName}
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, selectedPsychologist: null })); }}
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
                                    setFormData(prev => ({ ...prev, selectedPsychologist: psychologist }));
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

                    {/* FIXED: Participant 1 Field with improved card styling */}
                    <div>
                      <div className="relative">
                        {/* FIXED: Hide mandatory indicator when participant 1 selected */}
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
                            /* FIXED: Card styling - proper positioning inside field */
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

                    {/* FIXED: Participant 2 Field (Optional) with improved card styling */}
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
                            /* FIXED: Card styling - proper positioning inside field */
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

              {/* Location for Counseling */}
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

          {/* Custom Location - for non-counseling */}
          {!showParticipants && (
            <div className="flex gap-4 items-center">
              <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
              <input
                type="text"
                value={formData.customLocation}
                onChange={(e) => handleInputChange('customLocation', e.target.value)}
                placeholder="Masukkan lokasi"
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
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
                      handleInputChange('description', editorRef.current.innerHTML);
                    }
                  }}
                  className="outline-none resize-none min-h-[60px] focus:ring-2 focus:ring-[#488BBA] rounded p-1"
                  style={{ wordBreak: 'break-word' }}
                  suppressContentEditableWarning={true}
                  data-placeholder="Masukkan deskripsi"
                />
                
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                        <span className="material-icons text-xs">
                          {attachment.type === 'image' ? 'image' : 'description'}
                        </span>
                        <span className="max-w-20 truncate">{attachment.name}</span>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="text-red-500 hover:text-red-700 ml-1"
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
  );
};

export default AddScheduleModal;