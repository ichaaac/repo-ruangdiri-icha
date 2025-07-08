// src/components/shared/schedule/ViewScheduleModal.jsx - Enhanced with Stacking Support

import React from "react";

const ViewScheduleModal = ({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  scheduleData,
  loading = false 
}) => {
  if (!isOpen || !scheduleData) return null;

  const getTypeColor = (type) => {
    const colors = {
      counseling: "#9986FF",
      class: "#3CE69E", 
      seminar: "#FF886D",
      meeting: "#3399E9",
      other: "#979797"
    };
    return colors[type] || colors.other;
  };

  const getTypeLabel = (type) => {
    const labels = {
      counseling: "Konseling",
      class: "Kelas", 
      seminar: "Seminar",
      meeting: "Meeting",
      other: "Lainnya"
    };
    return labels[type] || "Lainnya";
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString || '';
  };

  // Handle multiple dates if available
  const dates = scheduleData.dates || [];
  
  // If no dates array, construct from individual date/time fields
  if (dates.length === 0) {
    if (scheduleData.startDateTime || scheduleData.date) {
      const dateStr = scheduleData.date || 
        (scheduleData.startDateTime ? new Date(scheduleData.startDateTime).toISOString().split('T')[0] : '');
      const startTime = scheduleData.startTime || 
        (scheduleData.startDateTime ? new Date(scheduleData.startDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
      const endTime = scheduleData.endTime || 
        (scheduleData.endDateTime ? new Date(scheduleData.endDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
      
      dates.push({
        date: dateStr,
        startTime: startTime,
        endTime: endTime
      });
    }
  }

  const getNotificationText = (offset) => {
    if (!offset) return '1 jam';
    if (offset >= 1440) return `${Math.floor(offset / 1440)} hari`;
    if (offset >= 60) return `${Math.floor(offset / 60)} jam`;
    return `${offset} menit`;
  };

  // ENHANCED: Better participant handling for both counseling and non-counseling
  const getParticipantsText = () => {
    if (scheduleData.participants && scheduleData.participants.length > 0) {
      return scheduleData.participants.map(p => `${p.fullName || p.name} (${p.email})`).join(', ');
    }
    if (scheduleData.userEmails && scheduleData.userEmails.length > 0) {
      return scheduleData.userEmails.join(', ');
    }
    return 'Tidak ada peserta';
  };

  // ENHANCED: Get location text based on schedule type
  const getLocationText = () => {
    if (scheduleData.type === "counseling") {
      return scheduleData.location || 'Lokasi tidak ditentukan';
    } else {
      return scheduleData.customLocation || scheduleData.location || 'Lokasi tidak ditentukan';
    }
  };

  // ENHANCED: Get psychologist from participants for counseling
  const getPsychologist = () => {
    if (scheduleData.type === "counseling" && scheduleData.participants) {
      return scheduleData.participants.find(p => p.role === 'psychologist');
    }
    return null;
  };

  // ENHANCED: Get clients from participants for counseling
  const getClients = () => {
    if (scheduleData.type === "counseling" && scheduleData.participants) {
      return scheduleData.participants.filter(p => p.role !== 'psychologist');
    }
    return [];
  };

  const handleEdit = () => {
    if (onEdit && !loading) {
      onEdit(scheduleData);
    }
  };

  const handleDelete = () => {
    if (onDelete && !loading) {
      if (window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
        onDelete(scheduleData);
      }
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const psychologist = getPsychologist();
  const clients = getClients();
  const isCounseling = scheduleData.type === "counseling";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-4">
            <span className="material-icons text-[#488BBA] text-[25px]">list_alt</span>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-800">
                {scheduleData.agenda || scheduleData.name || "No Title"}
              </h2>
              <div 
                className="px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: getTypeColor(scheduleData.type) }}
              >
                {getTypeLabel(scheduleData.type)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <span className="material-icons text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Date and Time */}
          <div className="flex gap-4 items-start">
            <span className="material-icons text-[#488BBA] text-[25px] mt-1">schedule</span>
            <div className="flex-1 space-y-2">
              {dates.map((dateInfo, index) => (
                <div key={index} className="flex items-center gap-4 text-gray-700">
                  <div className="min-w-[100px]">
                    <span className="font-medium">{formatDate(dateInfo.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{formatTime(dateInfo.startTime)}</span>
                    <span className="text-[#488BBA]">-</span>
                    <span>{formatTime(dateInfo.endTime)}</span>
                    <span className="text-sm text-gray-500">
                      {scheduleData.timezoneDisplay || 'WIB'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification */}
          <div className="flex gap-4 items-center">
            <span className="material-icons text-[#488BBA] text-[25px]">notifications_active</span>
            <div className="text-gray-700">
              Pengingat: {getNotificationText(scheduleData.notificationOffset)}
            </div>
          </div>

          {/* ENHANCED: Counseling-specific participants section */}
          {isCounseling && (
            <div className="space-y-4">
              {/* Psychologist */}
              {psychologist && (
                <div className="flex gap-4 items-start">
                  <span className="material-icons text-[#488BBA] text-[25px] mt-1">psychology</span>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">Psikolog</div>
                    <div className="bg-[#535353] text-white px-3 py-2 rounded-md">
                      <div className="font-medium">{psychologist.fullName}</div>
                      <div className="text-gray-300 text-sm">{psychologist.email}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Clients */}
              {clients.length > 0 && (
                <div className="flex gap-4 items-start">
                  <span className="material-icons text-[#488BBA] text-[25px] mt-1">person</span>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">
                      Klien ({clients.length})
                    </div>
                    <div className="space-y-2">
                      {clients.map((client, index) => (
                        <div key={index} className="bg-[#535353] text-white px-3 py-2 rounded-md">
                          <div className="font-medium">{client.fullName}</div>
                          <div className="text-gray-300 text-sm">{client.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ENHANCED: Non-counseling participants */}
          {!isCounseling && scheduleData.participants && scheduleData.participants.length > 0 && (
            <div className="flex gap-4 items-start">
              <span className="material-icons text-[#488BBA] text-[25px] mt-1">group</span>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">
                  Peserta ({scheduleData.participants.length})
                </div>
                <div className="text-gray-700 break-words">
                  {getParticipantsText()}
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex gap-4 items-start">
            <span className="material-icons text-[#488BBA] text-[25px] mt-1">location_on</span>
            <div className="flex-1">
              <div className="text-gray-700 break-words">
                {getLocationText()}
              </div>
            </div>
          </div>

          {/* Description */}
          {scheduleData.description && (
            <div className="flex gap-4 items-start">
              <span className="material-icons text-[#488BBA] text-[25px] mt-1">description</span>
              <div className="flex-1">
                <div 
                  className="text-gray-700 break-words max-h-[200px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ 
                    __html: scheduleData.description 
                  }}
                />
              </div>
            </div>
          )}

          {/* ENHANCED: Attachments with better display */}
          {(scheduleData.attachments && scheduleData.attachments.length > 0) && (
            <div className="flex gap-4 items-start">
              <span className="material-icons text-[#488BBA] text-[25px] mt-1">attach_file</span>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-2">
                  Lampiran ({scheduleData.attachments.length})
                </div>
                <div className="space-y-2">
                  {scheduleData.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="material-icons text-gray-400 text-sm">
                        {attachment.type?.includes('image') ? 'image' : 'description'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {attachment.name || attachment.filename || `Attachment ${index + 1}`}
                        </div>
                        {attachment.size && (
                          <div className="text-xs text-gray-500">
                            {Math.round(attachment.size / 1024)} KB
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ENHANCED: Stack information for conflicting schedules */}
          {scheduleData.totalStacks > 1 && (
            <div className="flex gap-4 items-start bg-blue-50 p-3 rounded-md">
              <span className="material-icons text-blue-600 text-[20px] mt-1">info</span>
              <div className="flex-1 text-sm">
                <div className="font-medium text-blue-800 mb-1">Jadwal Bertumpuk</div>
                <div className="text-blue-700">
                  Ada {scheduleData.totalStacks} jadwal pada waktu yang sama. 
                  Jadwal ini ditampilkan sebagai stack ke-{(scheduleData.stackIndex || 0) + 1}.
                </div>
              </div>
            </div>
          )}

          {/* Created/Updated Info */}
          {scheduleData.createdAt && (
            <div className="border-t pt-4 text-sm text-gray-500">
              <div>Dibuat: {new Date(scheduleData.createdAt).toLocaleString('id-ID')}</div>
              {scheduleData.updatedAt && scheduleData.updatedAt !== scheduleData.createdAt && (
                <div>Diperbarui: {new Date(scheduleData.updatedAt).toLocaleString('id-ID')}</div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
              title="Hapus jadwal"
            >
              <span className="material-icons text-[20px]">delete</span>
              <span>Hapus</span>
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                onClick={handleEdit}
                disabled={loading}
                className="px-6 py-2 bg-[#488BBA] text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Edit'}
              </button>
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
  );
};

export default ViewScheduleModal;