// src/components/shared/schedule/ScheduleGrid.jsx - Fixed Scrollbars and Layout

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const ScheduleGrid = ({ 
  onTimeSlotSelect, 
  containerWidth = 808,
  sidebarExpanded = false 
}) => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const viewportRef = useRef(null);

  // Base dimensions (Figma: 808x254)
  const baseWidth = 808;
  const baseHeight = 254;
  const actualWidth = Math.max(baseWidth, containerWidth);
  const actualHeight = baseHeight;

  // Grid constants
  const HOUR_WIDTH = 80;
  const DAY_ROW_HEIGHT = 50;
  const TIME_HEADER_HEIGHT = 30;
  const DAY_COLUMN_WIDTH = 70;
  const HEADER_HEIGHT = 66;
  const GRID_CONTENT_HEIGHT = actualHeight - HEADER_HEIGHT;

  const days = useMemo(() => [
    { short: "Sen", full: "Senin" }, { short: "Sel", full: "Selasa" },
    { short: "Rab", full: "Rabu" }, { short: "Kam", full: "Kamis" },
    { short: "Jum", full: "Jumat" }, { short: "Sab", full: "Sabtu" },
    { short: "Min", full: "Minggu" }
  ], []);

  const timeSlots = useMemo(() => 
    Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`), []
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 6 * HOUR_WIDTH; // jam 06:00
      viewportRef.current.scrollTop = 0;
    }
  }, []);

  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    return (totalMinutes / (24 * 60)) * (24 * HOUR_WIDTH);
  }, [currentTime]);

  const getCurrentTimeString = useCallback(() => {
    const now = currentTime;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}.${minutes}`;
  }, [currentTime]);

  const getInfoFromPosition = useCallback((clientX, clientY) => {
    if (!viewportRef.current) return null;
    const rect = viewportRef.current.getBoundingClientRect();
    const scrollLeft = viewportRef.current.scrollLeft;
    const scrollTop = viewportRef.current.scrollTop;

    const relativeX = clientX - rect.left - DAY_COLUMN_WIDTH + scrollLeft;
    const relativeY = clientY - rect.top - TIME_HEADER_HEIGHT + scrollTop;

    if (relativeX < 0 || relativeY < 0) return null;

    const hour = relativeX / HOUR_WIDTH;
    const dayIndex = Math.floor(relativeY / DAY_ROW_HEIGHT);

    return { hour, dayIndex };
  }, []);

  const handleMouseDown = (e) => {
    const info = getInfoFromPosition(e.clientX, e.clientY);
    if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
      setIsDragging(true);
      setSelectedArea({
        startDay: info.dayIndex, endDay: info.dayIndex,
        startHour: info.hour, endHour: info.hour,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const info = getInfoFromPosition(e.clientX, e.clientY);
    if (info) {
      setSelectedArea(prev => ({ ...prev, endDay: info.dayIndex, endHour: info.hour }));
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectedArea) {
      const startHour = Math.floor(Math.min(selectedArea.startHour, selectedArea.endHour));
      const endHour = Math.ceil(Math.max(selectedArea.startHour, selectedArea.endHour));
      const dayIndex = Math.min(selectedArea.startDay, selectedArea.endDay);

      if (dayIndex >= 0 && dayIndex < days.length && endHour > startHour) {
        const dayName = days[dayIndex]?.full;
        const today = new Date();
        const startDateTime = new Date(today.setHours(startHour, 0, 0, 0));
        const endDateTime = new Date(today.setHours(endHour, 0, 0, 0));
        onTimeSlotSelect({ startDateTime, endDateTime, day: dayName });
      }
    }
    setIsDragging(false);
    setSelectedArea(null);
  };

  const renderSelectionBox = () => {
    if (!selectedArea) return null;

    const top = Math.min(selectedArea.startDay, selectedArea.endDay) * DAY_ROW_HEIGHT;
    const height = (Math.abs(selectedArea.startDay - selectedArea.endDay) + 1) * DAY_ROW_HEIGHT;
    const left = Math.min(selectedArea.startHour, selectedArea.endHour) * HOUR_WIDTH;
    const width = Math.abs(selectedArea.startHour - selectedArea.endHour) * HOUR_WIDTH;

    return (
      <div
        className="absolute bg-blue-400/20 border-2 border-blue-500 rounded-sm pointer-events-none z-20"
        style={{ top, left, width, height }}
      />
    );
  };

  return (
    <div 
      className="rounded-md border border-zinc-400 bg-white select-none transition-all duration-300"
      style={{ 
        width: `${actualWidth}px`, 
        height: `${actualHeight}px`
      }}
    >
      {/* Header */}
      <div className="flex items-center px-5 py-3 border-b border-zinc-200" style={{ height: `${HEADER_HEIGHT}px` }}>
        <div className="flex items-center">
          <div className="w-[30px] h-[30px] bg-[#488BBA] rounded flex items-center justify-center">
            <span className="material-icons text-white text-lg">calendar_month</span>
          </div>
          <h2 
            className="text-xl font-semibold text-[#488BBA]" 
            style={{ marginLeft: '15px' }}
          >
            Jadwal
          </h2>
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative overflow-hidden" style={{ height: `${GRID_CONTENT_HEIGHT}px` }}>
        
        {/* Fixed Time Header */}
        <div 
          className="absolute top-0 bg-white border-b border-zinc-200 z-10"
          style={{ 
            left: `${DAY_COLUMN_WIDTH}px`,
            right: '0px',
            height: `${TIME_HEADER_HEIGHT}px`
          }}
        >
          <div className="overflow-hidden h-full">
            <div 
              className="flex relative h-full"
              style={{ 
                width: `${24 * HOUR_WIDTH}px`,
                transform: `translateX(-${viewportRef.current?.scrollLeft || 0}px)`
              }}
            >
              {timeSlots.map((time, i) => (
                <div 
                  key={time} 
                  className="flex-shrink-0 text-center relative"
                  style={{ width: `${HOUR_WIDTH}px`, height: `${TIME_HEADER_HEIGHT}px` }}
                >
                  <span className="text-sm text-neutral-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    {time}
                  </span>
                </div>
              ))}
              
              {/* Red dividers between hours (30-minute markers) */}
              {timeSlots.slice(0, -1).map((_, i) => (
                <div 
                  key={`divider-${i}`}
                  className="absolute pointer-events-none" 
                  style={{ 
                    left: `${(i + 1) * HOUR_WIDTH}px`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <svg width="1" height="7" viewBox="0 0 1 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.287914 6.466L0.284914 0.544H0.719914V6.466H0.287914Z" fill="#FF7D7D"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div 
          ref={viewportRef}
          className="absolute inset-0 overflow-auto"
          style={{ 
            top: `${TIME_HEADER_HEIGHT}px`,
            overflowX: 'auto',
            overflowY: 'auto'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => isDragging && handleMouseUp()}
          onScroll={(e) => {
            // Update time header position
            const timeHeader = e.target.parentElement.querySelector('[style*="left: 70px"]');
            if (timeHeader) {
              const timeHeaderContent = timeHeader.querySelector('.flex.relative');
              if (timeHeaderContent) {
                timeHeaderContent.style.transform = `translateX(-${e.target.scrollLeft}px)`;
              }
            }
          }}
        >
          <div className="flex">
            {/* Fixed Day Column */}
            <div 
              className="flex-shrink-0 bg-white sticky left-0 z-5"
              style={{ width: `${DAY_COLUMN_WIDTH}px` }}
            >
              {days.map((day, index) => (
                <div 
                  key={day.short} 
                  className="flex items-center justify-center"
                  style={{ height: `${DAY_ROW_HEIGHT}px` }}
                >
                  <span className="text-base font-bold text-neutral-600">
                    {day.short}
                  </span>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div 
              className="relative"
              style={{ 
                width: `${24 * HOUR_WIDTH}px`, 
                height: `${days.length * DAY_ROW_HEIGHT}px` 
              }}
              onMouseDown={handleMouseDown}
            >
              {/* Horizontal day lines only */}
              {days.map((_, i) => (
                i > 0 && (
                  <div 
                    key={`hline-${i}`}
                    className="absolute left-0 right-0 h-px bg-zinc-200"
                    style={{ top: `${i * DAY_ROW_HEIGHT}px` }}
                  />
                )
              ))}

              {renderSelectionBox()}

              {/* Current time line */}
              <div 
                className="absolute top-0 bottom-0 z-30 pointer-events-none" 
                style={{ left: `${getCurrentTimePosition()}px` }}
              >
                <div className="relative w-px h-full bg-red-500">
                  <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full -translate-x-1/2 -top-1" />
                  
                  {/* Time tooltip */}
                  <div className="absolute left-2 top-2">
                    <svg width="35" height="15" viewBox="0 0 35 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="35" height="15" rx="3" fill="black" fillOpacity="0.35"/>
                      <text x="17.5" y="10" textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace">
                        {getCurrentTimeString()}
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;