"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Menu } from '@headlessui/react';
import clsx from 'clsx';
import SuccessModal from "../../../components/organization/company/SuccessModal";
function AtRiskEmployeesList({ onClose }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState("Dodi Prakoso");

  // Sample employee data
  const employees = [
    { id: 1, name: "Ahmad Syahreza", department: "Marketing", gender: "L", employeeId: "EMP-00001" },
    { id: 2, name: "Budi Santoso", department: "Finance", gender: "L", employeeId: "EMP-00002" },
    { id: 3, name: "Clara Wijaya", department: "HR", gender: "P", employeeId: "EMP-00003" },
    { id: 4, name: "Dodi Prakoso", department: "IT", gender: "L", employeeId: "EMP-00004" },
    { id: 5, name: "Erika Damayanti", department: "Sales", gender: "P", employeeId: "EMP-00005" },
    { id: 6, name: "Faisal Rahman", department: "Operations", gender: "L", employeeId: "EMP-00006" },
    { id: 7, name: "Gina Salsabila", department: "Marketing", gender: "P", employeeId: "EMP-00007" },
    { id: 8, name: "Hadi Kurniawan", department: "Finance", gender: "L", employeeId: "EMP-00008" },
    { id: 9, name: "Indah Permata", department: "HR", gender: "P", employeeId: "EMP-00009" },
    { id: 10, name: "Joko Widodo", department: "IT", gender: "L", employeeId: "EMP-00010" },
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEmployeeSelect = (name) => {
    setSelectedEmployee(name);
  };

  return (
    <div className="bg-[#E6E6E6] p-7 rounded-xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 bg-[#f5f5f7] p-3 font-medium">
          <div className="col-span-3 text-[#488BBE]">Nama</div>
          <div className="col-span-2 text-[#488BBE]">Departemen</div>
          <div className="col-span-2 text-[#488BBE]">Jenis Kelamin</div>
          <div className="col-span-3 text-[#488BBE]">ID Karyawan</div>
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
        {employees.map((employee) => (
          <div
            key={employee.id}
            className={`grid grid-cols-12 p-3 border-b border-zinc-200 items-center relative transition-transform hover:scale-[1.01] cursor-pointer ${
              employee.name === selectedEmployee ? "bg-[#f5f5f7]" : ""
            }`}
            onClick={() => handleEmployeeSelect(employee.name)}
          >
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={`https://i.pravatar.cc/40?u=${employee.id}`}
                  alt={employee.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-[#8B8B8B]">{employee.name}</span>
            </div>
            <div className="col-span-2 text-[#8B8B8B]">{employee.department}</div>
            <div className="col-span-2 text-[#8B8B8B]">{employee.gender}</div>
            <div className="col-span-3 text-[#8B8B8B]">{employee.employeeId}</div>
            <div className="col-span-2 text-right">
              <a href="#" className="text-[#488BBE] hover:underline">
                Lihat Detail
              </a>
            </div>

            {/* Orange highlight for selected row */}
            {employee.name === selectedEmployee && (
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

function CompanyDashboard() {
  const [showingEmployeeList, setShowingEmployeeList] = useState(false);
  const [activeCard, setActiveCard] = useState("atrisk");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("");
  
  const handleCloseEmployeeList = () => {
    setShowingEmployeeList(false);
  };
  
  const handleReport = (type) => {
    setReportType(type);
    setShowReportModal(true);
  };
  
  // Get the current date as a formatted string
  const getCurrentDate = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
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
                <AtRiskEmployeesCard 
                  onClick={() => {
                    setShowingEmployeeList(true);
                    setActiveCard("atrisk");
                  }}
                  onReport={() => handleReport("Daftar Karyawan Berisiko")}
                  isActive={activeCard === "atrisk" || !showingEmployeeList}
                />
                <UnscreenedEmployeesCard 
                  onClick={() => {
                    setShowingEmployeeList(true);
                    setActiveCard("unscreened");
                  }}
                  onReport={() => handleReport("Daftar Karyawan Belum Skrining")}
                  isActive={activeCard === "unscreened" || !showingEmployeeList}
                />
                <UncounseledEmployeesCard 
                  onClick={() => {
                    setShowingEmployeeList(true);
                    setActiveCard("uncounseled");
                  }}
                  onReport={() => handleReport("Daftar Karyawan Belum Konseling")}
                  isActive={activeCard === "uncounseled" || !showingEmployeeList}
                />
              </div>
              
              {showingEmployeeList ? (
                <AtRiskEmployeesList onClose={handleCloseEmployeeList} />
              ) : (
                <>
                  <MentalHealthStatusSection currentDate={getCurrentDate()} />
                  <EmployeeStatusSections currentDate={getCurrentDate()} />
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
            src="/logo/ruang-diri-logo.png"
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
        <a href="/company-profile" className="flex gap-7">
          <span className="material-icons text-[46px] text-primary-variant1 cursor-pointer hover:text-primary transition-colors">
            business
          </span>
        </a>
      </div>
    </header>
  );
}

function WelcomeBanner() {
  return (
    <section className="px-16 pt-10 pb-16 mt-5 w-full text-4xl font-extrabold leading-loose text-white bg-primary max-md:px-5 max-md:max-w-full">
      Halo, PT Mencari Cinta Sejati
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
              Daftar Karyawan
            </div>
          )}
        </div>
        
        <div className={`flex gap-1.5 items-center mt-5 py-3 px-2 w-full rounded-md hover:bg-gray-100 transition-colors cursor-pointer ${collapsed ? 'justify-center' : 'justify-start'}`}>
          <span className="material-icons text-zinc-500">
            school
          </span>
          {!collapsed && (
            <div className="text-base leading-none text-zinc-500">
              Pelatihan & Pengembangan
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

function AtRiskEmployeesCard({ onClick, isActive = true, onReport }) {
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
            52
          </h2>
          <p className={`mt-3.5 text-sm ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>Total Karyawan Beresiko</p>
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
          <div className={`${progressBarStyle} h-2.5 rounded-full`} style={{ width: '13%' }}></div>
        </div>
        <p className="self-start mt-3.5">52/400</p>
      </div>
    </article>
  );
}

function UnscreenedEmployeesCard({ onClick, isActive = true, onReport }) {
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
            127
          </h2>
          <p className={`self-start mt-3.5 ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>Total Karyawan</p>
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
          <div className={`${progressBarStyle} h-2.5 rounded-full`} style={{ width: '32%' }}></div>
        </div>
        <p className="self-start mt-3.5">127/400</p>
      </div>
    </article>
  );
}

function UncounseledEmployeesCard({ onClick, isActive = true, onReport }) {
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
            37
          </h2>
          <p className={`mt-3.5 text-sm leading-6 ${isActive ? 'text-zinc-500' : 'text-[#D9D9D9]'}`}>
            Total Karyawan
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
          <div className={`${progressBarStyle} h-2.5 rounded-full`} style={{ width: '9%' }}></div>
        </div>
        <p className="self-start mt-3.5">37/400</p>
      </div>
    </article>
  );
}

function MentalHealthStatusSection({ currentDate }) {
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [periodType, setPeriodType] = useState('first-half');
  
  // Data for overall mental health status
  const overallData = [
    { name: 'Beresiko', value: 52, color: '#ED8768' },
    { name: 'Pengawasan', value: 128, color: '#FCBC03' },
    { name: 'Aman', value: 220, color: '#9BCA61' },
  ];
  
  // Monthly data for bar chart
  const monthlyData = {
    'All': {
      'first-half': [
        { month: 'Jan', Beresiko: 18, Pengawasan: 45, Aman: 87 },
        { month: 'Feb', Beresiko: 15, Pengawasan: 43, Aman: 92 },
        { month: 'Mar', Beresiko: 13, Pengawasan: 42, Aman: 95 },
        { month: 'Apr', Beresiko: 14, Pengawasan: 40, Aman: 96 },
        { month: 'Mei', Beresiko: 16, Pengawasan: 38, Aman: 96 },
        { month: 'Jun', Beresiko: 17, Pengawasan: 42, Aman: 91 },
      ],
      'second-half': [
        { month: 'Jul', Beresiko: 14, Pengawasan: 44, Aman: 92 },
        { month: 'Agu', Beresiko: 12, Pengawasan: 47, Aman: 91 },
        { month: 'Sep', Beresiko: 11, Pengawasan: 49, Aman: 90 },
        { month: 'Okt', Beresiko: 13, Pengawasan: 51, Aman: 86 },
        { month: 'Nov', Beresiko: 15, Pengawasan: 48, Aman: 87 },
        { month: 'Des', Beresiko: 17, Pengawasan: 46, Aman: 87 },
      ],
    },
    'IT': {
      'first-half': [
        { month: 'Jan', Beresiko: 5, Pengawasan: 12, Aman: 23 },
        { month: 'Feb', Beresiko: 4, Pengawasan: 11, Aman: 25 },
        { month: 'Mar', Beresiko: 3, Pengawasan: 10, Aman: 27 },
        { month: 'Apr', Beresiko: 4, Pengawasan: 9, Aman: 27 },
        { month: 'Mei', Beresiko: 5, Pengawasan: 8, Aman: 27 },
        { month: 'Jun', Beresiko: 6, Pengawasan: 10, Aman: 24 },
      ],
      'second-half': [
        { month: 'Jul', Beresiko: 5, Pengawasan: 11, Aman: 24 },
        { month: 'Agu', Beresiko: 4, Pengawasan: 12, Aman: 24 },
        { month: 'Sep', Beresiko: 3, Pengawasan: 13, Aman: 24 },
        { month: 'Okt', Beresiko: 4, Pengawasan: 14, Aman: 22 },
        { month: 'Nov', Beresiko: 5, Pengawasan: 13, Aman: 22 },
        { month: 'Des', Beresiko: 6, Pengawasan: 12, Aman: 22 },
      ],
    },
    'Marketing': {
      'first-half': [
        { month: 'Jan', Beresiko: 6, Pengawasan: 15, Aman: 19 },
        { month: 'Feb', Beresiko: 5, Pengawasan: 14, Aman: 21 },
        { month: 'Mar', Beresiko: 4, Pengawasan: 13, Aman: 23 },
        { month: 'Apr', Beresiko: 5, Pengawasan: 12, Aman: 23 },
        { month: 'Mei', Beresiko: 6, Pengawasan: 11, Aman: 23 },
        { month: 'Jun', Beresiko: 7, Pengawasan: 13, Aman: 20 },
      ],
      'second-half': [
        { month: 'Jul', Beresiko: 6, Pengawasan: 14, Aman: 20 },
        { month: 'Agu', Beresiko: 5, Pengawasan: 15, Aman: 20 },
        { month: 'Sep', Beresiko: 4, Pengawasan: 16, Aman: 20 },
        { month: 'Okt', Beresiko: 5, Pengawasan: 17, Aman: 18 },
        { month: 'Nov', Beresiko: 6, Pengawasan: 16, Aman: 18 },
        { month: 'Des', Beresiko: 7, Pengawasan: 15, Aman: 18 },
      ],
    },
  };
  
  const departmentOptions = ['All', 'IT', 'Marketing', 'Finance', 'HR', 'Sales', 'Operations'];
  
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
  
  // Get data for selected department or fallback to 'All'
  const selectedData = monthlyData[selectedDepartment] || monthlyData['All'];
  
  return (
    <section className="flex flex-col px-5 pt-7 pb-4 mt-4 w-full bg-blue-50 rounded-xl max-w-[1110px] max-md:px-5 max-md:max-w-full">
      <h2 className="self-start text-lg leading-4 text-primary">
        Status <span className="font-bold">Kesehatan Mental </span>
        <span className="font-bold text-primary-variant1">
          Karyawan
        </span>
      </h2>
      <div className="mt-4 max-md:max-w-full">
        <div className="flex gap-5 max-md:flex-col">
          {/* Overall Mental Health Status Chart */}
          <div className="w-2/5 max-md:ml-0 max-md:w-full">
            <div className="flex flex-col px-3.5 py-5 mx-auto w-full text-sm bg-white rounded-2xl border border-solid border-zinc-300 text-zinc-500 max-md:mt-7 max-md:max-w-full">
              <div className="flex gap-5 justify-between w-full">
                <p>Status Kesehatan Mental Karyawan Keseluruhan</p>
                <p className="gap-px self-start leading-6 w-auto">
                  {currentDate}
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
          
          {/* Department-specific Mental Health Status Chart (Bar Chart) */}
          <div className="ml-5 w-3/5 max-md:ml-0 max-md:w-full">
            <div className="px-3 pt-4 pb-4 mx-auto w-full bg-white rounded-2xl border border-solid border-zinc-300 max-md:mt-7 max-md:max-w-full">
              <div className="flex flex-wrap gap-5 justify-between w-full text-sm leading-6 text-zinc-500 max-md:mr-2.5 max-md:max-w-full">
                <p>
                  Status Kesehatan Mental{" "}
                  <span className="font-extrabold">
                    Karyawan {selectedDepartment !== 'All' ? `Departemen ${selectedDepartment}` : ''}
                  </span>
                </p>
                <Menu as="div" className="relative">
                  <Menu.Button className="flex gap-px items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors">
                    <p className="self-stretch my-auto">Departemen</p>
                    <span className="material-icons text-sm">
                      keyboard_arrow_down
                    </span>
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {departmentOptions.map((dept) => (
                      <Menu.Item key={dept}>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-blue-100 text-primary' : ''
                            } ${
                              selectedDepartment === dept ? 'bg-primary-light text-primary-variant1 font-semibold' : ''
                            } w-full text-left px-4 py-2 text-sm`}
                            onClick={() => setSelectedDepartment(dept)}
                          >
                            {dept}
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
                    data={selectedData[periodType]}
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

function EmployeeStatusSections({ currentDate }) {
  return (
    <div className="mt-4 w-full max-w-[1110px] max-md:max-w-full">
      <div className="flex gap-5 max-md:flex-col">
        <ScreeningStatusSection currentDate={currentDate} />
        <CounselingStatusSection currentDate={currentDate} />
      </div>
    </div>
  );
}

function ScreeningStatusSection({ currentDate }) {
  // Data for screening status with updated colors
  const screeningData = [
    { name: 'Belum Skrining', value: 127, color: '#6DC4C6' },
    { name: 'Sudah Skrining', value: 273, color: '#E284B3' },
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
          Status <span className="font-bold">Skrining Karyawan</span>
        </h2>
        <div className="flex flex-col items-end px-5 md:px-10 pt-5 pb-5 mt-5 w-full text-sm bg-white rounded-2xl border border-solid border-zinc-300 text-zinc-500 max-md:max-w-full">
          <p className="gap-px self-end leading-6 w-auto">{currentDate}</p>
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

function CounselingStatusSection({ currentDate }) {
  // Data for counseling status with updated colors
  const counselingData = [
    { name: 'Belum Konseling', value: 37, color: '#C194E9' },
    { name: 'Sudah Konseling', value: 363, color: '#F1D961' },
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
          Status <span className="font-bold">Konseling Karyawan</span>
        </h2>
        <div className="flex flex-col items-end px-5 md:px-10 pt-5 pb-5 mt-5 w-full text-sm bg-white rounded-2xl border border-solid border-zinc-300 text-zinc-500 max-md:max-w-full">
          <p className="gap-px self-end leading-6 w-auto">{currentDate}</p>
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

export default CompanyDashboard;