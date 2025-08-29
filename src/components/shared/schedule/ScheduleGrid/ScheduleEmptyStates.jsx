// src/components/shared/schedule/components/ScheduleEmptyStates.jsx

import { GRID_CONFIG, Z_INDICES, DAYS } from "./scheduleGridConfig";

const ScheduleEmptyStates = ({ 
  selectedDates, 
  processedSchedules, 
  dayRowHeights, 
  getDayRowTop 
}) => {
  // No week selected message
  if (selectedDates.length === 0) {
    return (
      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: Z_INDICES.BACKGROUND + 1,
        }}
      >
        <div className="text-gray-400 text-sm font-medium bg-gray-50 px-4 py-2 rounded-md">
          Pilih minggu di kalender untuk melihat jadwal
        </div>
      </div>
    );
  }

  // Empty state messages for individual days
  return (
    <>
      {selectedDates.length > 0 &&
        DAYS.map((day, dayIndex) => {
          const hasEvents = Object.values(processedSchedules[day.full] || {}).some(
            (events) => events.length > 0
          );
          const isDaySelected = selectedDates.some((date) => {
            const selectedDateObj = new Date(date);
            const selectedDayIndex = (selectedDateObj.getDay() + 6) % 7;
            return selectedDayIndex === dayIndex;
          });

          if (isDaySelected && !hasEvents) {
            const dayTop = getDayRowTop(dayIndex);
            const dayHeight = dayRowHeights[day.full];

            return (
              <div
                key={`empty-${dayIndex}`}
                className="absolute pointer-events-none flex items-center justify-center"
                style={{
                  left: "120px",
                  top: `${dayTop + GRID_CONFIG.dayPaddingTop}px`,
                  width: "240px",
                  height: `${dayHeight - GRID_CONFIG.dayPaddingTop - GRID_CONFIG.dayPaddingBottom}px`,
                zIndex: Z_INDICES.BACKGROUND + 1,
                }}
              >
                <div className="text-gray-400 text-xs font-medium bg-gray-50 px-3 py-1 rounded-md">
                  Belum ada jadwal
                </div>
              </div>
            );
          }
          return null;
        })}
    </>
  );
};

export default ScheduleEmptyStates;