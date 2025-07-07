// src/components/shared/schedule/AddScheduleModal.jsx - Simplified

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
    ...initialData
  }));

  const [dropdowns, setDropdowns] = useState({});
  const [searchTerms, setSearchTerms] = useState({ psychologist: "", participants: "" });
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Event types - text only, no color backgrounds
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

  // Fetch psychologist locations
  const { data: locations = [] } = useQuery({
    queryKey: ['psychologist-locations'],
    queryFn: async () => {
      const response = await apiClient.get('/psychologists/locations');
      return response.data || [];
    },
    enabled: isOpen && formData.type === "counseling",
    staleTime: 5 * 60 * 1000
  });

  // Fetch psychologists based on location
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
    queryKey: ['participants', searchTerms.participants],
    queryFn: async () => {
      const params = {
        limit: 50,
        ...(searchTerms.participants && { search: searchTerms.participants })
      };
      const response = await apiClient.get('/users', { params });
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
    
    // Auto-adjust end time when start time changes
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 15 * 1024 * 1024; // 15MB
    const validFiles = [];
    
    files.forEach(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds 15MB limit`);
      } else {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size
        });
      }
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
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
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
      
      // Upload attachments in background if schedule was created
      if (result?.data?.id && attachments.length > 0) {
        lastScheduleId = result.data.id;
        setUploadingAttachments(true);
        
        try {
          await uploadAttachmentsMutation.mutateAsync({
            scheduleId: result.data.id,
            files: attachments.map(a => a.file)
          });
          toast.success("Schedule and attachments uploaded successfully");
        } catch (error) {
          // Error already handled in mutation
        } finally {
          setUploadingAttachments(false);
        }
      }
      
    } catch (error) {
      console.error('Error submitting schedule:', error);
    }
  };

  const handleCancel = () => {
    if (Object.keys(formData).some(key => formData[key] !== (initialData?.[key] || ""))) {
      if (window.confirm('Ada perubahan yang belum disimpan. Yakin ingin membatalkan?')) {
        onClose();
      }
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
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-[#488BBA]">{modalTitle}</h2>
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
            <div className="flex-1">
              <input
                type="text"
                value={formData.agenda}
                onChange={(e) => handleInputChange('agenda', e.target.value)}
                placeholder="* Masukkan agenda"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
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
                    onChange={(e) => {
                      const newDates = [...formData.dates];
                      newDates[index] = { ...newDates[index], startTime: e.target.value };
                      handleInputChange('dates', newDates);
                    }}
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
                    onChange={(e) => {
                      const newDates = [...formData.dates];
                      newDates[index] = { ...newDates[index], endTime: e.target.value };
                      handleInputChange('dates', newDates);
                    }}
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>

                  <select
                    value={dateInfo.timezone}
                    onChange={(e) => {
                      const newDates = [...formData.dates];
                      newDates[index] = { ...newDates[index], timezone: e.target.value };
                      handleInputChange('dates', newDates);
                    }}
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                  >
                    {timezoneOptions.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              ))}
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
                <span className="material-icons text-[#488BBA] text-[25px] mt-1">person</span>
                <div className="flex-1 space-y-4">
                  
                  {/* Location Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
                    <select
                      value={formData.location}
                      onChange={(e) => {
                        handleInputChange('location', e.target.value);
                        setFormData(prev => ({ ...prev, selectedPsychologist: null })); // Reset psychologist when location changes
                      }}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                    >
                      <option value="">Semua Lokasi</option>
                      {locations.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                      {fixedLocationOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Psychologist Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Email/Nama Psikolog
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => !loading && toggleDropdown('psychologist')}
                        disabled={loading}
                        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                      >
                        {formData.selectedPsychologist 
                          ? `${formData.selectedPsychologist.fullName} (${formData.selectedPsychologist.email})`
                          : "Pilih Psikolog"}
                        <span className="material-icons float-right mt-0.5">keyboard_arrow_down</span>
                      </button>
                      {dropdowns.psychologist && !loading && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                          {loadingPsychologists ? (
                            <div className="p-3 text-center text-gray-500">Loading...</div>
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
                                <div className="font-medium">{psychologist.fullName}</div>
                                <div className="text-sm text-gray-500">{psychologist.email}</div>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center text-gray-500">Tidak ada psikolog ditemukan</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Participants Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Email/Nama Klien
                    </label>
                    
                    {/* Selected Participants */}
                    {formData.selectedParticipants.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.selectedParticipants.map((participant) => (
                          <div key={participant.id} className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded text-sm">
                            <span>{participant.fullName} ({participant.email})</span>
                            <button
                              onClick={() => removeParticipant(participant.id)}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <button
                        onClick={() => !loading && toggleDropdown('participants')}
                        disabled={loading}
                        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
                      >
                        Tambah Partisipan
                        <span className="material-icons float-right mt-0.5">keyboard_arrow_down</span>
                      </button>
                      {dropdowns.participants && !loading && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                          <div className="p-2 border-b">
                            <input
                              type="text"
                              value={searchTerms.participants}
                              onChange={(e) => setSearchTerms(prev => ({ ...prev, participants: e.target.value }))}
                              placeholder="Cari partisipan..."
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#488BBA]"
                            />
                          </div>
                          <div className="max-h-40 overflow-y-auto">
                            {loadingParticipants ? (
                              <div className="p-3 text-center text-gray-500">Loading...</div>
                            ) : participants.length > 0 ? (
                              participants.map((participant) => (
                                <button
                                  key={participant.id}
                                  onClick={() => handleParticipantSelect(participant)}
                                  disabled={formData.selectedParticipants.find(p => p.id === participant.id)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <div className="font-medium">{participant.fullName}</div>
                                  <div className="text-sm text-gray-500">{participant.email}</div>
                                </button>
                              ))
                            ) : (
                              <div className="p-3 text-center text-gray-500">Tidak ada partisipan ditemukan</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                        <span className="material-icons text-xs">attach_file</span>
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
                
                <div className="flex items-center mt-3 pt-3 border-t">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#488BBA] transition-colors"
                  >
                    <span className="material-icons text-sm">attach_file</span>
                    Attach Files (Max 15MB)
                  </button>
                  {uploadingAttachments && (
                    <span className="ml-2 text-xs text-blue-500">Uploading...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Required Fields Notice */}
          <div className="text-xs text-gray-600">
            <span className="text-red-500">*</span> Wajib diisi
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
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