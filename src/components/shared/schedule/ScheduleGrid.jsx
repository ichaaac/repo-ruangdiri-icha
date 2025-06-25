// src/components/shared/schedule/ScheduleGrid.jsx - Fixed Current Time and Google Calendar Behavior

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const ScheduleGrid = ({ 
  onTimeSlotSelect, 
  containerWidth = 808,
  sidebarExpanded = false 
}) => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
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

  const timeSlots = useMemo(() => {
    // Order: 6:00 - 22:00, then 23:00, 0:00 - 5:00
    const slots = [];
    
    // 6:00 - 22:00
    for (let i = 6; i <= 22; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    
    // 23:00, 0:00 - 5:00
    slots.push('23:00');
    for (let i = 0; i <= 5; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    
    return slots;
  }, []);

  // FIXED: Convert actual hour to display index
  const getHourDisplayIndex = useCallback((hour) => {
    if (hour >= 6 && hour <= 22) {
      return hour - 6; // 6:00-22:00 -> index 0-16
    } else if (hour === 23) {
      return 17; // 23:00 -> index 17
    } else if (hour >= 0 && hour <= 5) {
      return hour + 18; // 0:00-5:00 -> index 18-23
    }
    return 0;
  }, []);

  // FIXED: Convert display index to actual hour
  const getActualHour = useCallback((index) => {
    if (index >= 0 && index <= 16) {
      return index + 6; // index 0-16 -> 6:00-22:00
    } else if (index === 17) {
      return 23; // index 17 -> 23:00
    } else if (index >= 18 && index <= 23) {
      return index - 18; // index 18-23 -> 0:00-5:00
    }
    return 6;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 0; // Start at beginning (6:00)
      viewportRef.current.scrollTop = 0;
    }
  }, []);

  // FIXED: Current time position calculation
  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Get display index for current hour
    const hourDisplayIndex = getHourDisplayIndex(currentHour);
    
    // Calculate position based on display index
    const basePosition = hourDisplayIndex * HOUR_WIDTH;
    const minuteOffset = (currentMinutes / 60) * HOUR_WIDTH;
    
    return basePosition + minuteOffset;
  }, [currentTime, getHourDisplayIndex]);

  const getCurrentTimeString = useCallback(() => {
    const now = currentTime;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [currentTime]);

  const getInfoFromPosition = useCallback((clientX, clientY) => {
    if (!viewportRef.current) return null;
    const rect = viewportRef.current.getBoundingClientRect();
    const scrollLeft = viewportRef.current.scrollLeft;
    const scrollTop = viewportRef.current.scrollTop;

    // Calculate position relative to the time grid (excluding headers)
    const relativeX = clientX - rect.left - DAY_COLUMN_WIDTH + scrollLeft;
    const relativeY = clientY - rect.top - TIME_HEADER_HEIGHT + scrollTop;

    // Must be within the time grid area (not in headers)
    if (relativeX < 0 || relativeY < 0) return null;

    const hourIndex = Math.floor(relativeX / HOUR_WIDTH);
    const dayIndex = Math.floor(relativeY / DAY_ROW_HEIGHT);

    // Validate bounds - must be within valid grid area
    if (hourIndex < 0 || hourIndex >= 24 || dayIndex < 0 || dayIndex >= days.length) {
      return null;
    }

    // Additional check: ensure we're actually in the time grid area, not day labels
    const timeGridRect = viewportRef.current.getBoundingClientRect();
    const timeGridLeft = timeGridRect.left + DAY_COLUMN_WIDTH;
    const timeGridTop = timeGridRect.top + TIME_HEADER_HEIGHT;
    
    if (clientX < timeGridLeft || clientY < timeGridTop) {
      return null;
    }

    const actualHour = getActualHour(hourIndex);

    return { hour: actualHour, hourIndex, dayIndex };
  }, [getActualHour]);

  // IMPROVED: Google Calendar-like behavior
  const handleMouseDown = (e) => {
    const info = getInfoFromPosition(e.clientX, e.clientY);
    if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
      setIsDragging(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setSelectedArea({
        startDay: info.dayIndex, 
        endDay: info.dayIndex,
        startHour: info.hour,
        endHour: info.hour,
        startHourIndex: info.hourIndex,
        endHourIndex: info.hourIndex
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !dragStartPos) return;
    
    const info = getInfoFromPosition(e.clientX, e.clientY);
    if (info) {
      setSelectedArea(prev => ({ 
        ...prev, 
        endDay: info.dayIndex, 
        endHour: info.hour,
        endHourIndex: info.hourIndex
      }));
    }
  };

  const handleMouseUp = (e) => {
    if (!isDragging || !selectedArea || !dragStartPos) {
      setIsDragging(false);
      setSelectedArea(null);
      setDragStartPos(null);
      return;
    }

    // Check if it's a click (not drag)
    const dragDistance = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
    );
    
    const isClick = dragDistance < 5; // 5px threshold

    const startHour = Math.min(selectedArea.startHour, selectedArea.endHour);
    const endHour = Math.max(selectedArea.startHour, selectedArea.endHour);
    const startDay = Math.min(selectedArea.startDay, selectedArea.endDay);
    const endDay = Math.max(selectedArea.startDay, selectedArea.endDay);

    if (startDay >= 0 && startDay < days.length) {
      const dayName = days[startDay]?.full;
      
      // For click: create 1-hour slot, for drag: use selected range
      let finalEndHour = endHour;
      if (isClick) {
        finalEndHour = startHour + 1;
      } else {
        finalEndHour = endHour + 1; // Add 1 hour for end time
      }

      const today = new Date();
      const startDateTime = new Date(today);
      startDateTime.setHours(startHour, 0, 0, 0);
      
      const endDateTime = new Date(today);
      endDateTime.setHours(finalEndHour, 0, 0, 0);

      onTimeSlotSelect({ 
        startDateTime, 
        endDateTime, 
        day: dayName,
        isMultipleDays: startDay !== endDay
      });
    }
    
    setIsDragging(false);
    setSelectedArea(null);
    setDragStartPos(null);
  };

  const renderSelectionBox = () => {
    if (!selectedArea) return null;

    const startDayIndex = Math.min(selectedArea.startDay, selectedArea.endDay);
    const endDayIndex = Math.max(selectedArea.startDay, selectedArea.endDay);
    const startHourIndex = Math.min(selectedArea.startHourIndex || 0, selectedArea.endHourIndex || 0);
    const endHourIndex = Math.max(selectedArea.startHourIndex || 0, selectedArea.endHourIndex || 0);

    const top = startDayIndex * DAY_ROW_HEIGHT;
    const height = (endDayIndex - startDayIndex + 1) * DAY_ROW_HEIGHT;
    const left = startHourIndex * HOUR_WIDTH;
    const width = (endHourIndex - startHourIndex + 1) * HOUR_WIDTH;

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
        height: `${actualHeight}px`,
        overflow: 'hidden'
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
            height: `${TIME_HEADER_HEIGHT}px`,
            overflow: 'hidden'
          }}
        >
          <div className="h-full" style={{ overflow: 'hidden' }}>
            <div 
              className="flex relative h-full"
              style={{ 
                width: `${24 * HOUR_WIDTH}px`,
                minWidth: `${24 * HOUR_WIDTH}px`, 
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
              
              {/* Red dividers between hours */}
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
          className="absolute inset-0"
          style={{ 
            top: `${TIME_HEADER_HEIGHT}px`,
            overflowX: 'scroll',
            overflowY: 'auto'
          }}
          onScroll={(e) => {
            const timeHeader = e.target.parentElement.querySelector('[style*="left: 70px"]');
            if (timeHeader) {
              const timeHeaderContent = timeHeader.querySelector('.flex.relative');
              if (timeHeaderContent) {
                timeHeaderContent.style.transform = `translateX(-${e.target.scrollLeft}px)`;
              }
            }
          }}
        >
          <div className="flex" style={{ minWidth: `${DAY_COLUMN_WIDTH + (24 * HOUR_WIDTH)}px` }}>
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
              className="relative cursor-pointer"
              style={{ 
                width: `${24 * HOUR_WIDTH}px`, 
                height: `${days.length * DAY_ROW_HEIGHT}px`,
                minWidth: `${24 * HOUR_WIDTH}px`
              }}
            >
              {/* Invisible overlay for mouse events - ensures events only in grid area */}
              <div
                className="absolute inset-0 z-10"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => isDragging && handleMouseUp()}
              />

              {/* Horizontal day lines */}
              {days.map((_, i) => (
                i > 0 && (
                  <div 
                    key={`hline-${i}`}
                    className="absolute left-0 right-0 h-px bg-zinc-200 pointer-events-none"
                    style={{ top: `${i * DAY_ROW_HEIGHT}px` }}
                  />
                )
              ))}

              {renderSelectionBox()}

              {/* Current time line - FIXED position */}
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