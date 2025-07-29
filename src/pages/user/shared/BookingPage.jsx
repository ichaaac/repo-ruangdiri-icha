// src/pages/user/shared/BookingPage.jsx - Exact match with Figma design

import React, { useState } from 'react';

const BookingPage = () => {
  const [formData, setFormData] = useState({
    psikolog: '',
    tipeLangganan: 'Organisasi',
    tanggal: 'Rabu, 23 Juli 2025',
    startTime: '01.00 AM',
    endTime: '01.05 AM',
    timezone: 'WIB',
    jenisPermasalahan: 'Konseling Klinis',
    notes: '',
    multipleDate: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    // Handle form submission
  };

  const handleCancel = () => {
    console.log('Form cancelled');
    // Handle form cancellation
  };

  return (
    <div className="w-[1440px] h-[810px] relative bg-white overflow-hidden">
      {/* Background Gradient */}
      <div className="w-[1440px] h-72 left-0 top-0 absolute bg-gradient-to-b from-teal-200 to-indigo-500" />
      
      {/* Main Card */}
      <div className="w-[1322px] h-[668px] left-[59px] top-[142px] absolute bg-white rounded-tl-[10px] rounded-tr-[10px] shadow-[0px_12px_27px_0px_rgba(0,0,0,0.07)] shadow-[0px_49px_49px_0px_rgba(0,0,0,0.06)] shadow-[0px_111px_67px_0px_rgba(0,0,0,0.04)] shadow-[0px_198px_79px_0px_rgba(0,0,0,0.01)] shadow-[0px_309px_86px_0px_rgba(0,0,0,0.00)]" />
      
      {/* Logo */}
      <div className="w-24 left-[670px] top-[26px] absolute inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
        <img 
          src="/logo/ruang-diri-logo.svg" 
          alt="RuangDiri Logo"
          className="w-full h-auto"
        />
      </div>

      {/* Main Content */}
      <div className="w-[1204px] left-[118px] top-[172px] absolute inline-flex flex-col justify-start items-start gap-5">
        <div className="self-stretch inline-flex justify-start items-center gap-[864px]">
          <div className="justify-start text-primary-V1 text-4xl font-extrabold font-['Public_Sans'] leading-[74px]">
            Booking Sesi Konseling
          </div>
        </div>
        <div className="self-stretch justify-start text-TEXT-NEW text-base font-normal font-['Public_Sans'] leading-snug">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque dapibus nisi magna. Aenean sagittis arcu vitae mauris accumsan, eget vestibulum eros laoreet. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed sit amet bibendum neque. Sed condimentum ultricies tristique.
        </div>
      </div>

      {/* Separator Line */}
      <div className="w-[1204px] h-0 left-[118px] top-[288px] absolute outline outline-[0.50px] outline-offset-[-0.25px] outline-primary-V1"></div>

      {/* Consultation Type Section */}
      <div className="w-[454px] h-96 left-[257px] top-[321px] absolute inline-flex flex-col justify-between items-start">
        <div className="self-stretch inline-flex justify-start items-center gap-5">
          <div className="size-40 bg-zinc-300 rounded-full" />
          <img className="w-80 h-40" src="https://placehold.co/312x166" alt="Online consultation" />
          <img className="w-72 h-40" src="https://placehold.co/302x159" alt="In-person consultation" />
          <div className="w-40 h-0 origin-top-left rotate-90 outline outline-[0.50px] outline-offset-[-0.25px] outline-TEXT-NEW"></div>
          <div className="w-64 inline-flex flex-col justify-center items-start gap-3.5">
            <div className="self-stretch flex flex-col justify-center items-start gap-2.5">
              <div className="text-center justify-center text-TEXT-NEW text-sm font-semibold font-['Public_Sans']">
                Konseling Daring (Zoom)
              </div>
              <div className="self-stretch justify-center text-TEXT-NEW text-xs font-normal font-['Public_Sans'] leading-none">
                A link to access your virtual room will be sent to you.
              </div>
            </div>
            <div className="size- inline-flex justify-start items-center gap-[5px]">
              <div className="justify-center text-TEXT-NEW text-xs font-normal font-['Public_Sans'] leading-none">
                +62 21 1 500 911<br/>booking@ruangdiri.com
              </div>
            </div>
            <div className="size- px-2.5 py-1.5 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-text inline-flex justify-start items-center gap-2.5">
              <div className="text-center justify-center text-text text-xs font-normal font-['Public_Sans']">
                Ganti Jenis Konseling
              </div>
            </div>
          </div>
        </div>

        {/* Date & Time Section */}
        <div className="w-[454px] flex flex-col justify-start items-end gap-2.5">
          <div className="self-stretch flex flex-col justify-start items-end gap-2.5">
            <div className="self-stretch inline-flex justify-start items-center gap-5">
              <div className="w-40 flex justify-start items-center gap-2.5">
                <div className="text-center justify-center text-TEXT-NEW text-sm font-bold font-['Public_Sans']">
                  Tanggal
                </div>
              </div>
              <div className="w-72 h-9 px-2.5 py-3 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-TEXT-NEW flex justify-between items-center">
                <div className="text-center justify-center text-TEXT-NEW text-sm font-normal font-['Public_Sans']">
                  {formData.tanggal}
                </div>
                <span className="material-icons text-TEXT-NEW" style={{ fontSize: '16px' }}>
                  calendar_today
                </span>
              </div>
            </div>
          </div>
          
          {/* Time Selection */}
          <div className="w-72 inline-flex justify-between items-center">
            <div className="w-24 h-9 px-2.5 py-2 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-TEXT-NEW inline-flex flex-col justify-center items-center gap-2.5">
              <div className="size- inline-flex justify-start items-center gap-[5px]">
                <div className="justify-center text-text text-sm font-normal font-['Public_Sans']">
                  {formData.startTime}
                </div>
                <span className="material-icons text-TEXT-NEW" style={{ fontSize: '12px' }}>
                  keyboard_arrow_down
                </span>
              </div>
            </div>
            <div className="size- inline-flex flex-col justify-center items-center gap-2.5">
              <div className="self-stretch justify-center text-neutral-600 text-base font-normal font-['Public_Sans']">
                -
              </div>
            </div>
            <div className="w-24 h-9 px-2.5 py-2 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-TEXT-NEW inline-flex flex-col justify-center items-center gap-2.5">
              <div className="size- inline-flex justify-start items-center gap-[5px]">
                <div className="justify-center text-text text-sm font-normal font-['Public_Sans']">
                  {formData.endTime}
                </div>
                <span className="material-icons text-TEXT-NEW" style={{ fontSize: '12px' }}>
                  keyboard_arrow_down
                </span>
              </div>
            </div>
            <div className="w-16 h-9 px-2.5 py-2 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-TEXT-NEW inline-flex flex-col justify-center items-center gap-2.5">
              <div className="size- inline-flex justify-start items-center gap-[5px]">
                <div className="justify-center text-text text-sm font-normal font-['Public_Sans']">
                  {formData.timezone}
                </div>
                <span className="material-icons text-TEXT-NEW" style={{ fontSize: '12px' }}>
                  keyboard_arrow_down
                </span>
              </div>
            </div>
          </div>
          
          {/* Multiple Date Checkbox */}
          <div className="w-72 inline-flex justify-start items-center gap-2.5">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.multipleDate}
                onChange={(e) => handleInputChange('multipleDate', e.target.checked)}
                className="w-[14px] h-[14px] border border-TEXT-NEW rounded-sm"
              />
            </div>
            <div className="justify-center text-neutral-600 text-xs font-normal font-['Public_Sans']">
              Multiple Date
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-[454px] left-[789px] top-[500px] absolute inline-flex flex-col justify-start items-start gap-5">
        {/* Psikolog Selection */}
        <div className="self-stretch flex flex-col justify-start items-start gap-5">
          <div className="self-stretch h-9 flex flex-col justify-between items-end">
            <div className="self-stretch inline-flex justify-start items-center gap-5">
              <div className="w-40 flex justify-start items-center gap-2.5">
                <div className="text-center justify-center text-TEXT-NEW text-sm font-bold font-['Public_Sans']">
                  Psikolog
                </div>
              </div>
              <div className="w-72 h-9 px-2.5 py-2 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-TEXT-NEW flex justify-start items-center gap-56">
                <div className="flex-1 h-5 rounded-[5px] inline-flex flex-col justify-between items-start">
                  <div className="self-stretch inline-flex justify-center items-center gap-[5px]">
                    <div className="flex-1 flex justify-between items-center">
                      <div className="text-center justify-center">
                        <span className="text-sign-in---Back---cancle---Close text-sm font-normal font-['Public_Sans']">*</span>
                        <span className="text-text text-sm font-normal font-['Public_Sans']">Pilih Psikolog</span>
                      </div>
                      <span className="material-icons text-TEXT-NEW" style={{ fontSize: '16px' }}>
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tipe Langganan */}
        <div className="self-stretch flex flex-col justify-start items-start gap-5">
          <div className="self-stretch h-9 flex flex-col justify-between items-end">
            <div className="self-stretch inline-flex justify-start items-center gap-5">
              <div className="w-40 flex justify-start items-center gap-2.5">
                <div className="text-center justify-center text-TEXT-NEW text-sm font-bold font-['Public_Sans']">
                  Tipe Langganan
                </div>
              </div>
              <div className="w-72 h-9 px-2.5 py-2 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-TEXT-NEW flex justify-start items-center gap-56">
                <div className="flex-1 h-5 rounded-[5px] inline-flex flex-col justify-between items-start">
                  <div className="self-stretch inline-flex justify-center items-center gap-[5px]">
                    <div className="flex-1 flex justify-between items-center">
                      <div className="text-center justify-center text-TEXT-NEW text-sm font-normal font-['Public_Sans']">
                        {formData.tipeLangganan}
                      </div>
                      <span className="material-icons text-TEXT-NEW" style={{ fontSize: '16px' }}>
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jenis Permasalahan */}
        <div className="self-stretch flex flex-col justify-start items-end gap-2.5">
          <div className="self-stretch inline-flex justify-start items-center gap-5">
            <div className="w-40 flex justify-start items-center gap-2.5">
              <div className="text-center justify-center text-TEXT-NEW text-sm font-bold font-['Public_Sans']">
                Jenis Permasalahan
              </div>
            </div>
            <div className="w-72 h-9 px-2.5 py-2 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-TEXT-NEW flex justify-start items-center gap-56">
              <div className="flex-1 h-5 rounded-[5px] inline-flex flex-col justify-between items-start">
                <div className="self-stretch inline-flex justify-center items-center gap-[5px]">
                  <div className="flex-1 flex justify-between items-center">
                    <div className="text-center justify-center text-TEXT-NEW text-sm font-normal font-['Public_Sans']">
                      {formData.jenisPermasalahan}
                    </div>
                    <span className="material-icons text-TEXT-NEW" style={{ fontSize: '16px' }}>
                      keyboard_arrow_down
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="w-72 h-9 px-2.5 py-3 rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] outline-TEXT-NEW inline-flex justify-start items-center gap-2.5">
            <input
              type="text"
              placeholder="Notes / Request (optional)"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="text-center justify-center text-text text-sm font-normal font-['Public_Sans'] bg-transparent border-none outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-[454px] left-[789px] top-[753px] absolute inline-flex justify-end items-center gap-2.5">
        <button
          onClick={handleCancel}
          className="w-24 h-8 px-7 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-primary-V1 flex justify-center items-center gap-2.5 hover:bg-gray-50 transition-colors"
        >
          <div className="justify-start text-primary-V1 text-base font-semibold font-['Public_Sans'] leading-[74px]">
            Batal
          </div>
        </button>
        <button
          onClick={handleSubmit}
          className="w-24 h-8 px-7 py-2.5 bg-primary-V1 rounded-[5px] flex justify-center items-center gap-2.5 hover:bg-blue-600 transition-colors"
        >
          <div className="justify-start text-stone-50 text-base font-semibold font-['Public_Sans'] leading-[74px]">
            Tambah
          </div>
        </button>
      </div>

      {/* Quota Info */}
      <div className="size-5 left-[1092px] top-[685px] absolute bg-zinc-300" />
      <div className="left-[1093.67px] top-[686.67px] absolute">
        <span className="material-icons text-sign-in---Back---cancle---Close" style={{ fontSize: '18px' }}>
          info
        </span>
      </div>
      <div className="left-[1118px] top-[689px] absolute justify-center text-sign-in---Back---cancle---Close text-[8px] font-normal font-['Public_Sans'] leading-3">
        Kuota tersisa untuk konseling : 18
      </div>
    </div>
  );
};

export default BookingPage;