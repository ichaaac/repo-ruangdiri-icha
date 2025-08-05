// src/components/shared/booking/BookingSessionComplete.jsx

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const BookingSessionComplete = ({ userType = "student" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get booking result from location state
  const bookingResult = location.state?.bookingResult;
  
  // Get user data
  const userName = user?.fullName || user?.name || 'User';
  const userPhone = user?.phoneNumber || 'N/A';

  // Handle back to homepage/dashboard
  const handleBackToHome = () => {
    if (userType === 'student') {
      navigate('/user/student/screening', { replace: true });
    } else if (userType === 'employee') {
      navigate('/user/employee/screening', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // If no booking result, redirect back
  if (!bookingResult) {
    React.useEffect(() => {
      console.log("No booking result found, redirecting...");
      handleBackToHome();
    }, []);
    
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-blue-600">sync</span>
          <span className="text-blue-600">Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white h-[810px] relative overflow-hidden w-full max-w-[1440px] mx-auto">
      {/* Background Header */}
      <div 
        className="w-full h-72 absolute left-0 top-0"
        style={{
          background: "linear-gradient(180deg, rgba(145, 217, 225, 1.00) 0%, rgba(94, 110, 195, 1.00) 100%)"
        }}
      />
      
      {/* Background Card */}
      <div className="w-[926px] h-[660px] absolute left-[271px] top-[150px] bg-white rounded-lg shadow-lg" />
      
      {/* Logo */}
      <div className="w-[100px] absolute left-1/2 top-[26px] transform -translate-x-1/2 overflow-hidden">
        <img 
          src="/logo/ruang-diri-logo-white.svg" 
          alt="RuangDiri Logo"
          className="w-full h-auto"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = '<div class="bg-white bg-opacity-20 rounded-lg flex items-center justify-center w-full h-16"><span class="text-white font-bold text-lg">LOGO</span></div>';
          }}
        />
      </div>
      
      {/* Main Content */}
      <div className="w-[848px] absolute left-[310px] top-[199px] flex flex-col gap-10 items-center">
        
        {/* Success Icon */}
        <div className="w-[166.67px] h-[166.67px] flex items-center justify-center">
          <span className="material-icons text-green-500" style={{ fontSize: '166px' }}>
            check_circle
          </span>
        </div>
        
        {/* Content Section */}
        <div className="w-full flex flex-col gap-5 items-center">
          
          {/* Title and Description */}
          <div className="flex flex-col gap-[25px] items-center">
            <div className="w-full flex justify-center">
              <h1 className="text-[#488BBA] text-[40px] font-extrabold font-['Public_Sans'] leading-[74px]">
                Terima Kasih
              </h1>
            </div>
            <p className="text-[#535353] text-base font-normal font-['Public_Sans'] leading-[22px] text-center max-w-[800px]">
              Selamat, sesi konseling berhasil dibuat. Kamu sudah masuk daftar antrean konseling Ruang Diri.
            </p>
          </div>
          
          {/* Separator Line */}
          <div className="w-[848px] h-0 border-t-[0.25px] border-[#535353]" />
          
          {/* Order Summary */}
          <div className="w-[848px] border-dashed border-[0.25px] border-[#535353] rounded-[10px] p-[25px] flex flex-col gap-2.5 items-center">
            <div className="flex flex-col gap-5 items-start w-full">
              
              {/* Title */}
              <h2 className="text-[#488BBA] text-xl font-bold font-['Public_Sans'] leading-[22px]">
                Rincian Pemesanan
              </h2>
              
              {/* Details */}
              <div className="flex flex-col gap-[15px] w-full">
                
                {/* Booking ID */}
                <div className="flex justify-between items-center">
                  <span className="text-[#8B8B8B] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                    Nomor Pemesanan
                  </span>
                  <span className="text-[#535353] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                    {bookingResult?.id || bookingResult?.bookingId || 'RD-00001'}
                  </span>
                </div>
                
                {/* Date and Time */}
                <div className="flex justify-between items-center">
                  <span className="text-[#8B8B8B] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                    Waktu
                  </span>
                  <span className="text-[#535353] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                    {bookingResult?.dateTimeFormatted?.date} | {bookingResult?.dateTimeFormatted?.time}
                  </span>
                </div>
                
                {/* Counseling Type */}
                <div className="flex justify-between items-center">
                  <span className="text-[#8B8B8B] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                    Jenis Konseling
                  </span>
                  <span className="text-[#535353] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                    {bookingResult?.methodDisplay || 'Konseling Online'}
                  </span>
                </div>
                
                {/* User Name */}
                <div className="flex justify-between items-center">
                  <span className="text-[#8B8B8B] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                    Nama
                  </span>
                  <span className="text-[#535353] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                    {userName}
                  </span>
                </div>
                
                {/* Phone Number */}
                <div className="flex justify-between items-center">
                  <span className="text-[#8B8B8B] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                    Nomor Telepon
                  </span>
                  <span className="text-[#535353] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                    {userPhone}
                  </span>
                </div>

                {/* Psychologist (if available) */}
                {bookingResult?.psychologist && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#8B8B8B] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                      Psikolog
                    </span>
                    <span className="text-[#535353] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                      {bookingResult.psychologist.name || bookingResult.psychologist.fullName}
                    </span>
                  </div>
                )}

                {/* Location (if offline) */}
                {bookingResult?.location && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#8B8B8B] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                      Lokasi
                    </span>
                    <span className="text-[#535353] text-sm font-normal font-['Public_Sans'] leading-[22px]">
                      {bookingResult.location.name}
                    </span>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Back to Home Link */}
      <button
        onClick={handleBackToHome}
        className="absolute left-1/2 top-[749px] transform -translate-x-1/2 text-[#488BBA] text-[10px] font-normal font-['Public_Sans'] leading-[22px] hover:underline cursor-pointer"
      >
        Kembali ke Beranda
      </button>
</div>
  );
};

export default BookingSessionComplete;