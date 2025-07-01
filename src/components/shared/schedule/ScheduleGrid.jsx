// src/components/shared/schedule/ScheduleGrid.jsx - Best Practices with React Query + Enhanced Features

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const ScheduleGrid = ({ 
  onTimeSlotSelect, 
  containerWidth = 808,
  sidebarExpanded = false,
  selectedDates = [],
  schedules = [],
  loading = false,
  getScheduleAtTime
}) => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrollLeft, setScrollLeft] = useState(0);
  const viewportRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastMousePosRef = useRef(null);

  // Constants - defined first
  const baseWidth = 808;
  const baseHeight = 254;
  const actualWidth = Math.max(baseWidth, containerWidth);
  const actualHeight = baseHeight;
  const HOUR_WIDTH = 80;
  const DAY_ROW_HEIGHT = 50;
  const TIME_HEADER_HEIGHT = 30;
  const DAY_COLUMN_WIDTH = 70;
  const HEADER_HEIGHT = 66;
  const GRID_CONTENT_HEIGHT = actualHeight - HEADER_HEIGHT;

  // Static data - memoized
  const days = useMemo(() => [
    { short: "Sen", full: "Senin" }, { short: "Sel", full: "Selasa" },
    { short: "Rab", full: "Rabu" }, { short: "Kam", full: "Kamis" },
    { short: "Jum", full: "Jumat" }, { short: "Sab", full: "Sabtu" },
    { short: "Min", full: "Minggu" }
  ], []);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 6; i <= 22; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    slots.push('23:00');
    for (let i = 0; i <= 5; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Helper functions - defined before useMemo that uses them
  const getTypeColor = useCallback((type) => {
    const colors = {
      counseling: "#9986FF",
      class: "#3CE69E", 
      seminar: "#FF886D",
      meeting: "#3399E9",
      other: "#979797"
    };
    return colors[type] || colors.other;
  }, []);

  const getTimezoneDisplay = useCallback((timezone) => {
    const timezoneMap = {
      "Asia/Jakarta": "WIB",
      "Asia/Makassar": "WITA", 
      "Asia/Jayapura": "WIT"
    };
    return timezoneMap[timezone] || "WIB";
  }, []);

  const getHourDisplayIndex = useCallback((hour) => {
    if (hour >= 6 && hour <= 22) {
      return hour - 6;
    } else if (hour === 23) {
      return 17;
    } else if (hour >= 0 && hour <= 5) {
      return hour + 18; 
    }
    return 0;
  }, []);

  const getActualHour = useCallback((index) => {
    if (index >= 0 && index <= 16) {
      return index + 6;
    } else if (index === 17) {
      return 23;
    } else if (index >= 18 && index <= 23) {
      return index - 18;
    }
    return 6;
  }, []);

  const timeToPosition = useCallback((timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const hourIndex = getHourDisplayIndex(hours);
    const basePosition = hourIndex * HOUR_WIDTH;
    const minuteOffset = (minutes / 60) * HOUR_WIDTH;
    return basePosition + minuteOffset;
  }, [getHourDisplayIndex]);

  const calculateEventWidth = useCallback((startTime, endTime) => {
    const startPos = timeToPosition(startTime);
    const endPos = timeToPosition(endTime);
    return endPos - startPos;
  }, [timeToPosition]);

  // Convert backend schedule data to display format
  const getScheduleToDisplay = useMemo(() => {
    const scheduleData = {};
    
    // Initialize all days as empty arrays
    days.forEach(day => {
      scheduleData[day.full] = [];
    });

    // Process schedules
    schedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      const dayName = days[scheduleDate.getDay()]?.full;
      
      if (dayName) {
        // Filter by selected dates if any
        if (selectedDates.length > 0) {
          const isDateSelected = selectedDates.some(date => 
            date.toDateString() === scheduleDate.toDateString()
          );
          if (!isDateSelected) return;
        }

        // Format schedule for display
        const displaySchedule = {
          id: schedule.id,
          name: schedule.agenda || schedule.displayName || "No Title",
          startTime: new Date(schedule.startDateTime).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          endTime: new Date(schedule.endDateTime).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          platform: schedule.location || "Location",
          type: schedule.type || "other",
          color: getTypeColor(schedule.type),
          timezone: schedule.timezone || "Asia/Jakarta",
          timezoneDisplay: getTimezoneDisplay(schedule.timezone),
          participants: schedule.participants || [],
          originalData: schedule
        };

        scheduleData[dayName].push(displaySchedule);
      }
    });

    return scheduleData;
  }, [schedules, selectedDates, days, getTypeColor, getTimezoneDisplay]);

  // Check functions
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

  const isTimeRangeOccupied = useCallback((dayIndex, startHour, endHour, startMinute = 0, endMinute = 0) => {
    // Enhanced to check 5-minute intervals
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    for (let minutes = startTimeInMinutes; minutes < endTimeInMinutes; minutes += 5) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      if (isTimeSlotOccupied(dayIndex, hour, minute)) {
        return true;
      }
    }
    return false;
  }, [isTimeSlotOccupied]);

  // Dividers calculation
  const halfHourDividers = useMemo(() => {
    const dividers = [];
    for (let hourIndex = 0; hourIndex < timeSlots.length - 1; hourIndex++) {
      const position = (hourIndex + 1) * HOUR_WIDTH;
      dividers.push({ position, hourIndex });
    }
    return dividers;
  }, [timeSlots.length]);

  // Current time functions
  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const hourDisplayIndex = getHourDisplayIndex(currentHour);
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

  // Enhanced position calculation for 5-minute precision
  const getInfoFromPosition = useCallback((clientX, clientY) => {
    if (!viewportRef.current) return null;
    
    const rect = viewportRef.current.getBoundingClientRect();
    const scrollLeft = viewportRef.current.scrollLeft;
    const scrollTop = viewportRef.current.scrollTop;

    const absoluteX = clientX - rect.left + scrollLeft;
    const absoluteY = clientY - rect.top + scrollTop;

    const gridX = absoluteX - DAY_COLUMN_WIDTH;
    const gridY = absoluteY - TIME_HEADER_HEIGHT;

    if (gridX < 0 || gridY < 0) return null;

    const hourIndex = Math.floor(gridX / HOUR_WIDTH);
    const dayIndex = Math.floor(gridY / DAY_ROW_HEIGHT);

    if (hourIndex < 0 || hourIndex >= 24 || dayIndex < 0 || dayIndex >= days.length) {
      return null;
    }

    const actualHour = getActualHour(hourIndex);
    
    // Calculate 5-minute precision within the hour
    const pixelWithinHour = gridX % HOUR_WIDTH;
    const minuteWithinHour = Math.floor((pixelWithinHour / HOUR_WIDTH) * 60);
    const actualMinute = Math.floor(minuteWithinHour / 5) * 5; // Round to 5-minute intervals
    
    return { 
      hour: actualHour, 
      minute: actualMinute,
      hourIndex, 
      dayIndex 
    };
  }, [getActualHour, days.length]);

  // Enhanced mouse event handlers with 5-minute precision
  const handleOptimizedMouseMove = useCallback((e) => {
    if (!isDragging) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const info = getInfoFromPosition(e.clientX, e.clientY);
      if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
        const currentPos = `${info.dayIndex}-${info.hourIndex}-${info.minute}`;
        if (lastMousePosRef.current !== currentPos) {
          lastMousePosRef.current = currentPos;
          setSelectedArea(prev => ({ 
            ...prev, 
            endDay: info.dayIndex, 
            endHour: info.hour,
            endMinute: info.minute,
            endHourIndex: info.hourIndex
          }));
        }
      }
    });
  }, [isDragging, getInfoFromPosition, days.length]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const info = getInfoFromPosition(e.clientX, e.clientY);
    
    if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
      if (isTimeSlotOccupied(info.dayIndex, info.hour, info.minute)) {
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
        startMinute: info.minute,
        endMinute: info.minute,
        startHourIndex: info.hourIndex,
        endHourIndex: info.hourIndex
      });
      lastMousePosRef.current = `${info.dayIndex}-${info.hourIndex}-${info.minute}`;
    }
  }, [getInfoFromPosition, days, isTimeSlotOccupied]);

  const handleMouseUp = useCallback((e) => {
    if (!isDragging || !selectedArea || !dragStartPos) {
      setIsDragging(false);
      setSelectedArea(null);
      setDragStartPos(null);
      lastMousePosRef.current = null;
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const dragDistance = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
    );
    
    const isClick = dragDistance < 5;
    
    // Calculate selection bounds with 5-minute precision
    const startHour = Math.min(selectedArea.startHour, selectedArea.endHour);
    const endHour = Math.max(selectedArea.startHour, selectedArea.endHour);
    const startMinute = Math.min(selectedArea.startMinute || 0, selectedArea.endMinute || 0);
    const endMinute = Math.max(selectedArea.startMinute || 0, selectedArea.endMinute || 0);
    const startDay = Math.min(selectedArea.startDay, selectedArea.endDay);
    const endDay = Math.max(selectedArea.startDay, selectedArea.endDay);

    // For clicks, extend by minimum 5 minutes
    let finalEndHour = endHour;
    let finalEndMinute = endMinute;
    
    if (isClick) {
      finalEndMinute = startMinute + 5;
      if (finalEndMinute >= 60) {
        finalEndHour = startHour + 1;
        finalEndMinute = finalEndMinute - 60;
      } else {
        finalEndHour = startHour;
      }
    } else {
      // For drags, add 5 minutes to end time
      finalEndMinute = endMinute + 5;
      if (finalEndMinute >= 60) {
        finalEndHour = endHour + 1;
        finalEndMinute = finalEndMinute - 60;
      }
    }

    // Check for conflicts across all selected days
    let hasConflict = false;
    for (let day = startDay; day <= endDay; day++) {
      if (isTimeRangeOccupied(day, startHour, finalEndHour, startMinute, finalEndMinute)) {
        hasConflict = true;
        break;
      }
    }

    if (hasConflict) {
      console.log('Selected time range overlaps with existing schedule');
      setIsDragging(false);
      setSelectedArea(null);
      setDragStartPos(null);
      lastMousePosRef.current = null;
      return;
    }

    if (startDay >= 0 && startDay < days.length) {
      const today = new Date();
      const startDateTime = new Date(today);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(today);
      endDateTime.setHours(finalEndHour, finalEndMinute, 0, 0);

      const dayName = days[startDay]?.full;
      const isMultipleDays = startDay !== endDay;

      // Create dates array for multiple days if applicable
      const dates = [];
      for (let dayIndex = startDay; dayIndex <= endDay; dayIndex++) {
        const dayDate = new Date(today);
        // Adjust date based on day difference (assuming current week)
        dayDate.setDate(today.getDate() + (dayIndex - today.getDay()));
        
        dates.push({
          date: dayDate.toISOString().split('T')[0],
          startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
          endTime: `${finalEndHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`,
          timezone: 'Asia/Jakarta'
        });
      }

      onTimeSlotSelect({ 
        startDateTime, 
        endDateTime, 
        day: dayName,
        isMultipleDays,
        dates,
        draggedDays: endDay - startDay + 1
      });
    }
    
    setIsDragging(false);
    setSelectedArea(null);
    setDragStartPos(null);
    lastMousePosRef.current = null;
  }, [isDragging, selectedArea, dragStartPos, days, onTimeSlotSelect, isTimeRangeOccupied]);

  const handleScroll = useCallback((e) => {
    const newScrollLeft = e.target.scrollLeft;
    setScrollLeft(newScrollLeft);
  }, []);

  // Selection box rendering with original design
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

  // Effects
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 0;
      viewportRef.current.scrollTop = 0;
    }
  }, []);

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
        {loading && (
          <div className="ml-auto text-sm text-gray-500">Loading...</div>
        )}
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
              
              {/* 30-minute dividers */}
              {halfHourDividers.map((divider, i) => (
                <div 
                  key={`divider-30min-${i}`}
                  className="absolute pointer-events-none bg-red-400" 
                  style={{ 
                    left: `${divider.position - 1}px`,
                    top: '20%',
                    width: '2px',
                    height: '60%',
                    zIndex: 2
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Current time line - ENHANCED Z-INDEX */}
        <div 
          className="absolute pointer-events-none" 
          style={{ 
            left: `${DAY_COLUMN_WIDTH + getCurrentTimePosition() - scrollLeft}px`,
            top: `${TIME_HEADER_HEIGHT}px`,
            bottom: '0px',
            zIndex: 50, // HIGHER than schedule cards (z-30)
            width: '2px'
          }}
        >
          <div className="relative w-full h-full bg-red-500">
            <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full" 
                 style={{ top: '-5px', left: '50%', transform: 'translateX(-50%)' }} />
            
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
            {/* Day Column - SIMPLIFIED CLASSES */}
            <div 
              className="flex-shrink-0 bg-white sticky left-0"
              style={{ 
                width: `${DAY_COLUMN_WIDTH}px`,
                zIndex: 60
              }}
            >
              {days.map((day, index) => (
                <div 
                  key={day.short} 
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
              {/* Mouse event overlay */}
              <div
                className="absolute inset-0 cursor-pointer"
                style={{ 
                  zIndex: 5,
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

              {/* Render Schedule Events with TIMEZONE DISPLAY */}
              {Object.entries(getScheduleToDisplay).map(([dayName, events]) => {
                const dayIndex = days.findIndex(d => d.full === dayName);
                if (dayIndex === -1) return null;

                return events.map((event, eventIndex) => {
                  const left = timeToPosition(event.startTime);
                  const width = calculateEventWidth(event.startTime, event.endTime);
                  const top = dayIndex * DAY_ROW_HEIGHT + 5;
                  const height = DAY_ROW_HEIGHT - 10;

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
                        zIndex: 30 // Lower than current time indicator (z-50)
                      }}
                    >
                      <div className="text-white text-xs font-semibold truncate">
                        {event.name}
                      </div>
                      <div className="text-white text-xs truncate">
                        {event.startTime} - {event.endTime} {event.timezoneDisplay} | {event.platform}
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
                        zIndex: 25
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