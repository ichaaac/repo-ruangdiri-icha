// src/components/shared/schedule/SchedulePage.jsx - Fixed Layout and Responsive

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

  // Calculate available width - FIXED calculation
  const sidebarWidth = sidebarExpanded ? 257 : 80;
  const paddingLeft = 20;
  const paddingRight = 24;
  const availableWidth = windowWidth - sidebarWidth - paddingLeft - paddingRight;
  
  // Desktop threshold - more conservative
  const isDesktop = availableWidth >= 1100;

  // Component dimensions - IMPROVED calculation
  const getLeftColumnWidth = () => {
    if (isDesktop) {
      // Desktop: keep consistent layout
      const rightColumnSpace = 335;
      const gap = 24;
      const leftWidth = availableWidth - rightColumnSpace - gap;
      return Math.max(808, leftWidth); // Minimum 808px
    }
    // Mobile: full available width, minimum 808
    return Math.max(808, Math.min(availableWidth, 1000));
  };

  const getRightColumnWidth = () => {
    if (isDesktop) {
      // Desktop: fixed 335px for right column
      return 335;
    }
    // Mobile: adaptive but minimum 280, max 335
    return Math.min(335, Math.max(280, availableWidth));
  };

  const leftColumnWidth = getLeftColumnWidth();
  const rightColumnWidth = getRightColumnWidth();

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setModalData({
      startDateTime: timeSlot.startDateTime,
      endDateTime: timeSlot.endDateTime,
      day: timeSlot.day
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
        className="transition-all duration-300"
        style={{ 
          paddingTop: '86.5px', // 86.5px below TopRightControl as per Figma 1440x810
          paddingLeft: `${paddingLeft}px`, 
          paddingRight: `${paddingRight}px` 
        }}
      >
        <div className="max-w-none mx-auto space-y-6">

          {/* MAIN LAYOUT - FIXED */}
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
            <div className={`space-y-6 ${
              isDesktop ? 'w-auto flex-shrink-0' : 'w-full flex flex-col items-center'
            }`}>
              
              {/* DatePicker */}
              <div className="w-full flex justify-center">
                <DatePicker 
                  containerWidth={rightColumnWidth}
                  sidebarExpanded={sidebarExpanded}
                />
              </div>

              {/* Notification Panel */}
              <div className="w-full flex justify-center">
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