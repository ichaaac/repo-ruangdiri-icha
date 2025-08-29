// src/components/shared/schedule/components/scheduleGridConfig.js

export const GRID_CONFIG = {
  baseWidth: 808,
  baseHeight: 254,
  hourWidth: 120,
  minDayRowHeight: 60,
  scheduleBaseHeight: 44,
  scheduleStackedHeight: 38,
  scheduleMargin: 2,
  laneSpacing: 6,
  maxVisibleStacks: 20,
  dayPaddingTop: 12,
  dayPaddingBottom: 8,
  timeHeaderHeight: 30,
  dayColumnWidth: 70,
  headerHeight: 66,
  maxDragDays: 2,
  paddingOffset: 38,
};

export const Z_INDICES = {
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
  MODALS: 100,
};

export const DAYS = [
  { short: "Sen", full: "Senin" },
  { short: "Sel", full: "Selasa" },
  { short: "Rab", full: "Rabu" },
  { short: "Kam", full: "Kamis" },
  { short: "Jum", full: "Jumat" },
  { short: "Sab", full: "Sabtu" },
  { short: "Min", full: "Minggu" },
];

export const TIME_SLOTS = (() => {
  const slots = [];
  for (let i = 6; i <= 23; i++) {
    slots.push(`${i.toString().padStart(2, "0")}:00`);
  }
  slots.push("00:00");
  return slots;
})();

export const TYPE_COLORS = {
  counseling: "#9986FF",
  class: "#3CE69E", 
  seminar: "#FF886D",
  meeting: "#3399E9",
  other: "#979797",
  others: "#979797",
};