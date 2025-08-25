import React, { useState } from 'react';
import { LineChart, Line, YAxis, XAxis, ResponsiveContainer, ReferenceLine, Text } from 'recharts';
import { useAuth } from '../../../hooks/useAuth';

const UserDashboard = () => {
  const { user } = useAuth?.() || { user: {} };

  // Mock data untuk grafik
  const chartData = [
    { month: 'Jan', value: 1.0, status: 'at_risk' },
    { month: 'Feb', value: 2.0, status: 'monitored' },
    { month: 'Mar', value: 2.0, status: 'monitored' },
    { month: 'Apr', value: 2.0, status: 'monitored' },
    { month: 'May', value: 3.0, status: 'stable' },
    { month: 'Jun', value: 3.0, status: 'stable' }
  ];

  // Mock data untuk sesi konseling
  const upcomingSession = {
    date: '17',
    day: 'Minggu',
    fullDate: 'Minggu, 17 Agustus 2025 | 10.00 - 12.00 WIB',
    title: 'Sesi Konseling Baru (Daring)',
    platform: 'Zoom'
  };

  // Mock data untuk riwayat konseling
  const counselingHistory = [
    {
      id: 1,
      title: 'Sesi Konseling',
      counselor: 'Siti Dwita Anjani M.Psi, Psikolog',
      platform: 'Zoom',
      date: 'Senin, 14 Juli 2025',
      time: '12.00 - 13.00 WIB',
      status: 'cancelled',
      statusText: 'Dibatalkan'
    },
    {
      id: 2,
      title: 'Sesi Konseling Pertama',
      counselor: 'Nasrul M.Psi.Msc., Psikolog',
      platform: 'Zoom',
      date: 'Jumat, 11 Juli 2025',
      time: '12.00 - 13.00 WIB',
      status: 'cancelled',
      statusText: 'Dibatalkan'
    },
    {
      id: 3,
      title: 'Sesi Konseling',
      counselor: 'Bramantyo M.Psi, Psikolog',
      platform: 'Jiwaku Sehat',
      date: 'Senin, 14 Juli 2025',
      time: '12.00 - 13.00 WIB',
      status: 'completed',
      statusText: 'Selesai'
    },
    {
      id: 4,
      title: 'Sesi Konseling',
      counselor: 'Nasrul M.Psi.Psikolog',
      platform: 'Jiwaku Sehat',
      date: 'Senin, 14 Juli 2025',
      time: '12.00 - 13.00 WIB',
      status: 'rescheduled',
      statusText: 'Diubah'
    }
  ];

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const statusColors = {
      at_risk: "#EE4266",
      monitored: "#FFD400",
      stable: "#9BCA61",
      not_screened: "#B0B0B0",
    };
    const dotColor = statusColors[payload.status] || "#B0B0B0";
    return <circle cx={cx} cy={cy} r={5} fill={dotColor} />;
  };

  const CustomYAxisTick = (props) => {
    const { x, y, payload } = props;
    const { value } = payload;
    let label = '';
    let color = '#64748b';
    let fontWeight = 'bold';

    switch (value) {
      case 0: label = '0'; color = '#64748b'; fontWeight = 'normal'; break;
      case 1: label = 'Berisiko'; color = '#EE4266'; break;
      case 2: label = 'Pengawasan'; color = '#FFA600'; break;
      case 3: label = 'Stabil'; color = '#9BCA61'; break;
      default: return null;
    }

    return (
      <Text x={x} y={y} textAnchor="end" fill={color} fontSize={11} fontWeight={fontWeight} dominantBaseline="middle">
        {label}
      </Text>
    );
  };

  const CustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0} y={0} dy={16}
          textAnchor="middle"
          fill="#828898"
          fontSize={11}
          fontWeight="normal"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'cancelled': return 'bg-[#ee4266]';
      case 'completed': return 'bg-[#9bca61]';
      case 'rescheduled': return 'bg-[#a2a2a2]';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header with "Halo fullName" */}
      <div className="pt-[72px] px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
            Halo, {user?.fullName || "User"}
          </h1>
          <div className="text-right">
            <p className="text-lg sm:text-base text-[#488BBA] font-Large">
              Upcoming Features: AI Chat & Analytics
            </p>
            <p className="text-xs sm:text-sm text-[#488BBA]">
              Find My Psychologist (Powered by AI)
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Container with radial background - 1163x651px */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div 
          className="w-full max-w-[1163px] h-[651px] rounded-tl-[10px] rounded-tr-[10px] pt-[27px] pr-[19px] pb-[27px] pl-[19px] mx-auto overflow-hidden"
          style={{
            background: "radial-gradient(closest-side, rgba(215, 237, 255, 1.00) 0%, rgba(244, 244, 244, 1.00) 100%)",
          }}
        >
          <div className="flex flex-col gap-5 w-full h-full max-w-[1124px] mx-auto">
            {/* Top Section - Progress & Session */}
            <div className="flex flex-col xl:flex-row gap-5">
              {/* Grafik Progress */}
              <div className="flex flex-col gap-2.5 w-full xl:w-[670px]">
                <div className="flex items-center gap-[15px]">
                  <div className="bg-[#488BBE] rounded-[5px] p-1 flex items-center justify-center w-[33px] h-[33px]">
                    <span className="material-icons text-white text-xl">bar_chart</span>
                  </div>
                  <h2 className="text-[#488BBE] font-semibold text-xl">
                    Grafik Progress
                  </h2>
                </div>
                <div className="bg-[#fcfcfc] rounded-[10px] border border-gray-300 border-opacity-25 h-[276px] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 20, left: 80, bottom: 20 }}
                    >
                      <ReferenceLine y={3} stroke="#E5E7EB" strokeDasharray="2 2" />
                      <ReferenceLine y={2} stroke="#E5E7EB" strokeDasharray="2 2" />
                      <ReferenceLine y={1} stroke="#E5E7EB" strokeDasharray="2 2" />
                      <ReferenceLine y={0} stroke="#E5E7EB" strokeDasharray="2 2" />

                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={<CustomXAxisTick />}
                        interval={0}
                      />
                      <YAxis
                        type="number"
                        domain={[-0.5, 3.5]}
                        ticks={[0, 1, 2, 3]}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                        tick={<CustomYAxisTick />}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={<CustomDot />}
                        activeDot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sesi Konseling */}
              <div className="flex flex-col gap-2.5 w-full xl:w-[434px]">
                <div className="flex items-center gap-[15px]">
                  <div className="bg-[#488BBE] rounded-[5px] p-1 flex items-center justify-center w-[33px] h-[33px]">
                    <span className="material-icons text-white text-xl">calendar_month</span>
                  </div>
                  <h2 className="text-[#488BBE] font-semibold text-xl">
                    Sesi Konseling
                  </h2>
                </div>
                <div className="bg-white rounded-[10px] border border-gray-300 border-opacity-25 p-3 h-[275px]">
                  <div className="flex flex-col items-center gap-2.5 h-full">
                    {/* Calendar illustration placeholder */}
                    <div className="w-full max-w-[410px] h-[120px] bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-2">
                      <span className="material-icons text-[#488BBE] text-6xl">calendar_month</span>
                    </div>
                    
                    <div className="flex flex-col gap-0 w-full">
                      <div className="flex gap-5 items-center">
                        <div className="bg-[rgba(200,231,255,0.50)] rounded-[10px] p-4 flex flex-col items-center justify-center w-[87px] h-[87px]">
                          <div className="flex flex-col gap-1 items-center w-[49px]">
                            <div className="text-[#488BBE] text-center font-semibold text-4xl h-[29px] flex items-center">
                              {upcomingSession.date}
                            </div>
                            <div className="text-[#488BBE] text-center font-extralight text-sm h-[11px] flex items-center">
                              Minggu
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <div className="text-[#488BBE] font-extralight text-xs">
                            {upcomingSession.fullDate}
                          </div>
                          <div className="text-gray-800 font-bold text-lg">
                            {upcomingSession.title}
                          </div>
                          <div className="flex items-center gap-[5px]">
                            <div className="w-[15px] h-[15px] bg-gray-200 rounded"></div>
                            <span className="text-gray-600 text-sm">
                              {upcomingSession.platform}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2.5 justify-end mt-4">
                        <button className="border border-[#488BBE] text-[#488BBE] rounded-[5px] px-[15px] py-[6px] text-[10px] font-semibold h-[30px] w-[90px] hover:bg-[#488BBE] hover:text-white transition-colors">
                          Dibatalkan
                        </button>
                        <button className="bg-[#488BBE] text-white rounded-[5px] px-[15px] py-[6px] text-[10px] font-semibold h-[30px] w-[90px] hover:bg-[#3399E9] transition-colors">
                          Ubah Jadwal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Riwayat Konseling */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-[15px]">
                <div className="bg-[#488BBE] rounded-[5px] p-1 flex items-center justify-center w-[33px] h-[33px]">
                  <span className="material-icons text-white text-lg">history</span>
                </div>
                <h2 className="text-[#488BBE] font-semibold text-xl">
                  Riwayat Konseling
                </h2>
              </div>
              <div className="bg-white rounded-[10px] border border-gray-300 border-opacity-25 p-[15px] min-h-[206px]">
                <div className="flex flex-col gap-2.5 w-full">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                    {counselingHistory.map((session, index) => (
                      <div key={session.id} className="relative">
                        <div 
                          className={`absolute left-0 top-0 w-[4.72px] h-full rounded-l-sm ${getStatusColor(session.status)}`}
                        ></div>
                        <div 
                          className="h-[81px] rounded-r-[5px] border-l-[4.72px] pl-4 pr-5 py-3.5 flex items-center gap-2.5"
                          style={{
                            background: session.status === 'cancelled' 
                              ? "linear-gradient(90deg, rgba(255, 255, 255, 1.00) 0%, rgba(238, 66, 102, 0.15) 100%)"
                              : session.status === 'completed'
                              ? "linear-gradient(90deg, rgba(255, 255, 255, 1.00) 0%, rgba(155, 202, 97, 0.15) 100%)"
                              : "linear-gradient(90deg, rgba(255, 255, 255, 1.00) 0%, rgba(162, 162, 162, 0.15) 100%)"
                          }}
                        >
                          <div className="flex flex-col gap-[5px] w-[225px]">
                            <div className="p-[5px] h-6 flex items-center">
                              <span className="text-gray-800 font-semibold text-base">
                                {session.title}
                              </span>
                            </div>
                            <div className="p-[5px] h-6 flex items-center gap-[5px]">
                              <div className="w-[15px] h-[15px] bg-gray-200 rounded"></div>
                              <span className="text-gray-600 text-sm">
                                {session.platform} | {session.counselor}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-[5px] items-center flex-1 justify-end">
                            <div className="flex flex-col gap-[5px]">
                              <div className="p-[5px] h-6 flex items-center gap-[5px] w-40">
                                <span className="material-icons text-gray-600 text-sm">calendar_month</span>
                                <span className="text-gray-800 text-sm">
                                  {session.date}
                                </span>
                              </div>
                              <div className="p-[5px] h-6 flex items-center gap-[5px]">
                                <div className="w-[15px] h-[15px] bg-gray-300 rounded"></div>
                                <span className="text-gray-800 text-sm">
                                  {session.time}
                                </span>
                              </div>
                            </div>
                            <div className="py-2.5 h-[53px] flex items-center">
                              <div className={`${getStatusColor(session.status)} rounded-[50px] py-[5px] px-4 h-[19px] flex items-center`}>
                                <span className="text-white text-xs font-normal">
                                  {session.statusText}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;