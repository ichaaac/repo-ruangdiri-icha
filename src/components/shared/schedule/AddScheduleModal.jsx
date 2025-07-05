import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";

const AddScheduleModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  loading = false,
  mode = "create"
}) => {
  const [formData, setFormData] = useState({
    agenda: "",
    type: "counseling",
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "10:00",
    timezone: "Asia/Jakarta",
    notificationOffset: 60,
    multipleDate: false,
    additionalDates: [],
    selectedPsychologist: null,
    selectedParticipants: [],
    location: "",
    customLocation: "",
    description: ""
  });

  const [dropdowns, setDropdowns] = useState({
    type: false,
    startTime: false,
    endTime: false,
    timezone: false,
    notification: false,
    location: false,
    psychologist: false,
    participants: false
  });

  const [psychologistSearch, setPsychologistSearch] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [attachments, setAttachments] = useState([]);
  
  // API Data States
  const [psychologists, setPsychologists] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingPsychologists, setLoadingPsychologists] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantsPage, setParticipantsPage] = useState(1);
  const [hasMoreParticipants, setHasMoreParticipants] = useState(true);

  // Refs
  const editorRef = useRef(null);
  const participantScrollRef = useRef(null);

  // Event types with correct colors
  const eventTypes = [
    { label: "Konseling", value: "counseling", color: "#9986FF" },
    { label: "Kelas", value: "class", color: "#3CE69E" },
    { label: "Seminar", value: "seminar", color: "#FF886D" },
    { label: "Lainnya", value: "other", color: "#979797" }
  ];

  const notificationOptions = [
    { label: "1 jam", value: 60 },
    { label: "12 jam", value: 720 },
    { label: "1 hari", value: 1440 },
    { label: "3 hari", value: 4320 }
  ];

  const timezoneOptions = [
    { label: "WIB", value: "Asia/Jakarta" },
    { label: "WITA", value: "Asia/Makassar" },
    { label: "WIT", value: "Asia/Jayapura" }
  ];

  const fixedLocationOptions = [
    { label: "Online", value: "online" },
    { label: "Offline", value: "offline" },
    { label: "Organisasi", value: "organization" }
  ];

  // Generate time options with 5-minute intervals (6 AM - 9:55 PM)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        times.push(`${hourStr}:${minuteStr}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Load psychologist locations
  useEffect(() => {
    if (isOpen && formData.type === "counseling") {
      loadPsychologistLocations();
    }
  }, [isOpen, formData.type]);

  // Initialize form data
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      let formValues = {
        agenda: "",
        type: "counseling",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        timezone: "Asia/Jakarta",
        notificationOffset: 60,
        multipleDate: false,
        additionalDates: [],
        selectedPsychologist: null,
        selectedParticipants: [],
        location: "",
        customLocation: "",
        description: ""
      };

      if (mode === "edit") {
        formValues.agenda = initialData.agenda || "";
        formValues.type = initialData.type || "counseling";
        formValues.timezone = initialData.timezone || "Asia/Jakarta";
        formValues.notificationOffset = initialData.notificationOffset || 60;
        formValues.description = initialData.description || "";
        formValues.customLocation = initialData.customLocation || "";
        formValues.location = initialData.location || "";

        // Handle dates and times
        if (initialData.dates && initialData.dates.length > 0) {
          const firstDate = initialData.dates[0];
          formValues.date = firstDate.date;
          formValues.startTime = firstDate.startTime;
          formValues.endTime = firstDate.endTime;
          formValues.timezone = firstDate.timezone || formValues.timezone;
          
          if (initialData.dates.length > 1) {
            formValues.multipleDate = true;
            formValues.additionalDates = initialData.dates.slice(1);
          }
        }
      } else {
        // Create mode - extract from drag selection
        if (initialData.startDateTime) {
          const startDate = new Date(initialData.startDateTime);
          formValues.startTime = startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          formValues.date = startDate.toISOString().split('T')[0];
        }

        if (initialData.endDateTime) {
          const endDate = new Date(initialData.endDateTime);
          formValues.endTime = endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }

        if (initialData.dates && initialData.dates.length > 0) {
          formValues.date = initialData.dates[0].date;
          formValues.startTime = initialData.dates[0].startTime;
          formValues.endTime = initialData.dates[0].endTime;
          formValues.timezone = initialData.dates[0].timezone || formValues.timezone;
          
          if (initialData.dates.length > 1) {
            formValues.multipleDate = true;
            formValues.additionalDates = initialData.dates.slice(1);
          }
        }
      }

      setFormData(formValues);
    } else {
      setFormData({
        agenda: "",
        type: "counseling",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        timezone: "Asia/Jakarta",
        notificationOffset: 60,
        multipleDate: false,
        additionalDates: [],
        selectedPsychologist: null,
        selectedParticipants: [],
        location: "",
        customLocation: "",
        description: ""
      });
    }
    
    setHasChanges(false);
    setValidationErrors({});
    setPsychologistSearch("");
    setParticipantSearch("");
    setAttachments([]);
    
    // Reset all dropdowns
    setDropdowns({
      type: false,
      startTime: false,
      endTime: false,
      timezone: false,
      notification: false,
      location: false,
      psychologist: false,
      participants: false
    });
  }, [initialData, isOpen, mode]);

  // WYSIWYG editor implementation
  useEffect(() => {
    if (isOpen && editorRef.current) {
      editorRef.current.innerHTML = formData.description;
    }
  }, [isOpen, formData.description]);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setDropdowns({
          type: false,
          startTime: false,
          endTime: false,
          timezone: false,
          notification: false,
          location: false,
          psychologist: false,
          participants: false
        });
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // API Functions
  const loadPsychologistLocations = async () => {
    try {
      const response = await apiClient.get('/psychologists/locations');
      setLocations(response.data || []);
    } catch (error) {
      console.error('Failed to load psychologist locations:', error);
    }
  };

  const loadPsychologists = async (location = null) => {
    setLoadingPsychologists(true);
    try {
      const params = location ? { location } : {};
      const response = await apiClient.get('/psychologists', { params });
      
      if (response.data?.status === 'success') {
        setPsychologists(response.data.data || []);
      } else {
        setPsychologists(response.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to load psychologists:', error);
      setPsychologists([]);
    }
    setLoadingPsychologists(false);
  };

  const loadParticipants = async (page = 1, search = "") => {
    setLoadingParticipants(true);
    try {
      const params = {
        limit: 20,
        page,
        ...(search && { search })
      };
      
      const response = await apiClient.get('/users', { params });
      
      if (response.data?.status === 'success') {
        const newParticipants = response.data.data || [];
        setParticipants(prev => page === 1 ? newParticipants : [...prev, ...newParticipants]);
        setHasMoreParticipants(response.data.metadata?.hasNextPage || false);
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
    setLoadingParticipants(false);
  };

  // Event Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }

    // Auto-adjust end time if start time changes
    if (field === 'startTime') {
      const startTimeIndex = timeOptions.indexOf(value);
      const endTimeIndex = timeOptions.indexOf(formData.endTime);
      
      if (startTimeIndex >= endTimeIndex) {
        const newEndTimeIndex = Math.min(startTimeIndex + 1, timeOptions.length - 1);
        setFormData(prev => ({ ...prev, [field]: value, endTime: timeOptions[newEndTimeIndex] }));
      }
    }

    // Handle location selection for psychologists
    if (field === 'location' && formData.type === "counseling") {
      loadPsychologists(value);
    }
  };

  const toggleDropdown = (dropdown) => {
    setDropdowns(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [dropdown]: !prev[dropdown]
    }));

    // Load data when dropdown opens
    if (!dropdowns[dropdown]) {
      if (dropdown === 'psychologist' && formData.type === "counseling") {
        loadPsychologists(formData.location || null);
      } else if (dropdown === 'participants' && formData.type === "counseling") {
        setParticipantsPage(1);
        loadParticipants(1, participantSearch);
      }
    }
  };

  const selectOption = (dropdown, value) => {
    handleInputChange(dropdown, value);
    setDropdowns(prev => ({ ...prev, [dropdown]: false }));
  };

  const handlePsychologistSelect = (psychologist) => {
    setFormData(prev => ({ ...prev, selectedPsychologist: psychologist }));
    setDropdowns(prev => ({ ...prev, psychologist: false }));
    setHasChanges(true);
  };

  const handleParticipantSelect = (participant) => {
    if (!formData.selectedParticipants.find(p => p.id === participant.id)) {
      setFormData(prev => ({
        ...prev,
        selectedParticipants: [...prev.selectedParticipants, participant]
      }));
      setHasChanges(true);
    }
    setDropdowns(prev => ({ ...prev, participants: false }));
  };

  const removeParticipant = (participantId) => {
    setFormData(prev => ({
      ...prev,
      selectedParticipants: prev.selectedParticipants.filter(p => p.id !== participantId)
    }));
    setHasChanges(true);
  };

  const handleParticipantScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop === clientHeight && hasMoreParticipants && !loadingParticipants) {
      const nextPage = participantsPage + 1;
      setParticipantsPage(nextPage);
      loadParticipants(nextPage, participantSearch);
    }
  };

  const addDateSlot = () => {
    const newSlot = {
      date: new Date().toISOString().split('T')[0],
      startTime: formData.startTime,
      endTime: formData.endTime,
      timezone: formData.timezone
    };
    handleInputChange('additionalDates', [...formData.additionalDates, newSlot]);
  };

  const removeDateSlot = (index) => {
    const newDates = formData.additionalDates.filter((_, i) => i !== index);
    handleInputChange('additionalDates', newDates);
    
    if (newDates.length === 0) {
      handleInputChange('multipleDate', false);
    }
  };

  const updateAdditionalDate = (index, field, value) => {
    const newDates = [...formData.additionalDates];
    newDates[index] = { ...newDates[index], [field]: value };
    
    if (field === 'startTime') {
      const startTimeIndex = timeOptions.indexOf(value);
      const endTimeIndex = timeOptions.indexOf(newDates[index].endTime);
      
      if (startTimeIndex >= endTimeIndex) {
        const newEndTimeIndex = Math.min(startTimeIndex + 1, timeOptions.length - 1);
        newDates[index].endTime = timeOptions[newEndTimeIndex];
      }
    }
    
    handleInputChange('additionalDates', newDates);
  };

  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      file,
      type,
      id: Date.now() + Math.random()
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    setHasChanges(true);
    e.target.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    setHasChanges(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.agenda.trim()) {
      errors.agenda = "Agenda wajib diisi";
    }
    
    if (formData.type === "counseling") {
      if (!formData.selectedPsychologist) {
        errors.psychologist = "Psikolog wajib dipilih untuk konseling";
      }
      if (formData.selectedParticipants.length === 0) {
        errors.participants = "Minimal satu partisipan harus ditambahkan untuk konseling";
      }
    }
    
    const startTimeIndex = timeOptions.indexOf(formData.startTime);
    const endTimeIndex = timeOptions.indexOf(formData.endTime);
    
    if (startTimeIndex >= endTimeIndex) {
      errors.time = "Waktu selesai harus lebih besar dari waktu mulai";
    }

    if (formData.multipleDate) {
      formData.additionalDates.forEach((dateSlot, index) => {
        const startIdx = timeOptions.indexOf(dateSlot.startTime);
        const endIdx = timeOptions.indexOf(dateSlot.endTime);
        
        if (startIdx >= endIdx) {
          errors[`additionalTime_${index}`] = "Waktu selesai harus lebih besar dari waktu mulai";
        }
      });
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadAttachments = async (scheduleId) => {
    if (attachments.length === 0) return;

    try {
      const formData = new FormData();
      attachments.forEach(attachment => {
        formData.append('files', attachment.file);
      });

      await apiClient.post(`/schedules/${scheduleId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Failed to upload attachments:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const dates = [{
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      timezone: formData.timezone
    }];

    if (formData.multipleDate) {
      dates.push(...formData.additionalDates);
    }

    const userIds = [];
    if (formData.type === "counseling") {
      if (formData.selectedPsychologist) {
        userIds.push(formData.selectedPsychologist.id);
      }
      userIds.push(...formData.selectedParticipants.map(p => p.id));
    }

    const submitData = {
      agenda: formData.agenda,
      type: formData.type,
      description: formData.description,
      notificationOffset: formData.notificationOffset,
      userIds,
      dates,
      ...(formData.type === "counseling" 
        ? { location: formData.location }
        : { 
            location: "organization", // Default for non-counseling
            customLocation: formData.customLocation 
          }
      )
    };

    if (mode === "edit" && initialData?.id) {
      submitData.id = initialData.id;
    }
    
    try {
      const result = await onSubmit(submitData);
      
      // Upload attachments if schedule was created successfully
      if (result?.data?.id && attachments.length > 0) {
        await uploadAttachments(result.data.id);
      }
      
    } catch (error) {
      console.error('Error submitting schedule:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('Ada perubahan yang belum disimpan. Yakin ingin membatalkan?')) {
        onClose();
        setHasChanges(false);
      }
    } else {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const getSelectedEventType = () => {
    return eventTypes.find(type => type.value === formData.type) || eventTypes[0];
  };

  const getTimezoneLabel = (timezone = formData.timezone) => {
    return timezoneOptions.find(tz => tz.value === timezone)?.label || "WIB";
  };

  const getNotificationLabel = () => {
    return notificationOptions.find(opt => opt.value === formData.notificationOffset)?.label || "1 jam";
  };

  if (!isOpen) return null;

  const showParticipants = formData.type === "counseling";
  const modalTitle = mode === "edit" ? "Edit Jadwal" : "Tambah Jadwal";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={handleOverlayClick}
    >
      <div className="flex flex-col justify-center items-center p-6 bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center w-full max-w-[550px] mb-4">
          <h2 className="text-xl font-semibold text-[#488BBA]">{modalTitle}</h2>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <span className="material-icons text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col items-center w-full max-w-[550px]">
          
          {/* Agenda Input */}
          <div className="flex gap-4 items-center w-full mb-4">
            <div className="flex gap-2.5 items-center py-1.5 w-[25px]">
              <span className="material-icons text-[#488BBA] text-[25px] font-bold">list_alt</span>
            </div>
            <div className="flex-1 relative">
              <span className="absolute left-2.5 top-3 text-base font-semibold text-red-500 pointer-events-none z-10">*</span>
              <input
                type="text"
                value={formData.agenda}
                onChange={(e) => handleInputChange('agenda', e.target.value)}
                placeholder="Masukkan agenda"
                disabled={loading}
                className={`w-full pl-6 pr-2.5 py-3 text-base font-semibold rounded-md border border-gray-300 min-h-[35px] text-[#535353] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                  validationErrors.agenda ? 'border-red-500' : ''
                }`}
              />
            </div>

            {/* Event Type Dropdown with Colors */}
            <div className="relative dropdown-container">
              <button
                onClick={() => !loading && toggleDropdown('type')}
                disabled={loading}
                className="flex items-center px-2.5 py-3 text-sm whitespace-nowrap rounded-md border border-gray-300 min-h-[35px] w-[113px] focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                style={{ 
                  backgroundColor: getSelectedEventType().color,
                  color: 'white',
                  border: `1px solid ${getSelectedEventType().color}`
                }}
              >
                <div className="flex gap-1.5 justify-center items-center w-full">
                  <span>{getSelectedEventType().label}</span>
                  <span className="material-icons text-xs font-bold">keyboard_arrow_down</span>
                </div>
              </button>
              {dropdowns.type && !loading && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                  {eventTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => selectOption('type', type.value)}
                      className="w-full px-2.5 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-[#535353]">{type.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {validationErrors.agenda && (
            <p className="text-red-500 text-xs mt-1 w-full ml-8">{validationErrors.agenda}</p>
          )}

          {/* Date and Time Section */}
          <div className="flex gap-4 items-start w-full mb-4">
            <div className="flex gap-2.5 items-center py-1.5 w-[25px]">
              <span className="material-icons text-[#488BBA] text-[25px] font-bold">schedule</span>
            </div>
            <div className="flex-1">
              <div className="flex gap-2.5 items-center flex-wrap">
                {/* Date Input */}
                <div className="flex flex-col justify-center py-2.5 px-2.5 whitespace-nowrap rounded-md border border-gray-300 min-h-9 w-[127px]">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    disabled={loading}
                    className="w-full bg-transparent outline-none text-[#535353] focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                  />
                </div>

                {/* Time Inputs */}
                <div className="flex gap-1.5 items-center">
                  {/* Start Time */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => !loading && toggleDropdown('startTime')}
                      disabled={loading}
                      className="flex justify-center items-center py-2.5 px-2.5 rounded-md border border-gray-300 min-h-9 w-[85px] text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                    >
                      <span className="text-sm">{formData.startTime}</span>
                      <span className="material-icons text-xs ml-1 font-bold">keyboard_arrow_down</span>
                    </button>
                    {dropdowns.startTime && !loading && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                        {timeOptions.map((time) => (
                          <button
                            key={time}
                            onClick={() => selectOption('startTime', time)}
                            className="w-full px-2.5 py-1 text-left hover:bg-gray-100 text-sm text-[#535353]"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-base text-[#488BBA]">-</span>

                  {/* End Time */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => !loading && toggleDropdown('endTime')}
                      disabled={loading}
                      className="flex justify-center items-center py-2.5 px-2.5 rounded-md border border-gray-300 min-h-9 w-[85px] text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                    >
                      <span className="text-sm">{formData.endTime}</span>
                      <span className="material-icons text-xs ml-1 font-bold">keyboard_arrow_down</span>
                    </button>
                    {dropdowns.endTime && !loading && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                        {timeOptions.map((time) => (
                          <button
                            key={time}
                            onClick={() => selectOption('endTime', time)}
                            className="w-full px-2.5 py-1 text-left hover:bg-gray-100 text-sm text-[#535353]"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timezone */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => !loading && toggleDropdown('timezone')}
                      disabled={loading}
                      className="flex justify-center items-center px-2.5 py-2.5 whitespace-nowrap rounded-md border border-gray-300 min-h-9 w-[66px] text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                    >
                      <span className="text-sm">{getTimezoneLabel()}</span>
                      <span className="material-icons text-xs ml-1 font-bold">keyboard_arrow_down</span>
                    </button>
                    {dropdowns.timezone && !loading && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                        {timezoneOptions.map((tz) => (
                          <button
                            key={tz.value}
                            onClick={() => selectOption('timezone', tz.value)}
                            className="w-full px-2.5 py-1 text-left hover:bg-gray-100 text-sm text-[#535353]"
                          >
                            {tz.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {validationErrors.time && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.time}</p>
              )}

              {/* Multiple Date Toggle */}
              <div className="flex gap-2.5 items-center mt-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => !loading && handleInputChange('multipleDate', !formData.multipleDate)}
                  disabled={loading}
                  className={`flex shrink-0 w-3.5 h-3.5 border rounded-sm transition-colors disabled:opacity-50 ${
                    formData.multipleDate
                      ? 'bg-[#535353] border-[#000000]'
                      : 'border-gray-400 hover:border-gray-600'
                  }`}
                >
                  {formData.multipleDate && (
                    <span className="material-icons text-white text-xs leading-none">check</span>
                  )}
                </button>
                <span 
                  className={`text-[#535353] cursor-pointer ${loading ? 'opacity-50' : ''}`}
                  onClick={() => !loading && handleInputChange('multipleDate', !formData.multipleDate)}
                >
                  Multiple Date
                </span>
              </div>

              {/* Additional Date Fields - Aligned properly */}
              {formData.multipleDate && (
                <div className="mt-4 space-y-3">
                  {formData.additionalDates.map((dateSlot, index) => (
                    <div key={index} className="flex gap-2.5 items-center">
                      {/* Date */}
                      <div className="flex flex-col justify-center py-2.5 px-2.5 whitespace-nowrap rounded-md border border-gray-300 min-h-9 w-[127px]">
                        <input
                          type="date"
                          value={dateSlot.date}
                          onChange={(e) => updateAdditionalDate(index, 'date', e.target.value)}
                          disabled={loading}
                          className="w-full bg-transparent outline-none text-[#535353] focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                        />
                      </div>

                      {/* Start Time */}
                      <select
                        value={dateSlot.startTime}
                        onChange={(e) => updateAdditionalDate(index, 'startTime', e.target.value)}
                        disabled={loading}
                        className="py-2.5 px-2.5 rounded-md border border-gray-300 min-h-9 w-[85px] text-[#535353] focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>

                      <span className="text-base text-[#488BBA]">-</span>

                      {/* End Time */}
                      <select
                        value={dateSlot.endTime}
                        onChange={(e) => updateAdditionalDate(index, 'endTime', e.target.value)}
                        disabled={loading}
                        className="py-2.5 px-2.5 rounded-md border border-gray-300 min-h-9 w-[85px] text-[#535353] focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>

                      {/* Timezone */}
                      <select
                        value={dateSlot.timezone}
                        onChange={(e) => updateAdditionalDate(index, 'timezone', e.target.value)}
                        disabled={loading}
                        className="py-2.5 px-2.5 rounded-md border border-gray-300 min-h-9 w-[66px] text-[#535353] focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                      >
                        {timezoneOptions.map((tz) => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeDateSlot(index)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                      >
                        <span className="material-icons text-sm">close</span>
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={addDateSlot}
                    disabled={loading}
                    className="text-[#488BBA] hover:text-blue-700 text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <span className="material-icons text-sm font-bold">add</span>
                    Tambah tanggal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notification Section */}
          <div className="flex gap-4 items-center w-full mb-4">
            <div className="flex gap-2.5 items-center py-1.5 w-[25px]">
              <span className="material-icons text-[#488BBA] text-[25px] font-bold">notifications_active</span>
            </div>
            <div className="relative dropdown-container">
              <button
                onClick={() => !loading && toggleDropdown('notification')}
                disabled={loading}
                className="flex gap-1.5 items-center rounded border border-gray-300 px-2.5 py-2 min-h-[30px] text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
              >
                <span>{getNotificationLabel()}</span>
                <span className="material-icons text-xs font-bold">keyboard_arrow_down</span>
              </button>
              {dropdowns.notification && !loading && (
                <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[120px]">
                  {notificationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => selectOption('notificationOffset', option.value)}
                      className="w-full px-2.5 py-2 text-left hover:bg-gray-100 text-[#535353]"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Participants Section - Only for Counseling */}
          {showParticipants && (
            <div className="w-full mb-4">
              <div className="flex gap-4 items-start">
                <span className="material-icons text-[#488BBA] text-[25px] mt-1.5 font-bold">person</span>
                <div className="flex-1 space-y-4">
                  
                  {/* Psychologist Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Psikolog
                    </label>
                    <div className="flex gap-2">
                      {/* Location Dropdown (for filtering psychologists) */}
                      {locations.length > 0 && (
                        <div className="relative dropdown-container">
                          <select
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            disabled={loading}
                            className="py-2 px-3 rounded-md border border-gray-300 text-[#535353] focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                          >
                            <option value="">Semua Lokasi</option>
                            {locations.map((location) => (
                              <option key={location} value={location}>{location}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Psychologist Dropdown */}
                      <div className="relative dropdown-container flex-1">
                        <button
                          onClick={() => !loading && toggleDropdown('psychologist')}
                          disabled={loading}
                          className={`w-full py-2 px-3 text-left rounded-md border border-gray-300 text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                            validationErrors.psychologist ? 'border-red-500' : ''
                          }`}
                        >
                          {formData.selectedPsychologist 
                            ? formData.selectedPsychologist.fullName 
                            : "Pilih Psikolog"}
                          <span className="material-icons float-right text-xs font-bold mt-1">keyboard_arrow_down</span>
                        </button>
                        {dropdowns.psychologist && !loading && (
                          <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                            {loadingPsychologists ? (
                              <div className="p-2 text-center text-gray-500">Loading...</div>
                            ) : psychologists.length > 0 ? (
                              psychologists.map((psychologist) => (
                                <button
                                  key={psychologist.id}
                                  onClick={() => handlePsychologistSelect(psychologist)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 text-[#535353]"
                                >
                                  <div className="font-medium">{psychologist.fullName}</div>
                                  <div className="text-xs text-gray-500">{psychologist.email}</div>
                                  {psychologist.location && (
                                    <div className="text-xs text-gray-400">{psychologist.location}</div>
                                  )}
                                </button>
                              ))
                            ) : (
                              <div className="p-2 text-center text-gray-500">Tidak ada psikolog ditemukan</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {validationErrors.psychologist && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.psychologist}</p>
                    )}
                  </div>

                  {/* Participants Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Partisipan
                    </label>
                    
                    {/* Selected Participants */}
                    {formData.selectedParticipants.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.selectedParticipants.map((participant) => (
                          <div key={participant.id} className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded text-xs">
                            <span className="text-[#535353]">{participant.fullName}</span>
                            <button
                              onClick={() => removeParticipant(participant.id)}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-800 font-bold disabled:opacity-50"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Participant Dropdown */}
                    <div className="relative dropdown-container">
                      <button
                        onClick={() => !loading && toggleDropdown('participants')}
                        disabled={loading}
                        className={`w-full py-2 px-3 text-left rounded-md border border-gray-300 text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                          validationErrors.participants ? 'border-red-500' : ''
                        }`}
                      >
                        Tambah Partisipan
                        <span className="material-icons float-right text-xs font-bold mt-1">keyboard_arrow_down</span>
                      </button>
                      {dropdowns.participants && !loading && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                          {/* Search Input */}
                          <div className="p-2 border-b">
                            <input
                              type="text"
                              value={participantSearch}
                              onChange={(e) => {
                                setParticipantSearch(e.target.value);
                                setParticipantsPage(1);
                                loadParticipants(1, e.target.value);
                              }}
                              placeholder="Cari partisipan..."
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#488BBA]"
                            />
                          </div>
                          
                          {/* Participants List */}
                          <div 
                            ref={participantScrollRef}
                            className="max-h-40 overflow-y-auto"
                            onScroll={handleParticipantScroll}
                          >
                            {loadingParticipants && participantsPage === 1 ? (
                              <div className="p-2 text-center text-gray-500">Loading...</div>
                            ) : participants.length > 0 ? (
                              <>
                                {participants.map((participant) => (
                                  <button
                                    key={participant.id}
                                    onClick={() => handleParticipantSelect(participant)}
                                    disabled={formData.selectedParticipants.find(p => p.id === participant.id)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-[#535353] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <div className="font-medium">{participant.fullName}</div>
                                    <div className="text-xs text-gray-500">{participant.email}</div>
                                  </button>
                                ))}
                                {loadingParticipants && participantsPage > 1 && (
                                  <div className="p-2 text-center text-gray-500">Loading more...</div>
                                )}
                              </>
                            ) : (
                              <div className="p-2 text-center text-gray-500">Tidak ada partisipan ditemukan</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {validationErrors.participants && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.participants}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Section */}
          <div className="flex gap-4 items-start w-full mb-4">
            <span className="material-icons text-[#488BBA] text-[25px] mt-1.5 font-bold">location_on</span>
            <div className="flex-1">
              {formData.type === "counseling" ? (
                <div className="relative dropdown-container">
                  <button
                    onClick={() => !loading && toggleDropdown('location')}
                    disabled={loading}
                    className="flex items-center justify-between py-2.5 px-2.5 w-full rounded-md border border-gray-300 min-h-[35px] text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                  >
                    <span className="text-sm">{formData.location || "Pilih Lokasi"}</span>
                    <span className="material-icons text-xs font-bold">keyboard_arrow_down</span>
                  </button>
                  {dropdowns.location && !loading && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                      {fixedLocationOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleInputChange('location', option.value);
                            setDropdowns(prev => ({ ...prev, location: false }));
                          }}
                          className="w-full px-2.5 py-2 text-left hover:bg-gray-100 text-[#535353]"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={formData.customLocation}
                  onChange={(e) => handleInputChange('customLocation', e.target.value)}
                  placeholder="Masukkan lokasi"
                  disabled={loading}
                  className="w-full py-2.5 px-2.5 rounded-md border border-gray-300 min-h-[35px] text-[#535353] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                />
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="flex gap-4 items-start w-full mb-4">
            <span className="material-icons text-[#488BBA] text-[25px] mt-1.5 font-bold">description</span>
            <div className="flex-1">
              <div className="relative flex flex-col py-2.5 px-2 w-full rounded-md border border-gray-300 min-h-32">
                {/* Editable content area */}
                <div
                  ref={editorRef}
                  contentEditable={!loading}
                  onInput={() => {
                    if (editorRef.current) {
                      handleInputChange('description', editorRef.current.innerHTML);
                    }
                  }}
                  className={`flex-1 w-full bg-transparent outline-none resize-none text-[#535353] min-h-[60px] focus:ring-2 focus:ring-[#488BBA] rounded p-1 ${loading ? 'opacity-50' : ''}`}
                  style={{ wordBreak: 'break-word' }}
                  suppressContentEditableWarning={true}
                  data-placeholder="Masukkan deskripsi"
                />
                
                {/* Attachments Display */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                        <span className="material-icons text-xs">
                          {attachment.type === 'image' ? 'image' : 'description'}
                        </span>
                        <span className="max-w-20 truncate">{attachment.file.name}</span>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* File Upload Controls */}
                <div className="flex gap-2 items-center mt-2">
                  <label className="flex items-center justify-center hover:text-[#488BBA] transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'image')}
                      className="hidden"
                      disabled={loading}
                    />
                    <span className="material-icons text-gray-400 font-bold" style={{ fontSize: '18px' }}>add_photo_alternate</span>
                  </label>
                  <label className="flex items-center justify-center hover:text-[#488BBA] transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => handleFileSelect(e, 'document')}
                      className="hidden"
                      disabled={loading}
                    />
                    <span className="material-icons text-gray-400 font-bold" style={{ fontSize: '18px' }}>attach_file</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Required Field Notice */}
          <div className="flex items-center w-full mb-4 text-xs">
            <span className="text-red-500">*</span>
            <span className="text-gray-600 ml-1"> Wajib diisi</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 items-center w-full text-base font-semibold leading-5">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-7 py-2.5 text-[#488BBA] rounded-md border border-[#488BBA] min-h-8 w-[114px] hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.agenda || (showParticipants && (!formData.selectedPsychologist || formData.selectedParticipants.length === 0))}
              className="px-7 py-2.5 bg-[#488BBA] rounded-md min-h-8 text-white w-[114px] hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : (mode === "edit" ? 'Update' : 'Tambah')}
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#488abe]"></div>
              <span className="text-[#488abe] font-medium">Menyimpan...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddScheduleModal;