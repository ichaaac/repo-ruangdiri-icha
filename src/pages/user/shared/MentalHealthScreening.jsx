// src/pages/user/shared/MentalHealthScreening.jsx - Halaman Mental Health Screening

import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const MentalHealthScreening = () => {
  const { userType } = useOutletContext();
  const [selectedScreening, setSelectedScreening] = useState(null);

  const getUserTypeLabel = () => {
    return userType === "student" ? "siswa" : "pegawai";
  };

  const screeningTypes = [
    {
      id: 'depression',
      title: 'Skrining Depresi',
      subtitle: 'PHQ-9 (Patient Health Questionnaire)',
      description: 'Alat skrining untuk mengidentifikasi gejala depresi dan tingkat keparahannya',
      duration: '5-10 menit',
      questions: 9,
      icon: 'sentiment_very_dissatisfied',
      color: 'blue'
    },
    {
      id: 'anxiety',
      title: 'Skrining Kecemasan',
      subtitle: 'GAD-7 (Generalized Anxiety Disorder)',
      description: 'Menilai tingkat kecemasan dan gangguan kecemasan umum',
      duration: '3-5 menit',
      questions: 7,
      icon: 'psychology_alt',
      color: 'purple'
    },
    {
      id: 'stress',
      title: 'Skrining Stres',
      subtitle: 'Perceived Stress Scale',
      description: 'Mengukur persepsi stres dalam kehidupan sehari-hari',
      duration: '5-8 menit',
      questions: 10,
      icon: 'mood_bad',
      color: 'orange'
    },
    {
      id: 'burnout',
      title: 'Skrining Burnout',
      subtitle: 'Maslach Burnout Inventory',
      description: userType === 'student' 
        ? 'Menilai tingkat kelelahan emosional dalam konteks akademik'
        : 'Menilai tingkat kelelahan emosional dalam konteks pekerjaan',
      duration: '10-15 menit',
      questions: 22,
      icon: 'local_fire_department',
      color: 'red'
    },
    {
      id: 'wellbeing',
      title: 'Indeks Kesejahteraan',
      subtitle: 'WHO Well-Being Index',
      description: 'Mengukur tingkat kesejahteraan psikologis secara umum',
      duration: '3-5 menit',
      questions: 5,
      icon: 'favorite',
      color: 'green'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      green: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[color] || colors.blue;
  };

  const handleStartScreening = (screeningId) => {
    // TODO: Implement screening logic
    alert(`Fitur skrining ${screeningTypes.find(s => s.id === screeningId)?.title} akan segera tersedia!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#488BBE] rounded-full flex items-center justify-center">
              <span className="material-icons text-white text-2xl">psychology</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#488BBE] mb-2">
                Mental Health Screening
              </h1>
              <p className="text-gray-600">
                Asesmen kesehatan mental untuk {getUserTypeLabel()} - Pantau kondisi mental Anda secara berkala
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg shadow-sm p-8 mb-6 text-white">
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-4xl">construction</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Segera Hadir!
            </h2>
            <p className="text-lg mb-4 max-w-2xl mx-auto">
              Fitur Mental Health Screening sedang dalam tahap pengembangan final. 
              Sistem skrining komprehensif akan membantu Anda memantau kesehatan mental secara berkala.
            </p>
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
              <span className="material-icons text-sm">schedule</span>
              <span className="font-medium">Expected Launch: March 2025</span>
            </div>
          </div>
        </div>

        {/* Screening Types Preview */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Jenis Skrining yang Akan Tersedia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {screeningTypes.map((screening) => (
              <div
                key={screening.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(screening.color)}`}>
                    <span className="material-icons text-xl">{screening.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{screening.title}</h3>
                    <p className="text-sm text-gray-500">{screening.subtitle}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">
                  {screening.description}
                </p>
                
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <span className="material-icons text-sm">quiz</span>
                    {screening.questions} pertanyaan
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-icons text-sm">schedule</span>
                    {screening.duration}
                  </span>
                </div>
                
                <button
                  onClick={() => handleStartScreening(screening.id)}
                  disabled
                  className="w-full bg-gray-200 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Manfaat Mental Health Screening
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-blue-600">track_changes</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Deteksi Dini</h3>
                <p className="text-gray-600 text-sm">
                  Mengidentifikasi potensi masalah kesehatan mental sebelum berkembang lebih serius
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-green-600">insights</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Self-Awareness</h3>
                <p className="text-gray-600 text-sm">
                  Meningkatkan pemahaman tentang kondisi mental dan emosional Anda
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-purple-600">trending_up</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Progress Tracking</h3>
                <p className="text-gray-600 text-sm">
                  Memantau perkembangan kesehatan mental dari waktu ke waktu
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-orange-600">support</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Dukungan Tepat</h3>
                <p className="text-gray-600 text-sm">
                  Mendapatkan rekomendasi bantuan profesional yang sesuai
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-red-600">security</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Kerahasiaan</h3>
                <p className="text-gray-600 text-sm">
                  Semua hasil skrining dijaga kerahasiaannya sesuai standar medis
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-indigo-600">science</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Berbasis Riset</h3>
                <p className="text-gray-600 text-sm">
                  Menggunakan instrumen yang telah terbukti valid dan reliabel
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Sementara Itu...
            </h3>
            <p className="text-gray-600 mb-6">
              Jika Anda merasa membutuhkan bantuan segera, jangan ragu untuk booking sesi konseling
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.href = `/user/${userType}/booking`}
                className="flex items-center justify-center gap-2 bg-[#488BBE] hover:bg-[#3399E9] text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                <span className="material-icons text-sm">event_available</span>
                Booking Konseling
              </button>
              <button 
                onClick={() => window.location.href = `/user/${userType}/chat`}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                <span className="material-icons text-sm">chat</span>
                Chat dengan Konselor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentalHealthScreening;