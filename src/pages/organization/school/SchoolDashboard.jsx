import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Menu } from '@headlessui/react';
import clsx from 'clsx';
import SuccessModal from "../../../components/organization/school/SuccessModal";
function AtRiskStudentsList({ onClose }) {
  const [currentPage, setCurrentPage] = useState(2);
  const [selectedStudent, setSelectedStudent] = useState("Citra Pratiwi");

  // Sample student data
  const students = [
    { id: 1, name: "Armani", class: "12 C", gender: "L", nis: "9872435980" },
    { id: 2, name: "Aminudin", class: "12 A", gender: "L", nis: "0000735450" },
    { id: 3, name: "Aslani Burhan", class: "12 A", gender: "L", nis: "7812365408" },
    { id: 4, name: "Badrun", class: "12 B", gender: "L", nis: "0987514678" },
    { id: 5, name: "Citra Pratiwi", class: "12 C", gender: "P", nis: "1234567890" },
    { id: 6, name: "Cheline", class: "12 C", gender: "P", nis: "5432647600" },
    { id: 7, name: "Dina Miranda", class: "12 B", gender: "P", nis: "0000178612" },
    { id: 8, name: "Dodi Katamsi", class: "12 C", gender: "L", nis: "0000023453" },
    { id: 9, name: "Gunawa Sasmita", class: "12 A", gender: "L", nis: "0036547679" },
    { id: 10, name: "Julia Van Hauten", class: "12 A", gender: "P", nis: "0000425368" },
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleStudentSelect = (name) => {
    setSelectedStudent(name);
  };

  return (
    <div className="bg-[#E6E6E6] p-7 rounded-xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 bg-[#f5f5f7] p-3 font-medium">
          <div className="col-span-3 text-[#488BBE]">Nama</div>
          <div className="col-span-2 text-[#488BBE]">Kelas</div>
          <div className="col-span-2 text-[#488BBE]">Jenis Kelamin</div>
          <div className="col-span-3 text-[#488BBE]">NIS</div>
          <div className="col-span-2 text-right">
            <button 
              onClick={onClose}
              className="text-[#EE4266] hover:opacity-80 transition-opacity"
            >
              <span className="material-icons">cancel</span>
            </button>
          </div>
        </div>

        {/* Table rows */}
        {students.map((student) => (
          <div
            key={student.id}
            className={`grid grid-cols-12 p-3 border-b border-zinc-200 items-center relative transition-transform hover:scale-[1.01] cursor-pointer ${
              student.name === selectedStudent ? "bg-[#f5f5f7]" : ""
            }`}
            onClick={() => handleStudentSelect(student.name)}
          >
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={`https://i.pravatar.cc/40?u=${student.id}`}
                  alt={student.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-[#8B8B8B]">{student.name}</span>
            </div>
            <div className="col-span-2 text-[#8B8B8B]">{student.class}</div>
            <div className="col-span-2 text-[#8B8B8B]">{student.gender}</div>
            <div className="col-span-3 text-[#8B8B8B]">{student.nis}</div>
            <div className="col-span-2 text-right">
              <a href="#" className="text-[#488BBE] hover:underline">
                Lihat Detail
              </a>
            </div>

            {/* Orange highlight for selected row */}
            {student.name === selectedStudent && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ED8768]"></div>
            )}
          </div>
        ))}

        {/* Pagination */}
        <div className="flex justify-center p-4 gap-2">
          <button className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md">
            «
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md">
            ‹
          </button>
          <button 
            className={`w-8 h-8 flex items-center justify-center rounded-md ${
              currentPage === 1 ? "bg-primary-variant2 text-white" : "text-[#8B8B8B] hover:bg-gray-100"
            }`}
            onClick={() => handlePageChange(1)}
          >
            1
          </button>
          <button 
            className={`w-8 h-8 flex items-center justify-center rounded-md ${
              currentPage === 2 ? "bg-primary-variant2 text-white" : "text-[#8B8B8B] hover:bg-gray-100"
            }`}
            onClick={() => handlePageChange(2)}
          >
            2
          </button>
          <button 
            className={`w-8 h-8 flex items-center justify-center rounded-md ${
              currentPage === 3 ? "bg-primary-variant2 text-white" : "text-[#8B8B8B] hover:bg-gray-100"
            }`}
            onClick={() => handlePageChange(3)}
          >
            3
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md">
            ›
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md">
            »
          </button>
        </div>
      </div>
    </div>
  );
}

function SchoolDashboard() {
  const [showingStudentList, setShowingStudentList] = useState(false);
  const [activeCard, setActiveCard] = useState("atrisk");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("");
  
  const handleCloseStudentList = () => {
    setShowingStudentList(false);
  };
  
  const handleReport = (type) => {
    setReportType(type);
    setShowReportModal(true);
  };
  
  return (
    <main className="relative overflow-hidden pb-7 bg-white">
      <Header />
      <WelcomeBanner />
      
      <div className="flex relative">
        <Sidebar />
        
        <div className="ml-[200px] w-full">
          <div className="flex flex-col px-7 mt-2.5 w-full max-md:px-5 max-md:max-w-full">
            <div className="max-w-[1110px]">
              <div className="flex flex-wrap gap-5">
                <AtRiskStudentsCard 
                  onClick={() => {
                    setShowingStudentList(true);
                    setActiveCard("atrisk");
                  }}
                  onReport={() => handleReport("Daftar Siswa Beresiko")}
                  isActive={activeCard === "atrisk" || !showingStudentList}
                />
                <UnscreenedStudentsCard 
                  onClick={() => {
                    setShowingStudentList(true);
                    setActiveCard("unscreened");
                  }}
                  onReport={() => handleReport("Daftar Siswa Belum Skrining")}
                  isActive={activeCard === "unscreened" || !showingStudentList}
                />
                <UncounseledStudentsCard 
                  onClick={() => {
                    setShowingStudentList(true);
                    setActiveCard("uncounseled");
                  }}
                  onReport={() => handleReport("Daftar Siswa Belum Konseling")}
                  isActive={activeCard === "uncounseled" || !showingStudentList}
                />
              </div>
              
              {showingStudentList ? (
                <AtRiskStudentsList onClose={handleCloseStudentList} />
              ) : (
                <>
                  <MentalHealthStatusSection />
                  <StudentStatusSections />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      {showReportModal && (
        <SuccessModal 
          email="emaila******@gmail.com"
          reportType={reportType}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-wrap gap-5 justify-between items-start px-14 pt-3.5 w-full bg-white shadow-[0px_20px_20px_rgba(164,166,140,0.09)] max-md:px-5 max-md:max-w-full">
      <div className="flex flex-col justify-center self-start p-2.5">
        <div className="overflow-hidden w-full">
          <img
            src="/logo/ruang-diri-logo.svg"
            alt="Ruang Diri Logo"
            className="object-contain aspect-[1.12] w-[100px]"
          />
        </div>
      </div>
      <div className="flex gap-10 my-auto">
        <div className="my-auto text-sm font-bold text-center text-blue-500">
          ID /{" "}
          <span style={{ fontWeight: 400, color: "rgba(139,139,139,1)" }}>
            EN
          </span>
        </div>
        <a href="/school-profile" className="flex gap-7">
          <span className="material-icons text-[46px] text-primary-variant1 cursor-pointer hover:text-primary transition-colors">
            school
          </span>
        </a>
      </div>
    </header>
  );
}

function WelcomeBanner() {
  return (
    <section className="px-16 pt-10 pb-16 mt-5 w-full text-4xl font-extrabold leading-loose text-white bg-primary max-md:px-5 max-md:max-w-full">
      Halo, SMA 007 Veteran
    </section>
  );
}

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <nav className={`fixed top-[123px] left-0 h-[calc(100vh-123px)] bg-white shadow-lg rounded-lg z-10 transition-all duration-300 ease-in-out ${collapsed ? 'w-[70px]' : 'w-[200px]'}`}>
      <div className="flex overflow-hidden z-10 flex-col items-start w-full px-4 py-5">
        <div className={`flex gap-1.5 items-center py-3 px-2 w-full rounded-md bg-primary-light ${collapsed ? 'justify-center' : 'justify-start'}`}>
          <span className="material-icons text-primary-variant1">
            dashboard
          </span>
          {!collapsed && (
            <div className="text-base font-bold leading-none text-primary-variant1">
              Dashboard
            </div>
          )}
        </div>
        
        <div className={`flex gap-1.5 items-center mt-5 py-3 px-2 w-full rounded-md hover:bg-gray-100 transition-colors cursor-pointer ${collapsed ? 'justify-center' : 'justify-start'}`}>
          <span className="material-icons text-zinc-500">
            people
          </span>
          {!collapsed && (
            <div className="text-base leading-none text-zinc-500">
              Daftar Siswa
            </div>
          )}
        </div>
      </div>
      
      {/* Collapse/Expand button */}
      <button 
        className="absolute -right-7 top-4 bg-white rounded-r-full h-[60px] w-[30px] flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="material-icons text-primary">
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
    </nav>
  );
}

function AtRiskStudentsCard({ onClick, isActive = true, onReport }) {
  const cardStyle = isActive 
    ? "border-zinc-300" 
    : "border-[#D9D9D9]";
  
  const textStyle = isActive 
    ? "text-[#ED8768]" 
    : "text-[#D9D9D9]";
  
  const progressBarStyle = isActive 
    ? "bg-[#ED8768]" 
    : "bg-[#D9D9D9]";
  
  return (
    <article className={`flex flex-col pb-2.5 bg-white rounded-2xl border border-solid ${cardStyle} shadow-sm hover:shadow-md transition-shadow w-[350px]`}>
      <div className={`flex z-10 shrink-0 h-4 ${progressBarStyle} rounded-t-2xl`} />
      <div className="flex gap-10 self-center mt-5 w-full px-6">
        <div className="flex flex-col flex-1">
          <h2 
            className={`self-start text-5xl leading-loose ${textStyle} max-md:text-4xl cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={onClick}
          >
            76
          </h2>
          <p className={`mt-3.5 text-sm ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>Total Siswa Beresiko</p>
        </div>
        <div 
          className={`flex flex-col flex-1 self-start text-xs leading-6 items-center cursor-pointer hover:opacity-80 transition-opacity ${isActive ? 'text-primary' : 'text-[#D9D9D9]'}`}
          onClick={onReport}
        >
          <span className={`material-icons text-[42px] ${textStyle}`}>
            warning
          </span>
          <p className="mt-1.5">Kirim Laporan</p>
        </div>
      </div>
      <div className={`flex flex-col px-6 mt-3.5 text-sm leading-6 whitespace-nowrap ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={`${progressBarStyle} h-2.5 rounded-full`} style={{ width: '16%' }}></div>
        </div>
        <p className="self-start mt-3.5">76/490</p>
      </div>
    </article>
  );
}

function UnscreenedStudentsCard({ onClick, isActive = true, onReport }) {
  const cardStyle = isActive 
    ? "border-zinc-300" 
    : "border-[#D9D9D9]";
  
  const textStyle = isActive 
    ? "text-[#8CC3EE]" 
    : "text-[#D9D9D9]";
  
  const progressBarStyle = isActive 
    ? "bg-[#8CC3EE]" 
    : "bg-[#D9D9D9]";
  
  return (
    <article className={`flex flex-col pb-2.5 bg-white rounded-2xl border border-solid ${cardStyle} shadow-sm hover:shadow-md transition-shadow w-[350px]`}>
      <div className={`flex z-10 shrink-0 h-4 ${progressBarStyle} rounded-t-2xl`} />
      <div className="flex gap-10 self-center mt-5 w-full px-6">
        <div className="flex flex-col flex-1 text-sm leading-6">
          <h2 className={`text-5xl leading-loose ${textStyle} max-md:text-4xl cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={onClick}>
            260
          </h2>
          <p className={`self-start mt-3.5 ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>Total Siswa</p>
          <p className={`mt-1 ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>Belum Skrining</p>
        </div>
        <div 
          className={`flex flex-col flex-1 self-start text-xs leading-6 items-center cursor-pointer hover:opacity-80 transition-opacity ${isActive ? 'text-primary' : 'text-[#D9D9D9]'}`}
          onClick={onReport}
        >
          <span className={`material-icons text-[42px] ${textStyle}`}>
            assignment
          </span>
          <p className="mt-1.5">Kirim Laporan</p>
        </div>
      </div>
      <div className={`flex flex-col px-6 mt-3.5 text-sm leading-6 whitespace-nowrap ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={`${progressBarStyle} h-2.5 rounded-full`} style={{ width: '35%' }}></div>
        </div>
        <p className="self-start mt-3.5">260/750</p>
      </div>
    </article>
  );
}

function UncounseledStudentsCard({ onClick, isActive = true, onReport }) {
  const cardStyle = isActive 
    ? "border-zinc-300" 
    : "border-[#D9D9D9]";
  
  const textStyle = isActive 
    ? "text-[#A08CE2]" 
    : "text-[#D9D9D9]";
  
  const progressBarStyle = isActive 
    ? "bg-[#A08CE2]" 
    : "bg-[#D9D9D9]";
  
  return (
    <article className={`flex flex-col pb-2.5 bg-white rounded-2xl border border-solid ${cardStyle} shadow-sm hover:shadow-md transition-shadow w-[350px]`}>
      <div className={`flex z-10 shrink-0 h-4 ${progressBarStyle} rounded-t-2xl`} />
      <div className="flex gap-10 self-center mt-5 w-full px-6">
        <div className="flex flex-col flex-1">
          <h2 className={`self-start text-5xl leading-loose ${textStyle} max-md:text-4xl cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={onClick}>
            51
          </h2>
          <p className={`mt-3.5 text-sm leading-6 ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>
            Total Siswa
          </p>
          <p className={`mt-1 text-sm leading-6 ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>
            Belum Konseling
          </p>
        </div>
        <div 
          className={`flex flex-col flex-1 self-start text-xs leading-6 items-center cursor-pointer hover:opacity-80 transition-opacity ${isActive ? 'text-primary' : 'text-[#D9D9D9]'}`}
          onClick={onReport}
        >
          <span className={`material-icons text-[41px] ${textStyle}`}>
            groups
          </span>
          <p className="mt-1.5">Kirim Laporan</p>
        </div>
      </div>
      <div className={`flex flex-col px-6 mt-3.5 text-sm leading-6 whitespace-nowrap ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={`${progressBarStyle} h-2.5 rounded-full`} style={{ width: '10%' }}></div>
        </div>
        <p className="self-start mt-3.5">51/490</p>
      </div>
    </article>
  );
}

function MentalHealthStatusSection() {
  const [selectedClass, setSelectedClass] = useState('XII');
  const [dateDisplay, setDateDisplay] = useState('');
  const [periodType, setPeriodType] = useState('first-half');
  
  useEffect(() => {
    // Set current date display with full date
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    setDateDisplay(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
  }, []);
  
  // Data for overall mental health status
  const overallData = [
    { name: 'Beresiko', value: 76, color: '#ED8768' },
    { name: 'Pengawasan', value: 164, color: '#FCBC03' },
    { name: 'Aman', value: 250, color: '#9BCA61' },
  ];
  
  // Monthly data for bar chart
  const monthlyData = {
    'X': {
      'first-half': [
        { month: 'Jan', Beresiko: 20, Pengawasan: 70, Aman: 130 },
        { month: 'Feb', Beresiko: 18, Pengawasan: 55, Aman: 155 },
        { month: 'Mar', Beresiko: 15, Pengawasan: 50, Aman: 155 },
        { month: 'Apr', Beresiko: 17, Pengawasan: 48, Aman: 155 },
        { month: 'Mei', Beresiko: 22, Pengawasan: 45, Aman: 153 },
        { month: 'Jun', Beresiko: 18, Pengawasan: 52, Aman: 150 },
      ],
      'second-half': [
        { month: 'Jul', Beresiko: 16, Pengawasan: 60, Aman: 144 },
        { month: 'Agu', Beresiko: 14, Pengawasan: 58, Aman: 148 },
        { month: 'Sep', Beresiko: 13, Pengawasan: 55, Aman: 152 },
        { month: 'Okt', Beresiko: 15, Pengawasan: 53, Aman: 152 },
        { month: 'Nov', Beresiko: 18, Pengawasan: 52, Aman: 150 },
        { month: 'Des', Beresiko: 20, Pengawasan: 55, Aman: 145 },
      ],
    },
    'XI': {
      'first-half': [
        { month: 'Jan', Beresiko: 22, Pengawasan: 68, Aman: 130 },
        { month: 'Feb', Beresiko: 20, Pengawasan: 60, Aman: 140 },
        { month: 'Mar', Beresiko: 18, Pengawasan: 55, Aman: 147 },
        { month: 'Apr', Beresiko: 16, Pengawasan: 52, Aman: 152 },
        { month: 'Mei', Beresiko: 15, Pengawasan: 50, Aman: 155 },
        { month: 'Jun', Beresiko: 14, Pengawasan: 48, Aman: 158 },
      ],
      'second-half': [
        { month: 'Jul', Beresiko: 13, Pengawasan: 45, Aman: 162 },
        { month: 'Agu', Beresiko: 12, Pengawasan: 43, Aman: 165 },
        { month: 'Sep', Beresiko: 14, Pengawasan: 44, Aman: 162 },
        { month: 'Okt', Beresiko: 16, Pengawasan: 46, Aman: 158 },
        { month: 'Nov', Beresiko: 18, Pengawasan: 49, Aman: 153 },
        { month: 'Des', Beresiko: 21, Pengawasan: 52, Aman: 147 },
      ],
    },
    'XII': {
      'first-half': [
        { month: 'Jan', Beresiko: 29, Pengawasan: 61, Aman: 80 },
        { month: 'Feb', Beresiko: 25, Pengawasan: 58, Aman: 87 },
        { month: 'Mar', Beresiko: 22, Pengawasan: 55, Aman: 93 },
        { month: 'Apr', Beresiko: 20, Pengawasan: 53, Aman: 97 },
        { month: 'Mei', Beresiko: 18, Pengawasan: 50, Aman: 102 },
        { month: 'Jun', Beresiko: 15, Pengawasan: 48, Aman: 107 },
      ],
      'second-half': [
        { month: 'Jul', Beresiko: 14, Pengawasan: 46, Aman: 110 },
        { month: 'Agu', Beresiko: 13, Pengawasan: 45, Aman: 112 },
        { month: 'Sep', Beresiko: 15, Pengawasan: 47, Aman: 108 },
        { month: 'Okt', Beresiko: 18, Pengawasan: 50, Aman: 102 },
        { month: 'Nov', Beresiko: 21, Pengawasan: 53, Aman: 96 },
        { month: 'Des', Beresiko: 24, Pengawasan: 56, Aman: 90 },
      ],
    },
  };
  
  const classOptions = ['X', 'XI', 'XII'];
  
  const togglePeriod = () => {
    setPeriodType(periodType === 'first-half' ? 'second-half' : 'first-half');
  };
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-semibold">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <section className="flex flex-col px-5 pt-7 pb-4 mt-4 w-full bg-blue-50 rounded-xl max-w-[1110px] max-md:px-5 max-md:max-w-full">
      <h2 className="self-start text-lg leading-4 text-primary">
        Status <span className="font-bold">Kesehatan Mental </span>
        <span className="font-bold text-primary-variant1">
          Siswa
        </span>
      </h2>
      <div className="mt-4 max-md:max-w-full">
        <div className="flex gap-5 max-md:flex-col">
          {/* Overall Mental Health Status Chart */}
          <div className="w-2/5 max-md:ml-0 max-md:w-full">
            <div className="flex flex-col px-3.5 py-5 mx-auto w-full text-sm bg-white rounded-2xl border border-solid border-zinc-300 text-zinc-500 max-md:mt-7 max-md:max-w-full">
              <div className="flex gap-5 justify-between w-full">
                <p>Status Kesehatan Mental Siswa Keseluruhan</p>
                <p className="gap-px self-start leading-6 w-auto">
                  {dateDisplay}
                </p>
              </div>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overallData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {overallData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-3.5 items-center self-center mt-4 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#ED8768]"></div>
                  <p>Beresiko</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#FCBC03]"></div>
                  <p>Pengawasan</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#9BCA61]"></div>
                  <p>Aman</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Class-specific Mental Health Status Chart (Bar Chart) */}
          <div className="ml-5 w-3/5 max-md:ml-0 max-md:w-full">
            <div className="px-3 pt-4 pb-4 mx-auto w-full bg-white rounded-2xl border border-solid border-zinc-300 max-md:mt-7 max-md:max-w-full">
              <div className="flex flex-wrap gap-5 justify-between w-full text-sm leading-6 text-zinc-500 max-md:mr-2.5 max-md:max-w-full">
                <p>
                  Status Kesehatan Mental{" "}
                  <span className="font-extrabold">Siswa Kelas {selectedClass}</span>
                </p>
                <Menu as="div" className="relative">
                  <Menu.Button className="flex gap-px items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors">
                    <p className="self-stretch my-auto">Kelas</p>
                    <span className="material-icons text-sm">
                      keyboard_arrow_down
                    </span>
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {classOptions.map((classOption) => (
                      <Menu.Item key={classOption}>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-blue-100 text-primary' : ''
                            } ${
                              selectedClass === classOption ? 'bg-primary-light text-primary-variant1 font-semibold' : ''
                            } w-full text-left px-4 py-2 text-sm`}
                            onClick={() => setSelectedClass(classOption)}
                          >
                            {classOption}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Menu>
              </div>
              <div className="h-[336px] mt-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData[selectedClass][periodType]}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                    barSize={12}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Beresiko" fill="#ED8768" />
                    <Bar dataKey="Pengawasan" fill="#FCBC03" />
                    <Bar dataKey="Aman" fill="#9BCA61" />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Centered arrow buttons at 168px height */}
                <button 
                  onClick={togglePeriod}
                  className="absolute left-0 top-[168px] transform -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-[#3399E9] hover:bg-[#2185d0] transition-colors text-white"
                >
                  <span className="material-icons text-white">
                    chevron_left
                  </span>
                </button>
                
                <button 
                  onClick={togglePeriod}
                  className="absolute right-0 top-[168px] transform -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-[#3399E9] hover:bg-[#2185d0] transition-colors text-white"
                >
                  <span className="material-icons text-white">
                    chevron_right
                  </span>
                </button>
              </div>
              <div className="flex justify-center items-center mt-4">
                <div className="flex gap-3.5 items-center justify-center whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#ED8768]"></div>
                    <p>Beresiko</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#FCBC03]"></div>
                    <p>Pengawasan</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#9BCA61]"></div>
                    <p>Aman</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StudentStatusSections() {
  return (
    <div className="mt-4 w-full max-w-[1110px] max-md:max-w-full">
      <div className="flex gap-5 max-md:flex-col">
        <ScreeningStatusSection />
        <CounselingStatusSection />
      </div>
    </div>
  );
}

function ScreeningStatusSection() {
  const [dateDisplay, setDateDisplay] = useState('');
  
  useEffect(() => {
    // Set current date display with full date
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    setDateDisplay(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
  }, []);
  
  // Data for screening status with updated colors
  const screeningData = [
    { name: 'Belum Skrining', value: 260, color: '#6DC4C6' },
    { name: 'Sudah Skrining', value: 490, color: '#E284B3' },
  ];
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-semibold">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <section className="w-6/12 max-md:ml-0 max-md:w-full">
      <div className="flex flex-col grow px-3.5 py-5 w-full bg-blue-50 rounded-xl max-md:mt-2.5 max-md:max-w-full">
        <h2 className="self-start text-lg leading-4 text-primary">
          Status <span className="font-bold">Skrining Siswa</span>
        </h2>
        <div className="flex flex-col items-end px-5 md:px-10 pt-5 pb-5 mt-5 w-full text-sm bg-white rounded-2xl border border-solid border-zinc-300 text-zinc-500 max-md:max-w-full">
          <p className="gap-px self-end leading-6 w-auto">{dateDisplay}</p>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={screeningData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {screeningData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col md:flex-row gap-3.5 items-center justify-center w-full mt-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#6DC4C6]"></div>
              <p>Belum Skrining</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#E284B3]"></div>
              <p>Sudah Skrining</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CounselingStatusSection() {
  const [dateDisplay, setDateDisplay] = useState('');
  
  useEffect(() => {
    // Set current date display with full date
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    setDateDisplay(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
  }, []);
  
  // Data for counseling status with updated colors
  const counselingData = [
    { name: 'Belum Konseling', value: 51, color: '#C194E9' },
    { name: 'Sudah Konseling', value: 439, color: '#F1D961' },
  ];
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-semibold">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <section className="ml-5 w-6/12 max-md:ml-0 max-md:w-full">
      <div className="flex flex-col grow px-4 py-5 w-full bg-blue-50 rounded-xl max-md:mt-2.5 max-md:max-w-full">
        <h2 className="self-start text-lg leading-4 text-primary max-md:ml-2">
          Status <span className="font-bold">Konseling Siswa</span>
        </h2>
        <div className="flex flex-col items-end px-5 md:px-10 pt-5 pb-5 mt-5 w-full text-sm bg-white rounded-2xl border border-solid border-zinc-300 text-zinc-500 max-md:max-w-full">
          <p className="gap-px self-end leading-6 w-auto">{dateDisplay}</p>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={counselingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {counselingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col md:flex-row gap-3.5 items-center justify-center w-full mt-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#C194E9]"></div>
              <p>Belum Konseling</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#F1D961]"></div>
              <p>Sudah Konseling</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SchoolDashboard;