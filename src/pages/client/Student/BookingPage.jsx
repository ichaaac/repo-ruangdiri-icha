// src/pages/shared/BookingPage.jsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';

// Mock data for dropdowns - replace with actual data fetching
const psychologists = [
  { id: 1, name: 'Dr. Jane Doe' },
  { id: 2, name: 'Dr. John Smith' },
];

const subscriptionTypes = [
  { id: 'organization', name: 'Organisasi' },
  { id: 'individual', name: 'Individual' },
];

const issueTypes = [
  { id: 'clinical', name: 'Konseling Klinis' },
  { id: 'development', name: 'Pengembangan Diri' },
  { id: 'career', name: 'Karir' },
];

const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2).toString().padStart(2, '0');
    const minutes = (i % 2 === 0 ? '00' : '30');
    return `${hours}:${minutes}`;
});


const BookingPage = () => {
  const { sidebarExpanded } = useOutletContext() || { sidebarExpanded: false };

  // State for form fields
  const [formData, setFormData] = useState({
    date: '2025-07-23',
    startTime: '01:00',
    endTime: '01:05',
    timezone: 'WIB',
    useMultipleDates: false,
    issueType: 'clinical',
    notes: '',
    psychologistId: '',
    subscriptionType: 'organization',
  });

  // State for dropdown visibility
  const [dropdowns, setDropdowns] = useState({
    psychologist: false,
    subscriptionType: false,
    issueType: false,
    startTime: false,
    endTime: false,
    timezone: false,
  });

  // Generic input handler
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Toggle dropdown visibility
  const toggleDropdown = (dropdown) => {
    setDropdowns(prev => ({ ...prev, [dropdown]: !prev[dropdown] }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    if (!formData.psychologistId || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Harap isi semua kolom yang wajib diisi.');
      return;
    }
    console.log('Form Submitted:', formData);
    toast.success('Sesi konseling berhasil ditambahkan!');
    // Here you would typically call an API to save the data
  };
  
  const handleCancel = () => {
    // Reset form or navigate away
    console.log('Booking cancelled');
    toast.info('Penambahan sesi dibatalkan.');
  };

  return (
    <div className="bg-white min-h-screen w-full p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 pb-6 border-b border-primary-V1">
        <h1 className="text-primary-V1 text-3xl md:text-4xl font-extrabold">
          Booking Sesi Konseling
        </h1>
        <p className="text-TEXT-NEW text-base mt-2 leading-snug max-w-4xl">
          Silakan lengkapi formulir di bawah ini untuk menjadwalkan sesi konseling Anda. Pastikan semua informasi yang Anda masukkan sudah benar sebelum melanjutkan.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Counseling Type Section */}
            <div className="flex items-start gap-5">
               <img src="https://placehold.co/160x160/e2e8f0/e2e8f0" alt="Counseling Type" className="rounded-full w-24 h-24 md:w-40 md:h-40 object-cover" />
              <div className="flex-1">
                <h2 className="text-TEXT-NEW text-sm font-semibold">Konseling Daring (Zoom)</h2>
                <p className="text-TEXT-NEW text-xs mt-1">
                  Tautan untuk mengakses ruang virtual akan dikirimkan kepada Anda.
                </p>
                <div className="mt-2">
                    <p className="text-TEXT-NEW text-xs font-medium">+62 21 1 500 911</p>
                    <p className="text-TEXT-NEW text-xs font-medium">booking@ruangdiri.com</p>
                </div>
                <button type="button" className="mt-3 px-2.5 py-1.5 text-xs text-text rounded-[5px] border border-text hover:bg-gray-100 transition">
                  Ganti Jenis Konseling
                </button>
              </div>
            </div>

            {/* Date and Time Fields */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-TEXT-NEW block">Tanggal & Waktu</label>
                <div className="flex flex-col gap-3">
                    <input 
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full h-9 px-3 py-2 rounded-[5px] border border-TEXT-NEW/50 focus:outline-none focus:ring-2 focus:ring-primary-V1"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Start Time */}
                        <select value={formData.startTime} onChange={(e) => handleInputChange('startTime', e.target.value)} className="w-full h-9 px-2 py-2 rounded-[5px] border border-TEXT-NEW/50 text-sm">
                            {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                        {/* End Time */}
                         <select value={formData.endTime} onChange={(e) => handleInputChange('endTime', e.target.value)} className="w-full h-9 px-2 py-2 rounded-[5px] border border-TEXT-NEW/50 text-sm">
                            {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                        {/* Timezone */}
                        <select value={formData.timezone} onChange={(e) => handleInputChange('timezone', e.target.value)} className="col-span-2 sm:col-span-2 w-full h-9 px-2 py-2 rounded-[5px] border border-TEXT-NEW/50 text-sm">
                            <option value="WIB">WIB</option>
                            <option value="WITA">WITA</option>
                            <option value="WIT">WIT</option>
                        </select>
                    </div>
                     <div className="flex items-center gap-2.5">
                        <input 
                            type="checkbox" 
                            id="multiple-date"
                            checked={formData.useMultipleDates}
                            onChange={(e) => handleInputChange('useMultipleDates', e.target.checked)}
                            className="w-4 h-4 rounded border-TEXT-NEW/50 accent-primary-V1"
                        />
                        <label htmlFor="multiple-date" className="text-neutral-600 text-xs">Multiple Date</label>
                    </div>
                </div>
            </div>
            
            {/* Issue Type and Notes */}
            <div className="space-y-3">
                <label htmlFor="issueType" className="text-sm font-bold text-TEXT-NEW block">Jenis Permasalahan</label>
                 <select 
                    id="issueType"
                    value={formData.issueType}
                    onChange={(e) => handleInputChange('issueType', e.target.value)}
                    className="w-full h-9 px-3 py-2 rounded-[5px] border border-TEXT-NEW/50 focus:outline-none focus:ring-2 focus:ring-primary-V1"
                 >
                    {issueTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
                
                <textarea 
                    placeholder="Notes / Request (optional)"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full h-24 px-3 py-2 rounded-[5px] border border-TEXT-NEW/50 focus:outline-none focus:ring-2 focus:ring-primary-V1 resize-none"
                />
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Psychologist Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-5">
                <label htmlFor="psychologist" className="w-full sm:w-40 text-sm font-bold text-TEXT-NEW mb-2 sm:mb-0">Psikolog <span className="text-red-500">*</span></label>
                <select 
                    id="psychologist"
                    value={formData.psychologistId}
                    onChange={(e) => handleInputChange('psychologistId', e.target.value)}
                    className="w-full h-9 px-3 py-2 rounded-[5px] border border-TEXT-NEW/50 focus:outline-none focus:ring-2 focus:ring-primary-V1"
                >
                    <option value="">Pilih Psikolog</option>
                    {psychologists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            
            {/* Subscription Type */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-5">
                <label htmlFor="subscriptionType" className="w-full sm:w-40 text-sm font-bold text-TEXT-NEW mb-2 sm:mb-0">Tipe Langganan</label>
                 <select 
                    id="subscriptionType"
                    value={formData.subscriptionType}
                    onChange={(e) => handleInputChange('subscriptionType', e.target.value)}
                    className="w-full h-9 px-3 py-2 rounded-[5px] border border-TEXT-NEW/50 focus:outline-none focus:ring-2 focus:ring-primary-V1"
                >
                    {subscriptionTypes.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
            </div>

            {/* Quota Info */}
             <div className="flex justify-end items-center gap-2 mt-4">
                 <span className="material-icons text-red-500 text-lg">info</span>
                 <p className="text-red-500 text-xs font-normal">
                     Kuota tersisa untuk konseling : <strong>18</strong>
                 </p>
             </div>
          </div>
          
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-2.5 mt-12">
            <button 
                type="button" 
                onClick={handleCancel}
                className="w-24 h-8 px-7 py-2 rounded-[5px] border border-primary-V1 text-primary-V1 font-semibold hover:bg-primary-V1/10 transition-colors"
            >
                Batal
            </button>
            <button 
                type="submit"
                className="w-24 h-8 px-7 py-2 rounded-[5px] bg-primary-V1 text-white font-semibold hover:bg-opacity-90 transition-opacity"
            >
                Tambah
            </button>
        </div>
      </form>
    </div>
  );
};

export default BookingPage;