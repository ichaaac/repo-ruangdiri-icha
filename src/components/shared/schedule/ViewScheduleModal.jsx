// src/components/shared/schedule/ViewScheduleModal.jsx - FIXED STATE PERSISTENCE AFTER EDIT

import React, { useState, useEffect } from "react";
import AddScheduleModal from "./AddScheduleModal"; // Import AddScheduleModal for edit

const ViewScheduleModal = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  scheduleData: initialScheduleData,
  loading = false,
}) => {
  const [downloadingAttachment, setDownloadingAttachment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [scheduleData, setScheduleData] = useState(initialScheduleData); // Local state for schedule data

  // FIXED: Update local state when prop changes
  useEffect(() => {
    if (initialScheduleData) {
      setScheduleData(initialScheduleData);
    }
  }, [initialScheduleData]);

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
    const dates = [];
    
    if (scheduleData.dates && scheduleData.dates.length > 0) {
      return scheduleData.dates.map(dateInfo => ({
        ...dateInfo,
        timezone: dateInfo.timezone || "WIB"
      }));
    }
    
    // Fallback to startDateTime/endDateTime
    if (scheduleData.startDateTime || scheduleData.date) {
      const dateStr = scheduleData.date || 
        (scheduleData.startDateTime ? new Date(scheduleData.startDateTime).toISOString().split("T")[0] : "");
      const startTime = scheduleData.startTime ||
        (scheduleData.startDateTime ? new Date(scheduleData.startDateTime).toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit"
        }) : "");
      const endTime = scheduleData.endTime ||
        (scheduleData.endDateTime ? new Date(scheduleData.endDateTime).toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit"
        }) : "");

      dates.push({ 
        date: dateStr, 
        startTime: startTime, 
        endTime: endTime, 
        timezone: scheduleData.timezone || "WIB" 
      });
    }
    
    return dates;
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

  const getPsychologist = () => {
    if (scheduleData.type === "counseling" && scheduleData.participants) {
      return scheduleData.participants.find((p) => p.role === "psychologist");
    }
    return null;
  };

  const getClients = () => {
    if (scheduleData.type === "counseling" && scheduleData.participants) {
      return scheduleData.participants.filter((p) => p.role !== "psychologist");
    }
    return [];
  };

  const getLocationText = () => {
    if (scheduleData.type === "counseling") {
      return scheduleData.location || "Lokasi tidak ditentukan";
    } else {
      return scheduleData.customLocation || scheduleData.location || "Lokasi tidak ditentukan";
    }
  };

  // Enhanced attachment handlers for new API structure
  const handleAttachmentClick = async (attachment) => {
    const isImage = attachment.fileType?.includes('image') || 
      attachment.originalName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    if (isImage) {
      // Images: open in new window with proper URL handling
      try {
        let imageUrl = attachment.fileUrl;
        if (!imageUrl) {
          imageUrl = `/api/schedules/${scheduleData.id}/attachments/${attachment.id}/preview`;
        }
        
        // Create a temporary link to test if URL is accessible
        const testImage = new Image();
        testImage.onload = () => {
          window.open(imageUrl, '_blank');
        };
        testImage.onerror = () => {
          // Fallback: try to download instead
          handleDocumentDownload(attachment);
        };
        testImage.src = imageUrl;
        
      } catch (error) {
        console.error('Error opening image:', error);
        alert('Gagal membuka gambar');
      }
    } else {
      // Documents: download
      handleDocumentDownload(attachment);
    }
  };

  const handleDocumentDownload = async (attachment) => {
    try {
      setDownloadingAttachment(attachment.id);
      
      // Try direct URL first with new field name
      if (attachment.fileUrl) {
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        link.download = attachment.originalName || 'attachment';
        link.target = '_blank'; // Open in new tab if download fails
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Fallback to API download
      const response = await fetch(`/api/schedules/${scheduleData.id}/attachments/${attachment.id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Get filename from response headers or use default
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
    const type = attachment.fileType || attachment.mimeType || '';
    const extension = attachment.originalName?.split('.').pop()?.toLowerCase() || '';
    
    if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (type.includes('pdf') || extension === 'pdf') {
      return 'picture_as_pdf';
    } else if (type.includes('word') || ['doc', 'docx'].includes(extension)) {
      return 'description';
    } else if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension)) {
      return 'table_chart';
    } else {
      return 'description';
    }
  };

  const getFileTypeLabel = (attachment) => {
    const isImage = attachment.fileType?.includes('image') || 
      attachment.originalName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    return isImage ? 'Preview' : 'Download';
  };

  // FIXED: Enhanced edit handling with proper state update
  const handleEdit = () => {
    if (loading) return;
    setShowEditModal(true);
  };

  const handleEditSubmit = async (formData) => {
    try {
      if (onEdit) {
        const result = await onEdit(scheduleData.id, formData);
        
        // FIXED: Update local state with the new data to persist changes
        if (result?.data?.data) {
          // Backend returned updated schedule data
          setScheduleData(result.data.data);
        } else {
          // Optimistically update local state with form data
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
            // Update participants if provided
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
        
        setShowEditModal(false); // Close edit modal on success
        // Note: Don't close view modal here - let user see updated data
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      // Keep edit modal open on error so user can retry
      throw error;
    }
  };

  const handleDelete = () => {
    if (onDelete && !loading) {
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

  // FIXED: Prepare edit data with better transformation
  const prepareEditData = () => {
    const psychologist = getPsychologist();
    const clients = getClients();
    
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
      location: scheduleData.type === "counseling" ? (scheduleData.location || "") : "",
      customLocation: scheduleData.type !== "counseling" ? (scheduleData.customLocation || scheduleData.location || "") : "",
      multipleDate: dates.length > 1,
      // Pass original data for reference
      originalData: scheduleData
    };
  };

  const showParticipants = scheduleData.type === "counseling";

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
              disabled={loading}
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

                {/* Location for Counseling - VIEW ONLY */}
                <div className="flex gap-4 items-center">
                  <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
                  <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {getLocationText()}
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
                      disabled={loading}
                      className="w-12 h-12 flex items-center justify-center text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Hapus jadwal"
                    >
                      <span className="material-icons text-[20px]">delete</span>
                    </button>
                    <button
                      onClick={handleEdit}
                      disabled={loading}
                      className="px-6 py-2 bg-[#488BBA] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 font-medium"
                    >
                      {loading ? "Loading..." : "Edit"}
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
                <span className="text-[#488BBA] font-medium">Loading...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FIXED: Edit Modal with proper data preparation */}
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