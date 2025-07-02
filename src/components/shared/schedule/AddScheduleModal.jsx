// src/components/shared/schedule/AddScheduleModal.jsx - Enhanced UI & WYSIWYG Editor

import { useState, useEffect, useRef } from "react";

const AddScheduleModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  loading = false 
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
    userEmails: [],
    locations: [],
    description: ""
  });

  const [dropdowns, setDropdowns] = useState({
    type: false,
    startTime: false,
    endTime: false,
    timezone: false,
    notification: false,
    location: false
  });

  const [userInput, setUserInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const editorRef = useRef(null);

  // Event types - removed meeting
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

  // Location options - updated
  const locationOptions = [
    { label: "Online", value: "online" },
    { label: "Offline", value: "offline" },
    { label: "Organisasi", value: "organization" }
  ];

  // Generate time options with 5-minute intervals - SESUAIKAN DENGAN SCHEDULEGRID (6 AM - 9:55 PM)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour < 22; hour++) { // 6 AM to 9 PM (21:55 max)
      for (let minute = 0; minute < 60; minute += 5) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        times.push(`${hourStr}:${minuteStr}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      const isMultipleDays = initialData.dates && initialData.dates.length > 1;
      
      // Handle data from drag selection
      let startTime = "09:00";
      let endTime = "10:00";
      let date = new Date().toISOString().split('T')[0];

      if (initialData.startDateTime) {
        const startDate = new Date(initialData.startDateTime);
        startTime = startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        date = startDate.toISOString().split('T')[0];
      }

      if (initialData.endDateTime) {
        const endDate = new Date(initialData.endDateTime);
        endTime = endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }

      // Handle data from multi-day drag
      if (initialData.dates && initialData.dates.length > 0) {
        date = initialData.dates[0].date;
        startTime = initialData.dates[0].startTime;
        endTime = initialData.dates[0].endTime;
      }
      
      setFormData({
        agenda: initialData.agenda || "",
        type: initialData.type || "counseling",
        date: date,
        startTime: startTime,
        endTime: endTime,
        timezone: initialData.timezone || "Asia/Jakarta",
        notificationOffset: initialData.notificationOffset || 60,
        multipleDate: isMultipleDays || (initialData.draggedDays > 1),
        additionalDates: initialData.dates?.slice(1) || [],
        userEmails: initialData.participants?.map(p => p.email) || initialData.userEmails || [],
        locations: initialData.location ? [initialData.location] : [],
        description: initialData.description || ""
      });
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
        userEmails: [],
        locations: [],
        description: ""
      });
    }
    setHasChanges(false);
    setValidationErrors({});
  }, [initialData, isOpen]);

  // Simple WYSIWYG editor implementation
  useEffect(() => {
    if (isOpen && editorRef.current) {
      editorRef.current.innerHTML = formData.description;
    }
  }, [isOpen, formData.description]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }

    // Auto-adjust end time if start time changes and end time is before start time
    if (field === 'startTime') {
      const startTimeIndex = timeOptions.indexOf(value);
      const endTimeIndex = timeOptions.indexOf(formData.endTime);
      
      if (startTimeIndex >= endTimeIndex) {
        // Set end time to at least 5 minutes after start time
        const newEndTimeIndex = Math.min(startTimeIndex + 1, timeOptions.length - 1);
        setFormData(prev => ({ ...prev, [field]: value, endTime: timeOptions[newEndTimeIndex] }));
      }
    }
  };

  const toggleDropdown = (dropdown) => {
    setDropdowns(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [dropdown]: !prev[dropdown]
    }));
  };

  const selectOption = (dropdown, value) => {
    handleInputChange(dropdown, value);
    setDropdowns(prev => ({ ...prev, [dropdown]: false }));
  };

  // Handle description change from WYSIWYG editor
  const handleDescriptionChange = () => {
    if (editorRef.current) {
      handleInputChange('description', editorRef.current.innerHTML);
    }
  };

  // Format text functions for WYSIWYG
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleDescriptionChange();
  };

  // Add new date slot
  const addDateSlot = () => {
    const newSlot = {
      date: new Date().toISOString().split('T')[0],
      startTime: formData.startTime,
      endTime: formData.endTime,
      timezone: formData.timezone
    };
    handleInputChange('additionalDates', [...formData.additionalDates, newSlot]);
  };

  // Remove date slot
  const removeDateSlot = (index) => {
    const newDates = formData.additionalDates.filter((_, i) => i !== index);
    handleInputChange('additionalDates', newDates);
    
    // If no additional dates left, uncheck multiple date
    if (newDates.length === 0) {
      handleInputChange('multipleDate', false);
    }
  };

  // Update additional date
  const updateAdditionalDate = (index, field, value) => {
    const newDates = [...formData.additionalDates];
    newDates[index] = { ...newDates[index], [field]: value };
    
    // Auto-adjust end time for additional dates
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

  const addUser = () => {
    if (userInput.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(userInput.trim())) {
        handleInputChange('userEmails', [...formData.userEmails, userInput.trim()]);
        setUserInput("");
      } else {
        setValidationErrors(prev => ({ ...prev, userInput: "Format email tidak valid" }));
      }
    }
  };

  const removeUser = (index) => {
    handleInputChange('userEmails', formData.userEmails.filter((_, i) => i !== index));
  };

  const addLocation = () => {
    if (locationInput.trim()) {
      handleInputChange('locations', [...formData.locations, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const removeLocation = (index) => {
    handleInputChange('locations', formData.locations.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.agenda.trim()) {
      errors.agenda = "Agenda wajib diisi";
    }
    
    // Only require participants for counseling
    if (formData.type === "counseling" && formData.userEmails.length === 0) {
      errors.userEmails = "Minimal satu peserta harus ditambahkan untuk konseling";
    }
    
    // Check if start time is before end time
    const startTimeIndex = timeOptions.indexOf(formData.startTime);
    const endTimeIndex = timeOptions.indexOf(formData.endTime);
    
    if (startTimeIndex >= endTimeIndex) {
      errors.time = "Waktu selesai harus lebih besar dari waktu mulai";
    }

    // Validate additional dates
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

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Prepare dates array for backend
    const dates = [{
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      timezone: formData.timezone
    }];

    if (formData.multipleDate) {
      dates.push(...formData.additionalDates);
    }

    // Format data for backend API
    const submitData = {
      agenda: formData.agenda,
      type: formData.type,
      location: formData.locations[0] || "",
      description: formData.description,
      notificationOffset: formData.notificationOffset,
      userEmails: formData.userEmails,
      dates: dates,
      timezone: formData.timezone
    };
    
    console.log('Submitting schedule data:', submitData);
    onSubmit(submitData);
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

  const getSelectedEventType = () => {
    return eventTypes.find(type => type.value === formData.type) || eventTypes[0];
  };

  const getTimezoneLabel = (timezone = formData.timezone) => {
    return timezoneOptions.find(tz => tz.value === timezone)?.label || "WIB";
  };

  const getNotificationLabel = () => {
    return notificationOptions.find(opt => opt.value === formData.notificationOffset)?.label || "1 jam";
  };

  const getLocationLabel = () => {
    if (formData.locations.length === 0) return "Pilih Lokasi";
    const location = locationOptions.find(opt => opt.value === formData.locations[0]);
    return location?.label || formData.locations[0];
  };

  if (!isOpen) return null;

  const showParticipants = formData.type === "counseling";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="flex flex-col justify-center items-center p-6 bg-white rounded-lg max-w-[558px] w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-end w-full max-w-[508px]">
          <div className="flex flex-col items-end w-full">
            <div className="w-full">
              <div className="flex flex-col justify-center w-full">
                
                {/* Agenda Input */}
                <div className="flex gap-4 items-center w-full text-center">
                  <div className="flex gap-2.5 items-center self-stretch my-auto min-w-60 flex-1">
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
                        className={`w-full pl-6 pr-2.5 py-3 text-base font-semibold rounded-md border border-gray-300 min-h-[35px] text-[#535353] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#488BBA] ${
                          validationErrors.agenda ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Event Type Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown('type')}
                      className="flex items-center px-2.5 py-3 text-sm whitespace-nowrap rounded-md border border-gray-300 min-h-[35px] w-[113px] focus:outline-none focus:ring-2 focus:ring-[#488BBA] text-[#535353]"
                    >
                      <div className="flex gap-1.5 justify-center items-center w-full">
                        <span>{getSelectedEventType().label}</span>
                        <span className="material-icons text-xs font-bold">keyboard_arrow_down</span>
                      </div>
                    </button>
                    {dropdowns.type && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                        {eventTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => selectOption('type', type.value)}
                            className="w-full px-2.5 py-2 text-left hover:bg-gray-100 transition-colors text-[#535353]"
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {validationErrors.agenda && (
                  <p className="text-red-500 text-xs mt-1 ml-8">{validationErrors.agenda}</p>
                )}

                {/* Date and Time Section */}
                <div className="flex flex-col justify-center mt-4 max-w-full">
                  <div className="flex flex-col justify-center w-full">
                    <div className="flex gap-4 justify-center items-start w-full">
                      <div className="flex gap-2.5 items-center py-1.5 w-[25px]">
                        <span className="material-icons text-[#488BBA] text-[25px] font-bold">schedule</span>
                      </div>
                      <div className="flex flex-col justify-center text-sm min-w-60 text-[#488BBA] flex-1">
                        <div className="flex gap-2.5 items-center flex-wrap">
                          {/* Date Input */}
                          <div className="flex flex-col justify-center py-2.5 px-2.5 whitespace-nowrap rounded-md border border-gray-300 min-h-9 w-[127px]">
                            <input
                              type="date"
                              value={formData.date}
                              onChange={(e) => handleInputChange('date', e.target.value)}
                              className="w-full bg-transparent outline-none text-[#535353] focus:ring-2 focus:ring-[#488BBA]"
                            />
                          </div>

                          {/* Time Inputs */}
                          <div className="flex gap-1.5 items-center">
                            {/* Start Time */}
                            <div className="relative">
                              <button
                                onClick={() => toggleDropdown('startTime')}
                                className="flex justify-center items-center py-2.5 px-2.5 rounded-md border border-gray-300 min-h-9 w-[85px] text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA]"
                              >
                                <span className="text-sm">{formData.startTime}</span>
                                <span className="material-icons text-xs ml-1 font-bold">keyboard_arrow_down</span>
                              </button>
                              {dropdowns.startTime && (
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
                            <div className="relative">
                              <button
                                onClick={() => toggleDropdown('endTime')}
                                className="flex justify-center items-center py-2.5 px-2.5 rounded-md border border-gray-300 min-h-9 w-[85px] text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA]"
                              >
                                <span className="text-sm">{formData.endTime}</span>
                                <span className="material-icons text-xs ml-1 font-bold">keyboard_arrow_down</span>
                              </button>
                              {dropdowns.endTime && (
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
                            <div className="relative">
                              <button
                                onClick={() => toggleDropdown('timezone')}
                                className="flex justify-center items-center px-2.5 py-2.5 whitespace-nowrap rounded-md border border-gray-300 min-h-9 w-[66px] text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA]"
                              >
                                <span className="text-sm">{getTimezoneLabel()}</span>
                                <span className="material-icons text-xs ml-1 font-bold">keyboard_arrow_down</span>
                              </button>
                              {dropdowns.timezone && (
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
                      </div>
                    </div>
                    {validationErrors.time && (
                      <p className="text-red-500 text-xs mt-1 ml-8">{validationErrors.time}</p>
                    )}

                    {/* Multiple Date Display (Read-only, controlled by drag) */}
                    <div className="flex gap-2.5 items-center self-start ml-8 mt-2.5 text-xs">
                      <div
                        className={`flex shrink-0 w-3.5 h-3.5 border rounded-sm transition-colors ${
                          formData.multipleDate
                            ? 'bg-[#535353] border-[#000000]'
                            : 'border-gray-400'
                        }`}
                      >
                        {formData.multipleDate && (
                          <span className="material-icons text-white text-xs leading-none">check</span>
                        )}
                      </div>
                      <span className="text-[#535353]">Multiple Date</span>
                      {formData.multipleDate && (
                        <span className="text-gray-500 text-xs">
                          (dari drag selection)
                        </span>
                      )}
                    </div>

                    {/* Additional Date Fields */}
                    {formData.multipleDate && (
                      <div className="ml-8 mt-4 space-y-3">
                        {formData.additionalDates.map((dateSlot, index) => (
                          <div key={index} className="flex gap-2.5 items-center flex-wrap">
                            {/* Date Input */}
                            <div className="flex flex-col justify-center py-2.5 px-2.5 whitespace-nowrap rounded-md border border-gray-300 min-h-9 w-[127px]">
                              <input
                                type="date"
                                value={dateSlot.date}
                                onChange={(e) => updateAdditionalDate(index, 'date', e.target.value)}
                                className="w-full bg-transparent outline-none text-[#535353] focus:ring-2 focus:ring-[#488BBA]"
                              />
                            </div>

                            {/* Start Time */}
                            <select
                              value={dateSlot.startTime}
                              onChange={(e) => updateAdditionalDate(index, 'startTime', e.target.value)}
                              className="py-2.5 px-2.5 rounded-md border border-gray-300 min-h-9 w-[85px] text-[#535353] focus:outline-none focus:ring-2 focus:ring-[#488BBA]"
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
                              className="py-2.5 px-2.5 rounded-md border border-gray-300 min-h-9 w-[85px] text-[#535353] focus:outline-none focus:ring-2 focus:ring-[#488BBA]"
                            >
                              {timeOptions.map((time) => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>

                            {/* Timezone */}
                            <select
                              value={dateSlot.timezone}
                              onChange={(e) => updateAdditionalDate(index, 'timezone', e.target.value)}
                              className="py-2.5 px-2.5 rounded-md border border-gray-300 min-h-9 w-[66px] text-[#535353] focus:outline-none focus:ring-2 focus:ring-[#488BBA]"
                            >
                              {timezoneOptions.map((tz) => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                              ))}
                            </select>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeDateSlot(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <span className="material-icons text-sm">close</span>
                            </button>

                            {validationErrors[`additionalTime_${index}`] && (
                              <p className="text-red-500 text-xs w-full">{validationErrors[`additionalTime_${index}`]}</p>
                            )}
                          </div>
                        ))}
                        
                        {/* Add Date Button */}
                        <button
                          onClick={addDateSlot}
                          className="text-[#488BBA] hover:text-blue-700 text-xs flex items-center gap-1"
                        >
                          <span className="material-icons text-sm font-bold">add</span>
                          Tambah tanggal
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notification Section */}
                <div className="flex gap-4 items-center self-start mt-4 text-sm text-center text-[#488BBA]">
                  <div className="flex gap-2.5 items-center py-1.5 w-[25px]">
                    <span className="material-icons text-[#488BBA] text-[25px] font-bold">notifications_active</span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown('notification')}
                      className="flex gap-1.5 items-center rounded border border-gray-300 px-2.5 py-2 min-h-[30px] text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA]"
                    >
                      <span>{getNotificationLabel()}</span>
                      <span className="material-icons text-xs font-bold">keyboard_arrow_down</span>
                    </button>
                    {dropdowns.notification && (
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

                {/* Email/Name Section - Only for Counseling */}
                {showParticipants && (
                  <div className="flex gap-4 items-start mt-4 text-center min-h-[35px]">
                    <span className="material-icons text-[#488BBA] text-[25px] mt-1.5 font-bold">person</span>
                    <div className="flex-1 min-h-[35px]">
                      <div className={`flex flex-wrap items-center py-2.5 px-2.5 w-full rounded-md border min-h-[35px] ${
                        validationErrors.userEmails ? 'border-red-500' : 'border-gray-300'
                      }`}>
                        <span className="text-sm text-red-500 pointer-events-none mr-2">*</span>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {formData.userEmails.map((email, index) => (
                            <div key={index} className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded text-xs">
                              <span className="text-[#535353]">{email}</span>
                              <button
                                onClick={() => removeUser(index)}
                                className="text-blue-600 hover:text-blue-800 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <input
                            type="email"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUser())}
                            placeholder="Email/nama"
                            className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-[#535353] placeholder:text-zinc-400"
                          />
                        </div>
                        <button
                          onClick={addUser}
                          className="ml-2 text-xs text-[#488BBA] whitespace-nowrap hover:text-blue-700"
                        >
                          + tambah individu
                        </button>
                      </div>
                      {validationErrors.userEmails && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.userEmails}</p>
                      )}
                      {validationErrors.userInput && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.userInput}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Location Section */}
                <div className="flex gap-4 items-start mt-4 text-sm text-center min-h-[35px] text-[#488BBA]">
                  <span className="material-icons text-[#488BBA] text-[25px] mt-1.5 font-bold">location_on</span>
                  <div className="flex-1 min-h-[35px]">
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown('location')}
                        className="flex items-center justify-between py-2.5 px-2.5 w-full rounded-md border border-gray-300 min-h-[35px] text-[#535353] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#488BBA]"
                      >
                        <span className="text-sm">{getLocationLabel()}</span>
                        <span className="material-icons text-xs font-bold">keyboard_arrow_down</span>
                      </button>
                      {dropdowns.location && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                          {locationOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                handleInputChange('locations', [option.value]);
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
                  </div>
                </div>

                {/* Description Section with Simple WYSIWYG */}
                <div className="flex gap-4 items-start mt-4 w-full text-sm leading-loose text-[#488BBA]">
                  <span className="material-icons text-[#488BBA] text-[25px] mt-1.5 font-bold">description</span>
                  <div className="flex-1 min-h-32">
                    <div className="relative flex flex-col py-2.5 px-2 w-full rounded-md border border-gray-300 min-h-32">
                      {/* Simple formatting toolbar */}
                      <div className="flex gap-2 mb-2 pb-2 border-b border-gray-200">
                        <button 
                          type="button"
                          onClick={() => formatText('bold')}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-100 font-bold"
                        >
                          B
                        </button>
                        <button 
                          type="button"
                          onClick={() => formatText('italic')}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-100 italic"
                        >
                          I
                        </button>
                        <button 
                          type="button"
                          onClick={() => formatText('underline')}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-100 underline"
                        >
                          U
                        </button>
                      </div>
                      
                      {/* Editable content area */}
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleDescriptionChange}
                        onBlur={handleDescriptionChange}
                        className="flex-1 w-full bg-transparent outline-none resize-none text-[#535353] min-h-[80px] focus:ring-2 focus:ring-[#488BBA] rounded p-1"
                        style={{ wordBreak: 'break-word' }}
                        suppressContentEditableWarning={true}
                        data-placeholder="Masukkan deskripsi"
                      />
                      
                      <div className="flex gap-2 items-center mt-2">
                        <button 
                          type="button"
                          className="flex items-center justify-center hover:text-[#488BBA] transition-colors"
                          title="Attach file"
                        >
                          <span className="material-icons text-gray-400 font-bold" style={{ fontSize: '18px' }}>attach_file</span>
                        </button>
                        <button 
                          type="button"
                          className="flex items-center justify-center hover:text-[#488BBA] transition-colors"
                          title="Add image"
                        >
                          <span className="material-icons text-gray-400 font-bold" style={{ fontSize: '18px' }}>add_photo_alternate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Required Field Notice - Aligned with document icons */}
          <div className="flex items-center mt-4 text-xs" style={{ marginLeft: '50px' }}>
            <span className="text-red-500">*</span>
            <span className="text-gray-600 ml-1"> Wajib diisi</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 items-center mt-4 w-full text-base font-semibold leading-5">
            <button
              onClick={handleCancel}
              className="px-7 py-2.5 text-[#488BBA] rounded-md border border-[#488BBA] min-h-8 w-[114px] hover:bg-blue-50 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.agenda || (showParticipants && formData.userEmails.length === 0)}
              className="px-7 py-2.5 bg-[#488BBA] rounded-md min-h-8 text-white w-[114px] hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : (initialData ? 'Update' : 'Tambah')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddScheduleModal;