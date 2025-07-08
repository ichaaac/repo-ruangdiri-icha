import React, { useState } from "react";

const ViewScheduleModal = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  scheduleData,
  loading = false,
}) => {
  const [downloadingAttachment, setDownloadingAttachment] = useState(null);

  if (!isOpen || !scheduleData) return null;

  // Event types with colors
  const eventTypes = [
    { label: "Konseling", value: "counseling", textColor: "#9986FF" },
    { label: "Kelas", value: "class", textColor: "#3CE69E" },
    { label: "Seminar", value: "seminar", textColor: "#FF886D" },
    { label: "Lainnya", value: "others", textColor: "#979797" }
  ];

  const selectedEventType = eventTypes.find(type => type.value === scheduleData.type) || eventTypes[0];

  // Handle multiple dates
  const dates = scheduleData.dates || [];
  if (dates.length === 0) {
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

      dates.push({ date: dateStr, startTime: startTime, endTime: endTime, timezone: "Asia/Jakarta" });
    }
  }

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

  const getParticipantsText = () => {
    const psychologist = getPsychologist();
    const clients = getClients();
    const emails = [];
    
    if (psychologist) emails.push(psychologist.email);
    clients.forEach(client => emails.push(client.email));
    
    return emails.join(", ") || "Tidak ada peserta";
  };

  const getLocationText = () => {
    if (scheduleData.type === "counseling") {
      return scheduleData.location || "Lokasi tidak ditentukan";
    } else {
      return scheduleData.customLocation || scheduleData.location || "Lokasi tidak ditentukan";
    }
  };

  // Attachment handlers
  const handleAttachmentClick = async (attachment) => {
    const isImage = attachment.type?.includes('image') || 
      attachment.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    if (isImage) {
      // Images: open in new window
      let imageUrl = attachment.url;
      if (!imageUrl) {
        imageUrl = `/api/schedules/${scheduleData.id}/attachments/${attachment.id}/preview`;
      }
      window.open(imageUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    } else {
      // Documents: download
      try {
        setDownloadingAttachment(attachment.id);
        
        if (attachment.url) {
          const link = document.createElement('a');
          link.href = attachment.url;
          link.download = attachment.name || attachment.filename || 'attachment';
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
        
        if (!response.ok) throw new Error('Failed to download attachment');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name || attachment.filename || 'attachment';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
      } catch (error) {
        console.error('Download error:', error);
        alert('Gagal mengunduh file');
      } finally {
        setDownloadingAttachment(null);
      }
    }
  };

  const getFileIcon = (attachment) => {
    const type = attachment.type || attachment.mimeType || '';
    const extension = attachment.name?.split('.').pop()?.toLowerCase() || '';
    
    if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else {
      return 'description';
    }
  };

  const handleEdit = () => {
    if (onEdit && !loading) {
      onEdit(scheduleData);
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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <span className="material-icons text-[24px]">close</span>
          </button>
        </div>

        <div className="px-8 pb-8 space-y-6">
          
          {/* Title & Type Badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#488BBA] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-white text-[20px]">list_alt</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 leading-tight">
                  {scheduleData.agenda || scheduleData.name || "No Title"}
                </h2>
              </div>
            </div>
            <div
              className="px-3 py-1 rounded-full text-white text-sm font-medium flex-shrink-0"
              style={{ backgroundColor: selectedEventType.textColor }}
            >
              {selectedEventType.label}
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-[#488BBA] text-[24px]">schedule</span>
            </div>
            <div className="space-y-1">
              {dates.map((dateInfo, index) => (
                <div key={index} className="text-gray-700">
                  <span className="font-medium">{formatDate(dateInfo.date)}</span>
                  <span className="ml-4">
                    {dateInfo.startTime} - {dateInfo.endTime} {
                      dateInfo.timezone === "Asia/Jakarta" ? "WIB" : 
                      dateInfo.timezone === "Asia/Makassar" ? "WITA" : 
                      dateInfo.timezone === "Asia/Jayapura" ? "WIT" : "WIB"
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notification */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-[#488BBA] text-[24px]">notifications</span>
            </div>
            <div className="text-gray-700">
              {getNotificationText(scheduleData.notificationOffset)}
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-[#488BBA] text-[24px]">account_circle</span>
            </div>
            <div className="text-gray-700 break-words">
              {getParticipantsText()}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-[#488BBA] text-[24px]">place</span>
            </div>
            <div className="text-gray-700 break-words">
              {getLocationText()}
            </div>
          </div>

          {/* Description */}
          {scheduleData.description && (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-[#488BBA] text-[24px]">article</span>
              </div>
              <div 
                className="text-gray-700 break-words max-h-[200px] overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: scheduleData.description,
                }}
              />
            </div>
          )}

          {/* Attachments */}
          {scheduleData.attachments && scheduleData.attachments.length > 0 && (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-[#488BBA] text-[24px]">attach_file</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {scheduleData.attachments.map((attachment, index) => (
                  <button
                    key={index}
                    onClick={() => handleAttachmentClick(attachment)}
                    disabled={downloadingAttachment === attachment.id}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    title={attachment.type?.includes('image') ? 'Klik untuk preview' : 'Klik untuk download'}
                  >
                    {downloadingAttachment === attachment.id ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-icons text-[18px] text-gray-600">
                        {getFileIcon(attachment)}
                      </span>
                    )}
                    <span className="text-sm text-gray-700 max-w-[150px] truncate">
                      {attachment.name || `File ${index + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
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
              className="px-6 py-3 bg-[#488BBA] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 font-medium"
            >
              {loading ? "Loading..." : "Edit"}
            </button>
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
  );
};

export default ViewScheduleModal;