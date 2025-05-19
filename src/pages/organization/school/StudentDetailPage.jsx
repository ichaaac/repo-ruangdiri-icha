// src/pages/organization/school/StudentDetailPage.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";
import clsx from "clsx";
import { useStudentDetail } from "../../../hooks/useStudentData";
import StudentProfileEditModal from "@/components/organization/school/student-detail/StudentProfileEditModal";

// Helper to format dates with proper locale
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy", { locale: indonesianLocale });
  } catch (e) {
    return dateString || "-";
  }
};

// Helper to get birthdate in locale format
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

// Helper to determine IQ category display
const getIqCategoryDisplay = (category) => {
  const categories = {
    'very_below_average': 'Sangat Di Bawah Rata-rata',
    'below_average': 'Di Bawah Rata-rata',
    'average': 'Rata-rata',
    'above_average': 'Di Atas Rata-rata',
    'very_above_average': 'Sangat Di Atas Rata-rata',
    'genius': 'Jenius'
  };
  
  return categories[category] || 'Belum Dikategorikan';
};

// Helper to format phone numbers
const formatPhoneNumber = (phone) => {
  if (!phone) return "-";
  
  // Ensure it has country code
  if (!phone.startsWith('+')) {
    return phone.startsWith('0') ? `+62 ${phone.substring(1)}` : `+62 ${phone}`;
  }
  
  return phone;
};

// Get screening status information
const getScreeningStatusInfo = (status) => {
  const statuses = {
    'at_risk': {
      label: 'Berisiko',
      color: 'text-red-500',
      bgColor: 'bg-red-100',
      icon: 'warning'
    },
    'monitored': {
      label: 'Pengawasan',
      color: 'text-amber-500',
      bgColor: 'bg-amber-100',
      icon: 'error'
    },
    'stable': {
      label: 'Stabil',
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      icon: 'check_circle'
    }
  };
  
  return statuses[status] || statuses.stable;
};

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

// Success Modal Component
const SuccessModal = ({ isOpen, message, onClose }) => {
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

// Mental Health Timeline Chart Component
const MentalHealthTimeline = ({ studentData }) => {
  // In a real app, you would fetch timeline data from the API
  // For now, let's create a sample based on the available data
  
  // Generate some mock data points for the past 6 months
  const generateTimelineData = () => {
    const now = new Date();
    const data = [];
    
    // Start with current status
    const currentStatus = studentData?.studentProfile?.screeningStatus || 'stable';
    
    // Status values (3 = stable, 2 = monitored, 1 = at_risk)
    const statusValues = {
      'stable': 3,
      'monitored': 2,
      'at_risk': 1
    };
    
    // Create data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now);
      month.setMonth(month.getMonth() - i);
      
      let status;
      // For current month, use actual status
      if (i === 0) {
        status = statusValues[currentStatus];
      } else {
        // Generate realistic progression based on current status
        // More likely to be near current status than far from it
        const volatility = 0.7; // How much variation between months
        const baseLine = statusValues[currentStatus];
        const prevValue = data.length > 0 ? data[data.length - 1].value : baseLine;
        const randomFactor = Math.random() * volatility * 2 - volatility;
        
        // Constrain values between 1-3
        status = Math.max(1, Math.min(3, Math.round(prevValue + randomFactor)));
      }
      
      data.push({
        month: format(month, 'MMM', { locale: indonesianLocale }),
        value: status
      });
    }
    
    return data;
  };
  
  const timelineData = generateTimelineData();
  
  // Chart height calculations
  const chartHeight = 220;
  const bottomPadding = 40;
  const topPadding = 20;
  const usableHeight = chartHeight - bottomPadding - topPadding;
  
  // Calculate y position for each data point
  const getYPosition = (value) => {
    // Value is 1, 2, or 3, representing at_risk, monitored, stable
    // Map to y coordinate where higher value = lower y position (higher in graph)
    const normalizedValue = (value - 1) / 2; // Map 1-3 to 0-1
    return topPadding + (1 - normalizedValue) * usableHeight;
  };
  
  // Generate SVG path for the line chart
  const generatePathD = () => {
    if (!timelineData.length) return "";
    
    const width = 600;
    const pointSpacing = width / (timelineData.length - 1);
    
    return timelineData.map((point, index) => {
      const x = index * pointSpacing;
      const y = getYPosition(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };
  
  const getDataPointColor = (value) => {
    const colors = {
      1: '#EE4266', // at_risk - red
      2: '#FFC107', // monitored - amber
      3: '#87C054'  // stable - green
    };
    
    return colors[value] || colors[3];
  };
  
  return (
    <div className="flex overflow-hidden flex-wrap gap-2 pt-6 pr-6 pb-4 pl-4 mt-4 rounded-xl border-solid border-[0.5px] border-[#535353] bg-[#FAFAFA]">
      <div className="flex flex-col self-end mt-3 text-right pr-4 z-10">
        <p className="font-bold text-green-500 whitespace-nowrap">Stabil</p>
        <p className="font-bold text-amber-500 mt-14 whitespace-nowrap">Pengawasan</p>
        <p className="font-bold text-rose-500 mt-14 whitespace-nowrap">Berisiko</p>
      </div>
      
      <div className="flex-grow relative">
        {/* Y-axis grid lines */}
        <div className="absolute left-0 right-0 h-px bg-gray-200" style={{ top: getYPosition(3) }}></div>
        <div className="absolute left-0 right-0 h-px bg-gray-200" style={{ top: getYPosition(2) }}></div>
        <div className="absolute left-0 right-0 h-px bg-gray-200" style={{ top: getYPosition(1) }}></div>
        
        {/* SVG chart */}
        <svg width="100%" height={chartHeight} viewBox={`0 0 600 ${chartHeight}`} preserveAspectRatio="none">
          {/* The line */}
          <path
            d={generatePathD()}
            stroke="#488BBE"
            strokeWidth="3"
            fill="none"
          />
          
          {/* Data points */}
          {timelineData.map((point, index) => {
            const x = index * (600 / (timelineData.length - 1));
            const y = getYPosition(point.value);
            
            return (
              <g key={index}>
                {/* Outer circle */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="6" 
                  fill="white" 
                  stroke="#488BBE" 
                  strokeWidth="2"
                />
                {/* Inner circle */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="3" 
                  fill={getDataPointColor(point.value)}
                />
              </g>
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-1 px-1">
          {timelineData.map((point, index) => (
            <span key={index} className="text-xs text-gray-500">{point.month}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const StudentDetailPage = () => {
  const { studentId } = useParams();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Use the custom hook to fetch student data
  const { 
    student,
    isLoading,
    isError,
    error,
    refetch,
    updateStudent
  } = useStudentDetail(studentId);

  const handleEditSuccess = (message) => {
    setShowEditModal(false);
    setSuccessMessage(message || "Data siswa berhasil diperbarui!");
    setShowSuccessModal(true);
    
    // Auto-hide success message after 2 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-primary">sync</span>
          <span className="text-primary">Memuat data siswa...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-screen p-6">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">
            <span className="material-icons" style={{ fontSize: "6rem" }}>
              error_outline
            </span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Gagal Memuat Data
          </h1>
          <p className="text-gray-600 mb-6 max-w-md">
            {error?.message || "Gagal memuat data siswa. Silakan coba beberapa saat lagi."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-variant1 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }
  
  const profile = student?.studentProfile || {};
  const screeningStatus = getScreeningStatusInfo(profile.screeningStatus);
  
  return (
    <main className="flex flex-col min-h-screen bg-white overflow-x-hidden">
      {/* Header section with language switcher and notifications */}
      <header className="flex gap-6 items-center self-end mr-10 pt-8 text-sm">
        <div className="flex items-center">
          <span className="font-bold text-primary">ID</span>
          <span className="mx-2 text-primary">/</span>
          <span className="text-zinc-500">EN</span>
        </div>
        <button
          aria-label="Notifications"
          className="material-icons text-zinc-500"
        >
          notifications
        </button>
      </header>

      {/* Main content section */}
      <section className="mt-14 w-full px-12 pb-12 max-md:px-4 max-lg:mt-8">
        <div className="flex gap-8 max-lg:flex-col">
          {/* Left Column - Student Information */}
          <div className="w-[35%] max-lg:w-full">
            <div className="flex justify-between items-center mb-5">
              <h1 className="text-xl font-semibold text-primary">Profil Siswa</h1>
              
              <button
                onClick={() => setShowEditModal(true)}
                className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-md cursor-pointer hover:bg-primary-variant1 transition duration-200"
              >
                Edit
              </button>
            </div>
            
            {/* Profile Picture */}
            <div className="flex justify-center my-8">
              <div className="w-[202px] h-[202px] rounded-full overflow-hidden border-[1px] border-gray-200 shadow-sm flex items-center justify-center bg-gray-50">
                {profile.profilePicture ? (
                  <img 
                    src={profile.profilePicture} 
                    alt={student.fullName}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span 
                    className="material-icons text-gray-300"
                    style={{ fontSize: "64px" }}
                  >
                    person
                  </span>
                )}
              </div>
            </div>
            
            {/* Student Info Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 mt-8">
              {/* Full Name */}
              <div>
                <h2 className="text-xs text-zinc-500">Nama Lengkap</h2>
                <p className="mt-2.5 text-base text-neutral-600">
                  {student.fullName || "-"}
                </p>
              </div>
              
              {/* Birth Info */}
              <div>
                <h2 className="text-xs text-zinc-500">Tempat/Tanggal Lahir</h2>
                <p className="mt-2.5 text-base text-neutral-600">
                  {formatBirthInfo(profile.birthPlace, profile.birthDate)}
                </p>
              </div>
              
              {/* NIS */}
              <div>
                <h2 className="text-xs text-zinc-500">NIS</h2>
                <p className="mt-2.5 text-base text-neutral-600">
                  {profile.nis || "-"}
                </p>
              </div>
              
              {/* Guardian Contact */}
              <div>
                <h2 className="text-xs text-zinc-500">Kontak Wali</h2>
                <p className="mt-2.5 text-base text-neutral-600">
                  {formatPhoneNumber(profile.guardianContact)}
                </p>
              </div>
              
              {/* Class */}
              <div>
                <h2 className="text-xs text-zinc-500">Kelas</h2>
                <p className="mt-2.5 text-base text-neutral-600">
                  {profile.classroom || "-"}
                </p>
              </div>
              
              {/* IQ Score */}
              <div>
                <h2 className="text-xs text-zinc-500">Skor IQ</h2>
                <p className="mt-2.5 text-base text-neutral-600">
                  {profile.iqScore || "-"}
                </p>
              </div>
              
              {/* Gender */}
              <div>
                <h2 className="text-xs text-zinc-500">Jenis Kelamin</h2>
                <p className="mt-2.5 text-base text-neutral-600">
                  {profile.gender === 'male' ? 'Laki-laki' : 
                   profile.gender === 'female' ? 'Perempuan' : '-'}
                </p>
              </div>
              
              {/* IQ Category */}
              <div>
                <h2 className="text-xs text-zinc-500">Kategori</h2>
                <p className="mt-2.5 text-base text-neutral-600">
                  {getIqCategoryDisplay(profile.iqCategory)}
                </p>
              </div>
              
              {/* Guardian Name */}
              <div className="col-span-2">
                <h2 className="text-xs text-zinc-500">Nama Wali</h2>
                <p className="mt-2.5 text-base text-neutral-600">
                  {profile.guardianName || "-"}
                </p>
              </div>
              
              {/* Current screening status */}
              <div>
                <h2 className="text-xs text-zinc-500">Status Saat Ini</h2>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className={clsx(
                    "flex items-center justify-center w-6 h-6 rounded-full",
                    screeningStatus.bgColor
                  )}>
                    <span className={clsx("material-icons text-sm", screeningStatus.color)}>
                      {screeningStatus.icon}
                    </span>
                  </span>
                  <span className={clsx("text-base", screeningStatus.color)}>
                    {screeningStatus.label}
                  </span>
                </div>
              </div>
              
              {/* Counseling Status */}
              <div>
                <h2 className="text-xs text-zinc-500">Status Konseling</h2>
                <p className={clsx(
                  "mt-2.5 text-base",
                  profile.counselingStatus ? "text-green-500" : "text-red-500"
                )}>
                  {profile.counselingStatus ? "Sudah Konseling" : "Belum Konseling"}
                </p>
              </div>
              
              {/* Dates section - only show if any date exists */}
              {(profile.screeningDate || profile.counselingDate || profile.mentalHealthStatusUpdatedAt) && (
                <div className="col-span-2 mt-2 p-4 bg-[#f8f9fa] rounded-lg">
                  <h3 className="font-medium text-sm text-primary mb-3">Riwayat Terkini</h3>
                  <div className="grid grid-cols-1 gap-y-3">
                    {profile.screeningDate && (
                      <div>
                        <h4 className="text-xs text-zinc-500">Tanggal Skrining</h4>
                        <p className="text-sm text-neutral-600">{formatDate(profile.screeningDate)}</p>
                      </div>
                    )}
                    
                    {profile.counselingDate && (
                      <div>
                        <h4 className="text-xs text-zinc-500">Tanggal Konseling</h4>
                        <p className="text-sm text-neutral-600">{formatDate(profile.counselingDate)}</p>
                      </div>
                    )}
                    
                    {profile.mentalHealthStatusUpdatedAt && (
                      <div>
                        <h4 className="text-xs text-zinc-500">Status Kesehatan Mental Diperbarui</h4>
                        <p className="text-sm text-neutral-600">{formatDate(profile.mentalHealthStatusUpdatedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Progress Information */}
          <div className="w-[65%] max-lg:w-full">
            {/* Student Progress */}
            <div>
              <h2 className="text-xl font-semibold text-primary mb-4">
                Perkembangan Siswa
              </h2>
              <div className="relative p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f8f9fa] to-white rounded-lg opacity-50"></div>
                <div className="relative z-10">
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {profile.progress || "Belum ada catatan perkembangan untuk siswa ini. Silakan tambahkan catatan perkembangan untuk membantu pemantauan tumbuh kembang siswa."}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mental Health Timeline */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-primary mb-4">
                Perkembangan Status Kesehatan Mental ({student.fullName})
              </h2>
              
              <MentalHealthTimeline studentData={student} />
            </div>
            
            {/* Additional Information - test results, etc. */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-primary mb-4">
                Hasil Tes dan Evaluasi
              </h2>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Left card */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="font-medium text-lg text-primary mb-2">Tes Kognitif</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs text-zinc-500">Tanggal Tes</h4>
                      <p className="text-sm font-medium text-neutral-600">{formatDate(profile.cognitiveTestDate)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs text-zinc-500">Skor</h4>
                      <p className="text-lg font-bold text-primary">{profile.iqScore || "-"}</p>
                    </div>
                    <div>
                      <h4 className="text-xs text-zinc-500">Kategori</h4>
                      <p className="text-sm font-medium text-neutral-600">{getIqCategoryDisplay(profile.iqCategory)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Right card */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="font-medium text-lg text-primary mb-2">Penilaian Sosioemosional</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs text-zinc-500">Terakhir Diperbarui</h4>
                      <p className="text-sm font-medium text-neutral-600">{formatDate(profile.mentalHealthStatusUpdatedAt)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs text-zinc-500">Status</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={clsx(
                          "flex items-center justify-center w-6 h-6 rounded-full",
                          screeningStatus.bgColor
                        )}>
                          <span className={clsx("material-icons text-sm", screeningStatus.color)}>
                            {screeningStatus.icon}
                          </span>
                        </span>
                        <span className={clsx("text-base font-medium", screeningStatus.color)}>
                          {screeningStatus.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <Modal isOpen={true} onClose={() => setShowEditModal(false)}>
            <StudentProfileEditModal
              studentData={student}
              onClose={() => setShowEditModal(false)}
              onSuccess={handleEditSuccess}
              updateStudentMutation={updateStudent}
            />
          </Modal>
        )}
      </AnimatePresence>
      
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <SuccessModal
            isOpen={true}
            message={successMessage}
            onClose={() => setShowSuccessModal(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default StudentDetailPage;