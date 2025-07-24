// src/components/shared/schedule/ScheduleGrid.jsx - FIXED: Disable past time slots instead of preventing

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  
  const viewportRef = useRef(null);

  // CONSTANTS
  const baseWidth = 808;
  const baseHeight = 254;
  const actualWidth = Math.max(baseWidth, containerWidth);
  const actualHeight = baseHeight;
  const HOUR_WIDTH = 120;
  const MIN_DAY_ROW_HEIGHT = 60;
  
  const SCHEDULE_BASE_HEIGHT = 44;
  const SCHEDULE_STACKED_HEIGHT = 38;
  const SCHEDULE_MARGIN = 2; 
  const LANE_SPACING = 6;
  const MAX_VISIBLE_STACKS = 20;
  const DAY_PADDING_TOP = 12;
  const DAY_PADDING_BOTTOM = 8;
  
  const TIME_HEADER_HEIGHT = 30;
  const DAY_COLUMN_WIDTH = 70;
  const HEADER_HEIGHT = 66;
  const MAX_DRAG_DAYS = 2;
  const PADDING_OFFSET = 38;

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
    HELP_ICON: 55,
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
      const position = (i * HOUR_WIDTH) + (HOUR_WIDTH / 2);
      dividers.push({ position, hourIndex: i, timeSlot: timeSlots[i] });
    }
    return dividers;
  }, [timeSlots, HOUR_WIDTH]);

  // Helper functions
  const getTypeColor = useCallback((type) => {
    const colors = {
      counseling: "#9986FF",
      class: "#3CE69E", 
      seminar: "#FF886D",
      meeting: "#3399E9",
      other: "#979797",
      others: "#979797"
    };
    return colors[type] || colors.other;
  }, []);

  const getLocationDisplay = useCallback((schedule) => {
    const location = schedule.location || schedule.customLocation;
    
    if (location === "online") {
      return "Zoom";
    } else if (location === "offline") {
      return "Offline";
    } else if (location === "organization" || location === "seed-in") {
      return "Seed-in";
    } else if (location) {
      return location;
    } else {
      return "TBD";
    }
  }, []);

  const parseUTCToLocal = useCallback((utcDateTimeString) => {
    const utcDate = new Date(utcDateTimeString);
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibDate = new Date(utcDate.getTime() + wibOffset);
    
    return new Date(wibDate.getUTCFullYear(), wibDate.getUTCMonth(), wibDate.getUTCDate(), 
                   wibDate.getUTCHours(), wibDate.getUTCMinutes(), wibDate.getUTCSeconds());
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

  const timeToPosition = useCallback((hour, minute) => {
    const hourIndex = getHourDisplayIndex(hour);
    const basePosition = hourIndex * HOUR_WIDTH;
    const minuteOffset = (minute / 60) * HOUR_WIDTH;
    const totalPosition = basePosition + minuteOffset;
    
    return totalPosition;
  }, [getHourDisplayIndex]);

  // FIXED: Check if current date is in selected week - no logs
  const isCurrentDateInSelectedWeek = useMemo(() => {
    if (!selectedDates || selectedDates.length === 0) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDates.some(selectedDate => {
      const normalizedSelectedDate = new Date(selectedDate);
      normalizedSelectedDate.setHours(0, 0, 0, 0);
      return normalizedSelectedDate.getTime() === today.getTime();
    });
  }, [selectedDates]);

  // FIXED: Auto-scroll to current day when current date is selected
  useEffect(() => {
    if (isCurrentDateInSelectedWeek && viewportRef.current && selectedDates.length > 0) {
      const today = new Date();
      const currentDayIndex = (today.getDay() + 6) % 7; // Monday = 0
      
      // Calculate the top position for the current day
      let dayTop = 0;
      for (let i = 0; i < currentDayIndex; i++) {
        const dayName = days[i]?.full;
        dayTop += dayRowHeights[dayName] || MIN_DAY_ROW_HEIGHT;
      }
      
      // Scroll to show current day in view
      const scrollContainer = viewportRef.current;
      const containerHeight = scrollContainer.clientHeight;
      const targetScrollTop = Math.max(0, dayTop - containerHeight / 3);
      
      scrollContainer.scrollTop = targetScrollTop;
    }
  }, [isCurrentDateInSelectedWeek, selectedDates]);

  const calculateEventWidth = useCallback((startHour, startMinute, endHour, endMinute) => {
    const startPos = timeToPosition(startHour, startMinute);
    const endPos = timeToPosition(endHour, endMinute);
    const width = Math.max(endPos - startPos, HOUR_WIDTH * 0.4);
    
    return width;
  }, [timeToPosition]);

  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const hour = now.getHours();
    const minutes = now.getMinutes();
    return timeToPosition(hour, minutes);
  }, [currentTime, timeToPosition]);

  const getCurrentTimeString = useCallback(() => {
    const now = currentTime;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [currentTime]);

  // FIXED: Schedule processing - don't show schedules if no selected dates
  const processedSchedules = useMemo(() => {
    const processed = {};
    const dayEvents = {};
    
    days.forEach(day => {
      processed[day.full] = {};
      dayEvents[day.full] = [];
    });

    // FIXED: Return empty if no dates selected
    if (!selectedDates || selectedDates.length === 0) {
      return processed;
    }

    schedules.forEach(schedule => {
      const startDateTimeWIB = parseUTCToLocal(schedule.startDateTime);
      const endDateTimeWIB = parseUTCToLocal(schedule.endDateTime);
      
      const dayIndex = (startDateTimeWIB.getDay() + 6) % 7;
      const dayName = days[dayIndex]?.full;
      
      if (dayName) {
        const isDateSelected = selectedDates.some(date => {
          const selectedDateObj = new Date(date);
          return selectedDateObj.toDateString() === startDateTimeWIB.toDateString();
        });
        
        if (!isDateSelected) {
          return;
        }
        
        const displaySchedule = {
          id: schedule.id,
          name: schedule.agenda || "No Title",
          startHour: startDateTimeWIB.getHours(),
          startMinute: startDateTimeWIB.getMinutes(),
          endHour: endDateTimeWIB.getHours(),
          endMinute: endDateTimeWIB.getMinutes(),
          startTime: startDateTimeWIB.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          endTime: endDateTimeWIB.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          location: getLocationDisplay(schedule),
          type: schedule.type || "other",
          color: getTypeColor(schedule.type),
          timezone: "WIB",
          participants: schedule.participants || [],
          originalData: schedule,
          startDateTime: startDateTimeWIB,
          endDateTime: endDateTimeWIB,
          duration: endDateTimeWIB - startDateTimeWIB,
          startMinutes: startDateTimeWIB.getHours() * 60 + startDateTimeWIB.getMinutes(),
          endMinutes: endDateTimeWIB.getHours() * 60 + endDateTimeWIB.getMinutes(),
          createdAt: schedule.createdAt || startDateTimeWIB
        };
        
        dayEvents[dayName].push(displaySchedule);
      }
    });

    // Vertical stacking logic
    Object.keys(dayEvents).forEach(dayName => {
      const events = dayEvents[dayName];
      
      events.sort((a, b) => {
        const timeDiff = a.startDateTime - b.startDateTime;
        if (timeDiff !== 0) return timeDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      const lanes = [];
      
      events.forEach((event) => {
        let laneIndex = 0;
        let placed = false;
        
        for (let i = 0; i < lanes.length; i++) {
          const lastEventInLane = lanes[i][lanes[i].length - 1];
          
          if (event.startMinutes >= lastEventInLane.endMinutes) {
            lanes[i].push(event);
            laneIndex = i;
            placed = true;
            break;
          }
        }
        
        if (!placed) {
          lanes.push([event]);
          laneIndex = lanes.length - 1;
        }
        
        event.stackIndex = laneIndex;
        event.isStacked = lanes.length > 1;
      });

      events.forEach(event => {
        event.totalLanes = lanes.length;
      });

      const timeSlotGroups = {};
      events.forEach((event) => {
        const timeSlot = `${event.startHour.toString().padStart(2, '0')}:00`;
        
        if (!timeSlotGroups[timeSlot]) {
          timeSlotGroups[timeSlot] = [];
        }
        timeSlotGroups[timeSlot].push(event);
      });

      Object.keys(timeSlotGroups).forEach(timeSlot => {
        if (!processed[dayName][timeSlot]) {
          processed[dayName][timeSlot] = [];
        }
        processed[dayName][timeSlot] = timeSlotGroups[timeSlot];
      });
    });

    return processed;
  }, [schedules, selectedDates, days, parseUTCToLocal, getLocationDisplay, getTypeColor]);

  const dayRowHeights = useMemo(() => {
    const heights = {};
    
    days.forEach(day => {
      let maxStacks = 1;
      let hasEvents = false;
      
      Object.values(processedSchedules[day.full] || {}).forEach(eventsInSlot => {
        if (eventsInSlot.length > 0) {
          hasEvents = true;
          eventsInSlot.forEach(event => {
            if (event.totalLanes) {
              maxStacks = Math.max(maxStacks, event.totalLanes);
            }
          });
        }
      });
      
      if (hasEvents) {
        const visibleStacks = Math.min(maxStacks, MAX_VISIBLE_STACKS);
        let totalHeight = DAY_PADDING_TOP + DAY_PADDING_BOTTOM;
        
        for (let i = 0; i < visibleStacks; i++) {
          if (maxStacks === 1) {
            totalHeight += SCHEDULE_BASE_HEIGHT;
          } else {
            totalHeight += SCHEDULE_STACKED_HEIGHT;
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

  // FIXED: Add function to check if a time slot is in the past
  const isTimeSlotInPast = useCallback((dayIndex, hour, minute) => {
    const now = new Date();
    const targetDate = getDateFromDayIndex(dayIndex);
    const targetDateTime = new Date(targetDate);
    targetDateTime.setHours(hour, minute, 0, 0);
    
    return targetDateTime < now;
  }, []);

  const getTimeFromPosition = useCallback((clientX, clientY) => {
    if (!viewportRef.current) return null;
    
    const rect = viewportRef.current.getBoundingClientRect();
    const x = clientX - rect.left + scrollLeft;
    const y = clientY - rect.top + scrollTop;
    const gridX = x - PADDING_OFFSET;
    const gridY = y;
    
    if (gridX < 0 || gridY < 0) return null;
    
    const hourIndex = Math.floor(gridX / HOUR_WIDTH);
    if (hourIndex < 0 || hourIndex >= timeSlots.length) return null;
    
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
    
    const actualHour = getActualHour(hourIndex);
    const pixelWithinHour = gridX - (hourIndex * HOUR_WIDTH);
    const exactMinute = (pixelWithinHour / HOUR_WIDTH) * 60;
    const snappedMinute = Math.round(exactMinute / 15) * 15;
    const finalMinute = Math.min(snappedMinute, 59);
    const pixelX = hourIndex * HOUR_WIDTH + (finalMinute / 60) * HOUR_WIDTH;
    
    // FIXED: Check if this time slot is in the past
    const isPast = isTimeSlotInPast(dayIndex, actualHour, finalMinute);
    
    return {
      hour: actualHour,
      minute: finalMinute,
      hourIndex: hourIndex,
      dayIndex: dayIndex,
      exactMinute: exactMinute,
      pixelX: pixelX,
      isPast: isPast // FIXED: Add isPast flag
    };
  }, [scrollLeft, scrollTop, dayRowHeights, days, timeSlots.length, getActualHour, isTimeSlotInPast]);

  const getDateFromDayIndex = useCallback((dayIndex) => {
    const baseDate = weekStartDate ? new Date(weekStartDate) : new Date();
    const baseDayOfWeek = (baseDate.getDay() + 6) % 7;
    baseDate.setDate(baseDate.getDate() - baseDayOfWeek);
    baseDate.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + dayIndex);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate;
  }, [weekStartDate]);

  // FIXED: Mouse handlers - prevent dragging on past time slots
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.schedule-event') || e.target.closest('.help-icon')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const timeInfo = getTimeFromPosition(e.clientX, e.clientY);
    if (!timeInfo) return;
    
    // FIXED: Don't allow dragging on past time slots
    if (timeInfo.isPast) {
      return; // Simply don't start dragging for past time slots
    }
    
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
    
    // FIXED: Don't allow dragging to past time slots
    if (timeInfo.isPast) {
      return; // Don't update selection if trying to drag to a past time slot
    }
    
    let constrainedDayIndex = timeInfo.dayIndex;
    
    if (timeInfo.dayIndex !== dragStartPos.dayIndex) {
      const startDayIndex = dragStartPos.dayIndex;
      const maxEndDay = Math.min(startDayIndex + MAX_DRAG_DAYS - 1, days.length - 1);
      const minEndDay = Math.max(startDayIndex - MAX_DRAG_DAYS + 1, 0);
      constrainedDayIndex = Math.max(minEndDay, Math.min(maxEndDay, timeInfo.dayIndex));
    }
    
    setSelectedArea(prev => ({
      ...prev,
      endDay: constrainedDayIndex,
      endHour: timeInfo.hour,
      endMinute: timeInfo.minute,
      endPixelX: timeInfo.pixelX
    }));
    
    const rect = viewportRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    const time1 = { hour: dragStartPos.hour, minute: dragStartPos.minute, day: dragStartPos.dayIndex };
    const time2 = { hour: timeInfo.hour, minute: timeInfo.minute, day: constrainedDayIndex };
    
    const time1Minutes = time1.day * 1440 + time1.hour * 60 + time1.minute;
    const time2Minutes = time2.day * 1440 + time2.hour * 60 + time2.minute;
    
    let startTime, endTime;
    if (time1Minutes <= time2Minutes) {
      startTime = `${time1.hour.toString().padStart(2, '0')}:${time1.minute.toString().padStart(2, '0')}`;
      endTime = `${time2.hour.toString().padStart(2, '0')}:${time2.minute.toString().padStart(2, '0')}`;
    } else {
      startTime = `${time2.hour.toString().padStart(2, '0')}:${time2.minute.toString().padStart(2, '0')}`;
      endTime = `${time1.hour.toString().padStart(2, '0')}:${time1.minute.toString().padStart(2, '0')}`;
    }
    
    setDragTimeTooltip({
      x: relativeX,
      y: relativeY - 10,
      startTime: startTime,
      endTime: endTime
    });
  }, [isDragging, dragStartPos, days.length, getTimeFromPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !selectedArea || !dragStartPos) return;
    
    // FIXED: Check if the start time is in the past and show appropriate message
    const startDate = getDateFromDayIndex(selectedArea.startDay);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(selectedArea.startHour, selectedArea.startMinute, 0, 0);
    
    const now = new Date();
    if (startDateTime < now) {
      // FIXED: Show informative message instead of preventing
      toast.info("Jadwal yang dipilih sudah terlewat", {
        description: "Anda tetap dapat membuat jadwal ini jika diperlukan."
      });
    }
    
    const isClick = selectedArea.startDay === selectedArea.endDay && 
                   selectedArea.startHour === selectedArea.endHour && 
                   selectedArea.startMinute === selectedArea.endMinute;
    
    if (isClick) {
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
          date: formatDateLocal(clickedDate),
          startTime: `${selectedArea.startHour.toString().padStart(2, '0')}:${selectedArea.startMinute.toString().padStart(2, '0')}`,
          endTime: `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`,
          timezone: 'WIB'
        }],
        draggedDays: 1
      });
    } else {
      const startDay = Math.min(selectedArea.startDay, selectedArea.endDay);
      const endDay = Math.max(selectedArea.startDay, selectedArea.endDay);
      
      let startHour, startMinute, endHour, endMinute;
      
      const time1 = { hour: selectedArea.startHour, minute: selectedArea.startMinute, day: selectedArea.startDay };
      const time2 = { hour: selectedArea.endHour, minute: selectedArea.endMinute, day: selectedArea.endDay };
      
      const time1Minutes = time1.day * 1440 + time1.hour * 60 + time1.minute;
      const time2Minutes = time2.day * 1440 + time2.hour * 60 + time2.minute;
      
      if (time1Minutes <= time2Minutes) {
        startHour = time1.hour;
        startMinute = time1.minute;
        endHour = time2.hour;
        endMinute = time2.minute;
      } else {
        startHour = time2.hour;
        startMinute = time2.minute;
        endHour = time1.hour;
        endMinute = time1.minute;
      }
      
      if (startDay === endDay && startHour === endHour && startMinute === endMinute) {
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
          date: formatDateLocal(dayDate),
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
    
    const left = PADDING_OFFSET + startPixelX;
    const width = Math.max(endPixelX - startPixelX, 30);
    
    return (
      <div
        className="absolute bg-blue-400/20 border border-blue-400 rounded pointer-events-none"
        style={{ 
          top, 
          left, 
          width, 
          height, 
          zIndex: Z_INDICES.SELECTION_BOX,
        }}
      />
    );
  }, [selectedArea, isDragging, getDayRowTop, days, dayRowHeights]);

  const ScheduleEventCard = ({ event, style, className, onClickEvent }) => {
    const [isHovered, setIsHovered] = useState(false);

    const isStacked = event.totalLanes > 1;
    const laneIndex = event.stackIndex || 0;
    
    const height = isStacked ? SCHEDULE_STACKED_HEIGHT : SCHEDULE_BASE_HEIGHT;

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
      zIndex: isHovered ? style.zIndex + 50 : style.zIndex,
      boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
    };

    return (
      <div
        className={`absolute flex flex-col justify-center items-start cursor-pointer schedule-event ${className || ''}`}
        style={{
          ...combinedStyle,
          borderRadius: '6px',
          paddingLeft: '8px',
          paddingRight: '8px',
          overflow: 'hidden',
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full text-white text-[12px] font-semibold font-['Public_Sans'] truncate">
          {event.name}
        </div>
        <div className="w-full flex items-center">
          <span className="text-white text-[11px] font-normal font-['Public_Sans'] truncate">
            {event.startTime} - {event.endTime} {event.timezone}
          </span>
          <span className="text-white text-[11px] font-normal font-['Public_Sans'] mx-1">|</span>
          <span className="text-white text-[11px] font-semibold font-['Public_Sans'] truncate">
            {event.location}
          </span>
        </div>
      </div>
    );
  };

  const HelpTooltip = () => (
    <div className="w-20 h-24 p-2.5 bg-black/50 rounded-[5px] inline-flex flex-col justify-center items-center gap-2.5">
      <div className="w-16 flex flex-col justify-end items-start gap-[5px]">
        <div className="w-24 flex flex-col justify-center items-start gap-[5px]">
          <div className="inline-flex justify-start items-center gap-[5px]">
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="7" r="6.5" fill="#9986FF"/>
            </svg>
            <div className="justify-start text-white text-[10px] font-normal font-['Public_Sans'] leading-[14px]">Konseling</div>
          </div>
          <div className="self-stretch inline-flex justify-start items-center gap-[5px]">
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="7" r="6.5" fill="#3CE69E"/>
            </svg>
            <div className="justify-start text-white text-[10px] font-normal font-['Public_Sans'] leading-[14px]">Kelas</div>
          </div>
        </div>
        <div className="flex flex-col justify-start items-start gap-[5px]">
          <div className="inline-flex justify-start items-center gap-[5px]">
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="7" r="6.5" fill="#FF886D"/>
            </svg>
            <div className="justify-start text-white text-[10px] font-normal font-['Public_Sans'] leading-[14px]">Seminar</div>
          </div>
          <div className="self-stretch inline-flex justify-start items-center gap-[5px]">
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="7" r="6.5" fill="#979797"/>
            </svg>
            <div className="justify-start text-white text-[10px] font-normal font-['Public_Sans'] leading-[14px]">Lainnya</div>
          </div>
        </div>
      </div>
    </div>
  );

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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); 
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
      <div className="flex items-center justify-between px-5 py-3" style={{ height: `${HEADER_HEIGHT}px` }}>
        <div className="flex items-center">
          <div className="w-[30px] h-[30px] bg-[#488BBA] rounded flex items-center justify-center">
            <span className="material-icons text-white text-lg">calendar_month</span>
          </div>
          <h2 className="text-xl font-semibold text-[#488BBA]" style={{ marginLeft: '15px' }}>
            Jadwal
          </h2>
        </div>
        
        <div 
          className="relative help-icon"
          style={{ marginRight: '38px' }}
        >
          <div 
            className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center cursor-help transition-colors hover:bg-gray-200"
            onMouseEnter={() => setShowHelpTooltip(true)}
            onMouseLeave={() => setShowHelpTooltip(false)}
          >
            <span className="text-gray-600 text-sm font-medium">?</span>
          </div>
          
          {showHelpTooltip && (
            <div 
              className="absolute top-8 left-0"
              style={{ zIndex: Z_INDICES.TOOLTIP }}
            >
              <HelpTooltip />
            </div>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative overflow-hidden" style={{ height: `${actualHeight - HEADER_HEIGHT}px` }}>
        
        {/* Time Header */}
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
                  <span className="text-sm text-neutral-600 absolute top-1/2 left-0 transform -translate-y-1/2">
                    {time}
                  </span>
                </div>
              ))}

              {halfHourDividers.map((divider, i) => (
                <div 
                  key={`divider-30min-${i}`}
                  className="absolute pointer-events-none bg-red-400" 
                  style={{ 
                    left: `${PADDING_OFFSET + divider.position + 15}px`,
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

        {/* Day Column */}
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
            className="absolute overflow-hidden"
            style={{ 
              top: `${TIME_HEADER_HEIGHT}px`,
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
              {days.map((day, index) => (
                <div 
                  key={day.short} 
                  className="flex items-center justify-center bg-white"
                  style={{ 
                    height: `${dayRowHeights[day.full]}px`,
                  }}
                >
                  <span className="text-sm font-semibold text-neutral-700">
                    {day.short}
                  </span>
                </div>
              ))}
            </div>
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

              {/* FIXED: Visual indicators for past time slots */}
              {selectedDates.length > 0 && days.map((day, dayIndex) => {
                const isDaySelected = selectedDates.some(date => {
                  const selectedDateObj = new Date(date);
                  const selectedDayIndex = (selectedDateObj.getDay() + 6) % 7;
                  return selectedDayIndex === dayIndex;
                });
                
                if (!isDaySelected) return null;
                
                const dayTop = getDayRowTop(dayIndex);
                const dayHeight = dayRowHeights[day.full];
                
                return timeSlots.slice(0, -1).map((timeSlot, hourIndex) => {
                  const hour = getActualHour(hourIndex);
                  const isPast = isTimeSlotInPast(dayIndex, hour, 0);
                  
                  if (!isPast) return null;
                  
                  const left = hourIndex * HOUR_WIDTH;
                  
                  return (
                    <div
                      key={`past-indicator-${dayIndex}-${hourIndex}`}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${left + 55}px`,
                        top: `${dayTop}px`,
                        width: `${HOUR_WIDTH}px`,
                        height: `${dayHeight}px`,
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        zIndex: Z_INDICES.BACKGROUND + 1,
                        borderRight: '1px solid rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  );
                });
              })}

              {/* Schedule events */}
              {Object.entries(processedSchedules).map(([dayName, timeSlotStacks]) => {
                const dayIndex = days.findIndex(d => d.full === dayName);
                if (dayIndex === -1) return null;

                const dayTop = getDayRowTop(dayIndex);

                return Object.entries(timeSlotStacks).map(([timeSlot, eventsInSlot]) => {
                  if (eventsInSlot.length === 0) return null;

                  return eventsInSlot.map((event, eventIndex) => {
                    const leftPosition = timeToPosition(event.startHour, event.startMinute);
                    const width = calculateEventWidth(
                      event.startHour, 
                      event.startMinute, 
                      event.endHour, 
                      event.endMinute
                    );
                    
                    const laneIndex = event.stackIndex || 0;
                    
                    let laneOffset = 0;
                    if (event.totalLanes > 1) {
                      laneOffset = laneIndex * (SCHEDULE_STACKED_HEIGHT + LANE_SPACING);
                    }
                    
                    const top = dayTop + DAY_PADDING_TOP + laneOffset;

                    return (
                      <ScheduleEventCard
                        key={`${event.id}-${laneIndex}`}
                        event={event}
                        style={{
                          left: `${leftPosition + 55}px`,
                          top: `${top}px`,
                          width: `${width}px`,
                          zIndex: Z_INDICES.SCHEDULE_EVENTS + laneIndex,
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

              {/* No week selected message */}
              {selectedDates.length === 0 && (
                <div
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: Z_INDICES.BACKGROUND + 1
                  }}
                >
                  <div className="text-gray-400 text-sm font-medium bg-gray-50 px-4 py-2 rounded-md">
                    Pilih minggu di kalender untuk melihat jadwal
                  </div>
                </div>
              )}

              {selectionBox}
            </div>
          </div>
        </div>

        {/* FIXED: Current time line - only show if current date is in selected week */}
        {isCurrentDateInSelectedWeek && (
          <div 
            className="absolute pointer-events-none" 
            style={{ 
              left: `${DAY_COLUMN_WIDTH + PADDING_OFFSET + getCurrentTimePosition() + 15 - scrollLeft}px`,
              top: `${TIME_HEADER_HEIGHT}px`,
              height: `${totalGridHeight}px`,
              zIndex: Z_INDICES.CURRENT_TIME,
              width: '2px'
            }}
          >
            <div className="relative w-full h-full bg-red-500 shadow-sm">
              <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm" 
                   style={{ top: '-5px', left: '50%', transform: 'translateX(-50%)' }} />
              
              <div className="absolute" style={{ left: '4px', top: '2px' }}>
                <div className="bg-black bg-opacity-90 rounded text-white text-xs font-mono px-1.5 py-1 whitespace-nowrap shadow-md">
                  {getCurrentTimeString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tooltip */}
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