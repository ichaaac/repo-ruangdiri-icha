// src/pages/user/employee/OnboardingSplashScreen.jsx - Splash Screen Onboarding untuk Employee

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const EmployeeOnboardingSplashScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContinue = () => {
    navigate('/user/onboarding/form');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#488BBE] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-white text-3xl">work</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#488BBE] mb-4">
              Selamat Datang, {user?.fullName || 'Pegawai'}!
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Mari mulai perjalanan kesehatan mental Anda di tempat kerja
            </p>
            <p className="text-gray-500">
              Kami akan membantu Anda mengatur profil dan preferensi untuk pengalaman yang lebih personal
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-blue-600 text-2xl">event_available</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Booking Konseling</h3>
              <p className="text-sm text-gray-600">
                Jadwalkan sesi konseling yang fleksibel dengan jadwal kerja Anda
              </p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-green-600 text-2xl">psychology</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Mental Health Screening</h3>
              <p className="text-sm text-gray-600">
                Asesmen berkala untuk memantau kondisi kesehatan mental di tempat kerja
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-purple-600 text-2xl">chat</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Konsultasi Chat</h3>
              <p className="text-sm text-gray-600">
                Konsultasi langsung dengan konselor professional workplace
              </p>
            </div>

            <div className="text-center p-6 bg-orange-50 rounded-xl">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-orange-600 text-2xl">trending_up</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Wellness Tracking</h3>
              <p className="text-sm text-gray-600">
                Pantau work-life balance dan stress level secara berkala
              </p>
            </div>

            <div className="text-center p-6 bg-red-50 rounded-xl">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-red-600 text-2xl">security</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Privasi Terjamin</h3>
              <p className="text-sm text-gray-600">
                Semua informasi dijaga kerahasiaannya, terpisah dari HR perusahaan
              </p>
            </div>

            <div className="text-center p-6 bg-indigo-50 rounded-xl">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-indigo-600 text-2xl">support_agent</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Support 24/7</h3>
              <p className="text-sm text-gray-600">
                Tim support siap membantu Anda di luar jam kerja
              </p>
            </div>
          </div>

          {/* Employee-specific Benefits */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 mb-8 text-white">
            <h3 className="text-xl font-bold mb-4 text-center">
              Khusus untuk Pegawai
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="material-icons text-sm mt-1">check_circle</span>
                <div>
                  <h4 className="font-semibold mb-1">Work-Life Balance</h4>
                  <p className="text-sm opacity-90">Bantuan menjaga keseimbangan kehidupan kerja</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-icons text-sm mt-1">check_circle</span>
                <div>
                  <h4 className="font-semibold mb-1">Stress Management</h4>
                  <p className="text-sm opacity-90">Teknik mengelola stres dan burnout di tempat kerja</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-icons text-sm mt-1">check_circle</span>
                <div>
                  <h4 className="font-semibold mb-1">Team Wellness</h4>
                  <p className="text-sm opacity-90">Program kesehatan mental untuk tim kerja</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-icons text-sm mt-1">check_circle</span>
                <div>
                  <h4 className="font-semibold mb-1">Career Development</h4>
                  <p className="text-sm opacity-90">Konseling untuk pengembangan karir profesional</p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Notice for Employees */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="material-icons text-[#488BBE] mt-1">shield</span>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Independensi dan Privasi</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Layanan ini sepenuhnya independen dari departemen HR perusahaan Anda. 
                  Semua informasi dan konsultasi dijaga kerahasiaannya sesuai dengan standar keamanan data dan etika konseling profesional.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="material-icons text-xs text-green-600">check</span>
                    Data tidak dapat diakses oleh perusahaan atau HR
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-icons text-xs text-green-600">check</span>
                    Enkripsi end-to-end untuk semua komunikasi
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-icons text-xs text-green-600">check</span>
                    Tidak ada laporan ke manajemen tanpa persetujuan eksplisit
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-icons text-xs text-green-600">check</span>
                    Fleksibilitas jadwal sesuai jam kerja Anda
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Workplace Mental Health Stats */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h4 className="font-semibold text-gray-800 mb-4 text-center">
              Mengapa Kesehatan Mental di Tempat Kerja Penting?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[#488BBE] mb-1">76%</div>
                <p className="text-sm text-gray-600">Pekerja mengalami burnout</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#488BBE] mb-1">40%</div>
                <p className="text-sm text-gray-600">Peningkatan produktivitas dengan dukungan mental health</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#488BBE] mb-1">3.6x</div>
                <p className="text-sm text-gray-600">ROI untuk setiap $1 investasi kesehatan mental</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center">
            <button
              onClick={handleContinue}
              className="bg-[#488BBE] hover:bg-[#3399E9] text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Mulai Setup Profil
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Proses setup akan memakan waktu sekitar 3-5 menit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboardingSplashScreen;