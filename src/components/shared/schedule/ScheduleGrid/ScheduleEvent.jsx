// src/components/shared/schedule/components/ScheduleEvent.jsx

import { useState } from "react";

const ScheduleEvent = ({ 
  event, 
  style, 
  className = '', 
  onClickEvent,
  maxVisibleStacks = 20,
  stackedHeight = 38,
  baseHeight = 44
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isStacked = event.totalLanes > 1;
  const laneIndex = event.stackIndex || 0;
  const height = isStacked ? stackedHeight : baseHeight;

  const handleClick = (e) => {
    e.stopPropagation();
    onClickEvent && onClickEvent(event);
  };

  const handleMouseDown = (e) => e.stopPropagation();

  // Don't render if beyond max visible stacks
  if (laneIndex >= maxVisibleStacks) {
    return null;
  }

  const combinedStyle = {
    ...style,
    height: `${height}px`,
    backgroundColor: event.color,
    zIndex: isHovered ? style.zIndex + 50 : style.zIndex,
    boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.1)",
    borderRadius: "6px",
    paddingLeft: "8px",
    paddingRight: "8px",
    overflow: "hidden",
  };

  return (
    <div
      className={`absolute flex flex-col justify-center items-start cursor-pointer schedule-event ${className}`}
      style={combinedStyle}
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

export default ScheduleEvent;