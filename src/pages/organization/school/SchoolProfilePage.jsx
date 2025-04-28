// src/pages/organization/school/SchoolProfilePage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import SchoolInfoEditModal from '../../../components/organization/school/profile/SchoolInfoEditModal';
import SchoolAccountEditModal from '../../../components/organization/school/profile/SchoolAccountEditModal';
import ProfilePictureUpload from '../../../components/organization/school/profile/ProfilePictureUpload';

// Simple Modal component to replace Headless UI Dialog
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="flex items-center justify-center min-h-screen p-4">
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

const SchoolProfilePage = () => {
  const [activeModal, setActiveModal] = useState(null);
  
  // Fetch user profile data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/me`);
      return response.data.data;
    },
  });

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="box-border w-full min-h-screen bg-white p-5 max-md:p-2.5 max-sm:p-1.5">
      <header className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-semibold text-primary">Profil</h1>
        <div className="flex items-center gap-6 text-sm text-primary">
          <div className="flex items-center">
            <span className="font-bold">ID</span>
            <span className="mx-2">/</span>
            <span className="text-zinc-500">EN</span>
          </div>
          <button
            aria-label="Notifications"
            className="material-icons text-zinc-500"
          >
            notifications
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <span className="material-icons animate-spin text-primary text-3xl">refresh</span>
        </div>
      ) : (
        <>
          <section className="mb-5">
            <div className="flex gap-5 items-center p-5 bg-white rounded-xl border-solid border-[0.3px] border-zinc-500 max-md:flex-col max-md:items-start max-sm:p-2.5">
              <ProfilePictureUpload 
                currentProfilePicture={userData?.organization?.profilePicture || null} 
              />
              <div className="flex flex-col gap-1.5">
                <h2 className="text-base font-bold text-neutral-600">
                  {userData?.fullName || 'Nama Sekolah'}
                </h2>
                <p className="text-xs text-neutral-600">Admin</p>
                <p className="text-xs text-neutral-600">
                  {userData?.organization?.address?.split(',').slice(-2).join(', ') || 'Lokasi tidak tersedia'}
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <article className="p-5 bg-white rounded-xl border-solid border-[0.3px] border-zinc-500 max-md:flex-col max-md:items-start max-sm:p-2.5">
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-xl font-semibold text-primary">
                  Informasi Sekolah
                </h3>
                <button 
                  onClick={() => setActiveModal('schoolInfo')}
                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-md cursor-pointer hover:bg-primary-variant1 transition duration-200"
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Nama Sekolah</span>
                  <span className="text-base text-neutral-600">
                    {userData?.fullName || 'Belum diatur'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Alamat</span>
                  <span className="text-base text-neutral-600">
                    {userData?.organization?.address || 'Belum diatur'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Nomor Telepon</span>
                  <span className="text-base text-neutral-600">
                    {userData?.organization?.phone || 'Belum diatur'}
                  </span>
                </div>
              </div>
            </article>

            <article className="p-5 bg-white rounded-xl border-solid border-[0.3px] border-zinc-500 max-md:flex-col max-md:items-start max-sm:p-2.5">
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
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Email</span>
                  <span className="text-base text-neutral-600">
                    {userData?.email || 'Belum diatur'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Password</span>
                  <span className="text-base text-neutral-600">********</span>
                </div>
              </div>
            </article>
          </section>
        </>
      )}

      {/* School Info Edit Modal */}
      <AnimatePresence>
        {activeModal === 'schoolInfo' && (
          <Modal isOpen={true} onClose={closeModal}>
            <SchoolInfoEditModal onClose={closeModal} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Account Settings Edit Modal */}
      <AnimatePresence>
        {activeModal === 'accountSettings' && (
          <Modal isOpen={true} onClose={closeModal}>
            <SchoolAccountEditModal onClose={closeModal} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchoolProfilePage;