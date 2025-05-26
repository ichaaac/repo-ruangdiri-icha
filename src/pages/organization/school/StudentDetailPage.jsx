// src/pages/organization/school/StudentDetailPage.jsx - Fixed responsive, positioning, and null handling
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import clsx from "clsx";
import { useStudentDetail } from "@/hooks/useStudentDetail";
import StudentProfileEditModal from "../../../components/organization/school/student-detail/StudentProfileEditModal";

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
    'very_above_average': 'Jauh di atas Rata-rata',
    'genius': 'Jenius'
  };
  
  return categories[category] || 'Belum Dikategorikan';
};

// Helper to format phone numbers with proper null handling
const formatPhoneNumber = (phone) => {
  if (!phone || phone === null) return "-";
  
  // Ensure it has country code
  if (!phone.startsWith('+')) {
    return phone.startsWith('0') ? `+62 ${phone.substring(1)}` : `+62 ${phone}`;
  }
  
  return phone;
};

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
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

// Language Switcher Component - Fixed positioning
const LanguageSwitcher = () => {
  const [language, setLanguage] = useState("id");

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

// Student Profile Component
const StudentProfile = ({ student, onEdit }) => {
  const profile = student?.studentProfile || {};
  
  return (
    <section className="w-full max-w-[344px] flex-shrink-0">
      <h1 className="text-xl font-semibold leading-none text-[#488BBE] mb-12 text-center lg:text-left">
        Profil Siswa
      </h1>
      
      {/* Profile Picture - Always centered */}
      <div className="flex justify-center mb-12">
        <div className="w-[202px] h-[202px] rounded-full overflow-hidden shadow-sm bg-gray-100 border flex items-center justify-center">
          {student?.profilePicture ? (
            <img 
              src={student.profilePicture} 
              alt="Student profile"
              className="object-cover w-full h-full"
            />
          ) : (
            <span 
              className="material-icons text-gray-400"
              style={{ fontSize: "64px" }}
            >
              person
            </span>
          )}
        </div>
      </div>
      
      {/* Student Information - Fixed alignment */}
      <div className="flex flex-col w-full">
        <div className="flex gap-10">
          {/* Left Column - Fixed width */}
          <div className="flex flex-col space-y-8 w-[89px]">
            <div>
              <label className="text-xs leading-loose text-zinc-500 block">
                Nama Lengkap
              </label>
              <p className="mt-2.5 text-base leading-none text-neutral-600">
                {student?.fullName || "-"}
              </p>
            </div>
            
            <div>
              <label className="text-xs leading-loose text-zinc-500 block">
                NIS
              </label>
              <p className="mt-2.5 text-base leading-none text-neutral-600">
                {profile.nis || "-"}
              </p>
            </div>
            
            <div>
              <label className="text-xs leading-loose text-zinc-500 block">
                Kelas
              </label>
              <p className="mt-2.5 text-base leading-none text-neutral-600">
                {profile.classroom && profile.grade ? `${profile.classroom}-${profile.grade}` : "-"}
              </p>
            </div>
            
            <div>
              <label className="text-xs leading-loose text-zinc-500 block">
                Jenis Kelamin
              </label>
              <p className="mt-2.5 text-base leading-none text-neutral-600">
                {profile.gender === 'male' ? 'Laki Laki' : 
                 profile.gender === 'female' ? 'Perempuan' : '-'}
              </p>
            </div>
          </div>
          
          {/* Right Column - Fixed width */}
          <div className="flex flex-col space-y-8 w-[175px]">
            <div>
              <label className="text-xs leading-loose text-zinc-500 block">
                Tempat/Tanggal Lahir
              </label>
              <p className="mt-2.5 text-base leading-none text-neutral-600">
                {formatBirthInfo(profile.birthPlace, profile.birthDate)}
              </p>
            </div>
            
            <div>
              <label className="text-xs leading-loose text-zinc-500 block">
                Kontak Wali
              </label>
              <p className="mt-2.5 text-base leading-none text-neutral-600">
                {formatPhoneNumber(profile.guardianContact)}
              </p>
            </div>
            
            <div>
              <label className="text-xs leading-loose text-zinc-500 block">
                Skor IQ
              </label>
              <p className="mt-2.5 text-base leading-none text-neutral-600">
                {profile.iqScore || "-"}
              </p>
            </div>
            
            <div>
              <label className="text-xs leading-loose text-zinc-500 block">
                Kategori
              </label>
              <p className="mt-2.5 text-base leading-none text-neutral-600">
                {getIqCategoryDisplay(profile.iqCategory)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Edit Button */}
        <button 
          onClick={onEdit}
          className="self-end px-1.5 py-1 mt-8 text-xs font-semibold leading-5 text-white bg-[#488BBE] rounded-md min-h-7 w-[82px] hover:bg-[#3399E9] transition-colors"
        >
          Edit
        </button>
      </div>
    </section>
  );
};

// Student Development Component
const StudentDevelopment = ({ student, mentalHealthHistory }) => {
  const profile = student?.studentProfile || {};
  
  // Generate chart data
  const generateChartData = () => {
    if (mentalHealthHistory && Array.isArray(mentalHealthHistory) && mentalHealthHistory.length > 0) {
      // Group by month and get the latest status for each month
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
      
      // Convert to array and sort by date, take last 6 months
      const sortedData = Object.values(monthlyData)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-6);
      
      return sortedData.map(data => ({
        month: data.month,
        value: getStatusValue(data.status)
      }));
    } else {
      // Generate mock data based on current status
      const currentStatus = profile.screeningStatus || 'stable';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      
      return months.map((month, index) => {
        let value;
        if (index === months.length - 1) {
          value = getStatusValue(currentStatus);
        } else {
          // Generate realistic progression
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
  
  // Custom dot component for the chart
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const getColor = (value) => {
      if (value <= 1.5) return '#EE4266'; // red
      if (value <= 2.5) return '#FFC107'; // amber  
      return '#87C054'; // green
    };
    
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill="white" stroke="#488BBE" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={3} fill={getColor(payload.value)} />
      </g>
    );
  };

  // Progress notes with proper null handling
  const progressNotes = profile.progress && profile.progress !== null && profile.progress.trim() !== '' 
    ? profile.progress 
    : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent volutpat est in tempor ultrices. Maecenas feugiat magna bibendum, tincidunt nunc ac, facilisis orci. Proin imperdiet id lectus et sodales. Aliquam dignissim risus turpis, id interdum dolor luctus non. Vivamus aliquet ipsum elit, ac commodo nisi pellentesque a. In aliquet lacus vulputate ipsum lobortis, eu blandit quam aliquam. Nullam quis enim et odio fringilla vehicula in vitae quam. Donec placerat, enim in aliquet tempor, est dui blandit orci, venenatis luctus erat nisi ut libero. Phasellus feugiat bibendum sem, nec pulvinar massa viverra quis. Etiam ut facilisis nibh, in egestas enim. Duis fringilla orci lectus, vel bibendum elit tincidunt a. Praesent sagittis neque risus, ac tempus ante volutpat sodales. Nam eget metus sed ipsum placerat efficitur.";
  
  return (
    <section className="flex flex-col w-full max-w-[679px]">
      {/* Student Development */}
      <h2 className="font-semibold text-[#488BBE] mb-4">
        Perkembangan Siswa
      </h2>
      
      <article className="relative flex flex-col px-6 lg:px-12 py-6 w-full text-xs leading-5 rounded-xl border border-gray-300 bg-[#FCFCFC] min-h-32 lg:min-h-52 text-neutral-600">
        {/* Arrow Icons */}
        <button className="absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 text-[#3399E9] hover:text-[#488BBE] transition-colors">
          <span className="material-icons text-base lg:text-lg">chevron_left</span>
        </button>
        <button className="absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 text-[#3399E9] hover:text-[#488BBE] transition-colors">
          <span className="material-icons text-base lg:text-lg">chevron_right</span>
        </button>
        
        <p className="px-4 lg:px-8">{progressNotes}</p>
      </article>
      
      {/* Mental Health Chart */}
      <h2 className="mt-8 mb-4 font-semibold text-[#488BBE]">
        Perkembangan Status Kesehatan Mental ({student?.fullName || 'Siswa'})
      </h2>
      
      <div className="flex overflow-hidden gap-4 pt-7 pr-8 pb-2.5 pl-4 text-xs rounded-xl border-solid bg-zinc-50 border-[0.5px] border-[#535353]">
        {/* Y-axis labels - Fixed positioning */}
        <div className="flex flex-col justify-between text-right w-20 h-[180px] py-4">
          <p className="font-bold text-lime-400 leading-none">Stabil</p>
          <p className="font-bold text-amber-500 leading-none">Pengawasan</p>
          <p className="font-bold text-rose-500 leading-none">Berisiko</p>
          <p className="text-neutral-600 leading-none">0</p>
        </div>
        
        {/* Chart area */}
        <div className="flex flex-col grow text-center text-slate-500">
          <div className="w-full h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <YAxis domain={[0, 4]} hide />
                
                {/* Horizontal grid lines with dashed style - evenly spaced */}
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
const Divider = () => (
  <div
    className="hidden lg:block shrink-0 my-auto w-0 h-[589px]"
    style={{
      background: "linear-gradient(180deg, #FFFFFF 0%, #488BBA 50%, #FFFFFF 100%)",
      width: "1px"
    }}
  />
);

const StudentDetailPage = () => {
  const { studentId } = useParams();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Use the custom hook to fetch student data
  const { 
    student,
    mentalHealthHistory,
    isLoading,
    isLoadingHistory,
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
          <span className="material-icons animate-spin text-[#488BBE]">sync</span>
          <span className="text-[#488BBE]">Memuat data siswa...</span>
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
            className="px-4 py-2 bg-[#488BBE] text-white rounded-full hover:bg-[#3399E9] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <main className="overflow-hidden bg-white min-h-screen">
      {/* Language Switcher - Fixed positioning */}
      <LanguageSwitcher />
      
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Space - Desktop only */}
        <aside className="hidden lg:block w-[17%] flex-shrink-0" />
        
        {/* Main Content */}
        <div className="w-full lg:w-[83%] flex-shrink-0 px-4 lg:px-5">
          <div className="flex flex-col w-full">
            {/* Content Layout */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-[50px] mt-8 lg:mt-20">
              {/* Left Section - Student Profile */}
              <StudentProfile 
                student={student} 
                onEdit={() => setShowEditModal(true)}
              />
              
              {/* Divider */}
              <Divider />
              
              {/* Right Section - Student Development */}
              <div className="flex flex-col">
                <StudentDevelopment 
                  student={student}
                  mentalHealthHistory={mentalHealthHistory}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
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