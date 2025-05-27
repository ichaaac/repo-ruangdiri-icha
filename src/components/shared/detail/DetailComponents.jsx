// src/components/shared/detail/SharedDetailComponents.jsx - Reusable detail page components
import React, { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import clsx from "clsx";

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy", { locale: indonesianLocale });
  } catch (e) {
    return dateString || "-";
  }
};

const formatBirthInfo = (birthPlace, birthDate) => {
  if (!birthPlace && !birthDate) return "-";
  
  let result = birthPlace || "";
  
  if (birthDate) {
    if (result) result += ", ";
    try {
      const date = new Date(birthDate);
      result += format(date, "d MMMM yyyy", { locale: indonesianLocale });
    } catch (e) {
      result += birthDate;
    }
  }
  
  return result || "-";
};

const formatPhoneNumber = (phone) => {
  if (!phone || phone === null) return "-";
  
  if (!phone.startsWith('+')) {
    return phone.startsWith('0') ? `+62 ${phone.substring(1)}` : `+62 ${phone}`;
  }
  
  return phone;
};

const getIqCategoryDisplay = (category) => {
  const categories = {
    'very_below_average': 'Sangat Di Bawah Rata-rata',
    'below_average': 'Di Bawah Rata-rata', 
    'average': 'Rata-rata',
    'above_average': 'Di Atas Rata-rata',
    'very_above_average': 'Jauh di atas Rata-rata',
    'genius': 'Jenius'
  };
  
  return categories[category] || 'Belum Dikategorikan';
};

// Modal Components
export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export const SuccessModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50"></div>
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 bg-white rounded-xl p-6 w-[320px] flex flex-col items-center"
        >
          <span
            className="material-icons text-green-500"
            style={{ fontSize: "91px" }}
          >
            check_circle
          </span>
          <h2 className="text-lg font-bold mt-6 text-center">{message}</h2>
        </motion.div>
      </div>
    </div>
  );
};

// Language Switcher Component
export const LanguageSwitcher = () => {
  return (
    <div className="flex items-center justify-end px-4 sm:px-6 pt-6 sm:pt-8">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[#488BBE] text-xs sm:text-sm font-medium">ID / EN</span>
        </div>
        <div className="flex items-center">
          <span className="material-icons text-[#8b8b8b] text-lg sm:text-xl">notifications</span>
        </div>
      </div>
    </div>
  );
};

// Profile Component for Student/Employee
export const SharedProfile = ({ 
  data, 
  type = "student", // "student" or "employee"
  onEdit,
  title 
}) => {
  const profile = data?.studentProfile || data?.employeeProfile || data || {};
  
  // Student fields configuration
  const studentFields = [
    [
      { key: 'fullName', label: 'Nama Lengkap', value: data?.fullName },
      { key: 'nis', label: 'NIS', value: profile.nis },
      { 
        key: 'classroom', 
        label: 'Kelas', 
        value: profile.classroom && profile.grade ? `${profile.classroom}-${profile.grade}` : "-" 
      },
      { 
        key: 'gender', 
        label: 'Jenis Kelamin', 
        value: profile.gender === 'male' ? 'Laki Laki' : profile.gender === 'female' ? 'Perempuan' : '-' 
      }
    ],
    [
      { 
        key: 'birthInfo', 
        label: 'Tempat/Tanggal Lahir', 
        value: formatBirthInfo(profile.birthPlace, profile.birthDate) 
      },
      { key: 'guardianContact', label: 'Kontak Wali', value: formatPhoneNumber(profile.guardianContact) },
      { key: 'iqScore', label: 'Skor IQ', value: profile.iqScore || "-" },
      { key: 'iqCategory', label: 'Kategori', value: getIqCategoryDisplay(profile.iqCategory) }
    ]
  ];

  // Employee fields configuration
  const employeeFields = [
    [
      { key: 'fullName', label: 'Nama Lengkap', value: data?.fullName },
      { key: 'employeeId', label: 'ID Karyawan', value: profile.employeeId || profile.id },
      { key: 'department', label: 'Departemen', value: profile.department },
      { 
        key: 'gender', 
        label: 'Jenis Kelamin', 
        value: profile.gender === 'male' ? 'Laki-laki' : profile.gender === 'female' ? 'Perempuan' : '-' 
      }
    ],
    [
      { 
        key: 'birthInfo', 
        label: 'Tempat/Tanggal Lahir', 
        value: formatBirthInfo(profile.birthPlace, profile.birthDate) 
      },
      { key: 'contact', label: 'Kontak', value: formatPhoneNumber(profile.contact || profile.phone) },
      { key: 'position', label: 'Jabatan', value: profile.position },
      { 
        key: 'workYears', 
        label: 'Lama Bekerja', 
        value: profile.yearsOfService ? `${profile.yearsOfService} Tahun` : "-" 
      }
    ]
  ];

  const fields = type === "student" ? studentFields : employeeFields;
  
  return (
    <section className="w-full max-w-[344px] flex-shrink-0">
      <h1 className="text-xl font-semibold leading-none text-[#488BBE] mb-8 sm:mb-12 text-center lg:text-left">
        {title || `Profil ${type === "student" ? "Siswa" : "Karyawan"}`}
      </h1>
      
      {/* Profile Picture */}
      <div className="flex justify-start mb-8 sm:mb-12">
        <div className="w-[180px] sm:w-[202px] h-[180px] sm:h-[202px] rounded-full overflow-hidden shadow-sm bg-gray-100 border flex items-center justify-center">
          {data?.profilePicture ? (
            <img 
              src={data.profilePicture} 
              alt={`${type} profile`}
              className="object-cover w-full h-full justify-start"
            />
          ) : (
            <span 
              className="material-icons text-gray-400"
              style={{ fontSize: "64px" }}
            >
              {type === "student" ? "school" : "person"}
            </span>
          )}
        </div>
      </div>
      
      {/* Information Grid */}
      <div className="flex flex-col w-full">
        <div className="flex gap-6 sm:gap-10">
          {/* Left Column */}
          <div className="flex flex-col space-y-6 sm:space-y-8 w-[89px] flex-shrink-0">
            {fields[0].map((field) => (
              <div key={field.key}>
                <label className="text-xs leading-loose text-zinc-500 block">
                  {field.label}
                </label>
                <p className="mt-2.5 text-sm sm:text-base leading-none text-neutral-600 break-words">
                  {field.value || "-"}
                </p>
              </div>
            ))}
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col space-y-6 sm:space-y-8 flex-1 min-w-0">
            {fields[1].map((field) => (
              <div key={field.key}>
                <label className="text-xs leading-loose text-zinc-500 block">
                  {field.label}
                </label>
                <p className="mt-2.5 text-sm sm:text-base leading-none text-neutral-600 break-words">
                  {field.value || "-"}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Edit Button */}
        <button 
          onClick={onEdit}
          className="self-end px-1.5 py-1 mt-6 sm:mt-8 text-xs font-semibold leading-5 text-white bg-[#488BBE] rounded-md min-h-7 w-[82px] hover:bg-[#3399E9] transition-colors"
        >
          Edit
        </button>
      </div>
    </section>
  );
};

// Development Component
export const SharedDevelopment = ({ 
  data, 
  mentalHealthHistory, 
  type = "student" 
}) => {
  const profile = data?.studentProfile || data?.employeeProfile || data || {};
  
  // Generate chart data
  const generateChartData = () => {
    if (mentalHealthHistory && Array.isArray(mentalHealthHistory) && mentalHealthHistory.length > 0) {
      const monthlyData = {};
      
      mentalHealthHistory.forEach(record => {
        const date = new Date(record.date);
        const monthKey = format(date, 'yyyy-MM');
        
        if (!monthlyData[monthKey] || new Date(record.date) > new Date(monthlyData[monthKey].date)) {
          monthlyData[monthKey] = {
            month: format(date, 'MMM', { locale: indonesianLocale }),
            status: record.status,
            date: record.date
          };
        }
      });
      
      const sortedData = Object.values(monthlyData)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-6);
      
      return sortedData.map(data => ({
        month: data.month,
        value: getStatusValue(data.status)
      }));
    } else {
      const currentStatus = profile.screeningStatus || 'stable';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      
      return months.map((month, index) => {
        let value;
        if (index === months.length - 1) {
          value = getStatusValue(currentStatus);
        } else {
          const randomValue = Math.random() * 3 + 1;
          value = Math.round(randomValue);
        }
        
        return { month, value };
      });
    }
  };
  
  const getStatusValue = (status) => {
    const statusValues = {
      'at_risk': 1,
      'monitored': 2,
      'stable': 3,
      'not_screened': 2
    };
    return statusValues[status] || 3;
  };
  
  const chartData = generateChartData();
  
  // Custom dot component
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const getColor = (value) => {
      if (value <= 1.5) return '#EE4266';
      if (value <= 2.5) return '#FFC107';
      return '#87C054';
    };
    
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill="white" stroke="#488BBE" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={3} fill={getColor(payload.value)} />
      </g>
    );
  };

  const progressNotes = profile.progress && profile.progress !== null && profile.progress.trim() !== '' 
    ? profile.progress 
    : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent volutpat est in tempor ultrices. Maecenas feugiat magna bibendum, tincidunt nunc ac, facilisis orci. Proin imperdiet id lectus et sodales. Aliquam dignissim risus turpis, id interdum dolor luctus non. Vivamus aliquet ipsum elit, ac commodo nisi pellentesque a.";
  
  return (
    <section className="flex flex-col w-full max-w-[679px]">
      {/* Development Section */}
      <h2 className="font-semibold text-[#488BBE] mb-4">
        Perkembangan {type === "student" ? "Siswa" : "Karyawan"}
      </h2>
      
      <article className="relative flex flex-col px-4 sm:px-6 lg:px-12 py-4 sm:py-6 w-full text-xs leading-5 rounded-xl border border-gray-300 bg-[#FCFCFC] min-h-24 sm:min-h-32 lg:min-h-52 text-neutral-600">
        {/* Arrow Icons */}
        <button className="absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 text-[#3399E9] hover:text-[#488BBE] transition-colors">
          <span className="material-icons text-base lg:text-lg">chevron_left</span>
        </button>
        <button className="absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 text-[#3399E9] hover:text-[#488BBE] transition-colors">
          <span className="material-icons text-base lg:text-lg">chevron_right</span>
        </button>
        
        <p className="px-4 lg:px-8 text-xs sm:text-sm">{progressNotes}</p>
      </article>
      
      {/* Mental Health Chart */}
      <h2 className="mt-6 sm:mt-8 mb-4 font-semibold text-[#488BBE]">
        Perkembangan Status Kesehatan Mental ({data?.fullName || type === "student" ? "Siswa" : "Karyawan"})
      </h2>
      
      <div className="flex overflow-hidden gap-4 pt-4 sm:pt-7 pr-4 sm:pr-8 pb-2.5 pl-4 text-xs rounded-xl border-solid bg-zinc-50 border-[0.5px] border-[#535353]">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-right w-16 sm:w-20 h-[140px] sm:h-[180px] py-4">
          <p className="font-bold text-lime-400 leading-none text-xs">Stabil</p>
          <p className="font-bold text-amber-500 leading-none text-xs">Pengawasan</p>
          <p className="font-bold text-rose-500 leading-none text-xs">Berisiko</p>
          <p className="text-neutral-600 leading-none text-xs">0</p>
        </div>
        
        {/* Chart area */}
        <div className="flex flex-col grow text-center text-slate-500">
          <div className="w-full h-[140px] sm:h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <YAxis domain={[0, 4]} hide />
                
                <ReferenceLine y={0} stroke="#828898" strokeOpacity={0.5} strokeDasharray="4 2" />
                <ReferenceLine y={1} stroke="#828898" strokeOpacity={0.5} strokeDasharray="4 2" />
                <ReferenceLine y={2} stroke="#828898" strokeOpacity={0.5} strokeDasharray="4 2" />
                <ReferenceLine y={3} stroke="#828898" strokeOpacity={0.5} strokeDasharray="4 2" />
                <ReferenceLine y={4} stroke="#828898" strokeOpacity={0.5} strokeDasharray="4 2" />
                
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#488BBE" 
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={{ r: 6, stroke: '#488BBE', strokeWidth: 2, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between self-center mt-1.5 w-full max-w-[470px] px-4">
            {chartData.map((data, index) => (
              <span key={index} className="text-xs">{data.month}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Divider Component
export const Divider = () => (
  <div
    className="hidden lg:block shrink-0 my-auto w-0 h-[400px] sm:h-[500px] lg:h-[589px]"
    style={{
      background: "linear-gradient(180deg, #FFFFFF 0%, #488BBA 50%, #FFFFFF 100%)",
      width: "1px"
    }}
  />
);

// Main Layout Component
export const DetailPageLayout = ({ children }) => {
  return (
    <main className="overflow-hidden bg-white min-h-screen">
      <LanguageSwitcher />
      
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Space - Desktop only, adaptive to sidebar state */}
        <aside className="hidden lg:block w-[237px] flex-shrink-0 transition-all duration-300" />
        
        {/* Main Content - Responsive */}
        <div className="w-full lg:flex-1 px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex flex-col w-full max-w-7xl">
            {/* Content Layout */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-[50px] mt-6 sm:mt-8 lg:mt-20">
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};