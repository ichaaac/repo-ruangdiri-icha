// src/components/shared/schedule/components/ScheduleTimeIndicator.jsx

import { useState, useEffect, useCallback } from "react";

const ScheduleTimeIndicator = ({
  isCurrentDateInSelectedWeek,
  timeToPosition,
  dayColumnWidth = 70,
  paddingOffset = 38,
  totalGridHeight,
  timeHeaderHeight = 30,
  scrollLeft = 0,
  zIndex = 45
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const hour = now.getHours();
    const minutes = now.getMinutes();
    return timeToPosition(hour, minutes);
  }, [currentTime, timeToPosition]);

  const getCurrentTimeString = useCallback(() => {
    const now = currentTime;
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }, [currentTime]);

  // Only render if current date is in selected week
  if (!isCurrentDateInSelectedWeek) {
    return null;
  }

  const leftPosition = dayColumnWidth + paddingOffset + getCurrentTimePosition() + 15 - scrollLeft;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${leftPosition}px`,
        top: `${timeHeaderHeight}px`,
        height: `${totalGridHeight}px`,
        zIndex: zIndex,
        width: "2px",
      }}
    >
      <div className="relative w-full h-full bg-red-500 shadow-sm">
        {/* Top circle indicator */}
        <div
          className="absolute w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"
          style={{ top: "-5px", left: "50%", transform: "translateX(-50%)" }}
        />

        {/* Time label */}
        <div className="absolute" style={{ left: "4px", top: "2px" }}>
          <div className="bg-black bg-opacity-90 rounded text-white text-xs font-mono px-1.5 py-1 whitespace-nowrap shadow-md">
            {getCurrentTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTimeIndicator;