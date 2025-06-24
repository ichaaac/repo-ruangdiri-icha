// src/components/shared/schedule/ScheduleGrid.jsx

import { useState, useEffect, useRef } from "react";
import { getCurrentDateInfo } from "@/lib/date";

const ScheduleGrid = ({ onTimeSlotSelect }) => {
  const [selectedRange, setSelectedRange] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const gridRef = useRef(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Time slots from 6:00 to 14:00
  const timeSlots = [];
  for (let hour = 6; hour <= 14; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}.00`);
  }

  // Days of the week
  const days = [
    { short: "Sen", full: "Senin" },
    { short: "Sel", full: "Selasa" },
    { short: "Rab", full: "Rabu" },
    { short: "Kam", full: "Kamis" },
    { short: "Jum", full: "Jumat" },
    { short: "Sab", full: "Sabtu" },
    { short: "Min", full: "Minggu" }
  ];

  // Visible days (can be scrolled)
  const [visibleDays, setVisibleDays] = useState(days.slice(0, 3));
  const [dayStartIndex, setDayStartIndex] = useState(0);

  // Calculate current time position for the red needle
  const getCurrentTimePosition = () => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours < 6 || hours > 14) return null;

    const totalMinutes = (hours - 6) * 60 + minutes;
    const totalGridMinutes = 8 * 60; // 6:00 to 14:00 = 8 hours
    const percentage = (totalMinutes / totalGridMinutes) * 100;

    return Math.min(Math.max(percentage, 0), 100);
  };

  const timePosition = getCurrentTimePosition();

  // Handle mouse events for drag selection
  const handleMouseDown = (dayIndex, timeIndex) => {
    setIsDragging(true);
    setSelectedRange({
      startDay: dayIndex,
      endDay: dayIndex,
      startTime: timeIndex,
      endTime: timeIndex
    });
  };

  const handleMouseEnter = (dayIndex, timeIndex) => {
    if (isDragging && selectedRange) {
      setSelectedRange(prev => ({
        ...prev,
        endDay: dayIndex,
        endTime: timeIndex
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectedRange) {
      // Create time slot data for modal
      const startHour = Math.min(selectedRange.startTime, selectedRange.endTime) + 6;
      const endHour = Math.max(selectedRange.startTime, selectedRange.endTime) + 7;
      const dayName = visibleDays[selectedRange.startDay]?.full || "Senin";

      const today = new Date();
      const startDateTime = new Date(today);
      startDateTime.setHours(startHour, 0, 0, 0);

      const endDateTime = new Date(today);
      endDateTime.setHours(endHour, 0, 0, 0);

      onTimeSlotSelect({
        startDateTime,
        endDateTime,
        day: dayName
      });
    }

    setIsDragging(false);
    setSelectedRange(null);
  };

  // Check if a cell is selected
  const isCellSelected = (dayIndex, timeIndex) => {
    if (!selectedRange) return false;

    const minDay = Math.min(selectedRange.startDay, selectedRange.endDay);
    const maxDay = Math.max(selectedRange.startDay, selectedRange.endDay);
    const minTime = Math.min(selectedRange.startTime, selectedRange.endTime);
    const maxTime = Math.max(selectedRange.startTime, selectedRange.endTime);

    return dayIndex >= minDay && dayIndex <= maxDay &&
           timeIndex >= minTime && timeIndex <= maxTime;
  };

  // Handle day scrolling
  const scrollDays = (direction) => {
    if (direction === 'left' && dayStartIndex > 0) {
      const newIndex = Math.max(0, dayStartIndex - 1);
      setDayStartIndex(newIndex);
      setVisibleDays(days.slice(newIndex, newIndex + 3));
    } else if (direction === 'right' && dayStartIndex < days.length - 3) {
      const newIndex = Math.min(days.length - 3, dayStartIndex + 1);
      setDayStartIndex(newIndex);
      setVisibleDays(days.slice(newIndex, newIndex + 3));
    }
  };

  return (
    <div className="rounded-md border border-zinc-500 bg-white">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 py-3 border-b border-zinc-200">
        <div className="w-[30px] h-[30px] bg-[#488BBE] rounded flex items-center justify-center">
          <span className="material-icons text-white text-lg">calendar_month</span>
        </div>
        <h2 className="text-xl font-semibold text-blue-500">Jadwal</h2>
      </header>

      {/* Time Header */}
      <div className="flex items-center px-5 py-2.5 border-b border-zinc-200 overflow-x-auto scrollbar-custom">
        <div className="w-[35px] flex-shrink-0"></div>
        <div className="flex items-center gap-6 min-w-max">
          {timeSlots.map((time, index) => (
            <div key={time} className="flex items-center gap-6">
              <span className="text-xs text-neutral-600 whitespace-nowrap">{time}</span>
              {index < timeSlots.length - 1 && (
                <span className="text-xs text-rose-400">|</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="relative">
        {/* Progress bars */}
        <div className="absolute bottom-0 left-[97px] right-[16px] h-[3px] bg-zinc-300 z-10"></div>
        <div className="absolute bottom-0 left-[97px] w-[234px] h-[5px] bg-zinc-500 z-20"></div>

        {/* Current time needle */}
        {timePosition !== null && (
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none"
            style={{ left: `calc(97px + ${timePosition}% * (100% - 113px) / 100)` }}
          >
            <svg width="6" height="134" viewBox="0 0 6 134" fill="none" className="absolute top-0">
              <circle cx="3.39573" cy="2.5969" r="2.5969" fill="#FF0000"/>
              <rect x="2.875" y="4.15503" width="1.03876" height="129.845" fill="#FF0000"/>
            </svg>
          </div>
        )}

        {/* Day rows */}
        <div
          className="space-y-0"
          ref={gridRef}
          onMouseLeave={() => {
            if (isDragging) {
              setIsDragging(false);
              setSelectedRange(null);
            }
          }}
        >
          {visibleDays.map((day, dayIndex) => (
            <div key={`${day.short}-${dayStartIndex + dayIndex}`}>
              <div className="flex items-center min-h-[29px] border-b border-zinc-200 last:border-b-0">
                {/* Day label */}
                <div className="w-[35px] flex-shrink-0 px-2">
                  <span className="text-base font-bold text-neutral-600">{day.short}</span>
                </div>

                {/* Time slots */}
                <div className="flex-1 flex relative">
                  <div className="flex items-center bg-white rounded-md min-h-[29px] flex-1 overflow-x-auto scrollbar-custom">
                    <div className="flex min-w-max">
                      {timeSlots.map((time, timeIndex) => (
                        <div
                          key={`${day.short}-${time}`}
                          className={`
                            w-[77px] h-[29px] border-r border-zinc-100 last:border-r-0
                            cursor-pointer transition-colors relative
                            ${isCellSelected(dayIndex, timeIndex)
                              ? 'bg-blue-200 border-blue-300'
                              : 'hover:bg-gray-50'
                            }
                          `}
                          onMouseDown={() => handleMouseDown(dayIndex, timeIndex)}
                          onMouseEnter={() => handleMouseEnter(dayIndex, timeIndex)}
                          onMouseUp={handleMouseUp}
                        >
                          {/* Empty schedule placeholder */}
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-zinc-500">
                              {dayIndex === 0 && timeIndex === 0 ? "Belum ada jadwal" : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Day scroll controls */}
        {days.length > 3 && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
            <button
              onClick={() => scrollDays('left')}
              disabled={dayStartIndex === 0}
              className="w-6 h-6 bg-white border border-zinc-300 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <span className="material-icons text-xs">keyboard_arrow_up</span>
            </button>
            <button
              onClick={() => scrollDays('right')}
              disabled={dayStartIndex >= days.length - 3}
              className="w-6 h-6 bg-white border border-zinc-300 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <span className="material-icons text-xs">keyboard_arrow_down</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleGrid;
