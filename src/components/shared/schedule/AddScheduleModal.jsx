// src/components/shared/schedule/AddScheduleModal.jsx - Fixed Layout

import { useState, useRef } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

const AddScheduleModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  loading = false,
  mode = "create"
}) => {
  const [formData, setFormData] = useState(() => ({
    agenda: "",
    type: "counseling",
    dates: initialData?.dates || [{
      date: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "10:00",
      timezone: "Asia/Jakarta"
    }],
    notificationOffset: 60,
    selectedPsychologist: null,
    selectedParticipants: [],
    location: "",
    description: "",
    multipleDate: initialData?.draggedDays > 1 || false,
    ...initialData
  }));

  const [dropdowns, setDropdowns] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  
  const editorRef = useRef(null);
  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Event types
  const eventTypes = [
    { label: "Konseling", value: "counseling", textColor: "#9986FF" },
    { label: "Kelas", value: "class", textColor: "#3CE69E" },
    { label: "Seminar", value: "seminar", textColor: "#FF886D" },
    { label: "Lainnya", value: "other", textColor: "#979797" }
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

  // Fetch psychologist locations - ONLY 3 FIXED OPTIONS + BACKEND LOCATIONS
  const { data: backendLocations = [] } = useQuery({
    queryKey: ['psychologist-locations'],
    queryFn: async () => {
      const response = await apiClient.get('/psychologists/locations');
      return response.data || [];
    },
    enabled: isOpen && formData.type === "counseling",
    staleTime: 5 * 60 * 1000
  });

  // Combine fixed locations with backend locations
  const allLocations = [
    ...fixedLocationOptions,
    ...backendLocations.map(loc => ({ label: loc, value: loc }))
  ];

  // Fetch psychologists based on location OR all psychologists
  const { data: psychologists = [], isLoading: loadingPsychologists } = useQuery({
    queryKey: ['psychologists', formData.location],
    queryFn: async () => {
      const params = formData.location ? { location: formData.location } : {};
      const response = await apiClient.get('/psychologists', { params });
      return response.data?.data || response.data || [];
    },
    enabled: isOpen && formData.type === "counseling" && dropdowns.psychologist,
    staleTime: 2 * 60 * 1000
  });

  // Fetch participants with search
  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      const response = await apiClient.get('/users', { params: { limit: 100 } });
      return response.data?.data || [];
    },
    enabled: isOpen && formData.type === "counseling" && dropdowns.participants,
    staleTime: 30 * 1000
  });

  // Upload attachments mutation
  const uploadAttachmentsMutation = useMutation({
    mutationFn: async ({ scheduleId, files }) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      return await apiClient.post(`/schedules/${scheduleId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onError: (error) => {
      toast.error("Failed to upload attachments", {
        action: {
          label: "Retry",
          onClick: () => {
            if (lastScheduleId && attachments.length > 0) {
              uploadAttachmentsMutation.mutate({
                scheduleId: lastScheduleId,
                files: attachments.map(a => a.file)
              });
            }
          }
        }
      });
    }
  });

  let lastScheduleId = null;

  // Event handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
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
      setFormData(prev => ({ ...prev, dates: updatedDates }));
    }
  };

  const toggleDropdown = (dropdown) => {
    setDropdowns(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [dropdown]: !prev[dropdown]
    }));
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

  const handleParticipantSelect = (participant) => {
    if (!formData.selectedParticipants.find(p => p.id === participant.id)) {
      setFormData(prev => ({
        ...prev,
        selectedParticipants: [...prev.selectedParticipants, participant]
      }));
    }
    setDropdowns(prev => ({ ...prev, participants: false }));
  };

  const removeParticipant = (participantId) => {
    setFormData(prev => ({
      ...prev,
      selectedParticipants: prev.selectedParticipants.filter(p => p.id !== participantId)
    }));
  };

  const addDateSlot = () => {
    const newSlot = {
      date: new Date().toISOString().split('T')[0],
      startTime: formData.dates[0].startTime,
      endTime: formData.dates[0].endTime,
      timezone: formData.dates[0].timezone
    };
    handleInputChange('dates', [...formData.dates, newSlot]);
  };

  const removeDateSlot = (index) => {
    const newDates = formData.dates.filter((_, i) => i !== index);
    handleInputChange('dates', newDates);
    
    if (newDates.length === 1) {
      handleInputChange('multipleDate', false);
    }
  };

  const updateAdditionalDate = (index, field, value) => {
    const newDates = [...formData.dates];
    newDates[index] = { ...newDates[index], [field]: value };
    
    if (field === 'startTime') {
      const startTimeIndex = timeOptions.indexOf(value);
      const endTimeIndex = timeOptions.indexOf(newDates[index].endTime);
      
      // FIX: If start time is >= end time, auto-adjust end time
      if (startTimeIndex >= endTimeIndex) {
        const newEndTimeIndex = Math.min(startTimeIndex + 1, timeOptions.length - 1);
        newDates[index].endTime = timeOptions[newEndTimeIndex];
      }
    }
    
    if (field === 'endTime') {
      const startTimeIndex = timeOptions.indexOf(newDates[index].startTime);
      const endTimeIndex = timeOptions.indexOf(value);
      
      // FIX: If end time is <= start time, auto-adjust start time
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
    
    // For counseling: max 3 userIds (1 psychologist + 2 clients max)
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
      dates: formData.dates,
      location: formData.location || "organization"
    };

    if (mode === "edit" && initialData?.id) {
      submitData.id = initialData.id;
    }
    
    try {
      const result = await onSubmit(submitData);
      
      // FIX: Wait for schedule creation to complete and get proper ID
      if (result?.data?.id && attachments.length > 0) {
        const scheduleId = result.data.id;
        setUploadingAttachments(true);
        
        try {
          await uploadAttachmentsMutation.mutateAsync({
            scheduleId: scheduleId, // Use the returned schedule ID directly
            files: attachments.map(a => a.file)
          });
          toast.success("Schedule and attachments uploaded successfully");
        } catch (error) {
          console.error("Attachment upload error:", error);
          toast.error("Schedule created but failed to upload attachments", {
            action: {
              label: "Retry",
              onClick: () => {
                uploadAttachmentsMutation.mutate({
                  scheduleId: scheduleId,
                  files: attachments.map(a => a.file)
                });
              }
            }
          });
        } finally {
          setUploadingAttachments(false);
        }
      }
      
    } catch (error) {
      console.error('Error submitting schedule:', error);
    }
  };

  const handleCancel = () => {
    const hasChanges = Object.keys(formData).some(key => {
      const initialValue = initialData?.[key];
      const currentValue = formData[key];
      
      // Handle arrays and objects properly
      if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
        return JSON.stringify(currentValue) !== JSON.stringify(initialValue);
      }
      
      return currentValue !== (initialValue || "");
    });

    if (hasChanges) {
      toast("Ada perubahan yang belum disimpan. Yakin ingin membatalkan?", {
        action: {
          label: "Ya, batalkan",
          onClick: () => onClose()
        },
        cancel: {
          label: "Tetap edit",
          onClick: () => {} // Do nothing, just close toast
        },
        duration: 10000 // 10 seconds
      });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedEventType = eventTypes.find(type => type.value === formData.type) || eventTypes[0];
  const showParticipants = formData.type === "counseling";
  const modalTitle = mode === "edit" ? "Edit Jadwal" : "Tambah Jadwal";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div className="bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header - NO TEXT, NO DIVIDER */}
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
              <span className="absolute left-2 top-3 text-[#EE4266] text-sm pointer-events-none">*</span>
              <input
                type="text"
                value={formData.agenda}
                onChange={(e) => handleInputChange('agenda', e.target.value)}
                placeholder="Masukkan agenda"
                disabled={loading}
                className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
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

          {/* Date & Time */}
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

              {/* Multiple Date Toggle - NON-CLICKABLE, AUTO-ENABLED ONLY */}
              <div className="flex gap-2 items-center text-sm">
                <div className={`flex shrink-0 w-4 h-4 border rounded-sm transition-colors ${
                  formData.multipleDate
                    ? 'bg-[#535353] border-[#000000]'
                    : 'border-gray-400'
                }`}>
                  {formData.multipleDate && (
                    <span className="material-icons text-white text-xs leading-none">check</span>
                  )}
                </div>
                <span className="text-[#535353]">
                  Multiple Date {formData.multipleDate ? '(Dragged 2 days)' : ''}
                </span>
              </div>
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
                  
                  {/* Psychologist & Participant Side by Side */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Psychologist Column */}
                    <div>
                      {/* Selected Psychologist */}
                      {formData.selectedPsychologist && (
                        <div className="relative">
                          <div className="absolute inset-x-2 top-2 z-10">
                            <div className="flex items-center justify-between bg-[#535353] text-white text-xs px-2 py-1 rounded">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">
                                  {formData.selectedPsychologist.fullName}
                                </div>
                                <div className="text-gray-300 truncate text-xs">
                                  {formData.selectedPsychologist.email}
                                </div>
                              </div>
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, selectedPsychologist: null }))}
                                disabled={loading}
                                className="ml-2 text-white hover:text-gray-300"
                              >
                                <span className="material-icons text-sm">close</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        <div className="relative">
                          <span className="absolute left-2 top-3 text-[#EE4266] text-sm pointer-events-none">*</span>
                          <button
                            onClick={() => !loading && toggleDropdown('psychologist')}
                            disabled={loading}
                            className={`w-full pl-6 pr-8 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                              formData.selectedPsychologist ? 'pt-10' : ''
                            }`}
                            style={{ minHeight: formData.selectedPsychologist ? '60px' : '42px' }}
                          >
                            <span className={`text-gray-500 ${formData.selectedPsychologist ? 'opacity-0' : ''}`}>
                              Email/nama Psikolog
                            </span>
                            <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-sm">keyboard_arrow_down</span>
                          </button>
                        </div>
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

                    {/* Client Column */}
                    <div>
                      {/* Selected Participants - FLEX HORIZONTAL */}
                      {formData.selectedParticipants.length > 0 && (
                        <div className="relative">
                          <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
                            {formData.selectedParticipants.slice(0, 2).map((participant) => (
                              <div key={participant.id} className="flex items-center justify-between bg-[#EEEEEE] text-[#535353] text-xs px-2 py-1 rounded flex-1">
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium truncate">
                                    {participant.fullName}
                                  </div>
                                  <div className="text-gray-500 truncate text-xs">
                                    {participant.email}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeParticipant(participant.id)}
                                  disabled={loading}
                                  className="ml-2 text-[#535353] hover:text-gray-700"
                                >
                                  <span className="material-icons text-sm">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        <div className="relative">
                          <span className="absolute left-2 top-3 text-[#EE4266] text-sm pointer-events-none">*</span>
                          <button
                            onClick={() => !loading && toggleDropdown('participants')}
                            disabled={loading || formData.selectedParticipants.length >= 2}
                            className={`w-full pl-6 pr-8 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                              formData.selectedParticipants.length > 0 ? 'pt-10' : ''
                            }`}
                            style={{ 
                              minHeight: formData.selectedParticipants.length > 0 
                                ? '60px' // Fixed height for horizontal flex
                                : '42px' 
                            }}
                          >
                            <span className={`text-gray-500 ${formData.selectedParticipants.length > 0 ? 'opacity-0' : ''}`}>
                              {formData.selectedParticipants.length >= 2 ? "Max 2 klien" : "Email/nama Klien"}
                            </span>
                            <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-sm">keyboard_arrow_down</span>
                          </button>
                        </div>
                        {dropdowns.participants && !loading && formData.selectedParticipants.length < 2 && (
                          <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                            {loadingParticipants ? (
                              <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                            ) : participants.length > 0 ? (
                              participants
                                .filter(p => !formData.selectedParticipants.find(sp => sp.id === p.id))
                                .map((participant) => (
                                <button
                                  key={participant.id}
                                  onClick={() => handleParticipantSelect(participant)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                                >
                                  <div className="font-medium text-sm truncate">{participant.fullName}</div>
                                  <div className="text-xs text-gray-500 truncate">{participant.email}</div>
                                </button>
                              ))
                            ) : (
                              <div className="p-3 text-center text-gray-500 text-sm">Tidak ada partisipan ditemukan</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location - Below Participants */}
              <div className="flex gap-4 items-center">
                <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
                <select
                  value={formData.location}
                  onChange={(e) => {
                    handleInputChange('location', e.target.value);
                    // Reset psychologist when location changes
                    setFormData(prev => ({ ...prev, selectedPsychologist: null }));
                  }}
                  disabled={loading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                >
                  <option value="">Pilih Lokasi</option>
                  {/* ONLY 3 FIXED OPTIONS */}
                  {fixedLocationOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                  {/* BACKEND LOCATIONS - Only if psychologist selected first */}
                  {formData.selectedPsychologist && backendLocations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Location - for non-counseling */}
          {!showParticipants && (
            <div className="flex gap-4 items-center">
              <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
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
                
                {/* Attachments */}
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
                
                {/* File Upload Controls - FIXED ICONS */}
                <div className="flex items-center gap-3 mt-3">
                  {/* Document Upload - FIRST */}
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
                  
                  {/* Photo Upload - SECOND */}
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

              {/* Required Fields Notice & Action Buttons - Aligned with description field */}
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

        {/* Loading Overlay */}
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