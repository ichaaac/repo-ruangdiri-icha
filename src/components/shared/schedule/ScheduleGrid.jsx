// src/components/shared/schedule/ScheduleGrid.jsx - Fixed Z-Index & Schedule Cards

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// Dummy data berdasarkan Figma design
const dummyScheduleData = {
  "Senin": [
    {
      id: "sen1",
      name: "Armani",
      startTime: "06:00",
      endTime: "08:00",
      platform: "Zoom",
      type: "seminar", // Maps to "#FF886D"
      color: "#FF886D"
    },
    {
      id: "sen2", 
      name: "Armani",
      startTime: "08:30",
      endTime: "12:30",
      platform: "Zoom",
      type: "other", // Maps to "#979797"
      color: "#979797"
    },
    {
      id: "sen3",
      name: "Armani", 
      startTime: "12:30",
      endTime: "14:00",
      platform: "Zoom",
      type: "counseling", // Maps to "#9986FF"
      color: "#9986FF"
    }
  ],
  "Selasa": [], // Kosong seperti di Figma
  "Rabu": [
    {
      id: "rab1",
      name: "Armani",
      startTime: "06:00", 
      endTime: "08:30",
      platform: "Zoom",
      type: "class", // Maps to "#3CE69E"
      color: "#3CE69E"
    },
    {
      id: "rab2",
      name: "Armani",
      startTime: "08:30",
      endTime: "11:00", 
      platform: "Zoom",
      type: "meeting", // Maps to "#3399E9"
      color: "#3399E9"
    },
    {
      id: "rab3",
      name: "Bahlil Nikel",
      startTime: "11:00",
      endTime: "13:00",
      platform: "Zoom", 
      type: "seminar", // Maps to "#FF886D"
      color: "#FF886D"
    },
    {
      id: "rab4",
      name: "Armani",
      startTime: "13:00",
      endTime: "14:00",
      platform: "Offline",
      type: "counseling", // Maps to "#9986FF"
      color: "#9986FF"
    }
  ],
  "Kamis": [
    {
      id: "kam1",
      name: "Sarah Johnson",
      startTime: "09:00",
      endTime: "10:30", 
      platform: "Teams",
      type: "meeting", // Maps to "#3399E9"
      color: "#3399E9"
    }
  ],
  "Jumat": [
    {
      id: "jum1", 
      name: "Team Meeting",
      startTime: "10:00",
      endTime: "11:30",
      platform: "Google Meet",
      type: "meeting", // Maps to "#3399E9"
      color: "#3399E9"
    }
  ],
  "Sabtu": [
    {
      id: "sab1",
      name: "Workshop",
      startTime: "08:00", 
      endTime: "12:00",
      platform: "Offline",
      type: "class", // Maps to "#3CE69E"
      color: "#3CE69E"
    }
  ],
  "Minggu": []
};

const ScheduleGrid = ({ 
  onTimeSlotSelect, 
  containerWidth = 808,
  sidebarExpanded = false,
  selectedDates = [] // Prop untuk tanggal yang dipilih dari DatePicker
}) => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrollLeft, setScrollLeft] = useState(0);
  const viewportRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastMousePosRef = useRef(null);

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

  // Get schedule data for selected dates or show all if none selected
  const getScheduleToDisplay = useMemo(() => {
    if (selectedDates.length === 0) {
      // Jika tidak ada tanggal dipilih, tampilkan semua data
      return dummyScheduleData;
    }
    
    const scheduleData = {};
    selectedDates.forEach(date => {
      const dayName = days[date.getDay()]?.full;
      if (dayName && dummyScheduleData[dayName]) {
        scheduleData[dayName] = dummyScheduleData[dayName];
      }
    });
    return scheduleData;
  }, [selectedDates, days]);

  // Check if a time slot is occupied by existing schedule
  const isTimeSlotOccupied = useCallback((dayIndex, hour, minute = 0) => {
    const dayName = days[dayIndex]?.full;
    if (!dayName || !getScheduleToDisplay[dayName]) return false;

    const currentTimeInMinutes = hour * 60 + minute;
    
    return getScheduleToDisplay[dayName].some(event => {
      const [startHour, startMinute] = event.startTime.split(':').map(Number);
      const [endHour, endMinute] = event.endTime.split(':').map(Number);
      
      const eventStartMinutes = startHour * 60 + startMinute;
      const eventEndMinutes = endHour * 60 + endMinute;
      
      return currentTimeInMinutes >= eventStartMinutes && currentTimeInMinutes < eventEndMinutes;
    });
  }, [days, getScheduleToDisplay]);

  // Convert time string to position
  const timeToPosition = useCallback((timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const hourIndex = getHourDisplayIndex(hours);
    const basePosition = hourIndex * HOUR_WIDTH;
    const minuteOffset = (minutes / 60) * HOUR_WIDTH;
    return basePosition + minuteOffset;
  }, []);

  // Convert time string to width
  const calculateEventWidth = useCallback((startTime, endTime) => {
    const startPos = timeToPosition(startTime);
    const endPos = timeToPosition(endTime);
    return endPos - startPos;
  }, [timeToPosition]);

  // FIXED: Convert actual hour to display index
  const getHourDisplayIndex = useCallback((hour) => {
    if (hour >= 6 && hour <= 22) {
      return hour - 6; // 6:00-22:00 -> index 0-16
    } else if (hour === 23) {
      return 17; // 23:00 -> index 17
    } else if (hour >= 0 && hour <= 5) {
      return hour + 18; 
    }
    return 0;
  }, []);

  // FIXED: 30-minute dividers - now positioned BETWEEN hours, not overlapping
  const halfHourDividers = useMemo(() => {
    const dividers = [];
    
    // Create dividers between each hour (not in the middle of hours)
    for (let hourIndex = 0; hourIndex < timeSlots.length - 1; hourIndex++) {
      const position = (hourIndex + 1) * HOUR_WIDTH; // Position at the boundary between hours
      dividers.push({
        position,
        hourIndex,
      });
    }
    
    return dividers;
  }, [timeSlots.length]);

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

  // FIXED: Simplified and more reliable position calculation
  const getInfoFromPosition = useCallback((clientX, clientY) => {
    if (!viewportRef.current) return null;
    
    const rect = viewportRef.current.getBoundingClientRect();
    const scrollLeft = viewportRef.current.scrollLeft;
    const scrollTop = viewportRef.current.scrollTop;

    // Get absolute position within the scrollable container
    const absoluteX = clientX - rect.left + scrollLeft;
    const absoluteY = clientY - rect.top + scrollTop;

    // Calculate relative to grid start (after day column and time header)
    const gridX = absoluteX - DAY_COLUMN_WIDTH;
    const gridY = absoluteY - TIME_HEADER_HEIGHT;

    // Must be within the actual grid area
    if (gridX < 0 || gridY < 0) return null;

    // Calculate grid indices
    const hourIndex = Math.floor(gridX / HOUR_WIDTH);
    const dayIndex = Math.floor(gridY / DAY_ROW_HEIGHT);

    // Validate bounds
    if (hourIndex < 0 || hourIndex >= 24 || dayIndex < 0 || dayIndex >= days.length) {
      return null;
    }

    const actualHour = getActualHour(hourIndex);

    return { hour: actualHour, hourIndex, dayIndex };
  }, [getActualHour, days.length]);

  // OPTIMIZED: Throttled mouse move with requestAnimationFrame
  const handleOptimizedMouseMove = useCallback((e) => {
    if (!isDragging) return;

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule update on next frame
    animationFrameRef.current = requestAnimationFrame(() => {
      const info = getInfoFromPosition(e.clientX, e.clientY);
      if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
        // Only update if position actually changed
        const currentPos = `${info.dayIndex}-${info.hourIndex}`;
        if (lastMousePosRef.current !== currentPos) {
          lastMousePosRef.current = currentPos;
          setSelectedArea(prev => ({ 
            ...prev, 
            endDay: info.dayIndex, 
            endHour: info.hour,
            endHourIndex: info.hourIndex
          }));
        }
      }
    });
  }, [isDragging, getInfoFromPosition, days.length]);

  // OPTIMIZED: Mouse down handler with debugging and occupied slot check
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const info = getInfoFromPosition(e.clientX, e.clientY);
    
    // Debug log for troubleshooting
    console.log('Mouse down:', { 
      clientX: e.clientX, 
      clientY: e.clientY, 
      info,
      dayName: info ? days[info.dayIndex]?.short : 'none'
    });
    
    if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
      // Check if this time slot is already occupied
      if (isTimeSlotOccupied(info.dayIndex, info.hour)) {
        console.log('Time slot occupied, cannot select');
        return;
      }

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
      lastMousePosRef.current = `${info.dayIndex}-${info.hourIndex}`;
    }
  }, [getInfoFromPosition, days, isTimeSlotOccupied]);

  // OPTIMIZED: Mouse up handler
  const handleMouseUp = useCallback((e) => {
    if (!isDragging || !selectedArea || !dragStartPos) {
      setIsDragging(false);
      setSelectedArea(null);
      setDragStartPos(null);
      lastMousePosRef.current = null;
      return;
    }

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Check if it's a click (not drag)
    const dragDistance = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
    );
    
    const isClick = dragDistance < 5; // 5px threshold

    const startHour = Math.min(selectedArea.startHour, selectedArea.endHour);
    const endHour = Math.max(selectedArea.startHour, selectedArea.endHour);
    const startDay = Math.min(selectedArea.startDay, selectedArea.endDay);

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
        isMultipleDays: selectedArea.startDay !== selectedArea.endDay
      });
    }
    
    setIsDragging(false);
    setSelectedArea(null);
    setDragStartPos(null);
    lastMousePosRef.current = null;
  }, [isDragging, selectedArea, dragStartPos, days, onTimeSlotSelect]);

  // OPTIMIZED: Selection box rendering with memoization
  const selectionBox = useMemo(() => {
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
  }, [selectedArea]);

  // Handle scroll event to update sync elements
  const handleScroll = useCallback((e) => {
    const newScrollLeft = e.target.scrollLeft;
    setScrollLeft(newScrollLeft);
  }, []);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
                transform: `translateX(-${scrollLeft}px)`
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
              
              {/* FIXED: 30-minute dividers - now positioned BETWEEN hours */}
              {halfHourDividers.map((divider, i) => (
                <div 
                  key={`divider-30min-${i}`}
                  className="absolute pointer-events-none bg-red-400" 
                  style={{ 
                    left: `${divider.position - 1}px`, // Position at boundary between hours
                    top: '20%',
                    width: '2px',
                    height: '60%',
                    zIndex: 2 // Lower than current time line
                  }}
                />
              ))}

            </div>
          </div>
        </div>

        {/* FIXED: Current time line - higher z-index than dividers but lower than day column */}
        <div 
          className="absolute pointer-events-none" 
          style={{ 
            left: `${DAY_COLUMN_WIDTH + getCurrentTimePosition() - scrollLeft}px`,
            top: `${TIME_HEADER_HEIGHT}px`,
            bottom: '0px',
            zIndex: 15, // Higher than dividers (2) but lower than day column (60)
            width: '2px'
          }}
        >
          <div className="relative w-full h-full bg-red-500">
            {/* Red dot at top */}
            <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full" 
                 style={{ top: '-5px', left: '50%', transform: 'translateX(-50%)' }} />
            
            {/* Compact time tooltip */}
            <div className="absolute" style={{ left: '6px', top: '2px' }}>
              <div className="bg-black bg-opacity-80 rounded text-white text-xs font-mono px-1.5 py-1 whitespace-nowrap shadow-lg">
                {getCurrentTimeString()}
              </div>
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
          onScroll={handleScroll}
        >
          <div className="flex" style={{ minWidth: `${DAY_COLUMN_WIDTH + (24 * HOUR_WIDTH)}px` }}>
            {/* FIXED: Day Column with higher z-index */}
            <div 
              className="flex-shrink-0 bg-white sticky left-0"
              style={{ 
                width: `${DAY_COLUMN_WIDTH}px`,
                zIndex: 60 // Highest z-index to stay above everything including current time line
              }}
            >
              {days.map((day, index) => (
                <div 
                  key={day.short} 
                  className={`flex items-center justify-center border-b border-zinc-100 ${
                    selectedDates.length > 0 && selectedDates.some(date => days[date.getDay()]?.short === day.short) 
                      ? 'bg-blue-50 font-bold' 
                      : ''
                  }`}
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
                height: `${days.length * DAY_ROW_HEIGHT}px`,
                minWidth: `${24 * HOUR_WIDTH}px`
              }}
            >
              {/* Mouse event overlay - covers entire grid area */}
              <div
                className="absolute inset-0 cursor-pointer"
                style={{ 
                  zIndex: 5, // Lower than schedule events and current time line
                  backgroundColor: 'transparent'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleOptimizedMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />

              {/* Horizontal day lines */}
              {days.map((_, i) => (
                i > 0 && (
                  <div 
                    key={`hline-${i}`}
                    className="absolute left-0 right-0 h-px bg-zinc-200 pointer-events-none"
                    style={{ top: `${i * DAY_ROW_HEIGHT}px`, zIndex: 1 }}
                  />
                )
              ))}

              {/* Render Schedule Events */}
              {Object.entries(getScheduleToDisplay).map(([dayName, events]) => {
                const dayIndex = days.findIndex(d => d.full === dayName);
                if (dayIndex === -1) return null;

                return events.map((event, eventIndex) => {
                  const left = timeToPosition(event.startTime);
                  const width = calculateEventWidth(event.startTime, event.endTime);
                  const top = dayIndex * DAY_ROW_HEIGHT + 5; // Small padding
                  const height = DAY_ROW_HEIGHT - 10; // Small padding

                  return (
                    <div
                      key={`${event.id}-${eventIndex}`}
                      className="absolute rounded-md px-2 py-1 pointer-events-none"
                      style={{
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        backgroundColor: event.color,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        zIndex: 30 // Higher than current time line (15) and mouse overlay (5)
                      }}
                    >
                      <div className="text-white text-xs font-semibold truncate">
                        {event.name}
                      </div>
                      <div className="text-white text-xs truncate">
                        {event.startTime} - {event.endTime} WIB | {event.platform}
                      </div>
                    </div>
                  );
                });
              })}

              {/* Show "Belum ada jadwal" for empty rows when specific dates selected */}
              {selectedDates.length > 0 && days.map((day, dayIndex) => {
                const hasEvents = getScheduleToDisplay[day.full] && getScheduleToDisplay[day.full].length > 0;
                const isDaySelected = selectedDates.some(date => days[date.getDay()]?.full === day.full);
                
                if (isDaySelected && !hasEvents) {
                  const top = dayIndex * DAY_ROW_HEIGHT + 5;
                  const height = DAY_ROW_HEIGHT - 10;
                  
                  return (
                    <div
                      key={`empty-${dayIndex}`}
                      className="absolute rounded-md px-2 py-1 pointer-events-none flex items-center justify-center"
                      style={{
                        left: '200px',
                        top: `${top}px`,
                        width: '200px',
                        height: `${height}px`,
                        backgroundColor: 'transparent',
                        zIndex: 25 // Between mouse overlay and schedule events
                      }}
                    >
                      <div className="text-gray-400 text-xs">
                        Belum ada jadwal
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {selectionBox}

          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;