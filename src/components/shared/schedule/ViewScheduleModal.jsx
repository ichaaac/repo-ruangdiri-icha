// src/components/shared/schedule/ViewScheduleModal.jsx - FIXED UI AND FILE URLS

import React, { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { createScheduleApi } from './lib/scheduleApi';
import AddScheduleModal from "./AddScheduleModal";

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [scheduleData, setScheduleData] = useState(initialScheduleData);
  
  const scheduleApi = createScheduleApi(organizationType);

  // FIXED: Fetch detailed schedule data using the API
  const { data: detailedScheduleData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['schedule-detail', initialScheduleData?.id],
    queryFn: async () => {
      if (!initialScheduleData?.id) return null;
      
      console.log('Fetching detailed schedule for ID:', initialScheduleData.id);
      const response = await scheduleApi.getScheduleById(initialScheduleData.id);
      
      console.log('Detailed schedule response:', response);
      
      if (response.data?.status === 'success') {
        return response.data.data;
      }
      return response.data?.data || null;
    },
    enabled: !!initialScheduleData?.id && isOpen,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // FIXED: Update local state when detailed data is available
  useEffect(() => {
    if (detailedScheduleData) {
      console.log('Setting detailed schedule data:', detailedScheduleData);
      setScheduleData(detailedScheduleData);
    } else if (initialScheduleData) {
      console.log('Using initial schedule data:', initialScheduleData);
      setScheduleData(initialScheduleData);
    }
  }, [detailedScheduleData, initialScheduleData]);

  if (!isOpen || !scheduleData) return null;

  // Event types with colors
  const eventTypes = [
    { label: "Konseling", value: "counseling", textColor: "#9986FF" },
    { label: "Kelas", value: "class", textColor: "#3CE69E" },
    { label: "Seminar", value: "seminar", textColor: "#FF886D" },
    { label: "Lainnya", value: "others", textColor: "#979797" }
  ];

  const selectedEventType = eventTypes.find(type => type.value === scheduleData.type) || eventTypes[0];

  // FIXED: Better date handling for multiple dates
  const getDatesFromSchedule = () => {
    // Priority 1: Use dates array if available (from transformed data)
    if (scheduleData.dates && scheduleData.dates.length > 0) {
      return scheduleData.dates.map(dateInfo => ({
        ...dateInfo,
        timezone: dateInfo.timezone || "WIB"
      }));
    }
    
    // Priority 2: Parse from startDateTime/endDateTime
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
    });
  };

  const getNotificationText = (offset) => {
    if (!offset) return "1 jam";
    if (offset >= 1440) return `${Math.floor(offset / 1440)} hari`;
    if (offset >= 60) return `${Math.floor(offset / 60)} jam`;
    return `${offset} menit`;
  };

  // FIXED: Get psychologist from new API structure (usersSchedules)
  const getPsychologist = () => {
    console.log('Getting psychologist from scheduleData:', scheduleData);
    
    if (scheduleData.type === "counseling") {
      // Method 1: From transformed participants data
      if (scheduleData.participants) {
        const psychologist = scheduleData.participants.find((p) => p.role === "psychologist");
        if (psychologist) {
          console.log('Found psychologist from participants:', psychologist);
          return psychologist;
        }
      }
      
      // Method 2: From raw API data (usersSchedules)
      if (scheduleData.usersSchedules) {
        const psychSchedule = scheduleData.usersSchedules.find(us => us.user.role === "psychologist");
        if (psychSchedule?.user) {
          console.log('Found psychologist from usersSchedules:', psychSchedule.user);
          return psychSchedule.user;
        }
      }
    }
    
    console.log('No psychologist found');
    return null;
  };

  // FIXED: Get clients from new API structure with proper filtering
  const getClients = () => {
    console.log('Getting clients from scheduleData:', scheduleData);
    
    if (scheduleData.type === "counseling") {
      // Method 1: From transformed participants data
      if (scheduleData.participants) {
        const clients = scheduleData.participants.filter((p) => p.role !== "psychologist");
        if (clients.length > 0) {
          console.log('Found clients from participants:', clients);
          return clients;
        }
      }
      
      // Method 2: From raw API data (usersSchedules)
      if (scheduleData.usersSchedules) {
        const clients = scheduleData.usersSchedules
          .filter(us => us.user.role !== "psychologist")
          .map(us => us.user);
        
        console.log('Found clients from usersSchedules:', clients);
        return clients;
      }
    }
    
    console.log('No clients found');
    return [];
  };

  // FIXED: Get location text with enhanced logic and proper field handling
  const getLocationText = () => {
    // For counseling: use location field
    if (scheduleData.type === "counseling") {
      const location = scheduleData.location;
      
      if (location === "online") {
        return "Zoom Meeting";
      } else if (location === "offline") {
        return "Offline";
      } else if (location === "organization" || location === "seed-in") {
        return "Seed-in";
      } else if (location) {
        // For custom backend locations (like "Tuku GBK"), show as-is but treat as offline
        return location;
      }
    } else {
      // For non-counseling: use customLocation field
      const customLocation = scheduleData.customLocation;
      if (customLocation) {
        return customLocation;
      }
    }
    
    return "Lokasi tidak ditentukan";
  };

  // FIXED: Enhanced attachment handlers with proper UPLOAD URL prefix
  const getAttachmentUrl = (attachment) => {
    if (!attachment.fileUrl) return null;
    
    // Check if it's already a full URL
    if (attachment.fileUrl.startsWith('http://') || attachment.fileUrl.startsWith('https://')) {
      return attachment.fileUrl;
    }
    
    // FIXED: Use VITE_UPLOAD_URL for file URLs (not VITE_API_URL)
    const uploadUrl = import.meta.env.VITE_UPLOAD_URL || import.meta.env.VITE_API_URL || '';
    return `${uploadUrl}${attachment.fileUrl}`;
  };

  const handleAttachmentClick = async (attachment) => {
    console.log('Attachment clicked:', attachment);
    
    // Check if it's an image based on fileType
    const isImage = attachment.fileType?.startsWith('image/');
    const attachmentUrl = getAttachmentUrl(attachment);

    if (!attachmentUrl) {
      console.error('No valid URL found for attachment');
      alert('Gagal membuka file: URL tidak ditemukan');
      return;
    }

    if (isImage) {
      // FIXED: For images, open in new window with proper URL
      try {
        window.open(attachmentUrl, '_blank', 'width=800,height=600,scrollbars=yes');
      } catch (error) {
        console.error('Error opening image:', error);
        alert('Gagal membuka gambar');
      }
    } else {
      // FIXED: For files, download with proper URL
      handleDocumentDownload(attachment, attachmentUrl);
    }
  };

  const handleDocumentDownload = async (attachment, attachmentUrl) => {
    try {
      setDownloadingAttachment(attachment.id);
      
      // FIXED: Use proper attachment URL for download
      if (attachmentUrl) {
        const link = document.createElement('a');
        link.href = attachmentUrl;
        link.download = attachment.originalName || 'attachment';
        link.target = '_blank';
        
        // Add CORS handling for download
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Fallback to API download if URL construction fails
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

  // FIXED: Enhanced edit handling with proper state update
  const handleEdit = () => {
    if (loading || isLoadingDetail) return;
    setShowEditModal(true);
  };

  const handleEditSubmit = async (formData) => {
    try {
      if (onEdit) {
        const result = await onEdit(scheduleData.id, formData);
        
        if (result?.data?.data) {
          setScheduleData(result.data.data);
        } else {
          const updatedScheduleData = {
            ...scheduleData,
            agenda: formData.agenda,
            type: formData.type,
            description: formData.description,
            notificationOffset: formData.notificationOffset,
            dates: formData.dates,
            location: formData.type === "counseling" ? formData.location : scheduleData.location,
            customLocation: formData.type !== "counseling" ? formData.customLocation : scheduleData.customLocation,
            multipleDate: formData.dates?.length > 1,
            ...(formData.participants && {
              participants: [
                ...(formData.selectedPsychologist ? [formData.selectedPsychologist] : []),
                ...(formData.selectedParticipants || [])
              ]
            })
          };
          
          console.log('Optimistically updating schedule data:', updatedScheduleData);
          setScheduleData(updatedScheduleData);
        }
        
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  };

  const handleDelete = () => {
    if (onDelete && !loading && !isLoadingDetail) {
      if (window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
        onDelete(scheduleData);
      }
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // FIXED: Prepare edit data with proper location handling
  const prepareEditData = () => {
    const psychologist = getPsychologist();
    const clients = getClients();
    
    // FIXED: Prepare participants in new format for editing
    let participants = null;
    if (scheduleData.type === "counseling" && psychologist && clients.length > 0) {
      participants = {
        psychologistId: psychologist.id,
        patientIds: clients.map(client => client.id)
      };
    }
    
    // FIXED: Use original backend location for editing
    let editLocationValue = "";
    if (scheduleData.type === "counseling") {
      editLocationValue = scheduleData.location || "";
    }
    
    return {
      id: scheduleData.id,
      agenda: scheduleData.agenda || "",
      type: scheduleData.type || "counseling",
      description: scheduleData.description || "",
      notificationOffset: scheduleData.notificationOffset || 60,
      dates: dates.length > 0 ? dates : [{
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        timezone: "WIB"
      }],
      selectedPsychologist: psychologist,
      selectedParticipants: clients,
      participants: participants, // New format for API
      location: editLocationValue, // FIXED: Use original backend location
      customLocation: scheduleData.type !== "counseling" ? (scheduleData.customLocation || "") : "",
      multipleDate: dates.length > 1,
      originalData: scheduleData,
      _originalBackendLocation: scheduleData.location // Store original for reference
    };
  };

  // FIXED: Handle Zoom meeting access
  const handleZoomJoin = () => {
    if (scheduleData.zoomJoinUrl) {
      window.open(scheduleData.zoomJoinUrl, '_blank');
    }
  };

  const handleZoomStart = () => {
    if (scheduleData.zoomStartUrl) {
      window.open(scheduleData.zoomStartUrl, '_blank');
    }
  };

  const showParticipants = scheduleData.type === "counseling";

  console.log('=== ViewScheduleModal Debug ===');
  console.log('scheduleData:', scheduleData);
  console.log('showParticipants:', showParticipants);
  console.log('psychologist:', getPsychologist());
  console.log('clients:', getClients());
  console.log('location:', scheduleData.location);
  console.log('customLocation:', scheduleData.customLocation);
  console.log('attachments:', scheduleData.attachments);
  console.log('============================');

  return (
    <>
      {/* Only show ViewSchedule if edit modal is not open */}
      {!showEditModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Header */}
            <div className="flex justify-end items-center p-6">
              <button
                onClick={onClose}
                disabled={loading || isLoadingDetail}
                className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                <span className="material-icons text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
            
            {/* FIXED: Agenda & Type - Simple text display */}
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

            {/* FIXED: Date & Time - Simple text display */}
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

            {/* FIXED: Notification - Simple text display */}
            <div className="flex gap-4 items-center">
              <span className="material-icons text-[#488BBA] text-[25px]">notifications_active</span>
              <div className="text-gray-700">
                Notifikasi: <span className="font-medium">{getNotificationText(scheduleData.notificationOffset)}</span>
              </div>
            </div>

            {/* FIXED: Participants - Simple text display (Only for Counseling) */}
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

                {/* FIXED: Location for Counseling with Zoom integration */}
                <div className="flex gap-4 items-center">
                  <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="text-gray-700">
                      Lokasi: <span className="font-medium">{getLocationText()}</span>
                    </div>
                    
                    {/* FIXED: Show Zoom buttons only for online counseling sessions */}
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

            {/* FIXED: Custom Location - for non-counseling - Simple text display */}
            {!showParticipants && (
              <div className="flex gap-4 items-center">
                <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
                <div className="text-gray-700">
                  Lokasi: <span className="font-medium">{getLocationText()}</span>
                </div>
              </div>
            )}

            {/* FIXED: Description & Attachments - Simple display */}
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
                  
                {/* FIXED: Enhanced Attachments with proper URLs */}
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
                  <button
                    onClick={handleDelete}
                    disabled={loading || isLoadingDetail}
                    className="w-12 h-12 flex items-center justify-center text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Hapus jadwal"
                  >
                    <span className="material-icons text-[20px]">delete</span>
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={loading || isLoadingDetail}
                    className="px-6 py-2 bg-[#488BBA] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 font-medium"
                  >
                    {loading || isLoadingDetail ? "Loading..." : "Edit"}
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
      )}

      {/* FIXED: Edit Modal - Replace ViewSchedule instead of overlay */}
      {showEditModal && (
        <AddScheduleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          initialData={prepareEditData()}
          loading={loading}
          mode="edit"
          fromViewModal={true}
        />
      )}
    </>
  );
};

export default ViewScheduleModal;