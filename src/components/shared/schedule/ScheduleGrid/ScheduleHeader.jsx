// src/components/shared/schedule/components/ScheduleHeader.jsx

import { useState } from "react";
import { Z_INDICES } from "./scheduleGridConfig";

const ScheduleHeader = ({ headerHeight = 66 }) => {
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  const HelpTooltip = () => (
    <div className="w-20 h-24 p-2.5 bg-black/50 rounded-[5px] inline-flex flex-col justify-center items-center gap-2.5">
      <div className="w-16 flex flex-col justify-end items-start gap-[5px]">
        <div className="w-24 flex flex-col justify-center items-start gap-[5px]">
          <div className="inline-flex justify-start items-center gap-[5px]">
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="7" r="6.5" fill="#9986FF" />
            </svg>
            <div className="justify-start text-white text-[10px] font-normal font-['Public_Sans'] leading-[14px]">
              Konseling
            </div>
          </div>
          <div className="self-stretch inline-flex justify-start items-center gap-[5px]">
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="7" r="6.5" fill="#3CE69E" />
            </svg>
            <div className="justify-start text-white text-[10px] font-normal font-['Public_Sans'] leading-[14px]">
              Kelas
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-start items-start gap-[5px]">
          <div className="inline-flex justify-start items-center gap-[5px]">
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="7" r="6.5" fill="#FF886D" />
            </svg>
            <div className="justify-start text-white text-[10px] font-normal font-['Public_Sans'] leading-[14px]">
              Seminar
            </div>
          </div>
          <div className="self-stretch inline-flex justify-start items-center gap-[5px]">
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="7" r="6.5" fill="#979797" />
            </svg>
            <div className="justify-start text-white text-[10px] font-normal font-['Public_Sans'] leading-[14px]">
              Lainnya
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ height: `${headerHeight}px` }}>
      <div className="flex items-center">
        <div className="w-[30px] h-[30px] bg-[#488BBA] rounded flex items-center justify-center">
          <span className="material-icons text-white text-lg">calendar_month</span>
        </div>
        <h2 className="text-xl font-semibold text-[#488BBA]" style={{ marginLeft: "15px" }}>
          Jadwal
        </h2>
      </div>

      <div className="relative help-icon" style={{ marginRight: "38px" }}>
        <div
          className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center cursor-help transition-colors hover:bg-gray-200"
          onMouseEnter={() => setShowHelpTooltip(true)}
          onMouseLeave={() => setShowHelpTooltip(false)}
        >
          <span className="text-gray-600 text-sm font-medium">?</span>
        </div>

        {showHelpTooltip && (
          <div className="absolute top-8 left-0" style={{ zIndex: Z_INDICES.TOOLTIP }}>
            <HelpTooltip />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleHeader;