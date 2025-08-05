// src/components/shared/schedule/ViewScheduleModal.jsx - FIXED WITH PAST SCHEDULE CHECK

import React, { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";
import { createScheduleApi } from './lib/scheduleApi';

const ViewScheduleModal = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  scheduleData: initialScheduleData,
  loading = false,
  organizationType = "school"
}) => {
  const [downloadingAttachment, setDownloadingAttachment] = useState(null);
  const [scheduleData, setScheduleData] = useState(initialScheduleData);
  
  const scheduleApi = createScheduleApi(organizationType);

  // FIXED: Check if schedule is in the past (cannot edit)
  const isScheduleInPast = () => {
    if (!scheduleData?.startDateTime) return false
    
    const scheduleStartTime = new Date(scheduleData.startDateTime)
    const now = new Date()
    
    // Consider schedule in past if it's more than 5 minutes ago
    return scheduleStartTime < new Date(now.getTime() - 5 * 60 * 1000)
  }

  // FIXED: Check if schedule is within 24 hours (counseling restriction)
  const isWithin24Hours = () => {
    if (!scheduleData?.startDateTime || scheduleData.type !== "counseling") return false
    
    const scheduleStartTime = new Date(scheduleData.startDateTime)
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    return scheduleStartTime < twentyFourHoursFromNow
  }

  // FIXED: Check if edit should be disabled
  const isEditDisabled = () => {
    return isScheduleInPast() || (scheduleData.type === "counseling" && isWithin24Hours())
  }

  // Fetch detailed schedule data
  const { data: detailedScheduleData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['schedule-detail', initialScheduleData?.id],
    queryFn: async () => {
      if (!initialScheduleData?.id) return null;
      
      const response = await scheduleApi.getScheduleById(initialScheduleData.id);
      
      if (response.data?.status === 'success') {
        return response.data.data;
      }
      return response.data?.data || null;
    },
    enabled: !!initialScheduleData?.id && isOpen,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    networkMode: 'always',
    useErrorBoundary: false,
  });

  // Update local state when detailed data is available
  useEffect(() => {
    if (detailedScheduleData) {
      setScheduleData(detailedScheduleData);
    } else if (initialScheduleData) {
      setScheduleData(initialScheduleData);
    }
  }, [detailedScheduleData, initialScheduleData]);

  // Setup close all modals function
  useEffect(() => {
    if (isOpen) {
      window.closeAllModals = () => {
        onClose();
      };
    }
    
    return () => {
      if (window.closeAllModals) {
        delete window.closeAllModals;
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !scheduleData) return null;

  // Event types with colors
  const eventTypes = [
    { label: "Konseling", value: "counseling", textColor: "#9986FF" },
    { label: "Kelas", value: "class", textColor: "#3CE69E" },
    { label: "Seminar", value: "seminar", textColor: "#FF886D" },
    { label: "Lainnya", value: "others", textColor: "#979797" }
  ];

  const selectedEventType = eventTypes.find(type => type.value === scheduleData.type) || eventTypes[0];

  // Better date handling for multiple dates
  const getDatesFromSchedule = () => {
    if (scheduleData.dates && scheduleData.dates.length > 0) {
      return scheduleData.dates.map(dateInfo => ({
        ...dateInfo,
        timezone: dateInfo.timezone || "WIB"
      }));
    }
    
    if (scheduleData.startDateTime) {
      const startDate = new Date(scheduleData.startDateTime);
      const endDate = new Date(scheduleData.endDateTime);
      
      return [{
        date: startDate.toISOString().split("T")[0],
        startTime: startDate.toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit"
        }),
        endTime: endDate.toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit"
        }),
        timezone: "WIB"
      }];
    }
    
    return [];
  };

  const dates = getDatesFromSchedule();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
    }).replace(/\//g, ".");
  };

  const getNotificationText = (offset) => {
    if (!offset) return "1 jam";
    if (offset >= 1440) return `${Math.floor(offset / 1440)} hari`;
    if (offset >= 60) return `${Math.floor(offset / 60)} jam`;
    return `${offset} menit`;
  };

  // Get psychologist from API structure
  const getPsychologist = () => {
    if (scheduleData.type === "counseling") {
      if (scheduleData.participants) {
        const psychologist = scheduleData.participants.find((p) => p.role === "psychologist");
        if (psychologist) return psychologist;
      }
      
      if (scheduleData.usersSchedules) {
        const psychSchedule = scheduleData.usersSchedules.find(us => us.user.role === "psychologist");
        if (psychSchedule?.user) return psychSchedule.user;
      }
    }
    
    return null;
  };

  // Get clients from API structure
  const getClients = () => {
    if (scheduleData.type === "counseling") {
      if (scheduleData.participants) {
        const clients = scheduleData.participants.filter((p) => p.role !== "psychologist");
        if (clients.length > 0) return clients;
      }
      
      if (scheduleData.usersSchedules) {
        const clients = scheduleData.usersSchedules
          .filter(us => us.user.role !== "psychologist")
          .map(us => us.user);
        
        return clients;
      }
    }
    
    return [];
  };

  // Get location text with enhanced logic
  const getLocationText = () => {
    if (scheduleData.type === "counseling") {
      const location = scheduleData.location;
      
      if (location === "online") {
        return "Zoom Meeting";
      } else if (location === "offline") {
        return "Offline";
      } else if (location === "organization" || location === "seed-in") {
        return "Seed-in";
      } else if (location) {
        return location;
      }
    } else {
      const customLocation = scheduleData.customLocation;
      if (customLocation) {
        return customLocation;
      }
    }
    
    return "Lokasi tidak ditentukan";
  };

  // Enhanced attachment handlers
  const getAttachmentUrl = (attachment) => {
    if (!attachment.fileUrl) return null;
    
    if (attachment.fileUrl.startsWith('http://') || attachment.fileUrl.startsWith('https://')) {
      return attachment.fileUrl;
    }
    
    const uploadUrl = import.meta.env.VITE_UPLOAD_URL || import.meta.env.VITE_API_URL || '';
    return `${uploadUrl}${attachment.fileUrl}`;
  };

  const handleAttachmentClick = async (attachment) => {
    const isImage = attachment.fileType?.startsWith('image/');
    const attachmentUrl = getAttachmentUrl(attachment);

    if (!attachmentUrl) {
      alert('Gagal membuka file: URL tidak ditemukan');
      return;
    }

    if (isImage) {
      try {
        window.open(attachmentUrl, '_blank', 'width=800,height=600,scrollbars=yes');
      } catch (error) {
        console.error('Error opening image:', error);
        alert('Gagal membuka gambar');
      }
    } else {
      handleDocumentDownload(attachment, attachmentUrl);
    }
  };

  const handleDocumentDownload = async (attachment, attachmentUrl) => {
    try {
      setDownloadingAttachment(attachment.id);
      
      if (attachmentUrl) {
        const link = document.createElement('a');
        link.href = attachmentUrl;
        link.download = attachment.originalName || 'attachment';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      const response = await fetch(`/api/schedules/${scheduleData.id}/attachments/${attachment.id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = attachment.originalName || 'attachment';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      alert(`Gagal mengunduh file: ${error.message}`);
    } finally {
      setDownloadingAttachment(null);
    }
  };

  const getFileIcon = (attachment) => {
    const fileType = attachment.fileType || '';
    const extension = attachment.originalName?.split('.').pop()?.toLowerCase() || '';
    
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(extension)) {
      return 'image';
    } else if (fileType === 'application/pdf' || extension === 'pdf') {
      return 'picture_as_pdf';
    } else if (fileType.includes('word') || ['doc', 'docx'].includes(extension)) {
      return 'description';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension)) {
      return 'table_chart';
    } else {
      return 'description';
    }
  };

  const getFileTypeLabel = (attachment) => {
    const isImage = attachment.fileType?.startsWith('image/');
    return isImage ? 'Preview' : 'Download';
  };

  // Handle edit - FIXED: Check if edit is allowed
  const handleEdit = () => {
    if (loading || isLoadingDetail) return;
    
    if (isEditDisabled()) {
      if (isScheduleInPast()) {
        toast.error("Tidak dapat mengedit jadwal yang sudah berlalu");
      } else if (scheduleData.type === "counseling" && isWithin24Hours()) {
        toast.error("Tidak dapat mengedit jadwal konseling yang kurang dari 24 jam dari sekarang");
      }
      return;
    }
    
    onEdit && onEdit(scheduleData);
  };

  // Handle delete with sonner confirmation
  const handleDelete = () => {
    if (onDelete && !loading && !isLoadingDetail) {
      // FIXED: Also prevent delete for past schedules
      if (isScheduleInPast()) {
        toast.error("Tidak dapat menghapus jadwal yang sudah berlalu");
        return;
      }

      toast("Apakah Anda yakin ingin menghapus jadwal ini?", {
        description: "Tindakan ini tidak dapat dibatalkan. Jadwal akan dihapus secara permanen.",
        action: {
          label: "Ya, Hapus",
          onClick: () => {
            onDelete(scheduleData);
          },
          className: "!bg-red-600 hover:!bg-red-700 !text-white !border-red-600 hover:!border-red-700 !ml-auto"
        },
        cancel: {
          label: "Batal",
          onClick: () => {
            // Do nothing, just close the toast
          },
          className: "!bg-transparent hover:!bg-gray-100 !text-gray-700 !border !border-gray-300 hover:!border-gray-400"
        },
        duration: 10000,
        className: "!bg-white !border !border-gray-200 !shadow-lg",
        position: "top-center"
      });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const showParticipants = scheduleData.type === "counseling";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          {/* FIXED: Show status indicator for past schedules */}
          <div className="flex-1">
            {isScheduleInPast() && (
              <div className="bg-gray-100 border border-gray-400 text-gray-700 px-3 py-1 rounded text-sm inline-flex items-center">
                <span className="material-icons text-sm mr-1">history</span>
                Jadwal Selesai
              </div>
            )}
            {!isScheduleInPast() && isWithin24Hours() && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1 rounded text-sm inline-flex items-center">
                <span className="material-icons text-sm mr-1">schedule</span>
                Kurang dari 24 jam
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#EE4266] hover:text-[#d63854] transition-colors disabled:opacity-50"
          >
            <span className="material-icons text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
        
        {/* Agenda & Type */}
        <div className="flex gap-4 items-center">
          <span className="material-icons text-[#488BBA] text-[25px]">list_alt</span>
          <div className="flex-1">
            <div className="text-lg font-semibold text-gray-900">
              {scheduleData.agenda || "No Title"}
            </div>
          </div>
          <div className="flex items-center px-3 py-1 rounded-md">
            <span style={{ color: selectedEventType.textColor }} className="font-medium">
              {selectedEventType.label}
            </span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex gap-4 items-start">
          <span className="material-icons text-[#488BBA] text-[25px] mt-1">schedule</span>
          <div className="flex-1 space-y-2">
            {dates.map((dateInfo, index) => (
              <div key={index} className="flex gap-3 items-center text-gray-700">
                <span className="font-medium">
                  {formatDate(dateInfo.date)}
                </span>
                <span className="text-gray-500">•</span>
                <span>
                  {dateInfo.startTime} - {dateInfo.endTime} {dateInfo.timezone || "WIB"}
                </span>
              </div>
            ))}

            {dates.length > 1 && (
              <div className="flex gap-2 items-center text-sm text-gray-600">
                <div className="w-3 h-3 bg-[#535353] rounded-sm"></div>
                <span>Multiple Date</span>
              </div>
            )}
          </div>
        </div>

        {/* Notification */}
        <div className="flex gap-4 items-center">
          <span className="material-icons text-[#488BBA] text-[25px]">notifications_active</span>
          <div className="text-gray-700">
            Notifikasi: <span className="font-medium">{getNotificationText(scheduleData.notificationOffset)}</span>
          </div>
        </div>

        {/* Participants (Only for Counseling) */}
        {showParticipants && (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <span className="material-icons text-[#488BBA] text-[25px] mt-1">account_circle</span>
              <div className="flex-1 space-y-3">
                
                {/* Psychologist */}
                <div>
                  <div className="text-sm text-gray-600 mb-1">Psikolog:</div>
                  {getPsychologist() ? (
                    <div className="text-gray-900 font-medium">
                      {getPsychologist().fullName || getPsychologist().email}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">Tidak ada psikolog</div>
                  )}
                </div>

                {/* Client 1 */}
                <div>
                  <div className="text-sm text-gray-600 mb-1">Klien 1:</div>
                  {getClients()[0] ? (
                    <div className="text-gray-900 font-medium">
                      {getClients()[0].fullName || getClients()[0].email}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">Tidak ada klien 1</div>
                  )}
                </div>

                {/* Client 2 (Optional) */}
                {getClients()[1] && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Klien 2:</div>
                    <div className="text-gray-900 font-medium">
                      {getClients()[1].fullName || getClients()[1].email}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location for Counseling with Zoom integration */}
            <div className="flex gap-4 items-center">
              <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
              <div className="flex-1 flex items-center gap-3">
                <div className="text-gray-700">
                  Lokasi: <span className="font-medium">{getLocationText()}</span>
                </div>
                
                {/* Show Zoom buttons only for online counseling sessions */}
                {scheduleData.type === "counseling" && scheduleData.location === "online" && (
                  <div className="flex gap-2">
                    {scheduleData.zoomJoinUrl && (
                      <button
                        onClick={() => window.open(scheduleData.zoomJoinUrl, '_blank')}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                        title="Join Zoom Meeting"
                      >
                        <span className="material-icons text-sm">videocam</span>
                        Join Meeting
                      </button>
                    )}
                    {scheduleData.zoomStartUrl && (
                      <button
                        onClick={() => window.open(scheduleData.zoomStartUrl, '_blank')}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                        title="Start Zoom Meeting"
                      >
                        <span className="material-icons text-sm">play_arrow</span>
                        Start Meeting
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Custom Location - for non-counseling */}
        {!showParticipants && (
          <div className="flex gap-4 items-center">
            <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
            <div className="text-gray-700">
              Lokasi: <span className="font-medium">{getLocationText()}</span>
            </div>
          </div>
        )}

        {/* Description & Attachments */}
        <div className="flex gap-4 items-start">
          <span className="material-icons text-[#488BBA] text-[25px] mt-1">description</span>
          <div className="flex-1">
            
            {/* Description */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Deskripsi:</div>
              {scheduleData.description ? (
                <div
                  className="text-gray-700 leading-relaxed"
                  style={{ wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{
                    __html: scheduleData.description,
                  }}
                />
              ) : (
                <div className="text-gray-500 italic">Tidak ada deskripsi</div>
              )}
            </div>
              
            {/* Enhanced Attachments with proper URLs */}
            {scheduleData.attachments && scheduleData.attachments.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">File Lampiran:</div>
                <div className="flex flex-wrap gap-2">
                  {scheduleData.attachments.map((attachment, index) => {
                    const attachmentUrl = getAttachmentUrl(attachment);
                    return (
                      <button
                        key={attachment.id || index}
                        onClick={() => handleAttachmentClick(attachment)}
                        disabled={downloadingAttachment === attachment.id || !attachmentUrl}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 group"
                        title={`${getFileTypeLabel(attachment)}: ${attachment.originalName || `File ${index + 1}`}`}
                      >
                        {downloadingAttachment === attachment.id ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                        ) : (
                          <span className="material-icons text-[18px] text-gray-600 group-hover:text-[#488BBA]">
                            {getFileIcon(attachment)}
                          </span>
                        )}
                        <span className="text-sm text-gray-700 max-w-[150px] truncate group-hover:text-gray-900">
                          {attachment.originalName || `File ${index + 1}`}
                        </span>
                        <span className="text-xs text-gray-500 group-hover:text-gray-700">
                          ({getFileTypeLabel(attachment)})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3 justify-end">
              {/* FIXED: Only show delete if not past schedule */}
              {!isScheduleInPast() && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-12 h-12 flex items-center justify-center text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Hapus jadwal"
                >
                  <span className="material-icons text-[20px]">delete</span>
                </button>
              )}
              
              {/* FIXED: Edit button with proper disable state */}
              <button
                onClick={handleEdit}
                disabled={loading || isEditDisabled()}
                className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                  isEditDisabled()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#488BBA] text-white hover:bg-blue-600'
                }`}
                title={
                  isScheduleInPast() 
                    ? "Tidak dapat mengedit jadwal yang sudah berlalu"
                    : isWithin24Hours()
                    ? "Tidak dapat mengedit konseling kurang dari 24 jam"
                    : "Edit jadwal"
                }
              >
                {loading ? "Loading..." : isEditDisabled() ? "Tidak Dapat Edit" : "Edit"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {(loading || isLoadingDetail) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#488BBA]"></div>
            <span className="text-[#488BBA] font-medium">Loading...</span>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default ViewScheduleModal;