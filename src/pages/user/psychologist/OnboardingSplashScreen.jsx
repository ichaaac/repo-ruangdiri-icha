// src/pages/user/psychologist/OnboardingSplashScreen.jsx - Splash Screen Onboarding untuk Psikolog

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const PsychologistOnboardingSplashScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContinue = () => {
    navigate('/user/onboarding/form');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#488BBE] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-white text-3xl">psychology</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#488BBE] mb-4">
              Selamat Datang, {user?.fullName || 'Psikolog'}!
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Mari mulai perjalanan membantu kesehatan mental bersama
            </p>
            <p className="text-gray-500">
              Platform RuangDiri menyediakan tools dan environment yang aman untuk praktik konseling Anda
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-blue-600 text-2xl">chat</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Konseling Chat</h3>
              <p className="text-sm text-gray-600">
                Platform chat terintegrasi untuk komunikasi dengan klien
              </p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-green-600 text-2xl">schedule</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Manajemen Jadwal</h3>
              <p className="text-sm text-gray-600">
                Kelola booking dan jadwal konseling dengan mudah
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-purple-600 text-2xl">folder_shared</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Case Management</h3>
              <p className="text-sm text-gray-600">
                Kelola riwayat dan progress klien dengan aman
              </p>
            </div>

            <div className="text-center p-6 bg-orange-50 rounded-xl">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-orange-600 text-2xl">assessment</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Assessment Tools</h3>
              <p className="text-sm text-gray-600">
                Akses berbagai tools asesmen kesehatan mental
              </p>
            </div>

            <div className="text-center p-6 bg-red-50 rounded-xl">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-red-600 text-2xl">verified_user</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Privacy & Ethics</h3>
              <p className="text-sm text-gray-600">
                Sistem yang mematuhi kode etik dan standar privasi
              </p>
            </div>

            <div className="text-center p-6 bg-indigo-50 rounded-xl">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-indigo-600 text-2xl">school</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Continuing Education</h3>
              <p className="text-sm text-gray-600">
                Akses materi pembelajaran dan development profesional
              </p>
            </div>
          </div>

          {/* Psychologist-specific Benefits */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 mb-8 text-white">
            <h3 className="text-xl font-bold mb-4 text-center">
              Fitur Khusus Psikolog
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="material-icons text-sm mt-1">check_circle</span>
                <div>
                  <h4 className="font-semibold mb-1">Multi-Client Management</h4>
                  <p className="text-sm opacity-90">Kelola multiple klien dengan sistem yang terorganisir</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-icons text-sm mt-1">check_circle</span>
                <div>
                  <h4 className="font-semibold mb-1">Secure Communication</h4>
                  <p className="text-sm opacity-90">Chat terenkripsi sesuai standar keamanan medis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-icons text-sm mt-1">check_circle</span>
                <div>
                  <h4 className="font-semibold mb-1">Progress Tracking</h4>
                  <p className="text-sm opacity-90">Monitor perkembangan klien dari waktu ke waktu</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-icons text-sm mt-1">check_circle</span>
                <div>
                  <h4 className="font-semibold mb-1">Professional Support</h4>
                  <p className="text-sm opacity-90">Tim support khusus untuk kebutuhan profesional</p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Ethics Notice */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="material-icons text-[#488BBE] mt-1">gavel</span>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Komitmen Etika Profesional</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Platform RuangDiri dibangun dengan mempertimbangkan kode etik psikologi dan standar praktik profesional. 
                  Semua fitur dirancang untuk mendukung praktik yang etis dan aman.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="material-icons text-xs text-green-600">check</span>
                    Kerahasiaan klien terjaga dengan enkripsi end-to-end
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-icons text-xs text-green-600">check</span>
                    Sistem dokumentasi sesuai standar praktik psikologi
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-icons text-xs text-green-600">check</span>
                    Boundary setting tools untuk menjaga hubungan profesional
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-icons text-xs text-green-600">check</span>
                    Compliance dengan regulasi perlindungan data
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Professional Development */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h4 className="font-semibold text-gray-800 mb-4 text-center">
              Mendukung Pengembangan Profesional Anda
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-icons text-blue-600">trending_up</span>
                </div>
                <h5 className="font-semibold text-gray-800 mb-1">Career Growth</h5>
                <p className="text-sm text-gray-600">Platform untuk mengembangkan practice dan reach</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-icons text-blue-600">groups</span>
                </div>
                <h5 className="font-semibold text-gray-800 mb-1">Peer Network</h5>
                <p className="text-sm text-gray-600">Koneksi dengan psikolog lain untuk kolaborasi</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-icons text-blue-600">workspace_premium</span>
                </div>
                <h5 className="font-semibold text-gray-800 mb-1">Quality Practice</h5>
                <p className="text-sm text-gray-600">Tools untuk meningkatkan kualitas layanan</p>
              </div>
            </div>
          </div>

          {/* Current Access */}
          <div className="bg-yellow-50 rounded-lg p-6 mb-8 border border-yellow-200">
            <div className="flex items-start gap-3">
              <span className="material-icons text-yellow-600 mt-1">info</span>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Akses Saat Ini</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Dalam fase awal, Anda akan memiliki akses ke sistem chat untuk berkomunikasi dengan klien. 
                  Fitur-fitur tambahan akan tersedia dalam update mendatang.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-icons text-green-600 text-sm">check_circle</span>
                  <span className="text-gray-700 font-medium">Chat System - Available Now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center">
            <button
              onClick={handleContinue}
              className="bg-[#488BBE] hover:bg-[#3399E9] text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Mulai Setup Profil Profesional
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Proses setup akan memakan waktu sekitar 5-7 menit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychologistOnboardingSplashScreen;