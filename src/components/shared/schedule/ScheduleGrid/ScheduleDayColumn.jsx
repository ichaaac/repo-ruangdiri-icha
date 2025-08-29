// src/components/shared/schedule/components/ScheduleDayColumn.jsx

import { GRID_CONFIG, Z_INDICES, DAYS } from "./scheduleGridConfig";

const ScheduleDayColumn = ({ 
  dayRowHeights, 
  scrollTop, 
  getDateFromDayIndex, 
  today, 
  isTodayInCurrentWeek 
}) => {
  return (
    <div
      className="absolute top-0 bg-white"
      style={{
        left: "0px",
        width: `${GRID_CONFIG.dayColumnWidth}px`,
        height: "100%",
        zIndex: Z_INDICES.DAY_HEADERS,
      }}
    >
      <div style={{ height: `${GRID_CONFIG.timeHeaderHeight}px` }} />

      <div
        className="absolute overflow-hidden"
        style={{
          top: `${GRID_CONFIG.timeHeaderHeight}px`,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            transform: `translateY(-${scrollTop}px)`,
          }}
        >
          {DAYS.map((day, index) => {
            const dayDate = getDateFromDayIndex(index);
            const isTodayDay = dayDate.toDateString() === today.toDateString();
            return (
              <div
                key={day.short}
                className="flex items-center justify-center bg-white"
                style={{
                  height: `${dayRowHeights[day.full]}px`,
                }}
              >
                <span
                  className={`text-sm font-semibold text-neutral-700 ${
                    isTodayDay && isTodayInCurrentWeek ? "font-bold" : ""
                  }`}
                >
                  {day.short}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleDayColumn;