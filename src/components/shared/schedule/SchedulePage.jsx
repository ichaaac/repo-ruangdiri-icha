// src/components/shared/schedule/SchedulePage.jsx - Integrated with View Modal

import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import TopRightControl from "../layout/TopRightControl";
import ScheduleGrid from "./ScheduleGrid";
import CounselingQueue from "./CounselingQueue";
import DatePicker from "./DatePicker";
import NotificationPanel from "./NotificationsPanel";
import AddScheduleModal from "./AddScheduleModal";
import ViewScheduleModal from "./ViewScheduleModal";
import { useSchedule } from "./hooks/useSchedule";

const SchedulePage = ({ type = "school" }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [viewScheduleData, setViewScheduleData] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const [selectedDates, setSelectedDates] = useState([]);
  
  // Get sidebar state from layout context
  const outletContext = useOutletContext() || {};
  const { sidebarExpanded = false } = outletContext;

  // Use schedule hook for data management with React Query
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
    updateSchedule,
    deleteSchedule,
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
  
  // Desktop threshold
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



      // Open modal for new schedule (stacking is allowed, so no conflict check)
      setSelectedTimeSlot(timeSlot);
      setModalData({
        startDateTime: timeSlot.startDateTime,
        endDateTime: timeSlot.endDateTime,
        day: timeSlot.day,
        dates: timeSlot.dates || [{
          date: timeSlot.startDateTime.toISOString().split('T')[0],
          startTime: timeSlot.startDateTime.toTimeString().slice(0, 5),
          endTime: timeSlot.endDateTime.toTimeString().slice(0, 5),
          timezone: 'Asia/Jakarta'
        }],
        draggedDays: timeSlot.draggedDays || 1 // Pass dragged days to enable multiple date
      });
      setIsAddModalOpen(true);
    }, [loading]);
  

  // Handle schedule click to view details
  const handleScheduleClick = useCallback((scheduleData) => {
    setViewScheduleData(scheduleData);
    setIsViewModalOpen(true);
  }, []);

  // Handle edit from view modal
  const handleEditFromView = useCallback((scheduleData) => {
    setIsViewModalOpen(false);
    
    // Transform schedule data for edit modal
    const editData = {
      id: scheduleData.id,
      agenda: scheduleData.agenda || scheduleData.name,
      type: scheduleData.type,
      description: scheduleData.description,
      notificationOffset: scheduleData.notificationOffset,
      location: scheduleData.location,
      dates: scheduleData.dates || [{
        date: scheduleData.startDateTime ? new Date(scheduleData.startDateTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: scheduleData.startDateTime ? new Date(scheduleData.startDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '09:00',
        endTime: scheduleData.endDateTime ? new Date(scheduleData.endDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '10:00',
        timezone: scheduleData.timezone || 'Asia/Jakarta'
      }],
      selectedPsychologist: scheduleData.participants?.find(p => p.role === 'psychologist') || null,
      selectedParticipants: scheduleData.participants?.filter(p => p.role !== 'psychologist') || []
    };
    
    setModalData(editData);
    setIsAddModalOpen(true);
  }, []);

  // Handle delete from view modal
  const handleDeleteFromView = useCallback(async (scheduleData) => {
    try {
      await deleteSchedule(scheduleData.id);
      setIsViewModalOpen(false);
      toast.success('Schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete schedule';
      
      if (errorMessage.includes('already deleted')) {
        toast.error('Schedule has already been deleted');
        setIsViewModalOpen(false);
        // Refresh data to sync with backend
        refreshData();
      } else {
        toast.error(`Delete failed: ${errorMessage}`);
      }
    }
  }, [deleteSchedule, refreshData]);

  // Handle modal form submission with proper error handling
  const handleModalSubmit = useCallback(async (formData) => {
    try {
      let result;
      
      if (modalData?.id) {
        // Update existing schedule
        result = await updateSchedule(modalData.id, formData);
        toast.success('Schedule updated successfully');
      } else {
        // Create new schedule
        result = await createSchedule(formData);
        toast.success('Schedule created successfully');
      }
      
      // Close modal on success
      setIsAddModalOpen(false);
      setModalData(null);
      setSelectedTimeSlot(null);
      
      // React Query will automatically update the UI via optimistic updates
      // and invalidate queries, so no manual refresh needed
      
      return result;
      
    } catch (error) {
      console.error("Error submitting schedule:", error);
      
      // Extract meaningful error message
      const errorMessage = error.message || 
        (modalData?.id ? 'Failed to update schedule' : 'Failed to create schedule');
      
      toast.error(errorMessage);
      
      // Re-throw to prevent modal from closing
      throw error;
    }
  }, [modalData, createSchedule, updateSchedule]);

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
    setModalData(null);
    setSelectedTimeSlot(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setViewScheduleData(null);
  };

  // Handle date selection from DatePicker - Fixed to show date range
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

  return (
    <div className="relative bg-white min-h-screen w-full">
      <TopRightControl />

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

      {/* Add/Edit Schedule Modal */}
      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={handleAddModalClose}
        onSubmit={handleModalSubmit}
        initialData={modalData}
        loading={loading.submit}
        mode={modalData?.id ? "edit" : "create"}
      />

      {/* View Schedule Modal */}
      <ViewScheduleModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        onEdit={handleEditFromView}
        onDelete={handleDeleteFromView}
        scheduleData={viewScheduleData}
        loading={loading.submit}
      />
    </div>
  );
};

export default SchedulePage;