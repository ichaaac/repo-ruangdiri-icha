// src/pages/user/shared/UserDashboard.jsx - Dashboard untuk Student/Employee

import React from 'react';
import { useOutletContext } from 'react-router-dom';

const UserDashboard = () => {
  const { userType } = useOutletContext();

  const getDashboardTitle = () => {
    return userType === "student" ? "Dashboard Siswa" : "Dashboard Pegawai";
  };

  const getDashboardDescription = () => {
    return userType === "student" 
      ? "Pantau progress kesehatan mental dan aktivitas konseling Anda"
      : "Pantau progress kesehatan mental dan aktivitas konseling tim Anda";
  };

  const getComingSoonFeatures = () => {
    const baseFeatures = [
      "Riwayat sesi konseling",
      "Progress mental health screening", 
      "Jadwal konseling mendatang",
      "Statistik kesehatan mental",
      "Rekomendasi aktivitas",
      "Mood tracker",
      "Goal setting & tracking"
    ];

    if (userType === "employee") {
      return [
        ...baseFeatures,
        "Work-life balance metrics",
        "Stress level monitoring",
        "Team wellness overview"
      ];
    }

    return [
      ...baseFeatures,
      "Academic stress monitoring",
      "Peer support network",
      "Parent communication portal"
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#488BBE] rounded-full flex items-center justify-center">
              <span className="material-icons text-white text-2xl">dashboard</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#488BBE] mb-2">
                {getDashboardTitle()}
              </h1>
              <p className="text-gray-600">
                {getDashboardDescription()}
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-sm p-8 mb-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-[#488BBE] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-white text-4xl">construction</span>
            </div>
            <h2 className="text-3xl font-bold text-[#488BBE] mb-4">
              Segera Hadir!
            </h2>
            <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
              Dashboard komprehensif untuk memantau perjalanan kesehatan mental Anda sedang dalam tahap pengembangan. 
              Sementara itu, Anda dapat menggunakan fitur booking sesi konseling.
            </p>
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
              <span className="material-icons text-sm">schedule</span>
              <span className="font-medium">Launching Q2 2025</span>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Features List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="material-icons text-[#488BBE]">featured_play_list</span>
              Fitur yang Akan Datang
            </h3>
            <div className="space-y-3">
              {getComingSoonFeatures().map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="material-icons text-blue-600 text-sm">check_circle</span>
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="material-icons text-[#488BBE]">rocket_launch</span>
              Mulai Sekarang
            </h3>
            <div className="space-y-4">
              {/* Booking Card */}
              <div className="p-4 border-2 border-[#488BBE] rounded-lg bg-blue-50">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-icons text-[#488BBE]">event_available</span>
                  <h4 className="font-semibold text-[#488BBE]">Booking Sesi Konseling</h4>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Jadwalkan sesi konseling dengan konselor profesional kami
                </p>
                <button 
                  onClick={() => window.location.href = `/user/${userType}/booking`}
                  className="w-full bg-[#488BBE] hover:bg-[#3399E9] text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Booking Sekarang
                </button>
              </div>

              {/* Chat Card */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-icons text-[#488BBE]">chat</span>
                  <h4 className="font-semibold text-gray-800">Chat dengan Konselor</h4>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Konsultasi langsung melalui chat
                </p>
                <button 
                  onClick={() => window.location.href = `/user/${userType}/chat`}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Mulai Chat
                </button>
              </div>

              {/* Screening Card - Disabled */}
              <div className="p-4 border border-gray-200 rounded-lg opacity-50">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-icons text-gray-400">psychology</span>
                  <h4 className="font-semibold text-gray-400">Mental Health Screening</h4>
                </div>
                <p className="text-gray-500 text-sm mb-3">
                  Asesmen kesehatan mental (Segera hadir)
                </p>
                <button 
                  disabled
                  className="w-full bg-gray-200 text-gray-500 font-medium py-2 px-4 rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Butuh Bantuan?
            </h3>
            <p className="text-gray-600 mb-4">
              Tim support kami siap membantu Anda 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="flex items-center justify-center gap-2 bg-[#488BBE] hover:bg-[#3399E9] text-white font-medium py-2 px-6 rounded-lg transition-colors">
                <span className="material-icons text-sm">support_agent</span>
                Hubungi Support
              </button>
              <button className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors">
                <span className="material-icons text-sm">help</span>
                FAQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;