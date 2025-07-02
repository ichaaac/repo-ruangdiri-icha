// src/components/shared/schedule/SchedulePage.jsx - React Query Best Practices

import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner"; // For user feedback
import TopRightControl from "../layout/TopRightControl";
import ScheduleGrid from "./ScheduleGrid";
import CounselingQueue from "./CounselingQueue";
import DatePicker from "./DatePicker";
import NotificationPanel from "./NotificationsPanel";
import AddScheduleModal from "./AddScheduleModal";
import { useSchedule } from "./hooks/useSchedule";

const SchedulePage = ({ type = "school" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
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
    checkScheduleExists,
    refreshData,
    getSchedulesForDate,
    getScheduleAtTime,
    // Additional React Query specific properties
    isSchedulesLoading,
    isSchedulesError,
    schedulesError,
    createMutation,
    updateMutation,
    deleteMutation,
    checkExistsMutation,
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
    try {
      // Show loading toast
      const loadingToast = toast.loading('Checking schedule availability...');
      
      // Check if schedule already exists at this time (local check first)
      const existingSchedule = getScheduleAtTime(
        timeSlot.startDateTime, 
        timeSlot.startDateTime.getHours().toString().padStart(2, '0') + ':00'
      );
      
      if (existingSchedule) {
        toast.dismiss(loadingToast);
        toast.error('Schedule already exists at this time');
        return;
      }

      // Double check with API using React Query mutation
      const checkResult = await checkScheduleExists({
        date: timeSlot.startDateTime.toISOString().split('T')[0],
        startTime: timeSlot.startDateTime.toTimeString().slice(0, 5),
        endTime: timeSlot.endDateTime.toTimeString().slice(0, 5),
      });

      toast.dismiss(loadingToast);

      if (checkResult?.exists) {
        toast.error(checkResult.message || 'Schedule slot is already occupied');
        return;
      }

      // Open modal for new schedule
      setSelectedTimeSlot(timeSlot);
      setModalData({
        startDateTime: timeSlot.startDateTime,
        endDateTime: timeSlot.endDateTime,
        day: timeSlot.day
      });
      setIsModalOpen(true);
      
    } catch (error) {
      console.error('Error checking schedule existence:', error);
      toast.error('Failed to check schedule availability');
    }
  }, [getScheduleAtTime, checkScheduleExists]);

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
      setIsModalOpen(false);
      setModalData(null);
      setSelectedTimeSlot(null);
      
      // React Query will automatically update the UI via optimistic updates
      // and invalidate queries, so no manual refresh needed
      
    } catch (error) {
      console.error("Error submitting schedule:", error);
      
      // Extract meaningful error message
      const errorMessage = error.message || 
        (modalData?.id ? 'Failed to update schedule' : 'Failed to create schedule');
      
      toast.error(errorMessage);
      
      // Keep modal open so user can fix the issue
    }
  }, [modalData, createSchedule, updateSchedule]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalData(null);
    setSelectedTimeSlot(null);
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

      <AddScheduleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        initialData={modalData}
        loading={loading.submit}
      />  
    </div>
  );
};

export default SchedulePage;