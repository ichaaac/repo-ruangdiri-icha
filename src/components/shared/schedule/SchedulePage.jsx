// src/components/shared/schedule/SchedulePage.jsx - Simple Responsive

import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import TopRightControl from "../layout/TopRightControl";
import ScheduleGrid from "./ScheduleGrid";
import CounselingQueue from "./CounselingQueue";
import DatePicker from "./DatePicker";
import NotificationPanel from "./NotificationsPanel";
import AddScheduleModal from "./AddScheduleModal";

const SchedulePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [windowWidth, setWindowWidth] = useState(0);
  
  // Get sidebar state from layout context
  const outletContext = useOutletContext() || {};
  const { sidebarExpanded = false } = outletContext;

  // Track window width for responsive calculations
  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate available width
  const sidebarWidth = sidebarExpanded ? 257 : 80;
  const paddingLeft = 20; // 20px from sidebar
  const paddingRight = 24; // Reduced from 32px to 24px
  const availableWidth = windowWidth - sidebarWidth - paddingLeft - paddingRight;
  
  // More aggressive calculation for 1440x810
  // At 1440x810 with expanded sidebar: availableWidth = 1440 - 257 - 20 - 24 = 1139px
  // Force side-by-side if we have at least 1120px (should work for 1440 expanded)
  const isDesktop = availableWidth >= 1120;

  // Component dimensions based on sidebar state
  const getLeftColumnWidth = () => {
    if (isDesktop) {
      // Desktop: different behavior based on available space
      if (availableWidth >= 1300) {
        // Plenty of space (sidebar collapsed): expand left column, keep right at 335px
        const rightSpace = 335;
        const gap = 24;
        return availableWidth - rightSpace - gap;
      } else {
        // Tight space (sidebar expanded): keep left fixed, adaptive right
        return 808;
      }
    }
    // Mobile: full available width
    return Math.min(808, availableWidth);
  };

  const getRightColumnWidth = () => {
    if (isDesktop) {
      if (availableWidth >= 1300) {
        // Plenty of space: right column stays at 335px
        return 335;
      } else {
        // Tight space: adaptive right column
        const gap = 16;
        const rightSpace = availableWidth - 808 - gap;
        return Math.min(335, Math.max(280, rightSpace));
      }
    }
    return Math.min(335, availableWidth);
  };

  const leftColumnWidth = getLeftColumnWidth();
  const rightColumnWidth = getRightColumnWidth();

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setModalData({
      startDateTime: timeSlot.startDateTime,
      endDateTime: timeSlot.endDateTime,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (formData) => {
    console.log("Schedule submitted:", formData);
    setIsModalOpen(false);
    setModalData(null);
    setSelectedTimeSlot(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalData(null);
    setSelectedTimeSlot(null);
  };

  return (
    <div className="relative bg-white min-h-screen w-full">
      <TopRightControl />

      <div 
        className="pt-16"
        style={{ 
          paddingLeft: `${paddingLeft}px`, 
          paddingRight: `${paddingRight}px` 
        }}
      >
        <div className="max-w-none mx-auto space-y-4 sm:space-y-6 lg:space-y-8">

          {/* MAIN LAYOUT */}
          <div className={`grid transition-all duration-300 ${
            isDesktop ? (availableWidth >= 1300 ? 'grid-cols-[1fr_auto] gap-6' : 'grid-cols-[1fr_auto] gap-4') : 'grid-cols-1 gap-4 sm:gap-6 lg:gap-8'
          }`}>

            {/* LEFT COLUMN - Schedule and Queue */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 min-w-0">
              
              {/* Schedule Grid */}
              <div className="w-full">
                <ScheduleGrid 
                  onTimeSlotSelect={handleTimeSlotSelect}
                  containerWidth={leftColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                />
              </div>

              {/* Counseling Queue */}
              <div className="w-full">
                <CounselingQueue 
                  containerWidth={leftColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                />
              </div>
            </div>

            {/* RIGHT COLUMN - DatePicker and Notifications */}
            <div className={`space-y-4 sm:space-y-6 lg:space-y-8 ${
              isDesktop ? 'w-auto flex-shrink-0' : 'w-full'
            }`}>
              
              {/* DatePicker */}
              <div className={`w-full ${isDesktop ? '' : 'flex justify-center'}`}>
                <DatePicker 
                  containerWidth={rightColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                />
              </div>

              {/* Notification Panel */}
              <div className={`w-full ${isDesktop ? '' : 'flex justify-center'}`}>
                <NotificationPanel 
                  containerWidth={rightColumnWidth}
                  sidebarExpanded={sidebarExpanded}
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
      />  
    </div>
  );
};

export default SchedulePage;