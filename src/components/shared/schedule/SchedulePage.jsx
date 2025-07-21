// src/components/shared/schedule/SchedulePage.jsx - FIXED TOAST HANDLING

import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import ScheduleGrid from "./ScheduleGrid";
import CounselingQueue from "./CounselingQueue";
import DatePicker from "./DatePicker";
import NotificationPanel from "./NotificationsPanel";
import AddScheduleModal from "./AddScheduleModal";
import ViewScheduleModal from "./ViewScheduleModal";
import { useSchedule } from "./hooks/useSchedule";
import TopRightControl from "../layout/TopRightControl";

const SchedulePage = ({ type = "school" }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [viewScheduleData, setViewScheduleData] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const [selectedDates, setSelectedDates] = useState([]);
  
  // FIXED: Enhanced error message parser
  const parseErrorMessage = (message) => {
    if (!message) return 'An error occurred';
    
    // Parse ISO datetime patterns and other common backend formats
    const isoDatePattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)/g;
    const dateTimePattern = /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/g;
    
    let parsedMessage = message;
    
    // Replace ISO datetime patterns
    parsedMessage = parsedMessage.replace(isoDatePattern, (match) => {
      try {
        const date = new Date(match);
        const dateStr = date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        return `${dateStr} ${timeStr}`;
      } catch (e) {
        return match;
      }
    });
    
    // Replace simple datetime patterns
    parsedMessage = parsedMessage.replace(dateTimePattern, (match) => {
      try {
        const date = new Date(match);
        const dateStr = date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        return `${dateStr} ${timeStr}`;
      } catch (e) {
        return match;
      }
    });
    
    return parsedMessage;
  };
  
  // Get sidebar state from layout context
  const outletContext = useOutletContext() || {};
  const { sidebarExpanded = false } = outletContext;

  // Use schedule hook
  const {
    selectedDate,
    selectedWeek,
    schedules,
    counselingQueue,
    notifications,
    loading,
    error,
    setSelectedDate,
    setSelectedWeek,
    createSchedule,
    handleEditSchedule,
    handleDeleteSchedule,
    refreshData,
    getSchedulesForDate,
    getScheduleAtTime,
  } = useSchedule(type);

  // Track window width for responsive calculations
  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate available width
  const sidebarWidth = sidebarExpanded ? 257 : 80;
  const paddingLeft = 20;
  const paddingRight = 24;
  const availableWidth = windowWidth - sidebarWidth - paddingLeft - paddingRight;
  
  const isDesktop = availableWidth >= 1100;

  // Component dimensions
  const getLeftColumnWidth = () => {
    if (isDesktop) {
      const rightColumnSpace = 335;
      const gap = 24;
      const leftWidth = availableWidth - rightColumnSpace - gap;
      return Math.max(808, leftWidth);
    }
    return Math.max(808, Math.min(availableWidth, 1000));
  };

  const getRightColumnWidth = () => {
    if (isDesktop) {
      return 335;
    }
    return Math.min(335, Math.max(280, availableWidth));
  };

  const leftColumnWidth = getLeftColumnWidth();
  const rightColumnWidth = getRightColumnWidth();

  // Handle time slot selection for creating new schedule
  const handleTimeSlotSelect = useCallback(async (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setModalData({
      startDateTime: timeSlot.startDateTime,
      endDateTime: timeSlot.endDateTime,
      day: timeSlot.day,
      dates: timeSlot.dates || [{
        date: timeSlot.startDateTime.toISOString().split('T')[0],
        startTime: timeSlot.startDateTime.toTimeString().slice(0, 5),
        endTime: timeSlot.endDateTime.toTimeString().slice(0, 5),
        timezone: 'WIB'
      }],
      draggedDays: timeSlot.draggedDays || 1
    });
    setIsAddModalOpen(true);
  }, []);

  // Handle schedule click to view details
  const handleScheduleClick = useCallback((scheduleData) => {
    setViewScheduleData(scheduleData);
    setIsViewModalOpen(true);
  }, []);

  // Edit handler for ViewScheduleModal
  const handleEditFromViewModal = useCallback(async (scheduleId, formData) => {
    try {
      await handleEditSchedule(scheduleId, formData);
      // Don't close view modal here - let ViewScheduleModal handle its own state
    } catch (error) {
      console.error('Error updating schedule from view modal:', error);
      // ViewScheduleModal will keep edit modal open for retry
      throw error; // Re-throw so ViewScheduleModal can handle it
    }
  }, [handleEditSchedule]);

  // Delete handler for ViewScheduleModal
  const handleDeleteFromViewModal = useCallback(async (scheduleData) => {
    try {
      await handleDeleteSchedule(scheduleData);
      // Close view modal after successful delete
      setIsViewModalOpen(false);
      setViewScheduleData(null);
    } catch (error) {
      console.error('Error deleting schedule from view modal:', error);
      // ViewScheduleModal will handle error display
      throw error;
    }
  }, [handleDeleteSchedule]);

  // FIXED: Handle create/edit modal form submission with better error handling
  const handleModalSubmit = useCallback(async (formData) => {
    try {
      let result;
      
      if (modalData?.id) {
        // Update existing schedule (for direct edit, not from view modal)
        result = await handleEditSchedule(modalData.id, formData);
      } else {
        // Create new schedule
        result = await createSchedule(formData);
      }
      
      // FIXED: Only close modal on successful completion
      setIsAddModalOpen(false);
      setModalData(null);
      setSelectedTimeSlot(null);
      
      return result;
      
    } catch (error) {
      console.error("Error submitting schedule:", error);
      
      // FIXED: Parse error message and re-throw to prevent modal closure
      const parsedMessage = parseErrorMessage(error?.response?.data?.message || error.message);
      
      // Re-throw the parsed error to prevent modal from closing and let AddScheduleModal handle the toast
      throw new Error(parsedMessage);
    }
  }, [modalData, createSchedule, handleEditSchedule, parseErrorMessage]);

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
    setModalData(null);
    setSelectedTimeSlot(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setViewScheduleData(null);
    // Cleanup global close function if it exists
    if (window.closeAllModals) {
      delete window.closeAllModals;
    }
  };

  // Handle date selection from DatePicker
  const handleDateSelect = (dates) => {
    setSelectedDates(dates);
    if (dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  };

  // Handle week selection
  const handleWeekSelect = (weekStart) => {
    setSelectedWeek(weekStart);
  };

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isViewModalOpen) {
          handleViewModalClose();
        } else if (isAddModalOpen) {
          handleAddModalClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isViewModalOpen, isAddModalOpen]);

  // Prevent body scroll when modal is open  
  useEffect(() => {
    if (isAddModalOpen || isViewModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isAddModalOpen, isViewModalOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup global functions on unmount
      if (window.closeAllModals) {
        delete window.closeAllModals;
      }
      // Restore body scroll
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="relative bg-white min-h-screen w-full">
      <TopRightControl isAbsolute />
      <div 
        className="transition-all duration-300"
        style={{ 
          paddingTop: '120px',
          paddingLeft: `${paddingLeft}px`, 
          paddingRight: `${paddingRight}px` 
        }}
      >
        <div className="max-w-none mx-auto space-y-6">

          {/* MAIN LAYOUT */}
          <div className={`grid transition-all duration-300 ${
            isDesktop 
              ? 'grid-cols-[1fr_auto] gap-6' 
              : 'grid-cols-1 gap-6'
          }`}>

            {/* LEFT COLUMN - Schedule and Queue */}
            <div className="space-y-6 min-w-0 overflow-hidden">
              
              {/* Schedule Grid */}
              <div className="w-full">
                <ScheduleGrid 
                  onTimeSlotSelect={handleTimeSlotSelect}
                  onScheduleClick={handleScheduleClick}
                  containerWidth={leftColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                  selectedDates={selectedDates}
                  schedules={schedules}
                  loading={loading.schedules}
                  getScheduleAtTime={getScheduleAtTime}
                  weekStartDate={selectedWeek}
                />
              </div>

              {/* Counseling Queue */}
              <div className="w-full">
                <CounselingQueue 
                  containerWidth={leftColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                  queueData={counselingQueue}
                  loading={loading.queue}
                />
              </div>
            </div>

            {/* RIGHT COLUMN - DatePicker and Notifications */}
            <div className={`space-y-6 ${
              isDesktop ? 'w-auto flex-shrink-0' : 'w-full flex flex-col items-center'
            }`}>
              
              {/* DatePicker */}
              <div className="w-full flex justify-center">
                <DatePicker 
                  containerWidth={rightColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                  selectedDate={selectedDate}
                  selectedDates={selectedDates}
                  onDateSelect={handleDateSelect}
                  onWeekSelect={handleWeekSelect}
                />
              </div>

              {/* Notification Panel */}
              <div className="w-full flex justify-center">
                <NotificationPanel 
                  containerWidth={rightColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                  notifications={notifications}
                  loading={loading.notifications}
                />
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Add/Edit Schedule Modal - Standalone */}
      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={handleAddModalClose}
        onSubmit={handleModalSubmit}
        initialData={modalData}
        loading={loading.submit}
        mode={modalData?.id ? "edit" : "create"}
        fromViewModal={false}
      />

      {/* View Schedule Modal - Handles edit internally */}
      <ViewScheduleModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        onEdit={handleEditFromViewModal}
        onDelete={handleDeleteFromViewModal} 
        scheduleData={viewScheduleData}
        loading={loading.submit}
      />
    </div>
  );
};

export default SchedulePage;