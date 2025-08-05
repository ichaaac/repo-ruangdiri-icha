// src/components/shared/booking/BookingSession.jsx

import React, { useState, useEffect } from 'react';
import { useBooking } from './hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';

// Back Arrow Component
const BackArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex p-[5px] items-center gap-2.5 rounded-[3px] bg-[#8CC3EE] w-[26px] h-[26px]"
    aria-label="Go back"
  >
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[26px] h-[26px]"
    >
      <rect width="26" height="26" rx="3" fill="#8CC3EE" />
      <path
        d="M8.825 14L14.425 19.6L13 21L5 13L13 5L14.425 6.4L8.825 12H21V14H8.825Z"
        fill="white"
      />
    </svg>
  </button>
);

// Calendar Component - FIXED
const Calendar = ({ selectedDate, onDateSelect, availableDates = [], isOpen, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isAvailable = availableDates.some(d => d.value === dateStr);
      const isSelected = selectedDate === dateStr;
      const isPast = new Date(dateStr) < new Date().setHours(0, 0, 0, 0);
      const isToday = new Date(dateStr).toDateString() === new Date().toDateString();
      
      days.push({
        day,
        dateStr,
        isAvailable: isAvailable && !isPast,
        isSelected,
        isPast,
        isToday
      });
    }
    
    return days;
  };
  
  // FIXED: Proper month navigation
  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };
  
  const prevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };
  
  const days = getDaysInMonth(currentMonth);
  
  if (!isOpen) return null;
  
  return (
    // FIXED: Better positioning to prevent cutoff
    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] p-4 w-80 max-h-96 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prevMonth();
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <span className="material-icons text-gray-600 text-lg">chevron_left</span>
        </button>
        
        <h3 className="text-sm font-semibold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nextMonth();
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <span className="material-icons text-gray-600 text-lg">chevron_right</span>
        </button>
      </div>
      
      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-xs text-gray-500 text-center py-2 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto">
        {days.map((dayObj, index) => {
          if (!dayObj) {
            return <div key={index} className="h-9"></div>;
          }
          
          const { day, dateStr, isAvailable, isSelected, isPast, isToday } = dayObj;
          
          let dayClasses = 'h-9 text-sm rounded-full flex items-center justify-center transition-all duration-200 ';
          
          if (isSelected) {
            dayClasses += 'bg-[#488BBA] text-white font-semibold shadow-md';
          } else if (isToday) {
            dayClasses += 'bg-blue-50 text-[#488BBA] font-semibold border border-[#488BBA]';
          } else if (isAvailable) {
            dayClasses += 'hover:bg-blue-50 text-gray-800 cursor-pointer hover:text-[#488BBA]';
          } else if (isPast) {
            dayClasses += 'text-gray-300 cursor-not-allowed';
          } else {
            dayClasses += 'text-gray-400 cursor-not-allowed';
          }
          
          return (
            <button
              key={day}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isAvailable) {
                  onDateSelect(dateStr);
                  onClose();
                }
              }}
              disabled={!isAvailable}
              className={dayClasses}
            >
              {day}
            </button>
          );
        })}
      </div>
      
      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

// Main BookingSession Component
const BookingSession = ({ userType = "student", selectedMethod, onBack, onSuccess }) => {
  const { user } = useAuth();
  const {
    counselingMethods,
    timeSlots,
    locations,
    selectedDate,
    selectedTimeSlot,
    selectedLocation,
    notes,
    loading,
    errors,
    handleMethodSelection,
    handleDateSelection,
    handleTimeSlotSelection,
    handleLocationSelection,
    handleBookingSubmit,
    setNotes,
    showConfirmModal,
    setShowConfirmModal
  } = useBooking(userType);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Set selected method from props when component mounts
  useEffect(() => {
    if (selectedMethod && !loading.methods) {
      handleMethodSelection(selectedMethod);
    }
  }, [selectedMethod, handleMethodSelection, loading.methods]);

  // Generate available dates (next 30 days, excluding weekends for demo)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for demo
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })
        });
      }
    }
    
    return dates;
  };

  const availableDates = getAvailableDates();
  const selectedDateObject = availableDates.find(date => date.value === selectedDate);

  // Check if form is valid for button enabling
  const isFormValid = () => {
    const hasRequiredFields = selectedMethod && selectedDate && selectedTimeSlot;
    const hasLocationIfOffline = selectedMethod?.id !== 'offline' || selectedLocation;
    return hasRequiredFields && hasLocationIfOffline;
  };

  // FIXED: Back button navigation to BookingPage
  const handleBack = () => {
    if (isFormValid()) {
      setShowConfirmModal(true);
    } else {
      // Navigate back to BookingPage instead of using callback
      window.history.back();
    }
  };

  const handleCancel = () => {
    if (isFormValid()) {
      setShowConfirmModal(true);
    } else {
      // Navigate back to BookingPage
      window.history.back();
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await handleBookingSubmit();
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Booking submission error:', error);
    }
  };

  const getTermsContent = () => {
    const methodId = selectedMethod?.id || 'online';
    
    const termsMap = {
      'online': '• Pengguna diharapkan hadir tepat waktu sesuai jadwal yang telah ditentukan. Link Zoom akan dikirimkan ke email dan WA kamu 1 jam sebelum sesi dan toleransi keterlambatan pada hari H adalah 15 menit.\n• Pengguna diharapkan berada dalam ruangan yang kondusif (di tempat yang tenang dan tidak dalam perjalanan).\n• Perubahan dan pembatalan jadwal dapat dilakukan maksimal H-1 dari jadwal yang telah ditentukan (dengan maksimal 1x perubahan).\n• Tautan untuk mengakses Zoom akan dikirim 1 jam sebelum sesi konseling.',
      'offline': '• Pengguna diharapkan hadir tepat waktu sesuai jadwal yang telah ditentukan dengan toleransi keterlambatan 15 menit.\n• Pengguna diharapkan datang ke lokasi yang telah ditentukan sesuai dengan alamat yang diberikan.\n• Perubahan dan pembatalan jadwal dapat dilakukan maksimal H-1 dari jadwal yang telah ditentukan (dengan maksimal 1x perubahan).\n• Konfirmasi lokasi dan detail sesi akan dikirim 1 hari sebelum jadwal konseling.',
      'chat': '• Sesi chat berlangsung selama 15 menit sesuai jadwal yang telah ditentukan.\n• Pengguna dapat mengakses ruang chat 5 menit sebelum jadwal dimulai.\n• Perubahan jadwal dapat dilakukan maksimal 2 jam sebelum sesi dimulai.\n• Link akses chat akan dikirimkan 15 menit sebelum sesi dimulai.'
    };
    
    return termsMap[methodId] || termsMap['online'];
  };

  const getTermsTitle = () => {
    const methodId = selectedMethod?.id || 'online';
    
    const titleMap = {
      'online': 'Syarat dan Ketentuan Sesi Konseling Daring Ruang Diri:',
      'offline': 'Syarat dan Ketentuan Sesi Konseling Luring Ruang Diri:',
      'chat': 'Syarat dan Ketentuan Sesi Konseling Chat Ruang Diri:'
    };
    
    return titleMap[methodId] || titleMap['online'];
  };

  // Get remaining quota from user data
  const remainingQuota = user?.organization?.remainingQuota || 0;

  return (
    <div className="w-[1440px] h-[810px] relative bg-white overflow-hidden max-w-full max-h-full">
      {/* Background Header */}
      <div className="w-[1440px] h-72 left-0 top-0 absolute bg-gradient-to-b from-teal-200 to-indigo-500 max-w-full" />
      
      {/* Main Content Card */}
      <div className="w-[1322px] h-[668px] left-[59px] top-[142px] absolute bg-white rounded-tl-[10px] rounded-tr-[10px] shadow-[0px_12px_27px_0px_rgba(0,0,0,0.07)] shadow-[0px_49px_49px_0px_rgba(0,0,0,0.06)] shadow-[0px_111px_67px_0px_rgba(0,0,0,0.04)] shadow-[0px_198px_79px_0px_rgba(0,0,0,0.01)] shadow-[0px_309px_86px_0px_rgba(0,0,0,0.00)] max-w-[calc(100%-118px)]" />
      
      {/* Logo */}
      <div className="w-24 left-[670px] top-[26px] absolute inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
        <img 
          src="/logo/ruang-diri-logo-white.svg" 
          alt="RuangDiri Logo"
          className="w-full h-auto"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = '<div class="bg-white bg-opacity-20 rounded-lg flex items-center justify-center w-full h-16"><span class="text-white font-bold text-lg">LOGO</span></div>';
          }}
        />
      </div>

      {/* Blue Line Separator */}
      <div className="w-[1204px] h-0 left-[118px] top-[288px] absolute outline outline-[0.50px] outline-offset-[-0.25px] outline-[#488BBA]" />

      {/* Back Arrow */}
      <div className="left-[115px] top-[196px] absolute">
        <BackArrow onClick={handleBack} />
      </div>

      {/* Header - Aligned with back button */}
      <div className="left-[160px] top-[191px] absolute inline-flex flex-col justify-start items-start gap-5">
        <div className="self-stretch inline-flex justify-start items-center gap-[864px]">
          <div className="justify-start text-[#488BBA] text-5xl font-extrabold font-['Public_Sans'] leading-[74px]">
            Booking Sesi Konseling
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-[970px] left-[257px] top-[329px] absolute inline-flex flex-col justify-start items-start gap-5">
        
        {/* Method Selection */}
        <div className="self-stretch inline-flex justify-start items-center gap-5">
          <div className="w-[454px] inline-flex flex-col justify-center items-start gap-3.5">
            <div className="self-stretch p-2.5 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-gray-500 inline-flex justify-between items-center relative cursor-pointer"
                 onClick={() => setShowMethodDropdown(!showMethodDropdown)}>
              <div className="text-center justify-center text-neutral-600 text-sm font-semibold font-['Public_Sans']">
                {selectedMethod?.name || 'Pilih Jenis Konseling'}
              </div>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0.943359L5 5.94336L0 0.943359L0.8875 0.0558591L5 4.16836L9.1125 0.0558592L10 0.943359Z" fill="#535353"/>
              </svg>
              
              {/* Method Dropdown */}
              {showMethodDropdown && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                  {counselingMethods?.map((method) => (
                    <button
                      key={method.id}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMethodSelection(method);
                        setShowMethodDropdown(false);
                      }}
                    >
                      <div className="font-medium text-sm text-gray-900">{method.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Method Description */}
            <div className="self-stretch flex flex-col justify-center items-start gap-2.5">
              <div className="self-stretch justify-center text-neutral-600 text-sm font-normal font-['Public_Sans'] leading-tight">
                {selectedMethod?.description || 'Pilih jenis konseling terlebih dahulu'}
              </div>
            </div>
          </div>
        </div>

        {/* Date, Time, Subscription Section */}
        <div className="self-stretch inline-flex justify-start items-start gap-11">
          
          {/* Date and Time Column */}
          <div className="w-[454px] inline-flex flex-col justify-start items-end gap-2.5">
            <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
              <div className="self-stretch flex flex-col justify-start items-start gap-3">
                
                {/* Date Label */}
                <div className="w-40 inline-flex justify-start items-start gap-2.5">
                  <div className="text-center justify-center text-neutral-600 text-sm font-bold font-['Public_Sans']">
                    Tanggal
                  </div>
                </div>
                
                {/* Date Picker */}
                <div className="self-stretch h-9 px-2.5 py-3 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-neutral-600 inline-flex justify-between items-center relative cursor-pointer"
                     onClick={() => setShowCalendar(!showCalendar)}>
                  <div className="text-center justify-center">
                    <span className="text-red-500 text-sm font-normal font-['Public_Sans']">*</span>
                    <span className="text-neutral-600 text-sm font-normal font-['Public_Sans']">
                      {selectedDateObject?.label || 'Pilih Tanggal'}
                    </span>
                  </div>
                  <svg width="14" height="17" viewBox="0 0 14 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.55556 16.5C1.12778 16.5 0.761574 16.3433 0.456944 16.03C0.152315 15.7167 0 15.34 0 14.9V3.7C0 3.26 0.152315 2.88333 0.456944 2.57C0.761574 2.25667 1.12778 2.1 1.55556 2.1H2.33333V0.5H3.88889V2.1H10.1111V0.5H11.6667V2.1H12.4444C12.8722 2.1 13.2384 2.25667 13.5431 2.57C13.8477 2.88333 14 3.26 14 3.7V14.9C14 15.34 13.8477 15.7167 13.5431 16.03C13.2384 16.3433 12.8722 16.5 12.4444 16.5H1.55556ZM1.55556 14.9H12.4444V6.9H1.55556V14.9ZM1.55556 5.3H12.4444V3.7H1.55556V5.3ZM7 10.1C6.77963 10.1 6.59491 10.0233 6.44583 9.87C6.29676 9.71667 6.22222 9.52667 6.22222 9.3C6.22222 9.07333 6.29676 8.88333 6.44583 8.73C6.59491 8.57667 6.77963 8.5 7 8.5C7.22037 8.5 7.40509 8.57667 7.55417 8.73C7.70324 8.88333 7.77778 9.07333 7.77778 9.3C7.77778 9.52667 7.70324 9.71667 7.55417 9.87C7.40509 10.0233 7.22037 10.1 7 10.1ZM3.88889 10.1C3.66852 10.1 3.4838 10.0233 3.33472 9.87C3.18565 9.71667 3.11111 9.52667 3.11111 9.3C3.11111 9.07333 3.18565 8.88333 3.33472 8.73C3.4838 8.57667 3.66852 8.5 3.88889 8.5C4.10926 8.5 4.29398 8.57667 4.44306 8.73C4.59213 8.88333 4.66667 9.07333 4.66667 9.3C4.66667 9.52667 4.59213 9.71667 4.44306 9.87C4.29398 10.0233 4.10926 10.1 3.88889 10.1ZM10.1111 10.1C9.89074 10.1 9.70602 10.0233 9.55694 9.87C9.40787 9.71667 9.33333 9.52667 9.33333 9.3C9.33333 9.07333 9.40787 8.88333 9.55694 8.73C9.70602 8.57667 9.89074 8.5 10.1111 8.5C10.3315 8.5 10.5162 8.57667 10.6653 8.73C10.8144 8.88333 10.8889 9.07333 10.8889 9.3C10.8889 9.52667 10.8144 9.71667 10.6653 9.87C10.5162 10.0233 10.3315 10.1 10.1111 10.1ZM7 13.3C6.77963 13.3 6.59491 13.2233 6.44583 13.07C6.29676 12.9167 6.22222 12.7267 6.22222 12.5C6.22222 12.2733 6.29676 12.0833 6.44583 11.93C6.59491 11.7767 6.77963 11.7 7 11.7C7.22037 11.7 7.40509 11.7767 7.55417 11.93C7.70324 12.0833 7.77778 12.2733 7.77778 12.5C7.77778 12.7267 7.70324 12.9167 7.55417 13.07C7.40509 13.2233 7.22037 13.3 7 13.3ZM3.88889 13.3C3.66852 13.3 3.4838 13.2233 3.33472 13.07C3.18565 12.9167 3.11111 12.7267 3.11111 12.5C3.11111 12.2733 3.18565 12.0833 3.33472 11.93C3.4838 11.7767 3.66852 11.7 3.88889 11.7C4.10926 11.7 4.29398 11.7767 4.44306 11.93C4.59213 12.0833 4.66667 12.2733 4.66667 12.5C4.66667 12.7267 4.59213 12.9167 4.44306 13.07C4.29398 13.2233 4.10926 13.3 3.88889 13.3ZM10.1111 13.3C9.89074 13.3 9.70602 13.2233 9.55694 13.07C9.40787 12.9167 9.33333 12.7267 9.33333 12.5C9.33333 12.2733 9.40787 12.0833 9.55694 11.93C9.70602 11.7767 9.89074 11.7 10.1111 11.7C10.3315 11.7 10.5162 11.7767 10.6653 11.93C10.8144 12.0833 10.8889 12.2733 10.8889 12.5C10.8889 12.7267 10.8144 12.9167 10.6653 13.07C10.5162 13.2233 10.3315 13.3 10.1111 13.3Z" fill="#535353"/>
                  </svg>
                  
                  {/* Calendar */}
                  <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelection}
                    availableDates={availableDates}
                    isOpen={showCalendar}
                    onClose={() => setShowCalendar(false)}
                  />
                </div>
              </div>
            </div>
            
            {/* Time Picker */}
            {selectedDate && (
              <div className="self-stretch h-9 px-2.5 py-2 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-neutral-600 flex flex-col justify-between items-start relative cursor-pointer"
                   onClick={() => setShowTimePicker(!showTimePicker)}>
                <div className="self-stretch inline-flex justify-between items-center">
                  <div className="justify-center">
                    <span className="text-red-500 text-sm font-normal font-['Public_Sans']">*</span>
                    <span className="text-neutral-600 text-sm font-normal font-['Public_Sans']">
                      {selectedTimeSlot ? `${selectedTimeSlot.startTime} - ${selectedTimeSlot.endTime} WIB` : 'Pilih Waktu'}
                    </span>
                  </div>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0.943359L5 5.94336L0 0.943359L0.8875 0.0558591L5 4.16836L9.1125 0.0558592L10 0.943359Z" fill="#535353"/>
                  </svg>
                </div>
                
                {/* Time Dropdown */}
                {showTimePicker && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 mt-1">
                    {loading.timeSlots ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Loading available times...</div>
                    ) : timeSlots?.length > 0 ? (
                      timeSlots.map((slot, index) => (
                        <button
                          key={index}
                          className={`w-full px-3 py-2 text-sm text-left border-b border-gray-100 last:border-b-0 ${
                            slot.available 
                              ? 'hover:bg-gray-100 text-gray-900' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (slot.available) {
                              handleTimeSlotSelection(slot);
                              setShowTimePicker(false);
                            }
                          }}
                          disabled={!slot.available}
                        >
                          {slot.displayTime || `${slot.startTime} - ${slot.endTime}`}
                          {!slot.available && ' (Not Available)'}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No available times</div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Location Selection for Offline - FIXED: Now properly shows */}
            {selectedMethod?.id === 'offline' && (
              <div className="self-stretch h-9 px-2.5 py-2 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-neutral-600 flex flex-col justify-between items-start relative cursor-pointer"
                   onClick={() => setShowLocationDropdown(!showLocationDropdown)}>
                <div className="self-stretch inline-flex justify-between items-center">
                  <div className="justify-center">
                    <span className="text-red-500 text-sm font-normal font-['Public_Sans']">*</span>
                    <span className="text-neutral-600 text-sm font-normal font-['Public_Sans']">
                      {selectedLocation?.name || 'Pilih Lokasi Konseling'}
                    </span>
                  </div>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0.943359L5 5.94336L0 0.943359L0.8875 0.0558591L5 4.16836L9.1125 0.0558592L10 0.943359Z" fill="#535353"/>
                  </svg>
                </div>
                
                {/* Location Dropdown */}
                {showLocationDropdown && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-[9998] mt-1">
                    {loading.locations ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Loading locations...</div>
                    ) : locations?.length > 0 ? (
                      locations.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLocationSelection(location);
                            setShowLocationDropdown(false);
                          }}
                        >
                          <div className="font-medium">{location.name}</div>
                          <div className="text-xs text-gray-500">{location.address}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No locations available</div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Wajib diisi - Right aligned */}
            <div className="justify-end">
              <span className="text-red-500 text-[10px] font-normal font-['Public_Sans'] leading-snug">*</span>
              <span className="text-neutral-600 text-[10px] font-normal font-['Public_Sans'] leading-snug">Wajib diisi</span>
            </div>
          </div>
          
          {/* Subscription Type Column */}
          <div className="w-[471px] inline-flex flex-col justify-start items-start gap-3">
            <div className="w-40 inline-flex justify-start items-center gap-2.5">
              <div className="text-center justify-center text-neutral-600 text-sm font-bold font-['Public_Sans']">
                Tipe Langganan
              </div>
            </div>
            <div className="w-[471px] h-9 px-2.5 py-2 bg-zinc-100 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-gray-500 inline-flex justify-start items-center gap-56">
              <div className="flex-1 h-5 rounded-[5px] inline-flex flex-col justify-center items-start gap-2.5">
                <div className="w-64 flex-1 inline-flex justify-start items-center gap-4">
                  <div className="text-center justify-center text-gray-600 text-sm font-normal font-['Public_Sans']">
                    Organisasi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quota Info - FIXED: Positioned properly below form fields */}
      <div className="left-[1046px] top-[520px] absolute inline-flex justify-end items-center gap-[5px]">
        <div className="size-5 bg-zinc-300" />
        <span className="material-icons text-[#EE4266] text-base">info</span>
        <div className="justify-center text-[#EE4266] text-[10px] font-normal font-['Public_Sans'] leading-3">
          Kuota tersisa untuk konseling : {remainingQuota}
        </div>
      </div>

      {/* Problem Description - FIXED: More spacing from date/time fields */}
      <div className="w-[970px] left-[257px] top-[580px] absolute inline-flex flex-col justify-start items-start gap-2.5">
        <div className="self-stretch flex flex-col justify-start items-end">
          <div className="self-stretch flex flex-col justify-start items-start gap-3">
            <div className="inline-flex justify-start items-center gap-2.5">
              <div className="text-center justify-center text-neutral-600 text-sm font-bold font-['Public_Sans']">
                Jenis Permasalahan
              </div>
            </div>
            <div className="self-stretch h-20 px-2.5 py-3 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-neutral-600 inline-flex justify-start items-start gap-2.5">
              <textarea
                className="flex-1 self-stretch justify-start text-gray-600 text-xs font-normal font-['Public_Sans'] bg-transparent border-none outline-none resize-none"
                placeholder="Deskripsikan permasalahanmu secara singkat"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>
        </div>
        
        {/* Terms and Conditions */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="self-stretch justify-center text-[#EE4266] text-[8px] font-bold font-['Public_Sans']">
            {getTermsTitle()}
          </div>
          <div className="w-[970px] text-justify justify-center text-gray-600 text-[8px] font-normal font-['Public_Sans'] whitespace-pre-line">
            {getTermsContent()}
          </div>
        </div>
      </div>

      {/* Action Buttons - FIXED: Aligned with right border of description field */}
      <div className="w-[454px] left-[773px] top-[760px] absolute inline-flex justify-end items-center gap-2.5">
        <button
          onClick={handleCancel}
          className="h-8 px-5 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#488BBA] flex justify-center items-center gap-2.5 hover:bg-blue-50 transition-colors"
        >
          <div className="justify-start text-[#488BBA] text-base font-semibold font-['Public_Sans']">
            Batal
          </div>
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid() || loading.creating}
          className="h-8 px-5 py-2.5 bg-[#488BBA] rounded-[5px] flex justify-center items-center gap-2.5 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="justify-start text-white text-base font-semibold font-['Public_Sans']">
            {loading.creating ? 'Memproses...' : 'Buat Janji'}
          </div>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Konfirmasi Pembatalan</h3>
            <p className="text-gray-600 mb-6">
              Anda memiliki data yang belum disimpan. Apakah Anda yakin ingin membatalkan?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                Tetap di sini
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  // Navigate back to BookingPage
                  window.history.back();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading.creating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <span className="material-icons animate-spin text-[#488BBA]">sync</span>
            <span className="text-[#488BBA]">Membuat janji konseling...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingSession;