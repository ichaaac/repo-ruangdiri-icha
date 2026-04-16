import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import api from '../../../lib/api';
import Breadcrumb from '../../../components/shared/Breadcrumb';
import { toast } from 'sonner';

const getProfile = (user, userType) => {
  if (userType === 'student') return user?.studentProfile;
  if (userType === 'employee') return user?.employeeProfile;
  return null;
};

const formatDateForInput = (val) => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const UserProfile = () => {
  const { userType } = useOutletContext();
  const { user, changePassword, refetchUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    guardianName: '',
    guardianContact: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false, new: false, confirm: false,
  });

  // Sync form state when user data loads/changes
  useEffect(() => {
    if (!user) return;
    const profile = getProfile(user, userType);
    setProfileData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: profile?.contact || user.phone || '',
      birthDate: formatDateForInput(profile?.birthDate),
      address: profile?.address || user.address || '',
      guardianName: profile?.guardianName || '',
      guardianContact: profile?.guardianContact || '',
    });
  }, [user, userType]);

  const updateProfile = useMutation({
    mutationFn: (data) => api.user.updateProfile(data),
    onSuccess: () => {
      toast.success('Profil berhasil diperbarui!');
      setIsEditing(false);
      refetchUser();
    },
    onError: (err) => {
      toast.error(err?.message || 'Gagal memperbarui profil');
    },
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate({
      fullName: profileData.fullName,
      phone: profileData.phone,
      address: profileData.address,
      birthDate: profileData.birthDate || undefined,
      guardianName: profileData.guardianName || undefined,
      guardianContact: profileData.guardianContact || undefined,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Password baru dan konfirmasi password tidak cocok!');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password baru harus minimal 8 karakter!');
      return;
    }
    try {
      await changePassword.mutateAsync({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password berhasil diubah!');
    } catch (error) {
      toast.error(error.message || 'Gagal mengubah password!');
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getUserTypeLabel = () => userType === 'student' ? 'Siswa' : 'Pegawai';

  const tabs = [
    { id: 'profile', label: 'Profil', icon: 'person' },
    { id: 'security', label: 'Keamanan', icon: 'security' },
  ];

  const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500";

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
            <div className="w-16 h-16 bg-[#488BBE] rounded-full flex items-center justify-center overflow-hidden">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {user?.fullName?.charAt(0)?.toUpperCase() || getUserTypeLabel()[0]}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#488BBE] mb-1">Profil {getUserTypeLabel()}</h1>
              <p className="text-gray-600">{user?.fullName || 'Nama belum diatur'}</p>
              <p className="text-sm text-gray-500">{user?.email || 'Email belum diatur'}</p>
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
          {activeTab === 'profile' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Informasi Profil</h2>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                    <input type="text" value={profileData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} disabled={!isEditing} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" value={profileData.email} disabled className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
                    <input type="tel" value={profileData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} disabled={!isEditing} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir</label>
                    <input type="date" value={profileData.birthDate} onChange={(e) => handleInputChange('birthDate', e.target.value)} disabled={!isEditing} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                    <textarea value={profileData.address} onChange={(e) => handleInputChange('address', e.target.value)} disabled={!isEditing} rows={3} className={`${inputClass} resize-none`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kontak Darurat (Nama)</label>
                    <input type="text" value={profileData.guardianName} onChange={(e) => handleInputChange('guardianName', e.target.value)} disabled={!isEditing} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon Darurat</label>
                    <input type="tel" value={profileData.guardianContact} onChange={(e) => handleInputChange('guardianContact', e.target.value)} disabled={!isEditing} className={inputClass} />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end mt-6">
                    <button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="bg-[#488BBE] hover:bg-[#3399E9] text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updateProfile.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Keamanan Akun</h2>
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-6">
                  {[
                    { key: 'old', field: 'oldPassword', label: 'Password Lama' },
                    { key: 'new', field: 'newPassword', label: 'Password Baru', hint: 'Password harus minimal 8 karakter' },
                    { key: 'confirm', field: 'confirmPassword', label: 'Konfirmasi Password Baru' },
                  ].map(({ key, field, label, hint }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                      <div className="relative">
                        <input
                          type={showPasswords[key] ? "text" : "password"}
                          value={passwordData[field]}
                          onChange={(e) => handlePasswordChange(field, e.target.value)}
                          className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent"
                          required
                        />
                        <button type="button" onClick={() => togglePasswordVisibility(key)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <span className="material-icons text-gray-400 text-sm">
                            {showPasswords[key] ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={changePassword.isPending}
                      className="bg-[#488BBE] hover:bg-[#3399E9] text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {changePassword.isPending ? 'Mengubah...' : 'Ubah Password'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
