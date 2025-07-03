import React, { useEffect } from "react";

const ViewScheduleModal = ({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  scheduleData,
  loading = false 
}) => {
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
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

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

  const getParticipantsText = () => {
    if (scheduleData.participants && scheduleData.participants.length > 0) {
      return scheduleData.participants.map(p => p.email || p.name).join(', ');
    }
    if (scheduleData.userEmails && scheduleData.userEmails.length > 0) {
      return scheduleData.userEmails.join(', ');
    }
    return 'Tidak ada peserta';
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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={handleOverlayClick}
    >
      <div className="flex flex-col w-[544px] h-[479px] items-center justify-center gap-2.5 p-[25px] relative bg-white rounded-[0px_0px_5px_5px] shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10 disabled:opacity-50"
        >
          <span className="material-icons text-[20px]">close</span>
        </button>

        <div className="inline-flex flex-col items-end gap-[81px] relative flex-[0_0_auto]">
          <div className="flex flex-col w-[490px] items-start gap-[15px] relative flex-[0_0_auto]">
            
            {/* Title and Type */}
            <div className="flex h-6 items-center gap-[15px] relative self-stretch w-full">
              <span className="material-icons text-[#535353] text-[25px]">list_alt</span>

              <div className="inline-flex h-[35px] items-center gap-[147px] relative flex-[0_0_auto] mt-[-5.50px] mb-[-5.50px] rounded-[5px]">
                <div className="relative w-fit [font-family:'Public_Sans-Bold',Helvetica] font-bold text-[#535353] text-base text-center tracking-[0] leading-[normal] whitespace-nowrap">
                  {scheduleData.agenda || scheduleData.name || "No Title"}
                </div>

                <div className="flex flex-col w-[73px] h-[22px] items-center justify-around gap-2.5 px-[11px] py-1.5 relative bg-[#eeeeee] rounded-[5px]">
                  <div className="inline-flex items-center justify-center gap-[5px] relative flex-[0_0_auto] ml-[-2.50px] mr-[-2.50px]">
                    <div className="inline-flex items-center gap-[18px] relative flex-[0_0_auto]">
                      <div 
                        className="relative w-fit mt-[-1.00px] [font-family:'Public_Sans-Regular',Helvetica] font-normal text-xs text-center tracking-[0] leading-[normal] whitespace-nowrap"
                        style={{ color: getTypeColor(scheduleData.type) }}
                      >
                        {getTypeLabel(scheduleData.type)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="inline-flex flex-col items-start justify-center gap-2.5 relative flex-[0_0_auto]">
              <div className="inline-flex flex-col items-start gap-2.5 relative flex-[0_0_auto]">
                <div className="flex items-start gap-[15px] relative self-stretch w-full flex-[0_0_auto]">
                  <span className="material-icons text-[#535353] text-[25px]">schedule</span>

                  <div className="inline-flex flex-col items-start justify-center gap-3 px-0 py-1.5 relative flex-[0_0_auto]">
                    {dates.map((dateInfo, index) => (
                      <div key={index} className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
                        <div className="inline-flex items-center gap-[31px] relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Public_Sans-Regular',Helvetica] font-normal text-[#535353] text-base tracking-[0] leading-[normal] whitespace-nowrap">
                            {formatDate(dateInfo.date)}
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-[31px] relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Public_Sans-Regular',Helvetica] font-normal text-[#535353] text-base tracking-[0] leading-[normal] whitespace-nowrap">
                            {formatTime(dateInfo.startTime)}
                          </div>
                        </div>

                        <div className="inline-flex flex-col items-center justify-center gap-2.5 relative flex-[0_0_auto]">
                          <div className="relative self-stretch mt-[-1.00px] [font-family:'Public_Sans-Regular',Helvetica] font-normal text-[#535353] text-base tracking-[0] leading-[normal]">
                            -
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-[31px] relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Public_Sans-Regular',Helvetica] font-normal text-[#535353] text-base tracking-[0] leading-[normal] whitespace-nowrap">
                            {formatTime(dateInfo.endTime)} {scheduleData.timezoneDisplay || 'WIB'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification */}
            <div className="inline-flex items-center gap-[15px] relative flex-[0_0_auto]">
              <span className="material-icons text-[#535353] text-[23px]">notifications_active</span>

              <div className="inline-flex items-center gap-[5px] relative flex-[0_0_auto]">
                <div className="relative w-fit mt-[-1.00px] [font-family:'Public_Sans-Regular',Helvetica] font-normal text-[#535353] text-base text-center tracking-[0] leading-[normal] whitespace-nowrap">
                  {getNotificationText(scheduleData.notificationOffset)}
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="inline-flex items-center justify-end gap-3 relative flex-[0_0_auto]">
              <span className="material-icons text-[#535353] text-[25px]">person</span>

              <div className="inline-flex flex-col items-start gap-2.5 relative flex-[0_0_auto]">
                <div className="items-center gap-5 flex-[0_0_auto] flex w-[450px] relative rounded-[5px]">
                  <div className="inline-flex items-center gap-2.5 relative flex-[0_0_auto]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Public_Sans-Regular',Helvetica] font-normal text-[#535353] text-base text-center tracking-[0] leading-[normal] break-words max-w-[400px]">
                      {getParticipantsText()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="inline-flex items-center gap-[18px] relative flex-[0_0_auto]">
              <span className="material-icons text-[#535353] text-[25px]">location_on</span>

              <div className="justify-center gap-[54px] inline-flex flex-col items-start relative flex-[0_0_auto]">
                <div className="h-[23px] items-center gap-5 px-0 py-2 flex w-[450px] relative rounded-[5px]">
                  <p className="relative w-fit mt-[-3.00px] mb-[-2.00px] [font-family:'Public_Sans-Regular',Helvetica] font-normal text-[#535353] text-base text-center tracking-[0] leading-[normal] break-words max-w-[400px]">
                    {scheduleData.location || scheduleData.platform || 'Lokasi tidak ditentukan'}
                  </p>

                  <span className="material-icons text-[#535353] text-[20px] mt-[-6.50px] mb-[-6.50px]">assistant_navigation</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="inline-flex h-[91px] items-start gap-[15px] relative">
              <span className="material-icons text-[#535353] text-[25px]">description</span>

              <div className="h-[91px] gap-[15px] inline-flex flex-col items-start relative flex-[0_0_auto]">
                <div className="flex-col h-[115px] items-start gap-3.5 px-0 py-[5px] mb-[-24.00px] flex w-[450px] relative rounded-[5px]">
                  <div 
                    className="relative w-fit mt-[-0.50px] [font-family:'Public_Sans-Regular',Helvetica] font-normal text-[#535353] text-base tracking-[0] leading-[23px] overflow-hidden max-w-[400px]"
                    style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      textOverflow: 'ellipsis'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: scheduleData.description || 'Tidak ada deskripsi tersedia.' 
                    }}
                  />

                  <div className="inline-flex h-[15px] items-center gap-[5px] relative mb-[-28.00px]">
                    <span className="material-icons text-[#535353] text-[15px]">attach_file</span>
                    <span className="material-icons text-[#535353] text-[15px]">photo</span>
                  </div>

                  <div className="relative w-8 h-[15px] mb-[-57.00px]" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="inline-flex items-center gap-[15px] relative flex-[0_0_auto]">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="hover:opacity-75 transition-opacity disabled:opacity-50"
              title="Hapus jadwal"
            >
              <span className="material-icons text-[#535353] text-[20px]">delete</span>
            </button>

            <button
              onClick={handleEdit}
              disabled={loading}
              className="flex w-[114px] h-8 items-center justify-center gap-2.5 px-7 py-2.5 relative bg-[#488abe] rounded-[5px] hover:bg-[#3a7ba3] transition-colors disabled:bg-gray-400"
            >
              <div className="relative w-fit mt-[-1.00px] [font-family:'Public_Sans-SemiBold',Helvetica] font-semibold text-[#f8f8f8] text-base tracking-[0] leading-[74px] whitespace-nowrap">
                {loading ? 'Loading...' : 'Edit'}
              </div>
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-[0px_0px_5px_5px]">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#488abe]"></div>
              <span className="text-[#488abe] font-medium">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewScheduleModal;