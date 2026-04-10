// src/pages/user/shared/UserProfile.jsx - Halaman Profil untuk Student/Employee

import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Breadcrumb from '../../../components/shared/Breadcrumb';

const UserProfile = () => {
  const { userType } = useOutletContext();
  const { user, changePassword } = useAuth();
  
  // Form states
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    address: user?.address || '',
    emergencyContact: user?.emergencyContact || '',
    emergencyPhone: user?.emergencyPhone || '',
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const getUserTypeLabel = () => {
    return userType === "student" ? "Siswa" : "Pegawai";
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement profile update API call
    console.log('Updating profile:', profileData);
    setIsEditing(false);
    // Show success message
    alert('Profil berhasil diperbarui!');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Password baru dan konfirmasi password tidak cocok!');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('Password baru harus minimal 8 karakter!');
      return;
    }

    try {
      await changePassword.mutateAsync({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      
      // Reset form
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      alert('Password berhasil diubah!');
    } catch (error) {
      alert(error.message || 'Gagal mengubah password!');
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: 'person' },
    { id: 'security', label: 'Keamanan', icon: 'security' },
    { id: 'preferences', label: 'Preferensi', icon: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={[
          { label: "Home", to: `/user/${userType}/dashboard` },
          { label: "Profil" },
        ]} />
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#488BBE] rounded-full flex items-center justify-center">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {user?.fullName?.charAt(0)?.toUpperCase() || getUserTypeLabel()[0]}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#488BBE] mb-1">
                Profil {getUserTypeLabel()}
              </h1>
              <p className="text-gray-600">
                {user?.fullName || 'Nama belum diatur'}
              </p>
              <p className="text-sm text-gray-500">
                {user?.email || 'Email belum diatur'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#488BBE] text-[#488BBE]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="material-icons text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Informasi Profil
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isEditing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-[#488BBE] text-white hover:bg-[#3399E9]'
                  }`}
                >
                  {isEditing ? 'Batal' : 'Edit Profil'}
                </button>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      No. Telepon
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat
                    </label>
                    <textarea
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kontak Darurat (Nama)
                    </label>
                    <input
                      type="text"
                      value={profileData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      No. Telepon Darurat
                    </label>
                    <input
                      type="tel"
                      value={profileData.emergencyPhone}
                      onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end mt-6">
                    <button
                      type="submit"
                      className="bg-[#488BBE] hover:bg-[#3399E9] text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Keamanan Akun
              </h2>

              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Lama
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.old ? "text" : "password"}
                        value={passwordData.oldPassword}
                        onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('old')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <span className="material-icons text-gray-400 text-sm">
                          {showPasswords.old ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <span className="material-icons text-gray-400 text-sm">
                          {showPasswords.new ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Password harus minimal 8 karakter
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <span className="material-icons text-gray-400 text-sm">
                          {showPasswords.confirm ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={changePassword.isLoading}
                      className="bg-[#488BBE] hover:bg-[#3399E9] text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changePassword.isLoading ? 'Mengubah...' : 'Ubah Password'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Preferensi
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notification Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Notifikasi</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded text-[#488BBE] mr-3" />
                      <span className="text-gray-700">Email notifications</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded text-[#488BBE] mr-3" />
                      <span className="text-gray-700">SMS notifications</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded text-[#488BBE] mr-3" />
                      <span className="text-gray-700">Push notifications</span>
                    </label>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Privasi</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded text-[#488BBE] mr-3" />
                      <span className="text-gray-700">Bagikan data untuk riset</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-[#488BBE] mr-3" />
                      <span className="text-gray-700">Profil publik</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button className="bg-[#488BBE] hover:bg-[#3399E9] text-white font-medium py-2 px-6 rounded-lg transition-colors">
                  Simpan Preferensi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;