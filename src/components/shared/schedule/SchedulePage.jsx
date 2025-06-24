// src/components/shared/schedule/SchedulePage.jsx

import { useState } from "react";
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
    // Here you would typically save to your backend
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
      {/* Top Right Controls */}
      <TopRightControl />

      {/* Main Content Grid */}
      <div className="pt-16 px-4 lg:px-8">
        <div className="max-w-[1440px] mx-auto">
          {/* Schedule Grid Section */}
          <div className="mb-8">
            <ScheduleGrid onTimeSlotSelect={handleTimeSlotSelect} />
          </div>

          {/* Bottom Section - Queue and Right Panels */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Counseling Queue - Takes 2 columns on xl screens */}
            <div className="xl:col-span-2">
              <CounselingQueue />
            </div>

            {/* Right Panel - Date Picker and Notifications */}
            <div className="space-y-6">
              <DatePicker />
              <NotificationPanel />
            </div>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
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
