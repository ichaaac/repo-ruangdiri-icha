// src/components/shared/schedule/ViewScheduleModal.jsx - FIXED FOR NEW API RESPONSE

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

  // FIXED: Enhanced attachment handlers - window.open for images, download for files
  const handleAttachmentClick = async (attachment) => {
    console.log('Attachment clicked:', attachment);
    
    // Check if it's an image based on fileType
    const isImage = attachment.fileType?.startsWith('image/');

    if (isImage) {
      // FIXED: For images, open in new window
      try {
        const imageUrl = attachment.fileUrl;
        if (imageUrl) {
          // Open image in new window
          window.open(imageUrl, '_blank', 'width=800,height=600,scrollbars=yes');
        } else {
          console.error('No fileUrl found for image attachment');
          alert('Gagal membuka gambar: URL tidak ditemukan');
        }
      } catch (error) {
        console.error('Error opening image:', error);
        alert('Gagal membuka gambar');
      }
    } else {
      // FIXED: For files, download
      handleDocumentDownload(attachment);
    }
  };

  const handleDocumentDownload = async (attachment) => {
    try {
      setDownloadingAttachment(attachment.id);
      
      // FIXED: Use fileUrl directly from attachment
      if (attachment.fileUrl) {
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        link.download = attachment.originalName || 'attachment';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Fallback to API download if fileUrl not available
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

  // FIXED: Prepare edit data with new participants structure
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
      location: scheduleData.type === "counseling" ? (scheduleData.location || "") : "",
      customLocation: scheduleData.type !== "counseling" ? (scheduleData.customLocation || "") : "",
      multipleDate: dates.length > 1,
      originalData: scheduleData
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
            
            {/* Agenda & Type - VIEW ONLY */}
            <div className="flex gap-4 items-center">
              <span className="material-icons text-[#488BBA] text-[25px]">list_alt</span>
              <div className="flex-1 relative">
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {scheduleData.agenda || "No Title"}
                </div>
              </div>
              <div className="relative">
                <div
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md min-w-[120px] bg-gray-50"
                >
                  <span style={{ color: selectedEventType.textColor }} className="font-medium">
                    {selectedEventType.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Date & Time - VIEW ONLY */}
            <div className="flex gap-4 items-start">
              <span className="material-icons text-[#488BBA] text-[25px] mt-1">schedule</span>
              <div className="flex-1 space-y-3">
                {dates.map((dateInfo, index) => (
                  <div key={index} className="flex gap-2 items-center flex-wrap">
                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                      {formatDate(dateInfo.date)}
                    </div>
                    
                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                      {dateInfo.startTime}
                    </div>

                    <span className="text-[#488BBA]">-</span>

                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                      {dateInfo.endTime}
                    </div>

                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                      {dateInfo.timezone || "WIB"}
                    </div>
                  </div>
                ))}

                {dates.length > 1 && (
                  <div className="flex gap-2 items-center text-sm">
                    <div className="flex shrink-0 w-4 h-4 bg-[#535353] border border-[#535353] rounded-sm">
                      <span className="material-icons text-white text-xs leading-none">check</span>
                    </div>
                    <span className="text-[#535353]">Multiple Date</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notification - VIEW ONLY */}
            <div className="flex gap-4 items-center">
              <span className="material-icons text-[#488BBA] text-[25px]">notifications_active</span>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {getNotificationText(scheduleData.notificationOffset)}
              </div>
            </div>

            {/* Participants - VIEW ONLY (Only for Counseling) */}
            {showParticipants && (
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <span className="material-icons text-[#488BBA] text-[25px] mt-1">account_circle</span>
                  <div className="flex-1">
                    
                    <div className="flex flex-col gap-4">
                      
                      {/* Psychologist Field - VIEW ONLY */}
                      <div>
                        <div className="relative">
                          <div className="w-full py-2 px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700" style={{ minHeight: '42px' }}>
                            {getPsychologist() ? (
                              <div className="flex items-center gap-2 py-1">
                                <div className="px-2.5 py-1 bg-[#eeeeee] rounded-[5px] flex items-center gap-2 max-w-full">
                                  <div className="text-[#535353] text-sm font-normal truncate">
                                    {getPsychologist().fullName || getPsychologist().email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">
                                Tidak ada psikolog
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Participant 1 Field - VIEW ONLY */}
                      <div>
                        <div className="relative">
                          <div className="w-full py-2 px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700" style={{ minHeight: '42px' }}>
                            {getClients()[0] ? (
                              <div className="flex items-center gap-2 py-1">
                                <div className="px-2.5 py-1 bg-[#eeeeee] rounded-[5px] flex items-center gap-2 max-w-full">
                                  <div className="text-[#535353] text-sm font-normal truncate">
                                    {getClients()[0].fullName || getClients()[0].email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">
                                Tidak ada klien 1
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Participant 2 Field - VIEW ONLY (Optional) */}
                      <div>
                        <div className="relative">
                          <div className="w-full py-2 px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700" style={{ minHeight: '42px' }}>
                            {getClients()[1] ? (
                              <div className="flex items-center gap-2 py-1">
                                <div className="px-2.5 py-1 bg-[#eeeeee] rounded-[5px] flex items-center gap-2 max-w-full">
                                  <div className="text-[#535353] text-sm font-normal truncate">
                                    {getClients()[1].fullName || getClients()[1].email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">
                                Tidak ada klien 2 (Opsional)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location for Counseling - VIEW ONLY with Zoom integration */}
                <div className="flex gap-4 items-center">
                  <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                      {getLocationText()}
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

            {/* Custom Location - for non-counseling - VIEW ONLY */}
            {!showParticipants && (
              <div className="flex gap-4 items-center">
                <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
                <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {getLocationText()}
                </div>
              </div>
            )}

            {/* Description & Attachments - VIEW ONLY */}
            <div className="flex gap-4 items-start">
              <span className="material-icons text-[#488BBA] text-[25px] mt-1">description</span>
              <div className="flex-1">
                <div className="border border-gray-300 rounded-md min-h-[100px] p-3 bg-gray-50">
                  <div
                    className="min-h-[60px] text-gray-700"
                    style={{ wordBreak: 'break-word' }}
                    dangerouslySetInnerHTML={{
                      __html: scheduleData.description || "Tidak ada deskripsi",
                    }}
                  />
                  
                  {/* Enhanced Attachments */}
                  {scheduleData.attachments && scheduleData.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                      {scheduleData.attachments.map((attachment, index) => (
                        <button
                          key={attachment.id || index}
                          onClick={() => handleAttachmentClick(attachment)}
                          disabled={downloadingAttachment === attachment.id}
                          className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 group"
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
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex gap-3 justify-end">
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

      {/* Edit Modal */}
      {showEditModal && (
        <AddScheduleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          initialData={prepareEditData()}
          loading={loading}
          mode="edit"
        />
      )}
    </>
  );
};

export default ViewScheduleModal;