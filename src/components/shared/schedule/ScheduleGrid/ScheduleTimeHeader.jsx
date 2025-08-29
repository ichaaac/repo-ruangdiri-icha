// src/components/shared/schedule/components/ScheduleTimeHeader.jsx

import { GRID_CONFIG, Z_INDICES, TIME_SLOTS } from "./scheduleGridConfig";

const ScheduleTimeHeader = ({ dayColumnWidth, scrollLeft }) => {
  const halfHourDividers = TIME_SLOTS.slice(0, -1).map((_, i) => ({
    position: i * GRID_CONFIG.hourWidth + GRID_CONFIG.hourWidth / 2,
    hourIndex: i,
    timeSlot: TIME_SLOTS[i],
  }));

  return (
    <div
      className="absolute top-0 bg-white"
      style={{
        left: `${dayColumnWidth}px`,
        right: "0px",
        height: `${GRID_CONFIG.timeHeaderHeight}px`,
        overflow: "hidden",
        zIndex: Z_INDICES.TIME_HEADERS,
      }}
    >
      <div className="h-full" style={{ overflow: "hidden" }}>
        <div
          className="flex relative h-full"
          style={{
            width: `${TIME_SLOTS.length * GRID_CONFIG.hourWidth}px`,
            minWidth: `${TIME_SLOTS.length * GRID_CONFIG.hourWidth}px`,
            transform: `translateX(-${scrollLeft}px)`,
            paddingLeft: `${GRID_CONFIG.paddingOffset}px`,
          }}
        >
          {TIME_SLOTS.map((time, i) => (
            <div
              key={time}
              className="flex-shrink-0 relative"
              style={{ width: `${GRID_CONFIG.hourWidth}px`, height: `${GRID_CONFIG.timeHeaderHeight}px` }}
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
                left: `${GRID_CONFIG.paddingOffset + divider.position + 15}px`,
                top: "35%",
                width: "1px",
                height: "10px",
                zIndex: Z_INDICES.GRID_LINES,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleTimeHeader;