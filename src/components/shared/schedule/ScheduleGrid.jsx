// src/components/shared/schedule/ScheduleGrid.jsx - ENHANCED LAYOUT AND Z-INDEX

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const ScheduleGrid = ({ 
  onTimeSlotSelect, 
  onScheduleClick,
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
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragTimer, setDragTimer] = useState(null);
  
  const viewportRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastMousePosRef = useRef(null);
  const dragStartTimeRef = useRef(null);

  // Constants
  const baseWidth = 808;
  const baseHeight = 254;
  const actualWidth = Math.max(baseWidth, containerWidth);
  const actualHeight = baseHeight;
  const HOUR_WIDTH = 80;
  const MIN_DAY_ROW_HEIGHT = 55; // Increased base height
  
  // ENHANCED STACKING CONSTANTS
  const SCHEDULE_BASE_HEIGHT = 36; // Increased for better readability
  const SCHEDULE_COMPRESSED_HEIGHT = 24; // Increased compressed height
  const SCHEDULE_MARGIN = 3; // Increased margin
  const STACK_OVERLAP = 2; // Reduced overlap for cleaner look
  const MAX_VISIBLE_STACKS = 4; // Reduced to prevent overcrowding
  const STACK_EXPANSION_HEIGHT = 8; // Additional height per stack
  
  const TIME_HEADER_HEIGHT = 30;
  const DAY_COLUMN_WIDTH = 70;
  const HEADER_HEIGHT = 66;
  const DRAG_THRESHOLD = 5;
  const CLICK_TIMEOUT = 150;
  const MAX_DRAG_DAYS = 2;

  // FIXED: Enhanced Z-INDEX HIERARCHY
  const Z_INDICES = {
    BACKGROUND: 0,
    GRID_LINES: 5,
    DAY_ROW_LINES: 10,        // NEW: Specific for day row lines
    SCHEDULE_EVENTS: 15,
    STACKED_SCHEDULES: 20,
    OVERFLOW_INDICATORS: 25,
    SELECTION_BOX: 30,
    CURRENT_TIME: 35,         // FIXED: Higher than day row lines but lower than headers
    DAY_HEADERS: 40,          // FIXED: Higher than current time
    TIME_HEADERS: 45,
    SCROLL_BARS: 10,          // FIXED: Same as day row lines so current time can be above it
    MODALS: 100
  };

  // Static data
  const days = useMemo(() => [
    { short: "Sen", full: "Senin" }, { short: "Sel", full: "Selasa" },
    { short: "Rab", full: "Rabu" }, { short: "Kam", full: "Kamis" },
    { short: "Jum", full: "Jumat" }, { short: "Sab", full: "Sabtu" },
    { short: "Min", full: "Minggu" }
  ], []);

  // FIXED: Add 00:00 after 23:00
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 6; i <= 23; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    slots.push('00:00'); // Add midnight after 23:00
    return slots;
  }, []);

  // FIXED: Update half hour dividers to include 23:30
  const halfHourDividers = useMemo(() => {
    const dividers = [];
    for (let i = 0; i < timeSlots.length - 1; i++) { // Exclude 00:00 from dividers
      const position = i * HOUR_WIDTH + HOUR_WIDTH / 2 + 25;
      dividers.push({ position, hourIndex: i });
    }
    // Add 23:30 divider
    const last23Position = (timeSlots.length - 2) * HOUR_WIDTH + HOUR_WIDTH / 2 + 25;
    dividers.push({ position: last23Position, hourIndex: timeSlots.length - 2, isHalfPast: true });
    return dividers;
  }, [timeSlots.length]);

  // Helper functions
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
    if (timezone === "WIB" || timezone === "WITA" || timezone === "WIT") {
      return timezone;
    }
    
    if (typeof timezone === 'string' && timezone.includes('+')) {
      const offset = timezone.split('+')[1];
      switch (offset) {
        case '07': return 'WIB';
        case '08': return 'WITA'; 
        case '09': return 'WIT';
        default: return 'WIB';
      }
    }
    
    if (typeof timezone === 'string' && (timezone.includes('T') || timezone.includes(' '))) {
      const offsetMatch = timezone.match(/([+-]\d{2})/);
      if (offsetMatch) {
        const offset = offsetMatch[1].replace('+', '');
        switch (offset) {
          case '07': return 'WIB';
          case '08': return 'WITA';
          case '09': return 'WIT';
          default: return 'WIB';
        }
      }
    }
    
    return 'WIB';
  }, []);

  const getHourDisplayIndex = useCallback((hour) => {
    if (hour === 0) return timeSlots.length - 1; // 00:00 is at the end
    return Math.max(0, Math.min(17, hour - 6));
  }, [timeSlots.length]);

  const getActualHour = useCallback((index) => {
    if (index === timeSlots.length - 1) return 0; // Last slot is 00:00
    if (index >= 0 && index <= 17) return index + 6;
    return 6;
  }, [timeSlots.length]);

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
    return Math.max(endPos - startPos, 60); // Increased minimum width
  }, [timeToPosition]);

  // Current time helpers
  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const hourIndex = getHourDisplayIndex(hour);
    const minuteOffset = (minutes / 60);
    const totalOffset = hourIndex + minuteOffset;
    return totalOffset * HOUR_WIDTH;
  }, [currentTime, getHourDisplayIndex]);

  const getCurrentTimeString = useCallback(() => {
    const now = currentTime;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [currentTime]);

  // ENHANCED: Schedule processing with better collision detection
  const processedSchedules = useMemo(() => {
    const processed = {};
    
    days.forEach(day => {
      processed[day.full] = {};
    });

    schedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      const dayName = days[scheduleDate.getDay()]?.full;
      
      if (dayName) {
        if (selectedDates.length > 0) {
          const isDateSelected = selectedDates.some(date => 
            date.toDateString() === scheduleDate.toDateString()
          );
          if (!isDateSelected) return;
        }

        const startTime = new Date(schedule.startDateTime);
        const endTime = new Date(schedule.endDateTime);
        
        const displaySchedule = {
          id: schedule.id,
          name: schedule.agenda || schedule.displayName || "No Title",
          startTime: startTime.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          endTime: endTime.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          platform: schedule.location || "Location",
          type: schedule.type || "other",
          color: getTypeColor(schedule.type),
          timezone: schedule.timezone || "WIB",
          timezoneDisplay: getTimezoneDisplay(schedule.timezone || schedule.startDateTime),
          participants: schedule.participants || [],
          originalData: schedule,
          startDateTime: startTime,
          endDateTime: endTime,
          duration: endTime - startTime
        };

        const startHour = startTime.getHours();
        const timeSlot = `${startHour.toString().padStart(2, '0')}:00`;
        
        if (!processed[dayName][timeSlot]) {
          processed[dayName][timeSlot] = [];
        }
        
        processed[dayName][timeSlot].push(displaySchedule);
      }
    });

    // ENHANCED: Better overlap detection and positioning
    Object.keys(processed).forEach(dayName => {
      Object.keys(processed[dayName]).forEach(timeSlot => {
        const events = processed[dayName][timeSlot];
        
        // Sort by start time, then by duration (longer first)
        events.sort((a, b) => {
          const timeDiff = a.startDateTime - b.startDateTime;
          if (timeDiff !== 0) return timeDiff;
          return b.duration - a.duration;
        });

        // Enhanced overlap detection
        events.forEach((event, index) => {
          const overlapping = events.filter(otherEvent => {
            if (otherEvent.id === event.id) return false;
            
            // Check for time overlap with 5-minute buffer
            const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
            return (event.startDateTime < (otherEvent.endDateTime + buffer) && 
                   (event.endDateTime + buffer) > otherEvent.startDateTime);
          });

          event.stackIndex = index;
          event.totalStacks = Math.max(1, overlapping.length + 1);
          event.isStacked = overlapping.length > 0;
          event.overlapCount = overlapping.length;
        });
      });
    });

    return processed;
  }, [schedules, selectedDates, days, getTypeColor, getTimezoneDisplay]);

  // ENHANCED: Dynamic row heights with better stacking support
  const dayRowHeights = useMemo(() => {
    const heights = {};
    
    days.forEach(day => {
      let maxStackCount = 1;
      let hasEvents = false;
      
      Object.values(processedSchedules[day.full] || {}).forEach(eventsInSlot => {
        if (eventsInSlot.length > 0) {
          hasEvents = true;
          const maxConcurrent = Math.max(...eventsInSlot.map(e => e.totalStacks || 1));
          maxStackCount = Math.max(maxStackCount, maxConcurrent);
        }
      });
      
      // Calculate dynamic height based on stack count
      let baseHeight = MIN_DAY_ROW_HEIGHT;
      
      if (hasEvents && maxStackCount > 1) {
        // Add height for each additional stack, but cap at reasonable limit
        const additionalStacks = Math.min(maxStackCount - 1, MAX_VISIBLE_STACKS);
        const additionalHeight = additionalStacks * (SCHEDULE_COMPRESSED_HEIGHT + SCHEDULE_MARGIN + STACK_EXPANSION_HEIGHT);
        baseHeight += additionalHeight;
      }
      
      heights[day.full] = Math.max(baseHeight, MIN_DAY_ROW_HEIGHT);
    });
    
    return heights;
  }, [processedSchedules, days]);

  const totalGridHeight = useMemo(() => {
    return Object.values(dayRowHeights).reduce((sum, height) => sum + height, 0);
  }, [dayRowHeights]);

  // Position calculation helpers
  const getDayRowTop = useCallback((dayIndex) => {
    let top = 0;
    for (let i = 0; i < dayIndex; i++) {
      const dayName = days[i]?.full;
      top += dayRowHeights[dayName] || MIN_DAY_ROW_HEIGHT;
    }
    return top;
  }, [days, dayRowHeights]);

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
    
    let dayIndex = -1;
    let currentTop = 0;
    
    for (let i = 0; i < days.length; i++) {
      const dayHeight = dayRowHeights[days[i].full] || MIN_DAY_ROW_HEIGHT;
      if (gridY >= currentTop && gridY < currentTop + dayHeight) {
        dayIndex = i;
        break;
      }
      currentTop += dayHeight;
    }

    if (hourIndex < 0 || hourIndex >= timeSlots.length || dayIndex < 0 || dayIndex >= days.length) {
      return null;
    }

    const actualHour = getActualHour(hourIndex);
    const pixelWithinHour = gridX % HOUR_WIDTH;
    const minuteWithinHour = Math.floor((pixelWithinHour / HOUR_WIDTH) * 60);
    const actualMinute = Math.floor(minuteWithinHour / 5) * 5;
    
    return { 
      hour: actualHour, 
      minute: actualMinute,
      hourIndex, 
      dayIndex,
      exactPixelX: gridX,
      exactPixelY: gridY - getDayRowTop(dayIndex)
    };
  }, [getActualHour, days.length, timeSlots.length, dayRowHeights, getDayRowTop]);

  // Event handlers (keeping existing logic)
  const handleScheduleClick = useCallback((event, scheduleData) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!isDragging && !isMouseDown) {
      onScheduleClick && onScheduleClick(scheduleData.originalData || scheduleData);
    }
  }, [isDragging, isMouseDown, onScheduleClick]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.schedule-event')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    const info = getInfoFromPosition(e.clientX, e.clientY);
    
    if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
      setIsMouseDown(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
      dragStartTimeRef.current = Date.now();
      
      const timer = setTimeout(() => {
        if (isMouseDown) {
          setIsDragging(true);
          setSelectedArea({
            startDay: info.dayIndex, 
            endDay: info.dayIndex,
            startHour: info.hour,
            endHour: info.hour,
            startMinute: info.minute,
            endMinute: info.minute,
            startHourIndex: info.hourIndex,
            endHourIndex: info.hourIndex,
            startPixelX: info.exactPixelX,
            endPixelX: info.exactPixelX,
            startPixelY: info.exactPixelY,
            endPixelY: info.exactPixelY
          });
          lastMousePosRef.current = `${info.dayIndex}-${info.hourIndex}-${info.minute}`;
        }
      }, CLICK_TIMEOUT);
      
      setDragTimer(timer);
    }
  }, [getInfoFromPosition, days, isMouseDown]);

  const handleMouseMove = useCallback((e) => {
    if (!isMouseDown) return;

    const dragDistance = dragStartPos ? Math.sqrt(
      Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
    ) : 0;

    if (!isDragging && dragDistance > DRAG_THRESHOLD) {
      if (dragTimer) {
        clearTimeout(dragTimer);
        setDragTimer(null);
      }
      setIsDragging(true);
      
      const info = getInfoFromPosition(dragStartPos.x, dragStartPos.y);
      if (info) {
        setSelectedArea({
          startDay: info.dayIndex, 
          endDay: info.dayIndex,
          startHour: info.hour,
          endHour: info.hour,
          startMinute: info.minute,
          endMinute: info.minute,
          startHourIndex: info.hourIndex,
          endHourIndex: info.hourIndex,
          startPixelX: info.exactPixelX,
          endPixelX: info.exactPixelX,
          startPixelY: info.exactPixelY,
          endPixelY: info.exactPixelY
        });
      }
    }

    if (isDragging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const info = getInfoFromPosition(e.clientX, e.clientY);
        if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
          
          const startDayIndex = selectedArea?.startDay || 0;
          const maxEndDay = Math.min(startDayIndex + MAX_DRAG_DAYS - 1, days.length - 1);
          const minEndDay = Math.max(startDayIndex - MAX_DRAG_DAYS + 1, 0);
          
          const constrainedDayIndex = Math.max(minEndDay, Math.min(maxEndDay, info.dayIndex));
          
          const currentPos = `${constrainedDayIndex}-${info.hourIndex}-${info.minute}`;
          if (lastMousePosRef.current !== currentPos) {
            lastMousePosRef.current = currentPos;
            setSelectedArea(prev => ({ 
              ...prev, 
              endDay: constrainedDayIndex, 
              endHour: info.hour,
              endMinute: info.minute,
              endHourIndex: info.hourIndex,
              endPixelX: info.exactPixelX,
              endPixelY: info.exactPixelY
            }));
          }
        }
      });
    }
  }, [isMouseDown, isDragging, dragStartPos, dragTimer, getInfoFromPosition, days.length, selectedArea]);

  const handleMouseUp = useCallback((e) => {
    if (dragTimer) {
      clearTimeout(dragTimer);
      setDragTimer(null);
    }

    if (!isMouseDown) return;

    const wasClick = !isDragging && dragStartTimeRef.current && 
                    (Date.now() - dragStartTimeRef.current) < CLICK_TIMEOUT;

    if (wasClick && dragStartPos) {
      const info = getInfoFromPosition(dragStartPos.x, dragStartPos.y);
      if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
        const today = new Date();
        const startDateTime = new Date(today);
        startDateTime.setHours(info.hour, info.minute, 0, 0);
        
        const endDateTime = new Date(today);
        endDateTime.setHours(info.hour, info.minute + 5, 0, 0);

        const dayName = days[info.dayIndex]?.full;

        onTimeSlotSelect && onTimeSlotSelect({ 
          startDateTime, 
          endDateTime, 
          day: dayName,
          isMultipleDays: false,
          dates: [{
            date: today.toISOString().split('T')[0],
            startTime: `${info.hour.toString().padStart(2, '0')}:${info.minute.toString().padStart(2, '0')}`,
            endTime: `${info.hour.toString().padStart(2, '0')}:${(info.minute + 5).toString().padStart(2, '0')}`,
            timezone: 'WIB'
          }],
          draggedDays: 1
        });
      }
    } else if (isDragging && selectedArea && dragStartPos) {
      const dragDistance = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
      );
      
      if (dragDistance >= DRAG_THRESHOLD) {
        const startHour = Math.min(selectedArea.startHour, selectedArea.endHour);
        const endHour = Math.max(selectedArea.startHour, selectedArea.endHour);
        const startMinute = Math.min(selectedArea.startMinute || 0, selectedArea.endMinute || 0);
        const endMinute = Math.max(selectedArea.startMinute || 0, selectedArea.endMinute || 0);
        const startDay = Math.min(selectedArea.startDay, selectedArea.endDay);
        const endDay = Math.max(selectedArea.startDay, selectedArea.endDay);

        let finalEndHour = endHour;
        let finalEndMinute = endMinute + 5;
        if (finalEndMinute >= 60) {
          finalEndHour = endHour + 1;
          finalEndMinute = finalEndMinute - 60;
        }

        if (startDay >= 0 && startDay < days.length) {
          const today = new Date();
          const startDateTime = new Date(today);
          startDateTime.setHours(startHour, startMinute, 0, 0);
          
          const endDateTime = new Date(today);
          endDateTime.setHours(finalEndHour, finalEndMinute, 0, 0);

          const dayName = days[startDay]?.full;
          const isMultipleDays = startDay !== endDay;

          const dates = [];
          for (let dayIndex = startDay; dayIndex <= endDay; dayIndex++) {
            const dayDate = new Date(today);
            dayDate.setDate(today.getDate() + (dayIndex - today.getDay()));
            
            dates.push({
              date: dayDate.toISOString().split('T')[0],
              startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
              endTime: `${finalEndHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`,
              timezone: 'WIB'
            });
          }

          onTimeSlotSelect && onTimeSlotSelect({ 
            startDateTime, 
            endDateTime, 
            day: dayName,
            isMultipleDays,
            dates,
            draggedDays: endDay - startDay + 1
          });
        }
      }
    }
    
    setIsDragging(false);
    setIsMouseDown(false);
    setSelectedArea(null);
    setDragStartPos(null);
    lastMousePosRef.current = null;
    dragStartTimeRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [isMouseDown, isDragging, selectedArea, dragStartPos, dragTimer, days, onTimeSlotSelect, getInfoFromPosition]);

  const handleScroll = useCallback((e) => {
    const newScrollLeft = e.target.scrollLeft;
    setScrollLeft(newScrollLeft);
  }, []);

  // Selection box rendering
  const selectionBox = useMemo(() => {
    if (!selectedArea || !isDragging) return null;

    const startDayIndex = Math.min(selectedArea.startDay, selectedArea.endDay);
    const endDayIndex = Math.max(selectedArea.startDay, selectedArea.endDay);
    
    const startPixelX = Math.min(selectedArea.startPixelX || 0, selectedArea.endPixelX || 0);
    const endPixelX = Math.max(selectedArea.startPixelX || 0, selectedArea.endPixelX || 0);

    const top = getDayRowTop(startDayIndex);
    let height = 0;
    for (let i = startDayIndex; i <= endDayIndex; i++) {
      const dayName = days[i]?.full;
      height += dayRowHeights[dayName] || MIN_DAY_ROW_HEIGHT;
    }
    
    const left = startPixelX;
    const width = Math.max(endPixelX - startPixelX, 10);

    return (
      <div
        className="absolute bg-blue-400/20 border-2 border-blue-500 rounded-sm pointer-events-none"
        style={{ top, left, width, height, zIndex: Z_INDICES.SELECTION_BOX }}
      />
    );
  }, [selectedArea, isDragging, getDayRowTop, days, dayRowHeights]);

  // Effects
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = (e) => handleMouseUp(e);

    if (isMouseDown) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDown, handleMouseMove, handleMouseUp]);

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
          <h2 className="text-xl font-semibold text-[#488BBA]" style={{ marginLeft: '15px' }}>
            Jadwal
          </h2>
        </div>
        {loading && (
          <div className="ml-auto text-sm text-gray-500">Loading...</div>
        )}
      </div>

      {/* Grid Container */}
      <div className="relative overflow-hidden" style={{ height: `${actualHeight - HEADER_HEIGHT}px` }}>
        
        {/* FIXED: Time Header with proper z-index */}
        <div 
          className="absolute top-0 bg-white border-b border-zinc-200"
          style={{ 
            left: `${DAY_COLUMN_WIDTH - 15}px`,
            right: '0px',
            height: `${TIME_HEADER_HEIGHT}px`,
            overflow: 'hidden',
            zIndex: Z_INDICES.TIME_HEADERS
          }}
        >
          <div className="h-full" style={{ overflow: 'hidden' }}>
            <div 
              className="flex relative h-full"
              style={{ 
                width: `${timeSlots.length * HOUR_WIDTH}px`,
                minWidth: `${timeSlots.length * HOUR_WIDTH}px`, 
                transform: `translateX(-${scrollLeft}px)`
              }}
            >
              {timeSlots.map((time, i) => (
                <div 
                  key={time} 
                  className="flex-shrink-0 relative"
                  style={{ width: `${HOUR_WIDTH}px`, height: `${TIME_HEADER_HEIGHT}px` }}
                >
                  <span className="text-sm text-neutral-600 absolute top-1/2 transform -translate-y-1/2 left-2">
                    {time}
                  </span>
                </div>
              ))}

              {halfHourDividers.map((divider, i) => (
                <div 
                  key={`divider-30min-${i}`}
                  className="absolute pointer-events-none bg-red-400" 
                  style={{ 
                    left: `${divider.position}px`,
                    top: '60%',
                    width: '1px',       
                    height: '10px',        
                    zIndex: Z_INDICES.GRID_LINES
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* FIXED: Scrollable Content Area with proper z-index */}
        <div 
          className="absolute inset-0" 
          style={{ 
            top: `${TIME_HEADER_HEIGHT}px`,
            zIndex: Z_INDICES.SCROLL_BARS
          }}
        >
          <div
            ref={viewportRef}
            className="w-full h-full overflow-x-scroll overflow-y-auto"
            onScroll={handleScroll}
            style={{ zIndex: Z_INDICES.SCROLL_BARS }}
          >
            <div className="flex" style={{ minWidth: `${DAY_COLUMN_WIDTH + (timeSlots.length * HOUR_WIDTH)}px` }}>
              {/* FIXED: Day Column with higher z-index */}
              <div 
                className="flex-shrink-0 bg-white sticky left-0"
                style={{ 
                  width: `${DAY_COLUMN_WIDTH}px`,
                  zIndex: Z_INDICES.DAY_HEADERS
                }}
              >
                {days.map((day, index) => (
                  <div 
                    key={day.short} 
                    className="flex items-center justify-center border-b border-zinc-200 bg-white"
                    style={{ height: `${dayRowHeights[day.full]}px` }}
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
                  width: `${timeSlots.length * HOUR_WIDTH}px`, 
                  height: `${totalGridHeight}px`,
                  minWidth: `${timeSlots.length * HOUR_WIDTH}px`
                }}
              >
                {/* Mouse event overlay */}
                <div
                  className="absolute inset-0 cursor-pointer"
                  style={{ 
                    zIndex: Z_INDICES.BACKGROUND,
                    backgroundColor: 'transparent'
                  }}
                  onMouseDown={handleMouseDown}
                />

                {/* FIXED: Enhanced Day separator lines */}
                {days.map((day, i) => {
                  if (i === 0) return null;
                  const top = getDayRowTop(i);
                  return (
                    <div 
                      key={`hline-${i}`}
                      className="absolute left-0 right-0 border-t border-zinc-300 pointer-events-none"
                      style={{ top: `${top}px`, zIndex: Z_INDICES.DAY_ROW_LINES }}
                    />
                  );
                })}

                {/* ENHANCED: Schedule Events with improved layout */}
                {Object.entries(processedSchedules).map(([dayName, timeSlotStacks]) => {
                  const dayIndex = days.findIndex(d => d.full === dayName);
                  if (dayIndex === -1) return null;

                  const dayTop = getDayRowTop(dayIndex);

                  return Object.entries(timeSlotStacks).map(([timeSlot, eventsInSlot]) => {
                    if (eventsInSlot.length === 0) return null;

                    return eventsInSlot.map((event, stackIndex) => {
                      const left = timeToPosition(event.startTime);
                      const width = calculateEventWidth(event.startTime, event.endTime);
                      
                      // ENHANCED: Better stacking logic
                      const isStacked = event.isStacked;
                      const isSingle = !isStacked;
                      
                      // Dynamic height based on stacking
                      let height = isSingle ? SCHEDULE_BASE_HEIGHT : SCHEDULE_COMPRESSED_HEIGHT;
                      
                      // Better positioning with spacing
                      const topOffset = 6; // Base offset from day top
                      const stackOffset = stackIndex * (height + SCHEDULE_MARGIN);
                      const top = dayTop + topOffset + stackOffset;
                      
                      // Visibility control
                      const isVisible = stackIndex < MAX_VISIBLE_STACKS;
                      const opacity = isVisible ? (stackIndex === 0 ? 1 : Math.max(0.7, 1 - (stackIndex * 0.15))) : 0;
                      
                      // Dynamic width adjustment for stacked items
                      const stackedWidthReduction = isStacked ? Math.min(stackIndex * 4, 16) : 0;
                      const finalWidth = Math.max(width - stackedWidthReduction, 40);

                      if (!isVisible) return null;

                      return (
                        <div
                          key={`${event.id}-${stackIndex}`}
                          className="schedule-event absolute rounded-md px-2 py-1 cursor-pointer hover:opacity-95 transition-all duration-200 shadow-sm"
                          style={{
                            left: `${left}px`,
                            top: `${top}px`,
                            width: `${finalWidth}px`,
                            height: `${height}px`,
                            backgroundColor: event.color,
                            opacity,
                            transform: isStacked ? `translateX(${stackIndex * STACK_OVERLAP}px)` : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            zIndex: Z_INDICES.SCHEDULE_EVENTS + stackIndex,
                            fontSize: isSingle ? '11px' : '9px',
                            boxShadow: isStacked ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.1)',
                            border: `1px solid ${event.color}`,
                            borderColor: event.color
                          }}
                          onClick={(e) => handleScheduleClick(e, event)}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {/* Event content with conditional display */}
                          <div className="text-white font-semibold truncate" style={{ lineHeight: '1.1' }}>
                            {event.name}
                          </div>
                          {isSingle && (
                            <div className="text-white text-[10px] truncate opacity-90 mt-0.5">
                              {event.startTime} - {event.endTime} {event.timezoneDisplay}
                            </div>
                          )}
                          {isSingle && event.platform && (
                            <div className="text-white text-[9px] truncate opacity-80">
                              {event.platform}
                            </div>
                          )}
                        </div>
                      );
                    });
                  });
                })}

                {/* ENHANCED: Stack count indicators */}
                {Object.entries(processedSchedules).map(([dayName, timeSlotStacks]) => {
                  const dayIndex = days.findIndex(d => d.full === dayName);
                  if (dayIndex === -1) return null;
                  const dayTop = getDayRowTop(dayIndex);

                  return Object.entries(timeSlotStacks).map(([timeSlot, eventsInSlot]) => {
                    const overflowCount = eventsInSlot.length - MAX_VISIBLE_STACKS;
                    if (overflowCount <= 0) return null;

                    const left = timeToPosition(timeSlot);
                    const topOffset = 6;
                    const stackHeight = (SCHEDULE_COMPRESSED_HEIGHT + SCHEDULE_MARGIN);
                    const top = dayTop + topOffset + (MAX_VISIBLE_STACKS * stackHeight);

                    return (
                      <div
                        key={`overflow-${dayName}-${timeSlot}`}
                        className="absolute bg-gray-600 text-white text-[10px] rounded px-2 py-1 pointer-events-none font-medium shadow-sm"
                        style={{
                          left: `${left}px`,
                          top: `${top}px`,
                          height: `${SCHEDULE_COMPRESSED_HEIGHT}px`,
                          display: 'flex',
                          alignItems: 'center',
                          zIndex: Z_INDICES.OVERFLOW_INDICATORS
                        }}
                      >
                        +{overflowCount} more
                      </div>
                    );
                  });
                })}

                {/* Empty day messages */}
                {selectedDates.length > 0 && days.map((day, dayIndex) => {
                  const hasEvents = Object.values(processedSchedules[day.full] || {}).some(events => events.length > 0);
                  const isDaySelected = selectedDates.some(date => days[date.getDay()]?.full === day.full);
                  
                  if (isDaySelected && !hasEvents) {
                    const top = getDayRowTop(dayIndex);
                    const height = dayRowHeights[day.full] - 10;
                    
                    return (
                      <div
                        key={`empty-${dayIndex}`}
                        className="absolute rounded-md px-2 py-1 pointer-events-none flex items-center justify-center"
                        style={{
                          left: '200px',
                          top: `${top + 5}px`,
                          width: '200px',
                          height: `${height}px`,
                          backgroundColor: 'transparent',
                          zIndex: Z_INDICES.GRID_LINES
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

                {/* Selection box */}
                {selectionBox}
              </div>
            </div>
          </div>
        </div>

        {/* FIXED: Current time line with proper z-index */}
        <div 
          className="absolute pointer-events-none" 
          style={{ 
            left: `${DAY_COLUMN_WIDTH + getCurrentTimePosition() - scrollLeft + 10}px`,
            top: `${TIME_HEADER_HEIGHT}px`,
            height: `${totalGridHeight}px`,
            zIndex: Z_INDICES.CURRENT_TIME,
            width: '2px'
          }}
        >
          <div className="relative w-full h-full bg-red-500 shadow-sm">
            <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm" 
                 style={{ top: '-5px', left: '50%', transform: 'translateX(-50%)' }} />
            
            <div className="absolute" style={{ left: '6px', top: '2px' }}>
              <div className="bg-black bg-opacity-90 rounded text-white text-xs font-mono px-1.5 py-1 whitespace-nowrap shadow-md">
                {getCurrentTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;