// src/components/shared/schedule/ScheduleGrid.jsx - FIXED PRECISION POSITIONING & GOOGLE CALENDAR BEHAVIOR

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const ScheduleGrid = ({ 
  onTimeSlotSelect, 
  onScheduleClick,
  containerWidth = 808,
  sidebarExpanded = false,
  selectedDates = [],
  weekStartDate, 
  schedules = [],
  loading = false,
  getScheduleAtTime
}) => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [dragTimeTooltip, setDragTimeTooltip] = useState(null);
  
  const viewportRef = useRef(null);

  // CONSTANTS - FIXED PRECISION
  const baseWidth = 808;
  const baseHeight = 254;
  const actualWidth = Math.max(baseWidth, containerWidth);
  const actualHeight = baseHeight;
  const HOUR_WIDTH = 80;
  const MIN_DAY_ROW_HEIGHT = 60;
  
  const SCHEDULE_BASE_HEIGHT = 40;
  const SCHEDULE_COMPRESSED_HEIGHT = 22;
  const SCHEDULE_MARGIN = 2; 
  const LANE_SPACING = 6;
  const MAX_VISIBLE_STACKS = 10; 
  const DAY_PADDING_TOP = 12;
  const DAY_PADDING_BOTTOM = 8;
  
  const TIME_HEADER_HEIGHT = 30;
  const DAY_COLUMN_WIDTH = 70;
  const HEADER_HEIGHT = 66;
  const MAX_DRAG_DAYS = 2;

  // FIXED: Consistent padding offset
  const PADDING_OFFSET = 40;

  const Z_INDICES = {
    BACKGROUND: 0,
    GRID_LINES: 5,
    DAY_ROW_LINES: 10,        
    SCHEDULE_EVENTS: 15,
    STACKED_SCHEDULES: 20,
    OVERFLOW_INDICATORS: 25,
    SELECTION_BOX: 30,
    SCROLL_CONTENT: 35,
    TIME_HEADERS: 40,
    CURRENT_TIME: 45,
    DAY_HEADERS: 50,
    TOOLTIP: 60,
    MODALS: 100
  };

  // Static data
  const days = useMemo(() => [
    { short: "Sen", full: "Senin" }, { short: "Sel", full: "Selasa" },
    { short: "Rab", full: "Rabu" }, { short: "Kam", full: "Kamis" },
    { short: "Jum", full: "Jumat" }, { short: "Sab", full: "Sabtu" },
    { short: "Min", full: "Minggu" }
  ], []);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 6; i <= 23; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    slots.push('00:00');
    return slots;
  }, []);

  const halfHourDividers = useMemo(() => {
    const dividers = [];  
    for (let i = 0; i < timeSlots.length - 1; i++) {
      // FIXED: Half hour dividers positioned correctly with padding offset
      const position = (i * HOUR_WIDTH) + (HOUR_WIDTH / 2);
      dividers.push({ position, hourIndex: i });
    }
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
    if (hour === 0) return timeSlots.length - 1;
    return Math.max(0, Math.min(17, hour - 6));
  }, [timeSlots.length]);

  const getActualHour = useCallback((index) => {
    if (index === timeSlots.length - 1) return 0;
    if (index >= 0 && index <= 17) return index + 6;
    return 6;
  }, [timeSlots.length]);

  // FIXED: Precise time to position conversion (without padding)
  const timeToPosition = useCallback((timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const hourIndex = getHourDisplayIndex(hours);
    
    // PRECISE: Return position without padding (padding added during render)
    const basePosition = hourIndex * HOUR_WIDTH;
    const minuteOffset = (minutes / 60) * HOUR_WIDTH;
    
    return basePosition + minuteOffset;
  }, [getHourDisplayIndex]);

  const calculateEventWidth = useCallback((startTime, endTime) => {
    const startPos = timeToPosition(startTime);
    const endPos = timeToPosition(endTime);
    return Math.max(endPos - startPos, 60);
  }, [timeToPosition]);

  // Current time helpers with precise positioning
  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const hourIndex = getHourDisplayIndex(hour);
    const minuteOffset = (minutes / 60);
    const totalOffset = hourIndex + minuteOffset;
    return totalOffset * HOUR_WIDTH; // Without padding
  }, [currentTime, getHourDisplayIndex]);

  const getCurrentTimeString = useCallback(() => {
    const now = currentTime;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [currentTime]);

  // Schedule processing
  const processedSchedules = useMemo(() => {
    const processed = {};
    const dayEvents = {};
    
    days.forEach(day => {
      processed[day.full] = {};
      dayEvents[day.full] = [];
    });

    schedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      const dayIndex = (scheduleDate.getDay() + 6) % 7;
      const dayName = days[dayIndex]?.full;
      
      if (dayName) {
        if (selectedDates.length > 0) {
          const isDateSelected = selectedDates.some(date => {
            const selectedDateObj = new Date(date);
            return selectedDateObj.toDateString() === scheduleDate.toDateString();
          });
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
          duration: endTime - startTime,
          startMinutes: startTime.getHours() * 60 + startTime.getMinutes(),
          endMinutes: endTime.getHours() * 60 + endTime.getMinutes(),
          createdAt: schedule.createdAt || startTime
        };

        dayEvents[dayName].push(displaySchedule);
      }
    });

    Object.keys(dayEvents).forEach(dayName => {
      const events = dayEvents[dayName];
      
      events.sort((a, b) => {
        const timeDiff = a.startDateTime - b.startDateTime;
        if (timeDiff !== 0) return timeDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      const timeSlotGroups = {};
      
      events.forEach((event) => {
        const startHour = event.startDateTime.getHours();
        const timeSlot = `${startHour.toString().padStart(2, '0')}:00`;
        
        if (!timeSlotGroups[timeSlot]) {
          timeSlotGroups[timeSlot] = [];
        }
        timeSlotGroups[timeSlot].push(event);
      });

      Object.keys(timeSlotGroups).forEach(timeSlot => {
        const slotEvents = timeSlotGroups[timeSlot];
        
        slotEvents.forEach((event, index) => {
          event.stackIndex = index;
          event.totalLanes = slotEvents.length;
          event.isStacked = slotEvents.length > 1;
        });

        if (!processed[dayName][timeSlot]) {
          processed[dayName][timeSlot] = [];
        }
        processed[dayName][timeSlot] = slotEvents;
      });
    });

    return processed;
  }, [schedules, selectedDates, days, getTypeColor, getTimezoneDisplay]);

  const dayRowHeights = useMemo(() => {
    const heights = {};
    
    days.forEach(day => {
      let maxStacks = 1;
      let hasEvents = false;
      
      Object.values(processedSchedules[day.full] || {}).forEach(eventsInSlot => {
        if (eventsInSlot.length > 0) {
          hasEvents = true;
          maxStacks = Math.max(maxStacks, eventsInSlot.length);
        }
      });
      
      if (hasEvents) {
        const visibleStacks = Math.min(maxStacks, MAX_VISIBLE_STACKS);
        let totalHeight = DAY_PADDING_TOP + DAY_PADDING_BOTTOM;
        
        for (let i = 0; i < visibleStacks; i++) {
          if (maxStacks === 1) {
            totalHeight += SCHEDULE_BASE_HEIGHT;
          } else {
            totalHeight += SCHEDULE_COMPRESSED_HEIGHT;
          }
          
          if (i < visibleStacks - 1) {
            totalHeight += LANE_SPACING;
          }
        }
        
        heights[day.full] = Math.max(totalHeight, MIN_DAY_ROW_HEIGHT);
      } else {
        heights[day.full] = MIN_DAY_ROW_HEIGHT;
      }
    });
    
    return heights;
  }, [processedSchedules, days]);

  // FIXED: Precise mouse position to time calculation
  const getTimeFromPosition = useCallback((clientX, clientY) => {
    if (!viewportRef.current) return null;
    
    const rect = viewportRef.current.getBoundingClientRect();
    
    // Get exact coordinates within viewport
    const x = clientX - rect.left + scrollLeft;
    const y = clientY - rect.top + scrollTop;
    
    // Remove padding to get pure grid position
    const gridX = x - PADDING_OFFSET;
    const gridY = y;
    
    if (gridX < 0 || gridY < 0) return null;
    
    // FIXED: 15-minute precision like Google Calendar
    const hourIndex = Math.floor(gridX / HOUR_WIDTH);
    if (hourIndex < 0 || hourIndex >= timeSlots.length) return null;
    
    // Calculate day index
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
    
    if (dayIndex < 0) return null;
    
    // FIXED: 15-minute precision calculation
    const actualHour = getActualHour(hourIndex);
    const pixelWithinHour = gridX - (hourIndex * HOUR_WIDTH);
    const exactMinute = (pixelWithinHour / HOUR_WIDTH) * 60;
    
    // GOOGLE CALENDAR: 15-minute snapping
    const snappedMinute = Math.round(exactMinute / 15) * 15;
    const finalMinute = Math.min(snappedMinute, 45);
    
    // FIXED: Return exact position for consistency
    const pixelX = hourIndex * HOUR_WIDTH + (finalMinute / 60) * HOUR_WIDTH;
    
    return {
      hour: actualHour,
      minute: finalMinute,
      hourIndex: hourIndex,
      dayIndex: dayIndex,
      exactMinute: exactMinute,
      pixelX: pixelX // Position without padding
    };
  }, [scrollLeft, scrollTop, dayRowHeights, days, timeSlots.length, getActualHour]);

  const getDateFromDayIndex = useCallback((dayIndex) => {
    const baseDate = weekStartDate ? new Date(weekStartDate) : new Date();
    const baseDayOfWeek = (baseDate.getDay() + 6) % 7;
    baseDate.setDate(baseDate.getDate() - baseDayOfWeek);
    baseDate.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + dayIndex);
    return targetDate;
  }, [weekStartDate]);

  // FIXED: Mouse handlers with proper tooltip positioning
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.schedule-event')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const timeInfo = getTimeFromPosition(e.clientX, e.clientY);
    if (!timeInfo) return;
    
    setDragStartPos(timeInfo);
    setSelectedArea({
      startDay: timeInfo.dayIndex,
      endDay: timeInfo.dayIndex,
      startHour: timeInfo.hour,
      endHour: timeInfo.hour,
      startMinute: timeInfo.minute,
      endMinute: timeInfo.minute,
      startPixelX: timeInfo.pixelX,
      endPixelX: timeInfo.pixelX
    });
    setIsDragging(true);
    
    // FIXED: Tooltip positioned relative to viewport
    const rect = viewportRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    setDragTimeTooltip({
      x: relativeX,
      y: relativeY,
      startTime: `${timeInfo.hour.toString().padStart(2, '0')}:${timeInfo.minute.toString().padStart(2, '0')}`,
      endTime: `${timeInfo.hour.toString().padStart(2, '0')}:${(timeInfo.minute + 15).toString().padStart(2, '0')}`
    });
  }, [getTimeFromPosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStartPos) return;
    
    const timeInfo = getTimeFromPosition(e.clientX, e.clientY);
    if (!timeInfo) return;
    
    // Constrain to max drag days
    const startDayIndex = dragStartPos.dayIndex;
    const maxEndDay = Math.min(startDayIndex + MAX_DRAG_DAYS - 1, days.length - 1);
    const minEndDay = Math.max(startDayIndex - MAX_DRAG_DAYS + 1, 0);
    const constrainedDayIndex = Math.max(minEndDay, Math.min(maxEndDay, timeInfo.dayIndex));
    
    setSelectedArea(prev => ({
      ...prev,
      endDay: constrainedDayIndex,
      endHour: timeInfo.hour,
      endMinute: timeInfo.minute,
      endPixelX: timeInfo.pixelX
    }));
    
    // FIXED: Update tooltip with relative positioning
    const rect = viewportRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    const startTime = `${dragStartPos.hour.toString().padStart(2, '0')}:${dragStartPos.minute.toString().padStart(2, '0')}`;
    const endTime = `${timeInfo.hour.toString().padStart(2, '0')}:${timeInfo.minute.toString().padStart(2, '0')}`;
    
    setDragTimeTooltip({
      x: relativeX,
      y: relativeY - 10,
      startTime: startTime,
      endTime: endTime
    });
  }, [isDragging, dragStartPos, days.length, getTimeFromPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !selectedArea || !dragStartPos) return;
    
    const isClick = selectedArea.startDay === selectedArea.endDay && 
                   selectedArea.startHour === selectedArea.endHour && 
                   selectedArea.startMinute === selectedArea.endMinute;
    
    if (isClick) {
      // CLICK: Create 30-minute slot
      const clickedDate = getDateFromDayIndex(selectedArea.startDay);
      const startDateTime = new Date(clickedDate);
      startDateTime.setHours(selectedArea.startHour, selectedArea.startMinute, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + 30);
      
      onTimeSlotSelect && onTimeSlotSelect({
        startDateTime,
        endDateTime,
        day: days[selectedArea.startDay]?.full,
        isMultipleDays: false,
        dates: [{
          date: clickedDate.toISOString().split('T')[0],
          startTime: `${selectedArea.startHour.toString().padStart(2, '0')}:${selectedArea.startMinute.toString().padStart(2, '0')}`,
          endTime: `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`,
          timezone: 'WIB'
        }],
        draggedDays: 1
      });
    } else {
      // DRAG: Create range selection
      const startDay = Math.min(selectedArea.startDay, selectedArea.endDay);
      const endDay = Math.max(selectedArea.startDay, selectedArea.endDay);
      
      // Preserve exact start and end times
      let startHour, startMinute, endHour, endMinute;
      
      if (selectedArea.startDay <= selectedArea.endDay) {
        startHour = selectedArea.startHour;
        startMinute = selectedArea.startMinute;
        endHour = selectedArea.endHour;
        endMinute = selectedArea.endMinute;
      } else {
        startHour = selectedArea.endHour;
        startMinute = selectedArea.endMinute;
        endHour = selectedArea.startHour;
        endMinute = selectedArea.startMinute;
      }
      
      // Ensure minimum 15 minutes
      if (startHour === endHour && startMinute === endMinute) {
        endMinute += 15;
        if (endMinute >= 60) {
          endHour += 1;
          endMinute -= 60;
        }
      }
      
      const startDate = getDateFromDayIndex(startDay);
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(startDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      const dates = [];
      for (let dayIndex = startDay; dayIndex <= endDay; dayIndex++) {
        const dayDate = getDateFromDayIndex(dayIndex);
        dates.push({
          date: dayDate.toISOString().split('T')[0],
          startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
          endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
          timezone: 'WIB'
        });
      }
      
      onTimeSlotSelect && onTimeSlotSelect({
        startDateTime,
        endDateTime,
        day: days[startDay]?.full,
        isMultipleDays: startDay !== endDay,
        dates,
        draggedDays: endDay - startDay + 1
      });
    }
    
    // Reset states
    setIsDragging(false);
    setSelectedArea(null);
    setDragStartPos(null);
    setDragTimeTooltip(null);
  }, [isDragging, selectedArea, dragStartPos, days, getDateFromDayIndex, onTimeSlotSelect]);

  const totalGridHeight = useMemo(() => {
    return Object.values(dayRowHeights).reduce((sum, height) => sum + height, 0);
  }, [dayRowHeights]);

  const getDayRowTop = useCallback((dayIndex) => {
    let top = 0;
    for (let i = 0; i < dayIndex; i++) {
      const dayName = days[i]?.full;
      top += dayRowHeights[dayName] || MIN_DAY_ROW_HEIGHT;
    }
    return top;
  }, [days, dayRowHeights]);

  const handleScheduleClick = useCallback((event, scheduleData) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!isDragging) {
      onScheduleClick && onScheduleClick(scheduleData.originalData || scheduleData);
    }
  }, [isDragging, onScheduleClick]);

  const handleScroll = useCallback((e) => {
    setScrollLeft(e.target.scrollLeft);
    setScrollTop(e.target.scrollTop);
  }, []);

  // Selection box visualization with fixed positioning
  const selectionBox = useMemo(() => {
    if (!selectedArea || !isDragging) return null;
    
    const startDayIndex = Math.min(selectedArea.startDay, selectedArea.endDay);
    const endDayIndex = Math.max(selectedArea.startDay, selectedArea.endDay);
    const startPixelX = Math.min(selectedArea.startPixelX, selectedArea.endPixelX);
    const endPixelX = Math.max(selectedArea.startPixelX, selectedArea.endPixelX);
    
    const top = getDayRowTop(startDayIndex);
    let height = 0;
    for (let i = startDayIndex; i <= endDayIndex; i++) {
      const dayName = days[i]?.full;
      height += dayRowHeights[dayName] || MIN_DAY_ROW_HEIGHT;
    }
    
    // FIXED: Position with padding offset for proper alignment
    const left = PADDING_OFFSET + startPixelX;
    const width = Math.max(endPixelX - startPixelX, 30);
    
    return (
      <div
        className="absolute bg-blue-400/20 border border-blue-400 rounded pointer-events-none"
        style={{ top, left, width, height, zIndex: Z_INDICES.SELECTION_BOX }}
      />
    );
  }, [selectedArea, isDragging, getDayRowTop, days, dayRowHeights]);

  const ScheduleEventCard = ({ event, style, className, onClickEvent }) => {
    const [isHovered, setIsHovered] = useState(false);

    const isStacked = event.totalLanes > 1;
    const isSingle = !isStacked;
    const laneIndex = event.stackIndex || 0;
    
    const height = isSingle ? SCHEDULE_BASE_HEIGHT : SCHEDULE_COMPRESSED_HEIGHT;

    const handleClick = (e) => {
      e.stopPropagation();
      onClickEvent && onClickEvent(event);
    };
    const handleMouseDown = (e) => e.stopPropagation();

    if (laneIndex >= MAX_VISIBLE_STACKS) {
      return null;
    }

    const combinedStyle = {
      ...style,
      height: `${height}px`,
      backgroundColor: event.color,
      zIndex: isHovered ? 99 : style.zIndex,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, z-index 0s linear',
    };

    if (isHovered) {
      const existingTransform = style.transform || '';
      combinedStyle.transform = `${existingTransform} scale(1.05)`;
      combinedStyle.boxShadow = '0 8px 20px rgba(0,0,0,0.25)';
    }

    if (isSingle) {
      return (
        <div
          className={`absolute flex flex-col justify-center items-start cursor-pointer schedule-event ${className || ''}`}
          style={{
            ...combinedStyle,
            borderRadius: '5px',
            paddingLeft: '8px',
            paddingRight: '8px',
            overflow: 'hidden',
            boxShadow: isHovered ? combinedStyle.boxShadow : '0 2px 6px rgba(0,0,0,0.12)',
          }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="w-full text-white text-[10px] font-semibold font-['Public_Sans'] truncate">
            {event.name}
          </div>
          <div className="w-full flex items-center">
            <span className="text-white text-[10px] font-normal font-['Public_Sans'] truncate">
              {event.startTime} - {event.endTime} {event.timezoneDisplay}
            </span>
            <span className="text-white text-[10px] font-normal font-['Public_Sans'] mx-1">|</span>
            <span className="text-white text-[10px] font-semibold font-['Public_Sans'] truncate">
              {event.platform}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`absolute flex items-center cursor-pointer schedule-event ${className || ''}`}
        style={{
          ...combinedStyle,
          borderRadius: '4px',
          paddingLeft: '8px',
          paddingRight: '8px',
          overflow: 'hidden',
          boxShadow: isHovered ? combinedStyle.boxShadow : '0 1px 4px rgba(0,0,0,0.1)',
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full text-white text-[10px] font-semibold font-['Public_Sans'] truncate">
          {event.name}
        </div>
      </div>
    );
  };

  // Global mouse events
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      handleMouseMove(e);
    };
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
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
      <div className="flex items-center px-5 py-3" style={{ height: `${HEADER_HEIGHT}px` }}>
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
        
        {/* Time Header - FIXED with proper padding */}
        <div 
          className="absolute top-0 bg-white"
          style={{ 
            left: `${DAY_COLUMN_WIDTH}px`,
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
                transform: `translateX(-${scrollLeft}px)`,
                paddingLeft: `${PADDING_OFFSET}px`
              }}
            >
              {timeSlots.map((time, i) => (
                <div 
                  key={time} 
                  className="flex-shrink-0 relative"
                  style={{ width: `${HOUR_WIDTH}px`, height: `${TIME_HEADER_HEIGHT}px` }}
                >
                  <span className="text-sm text-neutral-600 absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2">
                    {time}
                  </span>
                </div>
              ))}

              {/* FIXED: Half hour dividers with proper positioning */}
              {halfHourDividers.map((divider, i) => (
                <div 
                  key={`divider-30min-${i}`}
                  className="absolute pointer-events-none bg-red-400" 
                  style={{ 
                    left: `${PADDING_OFFSET + divider.position}px`,
                    top: '35%',
                    width: '1px',       
                    height: '10px',        
                    zIndex: Z_INDICES.GRID_LINES
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Day Column */}
        <div 
          className="absolute top-0 bg-white"
          style={{ 
            left: '0px',
            width: `${DAY_COLUMN_WIDTH}px`,
            height: '100%',
            zIndex: Z_INDICES.DAY_HEADERS
          }}
        >
          <div style={{ height: `${TIME_HEADER_HEIGHT}px` }} />
          
          <div 
            style={{ 
              height: `${totalGridHeight}px`,
              transform: `translateY(-${scrollTop}px)`
            }}
          >
            {days.map((day, index) => (
              <div 
                key={day.short} 
                className="flex items-center justify-center bg-white"
                style={{ 
                  height: `${dayRowHeights[day.full]}px`
                }}
              >
                <span className="text-sm font-semibold text-neutral-700">
                  {day.short}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div 
          className="absolute" 
          style={{ 
            left: `${DAY_COLUMN_WIDTH}px`,
            top: `${TIME_HEADER_HEIGHT}px`,
            right: '0px',
            bottom: '0px',
            zIndex: Z_INDICES.SCROLL_CONTENT
          }}
        >
          <div
            ref={viewportRef}
            className="w-full h-full overflow-x-scroll overflow-y-auto"
            onScroll={handleScroll}
          >
            <div 
              className="relative"
              style={{ 
                width: `${timeSlots.length * HOUR_WIDTH}px`, 
                height: `${totalGridHeight}px`,
                minWidth: `${timeSlots.length * HOUR_WIDTH}px`,
                paddingLeft: `${PADDING_OFFSET}px`,
              }}
            >
              {/* Direct drag area */}
              <div
                className="absolute inset-0"
                style={{ 
                  zIndex: Z_INDICES.BACKGROUND,
                  backgroundColor: 'transparent',
                  cursor: isDragging ? 'grabbing' : 'cell'
                }}
                onMouseDown={handleMouseDown}
              />

              {/* Day separator lines */}
              {days.map((day, i) => {
                if (i === 0) return null;
                const top = getDayRowTop(i);
                return (
                  <div 
                    key={`separator-${i}`}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{ 
                      top: `${top}px`,
                      height: '1px',
                      backgroundColor: '#8B8B8B',
                      zIndex: Z_INDICES.DAY_ROW_LINES
                    }}
                  />
                );
              })}

              {/* FIXED: Schedule events with precise positioning */}
              {Object.entries(processedSchedules).map(([dayName, timeSlotStacks]) => {
                const dayIndex = days.findIndex(d => d.full === dayName);
                if (dayIndex === -1) return null;

                const dayTop = getDayRowTop(dayIndex);

                return Object.entries(timeSlotStacks).map(([timeSlot, eventsInSlot]) => {
                  if (eventsInSlot.length === 0) return null;

                  return eventsInSlot.map((event, eventIndex) => {
                    // FIXED: Use timeToPosition (returns position without padding)
                    const left = timeToPosition(event.startTime);
                    const width = calculateEventWidth(event.startTime, event.endTime);
                    
                    const laneIndex = event.stackIndex || 0;
                    const totalLanes = event.totalLanes || 1;
                    
                    let laneOffset = 0;
                    if (totalLanes > 1) {
                      laneOffset = laneIndex * (SCHEDULE_COMPRESSED_HEIGHT + LANE_SPACING);
                    }
                    
                    const top = dayTop + DAY_PADDING_TOP + laneOffset;

                    return (
                      <ScheduleEventCard
                        key={`${event.id}-${laneIndex}`}
                        event={event}
                        style={{
                          left: `${left}px`, // Position without padding (padding handled by container)
                          top: `${top}px`,
                          width: `${width}px`,
                          zIndex: Z_INDICES.SCHEDULE_EVENTS + laneIndex
                        }}
                        onClickEvent={(scheduleData) => handleScheduleClick({ preventDefault: () => {}, stopPropagation: () => {} }, scheduleData)}
                      />
                    );
                  });
                });
              })}

              {/* Empty state messages */}
              {selectedDates.length > 0 && days.map((day, dayIndex) => {
                const hasEvents = Object.values(processedSchedules[day.full] || {}).some(events => events.length > 0);
                const isDaySelected = selectedDates.some(date => {
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
                        left: '120px',
                        top: `${dayTop + DAY_PADDING_TOP}px`,
                        width: '240px',
                        height: `${dayHeight - DAY_PADDING_TOP - DAY_PADDING_BOTTOM}px`,
                        zIndex: Z_INDICES.BACKGROUND + 1
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

              {/* Selection box */}
              {selectionBox}
            </div>
          </div>
        </div>

        {/* FIXED: Current time line with precise positioning */}
        <div 
          className="absolute pointer-events-none" 
          style={{ 
            left: `${DAY_COLUMN_WIDTH + PADDING_OFFSET + getCurrentTimePosition() - scrollLeft}px`,
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

        {/* FIXED: Tooltip positioned within viewport */}
        {dragTimeTooltip && (
          <div
            className="absolute pointer-events-none bg-black text-white text-xs px-2 py-1 rounded shadow-lg"
            style={{
              left: `${dragTimeTooltip.x + 10}px`,
              top: `${dragTimeTooltip.y - 30}px`,
              zIndex: Z_INDICES.TOOLTIP
            }}
          >
            {dragTimeTooltip.startTime} - {dragTimeTooltip.endTime}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleGrid;