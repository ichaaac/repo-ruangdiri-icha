// src/pages/organization/company/CompanyProfilePage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import CompanyInfoEditModal from '../../../components/organization/company/profile/CompanyInfoEditModal';
import CompanyAccountEditModal from '../../../components/organization/company/profile/CompanyAccountEditModal';
import ProfilePictureUpload from '../../../components/organization/company/profile/ProfilePictureUpload';

// Enhanced Modal component with proper styling based on design images
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-30"></div>
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

// Success Modal component
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
          <h2 className="text-lg font-bold mt-6 text-center">
            {message}
          </h2>
        </motion.div>
      </div>
    </div>
  );
};

const CompanyProfilePage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch user profile data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/me`);
      return response.data.data;
    },
  });

  const handleModalClose = (success) => {
    setActiveModal(null);
    if (success) {
      if (activeModal === 'companyInfo') {
        setSuccessMessage('Informasi Perusahaan Berhasil Diubah!');
      } else {
        setSuccessMessage('Password Berhasil Diubah!');
      }
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    }
  };

  return (
    <div className="box-border w-full min-h-screen bg-white">
      {/* Profile header */}
      <div className="relative">
        <h1 className="absolute text-lg font-semibold text-primary" style={{ top: '92px', left: '12px', width: '52px' }}>
          Profil
        </h1>
        <div 
          className="absolute h-[0.5px] bg-[#8B8B8B]" 
          style={{ top: '99px', left: '76px', right: '20px' }}
        ></div>
      </div>
      
      {/* ID/EN and Notification with absolute positioning */}
      <div className="absolute flex items-center gap-[23px]" style={{ top: '29px', right: '20px', width: '101px' }}>
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
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64 mt-[180px]">
          <span className="material-icons animate-spin text-primary text-3xl">refresh</span>
        </div>
      ) : (
        <div className="pt-[180px] px-[12px]">
          {/* Profile section */}
          <section className="mb-[20px]">
            <div className="flex gap-5 items-center p-5 bg-white rounded-xl border-solid border-[0.3px] border-[#8B8B8B] max-md:flex-col max-md:items-start max-sm:p-2.5">
              <ProfilePictureUpload 
                currentProfilePicture={userData?.organization?.profilePicture || null} 
              />
              <div className="flex flex-col gap-1.5">
                <h2 className="text-base font-bold text-neutral-600">
                  {userData?.fullName || 'PT Teknologi Digital Indonesia'}
                </h2>
                <p className="text-xs text-neutral-600">Admin</p>
                <p className="text-xs text-neutral-600">
                  Jakarta, Indonesia
                </p>
              </div>
            </div>
          </section>

          {/* Company Information section */}
          <section className="mb-[20px]">
            <div className="p-5 bg-white rounded-xl border-solid border-[0.3px] border-[#8B8B8B] max-md:flex-col max-md:items-start max-sm:p-2.5">
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-xl font-semibold text-primary">
                  Informasi Perusahaan
                </h3>
                <button 
                  onClick={() => setActiveModal('companyInfo')}
                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-md cursor-pointer hover:bg-primary-variant1 transition duration-200"
                >
                  Edit
                </button>
              </div>
              
              {/* Gradient divider */}
              <div className="relative h-[1px] w-full mb-4">
                <div className="absolute inset-0" style={{ 
                  background: 'linear-gradient(90deg, #FFFFFF 0%, #488BBE 50%, #FFFFFF 100%)' 
                }}></div>
              </div>
              
              <div className="flex">
                <div className="w-[270px]">
                  <span className="block text-xs text-zinc-500">Nama Perusahaan</span>
                  <span className="block text-base text-neutral-600 mt-1 pl-0">
                    PT Teknologi Digital Indonesia
                  </span>
                </div>
                <div className="w-[369px]">
                  <span className="block text-xs text-zinc-500">Alamat</span>
                  <span className="block text-base text-neutral-600 mt-1 pl-0">
                    Jl. Sudirman No. 123, Setiabudi, Jakarta Selatan, DKI Jakarta 12190
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-zinc-500">Nomor Telepon</span>
                  <span className="block text-base text-neutral-600 mt-1 pl-0">
                    +62 | 21-5557-8899
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Account Settings section */}
          <section>
            <div className="p-5 bg-white rounded-xl border-solid border-[0.3px] border-[#8B8B8B] max-md:flex-col max-md:items-start max-sm:p-2.5">
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-xl font-semibold text-primary">
                  Pengaturan Akun
                </h3>
                <button 
                  onClick={() => setActiveModal('accountSettings')}
                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-md cursor-pointer hover:bg-primary-variant1 transition duration-200"
                >
                  Edit
                </button>
              </div>
              
              {/* Gradient divider */}
              <div className="relative h-[1px] w-full mb-4">
                <div className="absolute inset-0" style={{ 
                  background: 'linear-gradient(90deg, #FFFFFF 0%, #488BBE 50%, #FFFFFF 100%)' 
                }}></div>
              </div>
              
              <div className="flex">
                <div className="w-[320px]">
                  <span className="block text-xs text-zinc-500">Email</span>
                  <span className="block text-base text-neutral-600 mt-1 pl-0">
                    recruitment@teknologidigital.com
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-zinc-500">Password</span>
                  <span className="block text-base text-neutral-600 mt-1 pl-0">********</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Company Info Edit Modal */}
      <AnimatePresence>
        {activeModal === 'companyInfo' && (
          <Modal isOpen={true} onClose={handleModalClose}>
            <CompanyInfoEditModal onClose={handleModalClose} userData={userData} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Account Settings Edit Modal */}
      <AnimatePresence>
        {activeModal === 'accountSettings' && (
          <Modal isOpen={true} onClose={handleModalClose}>
            <CompanyAccountEditModal onClose={handleModalClose} userData={userData} />
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
    </div>
  );
};

export default CompanyProfilePage;