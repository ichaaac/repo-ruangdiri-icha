import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import Breadcrumb from '../../../components/shared/Breadcrumb';
import ProfilePictureUpload from '../../../components/shared/profile/ProfilePictureUpload';
import { toast } from 'sonner';

const OrganizationProfile = ({
  organizationType = 'company',
  organizationLabel = 'Perusahaan',
  dashboardPath = '/organization/company/dashboard',
}) => {
  const { user, changePassword, refetchUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false, new: false, confirm: false,
  });

  useEffect(() => {
    if (!user) return;
    setProfileData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
    });
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: (data) => apiClient.patch('/organizations/profile', data),
    onSuccess: () => {
      toast.success('Profil berhasil diperbarui!');
      setIsEditing(false);
      refetchUser();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui profil');
    },
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate({
      fullName: profileData.fullName,
      phone: profileData.phone,
      address: profileData.address,
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

  const tabs = [
    { id: 'profile', label: 'Profil', icon: 'person' },
    { id: 'security', label: 'Keamanan', icon: 'security' },
  ];

  const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#488BBE] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={[
          { label: "Home", to: dashboardPath },
          { label: `Profil ${organizationLabel}` },
        ]} />

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <ProfilePictureUpload
              currentProfilePicture={user?.profilePictureUrl || user?.profilePicture}
              organizationType={organizationType}
              mode="direct-upload"
              isEditing={true}
            />
            <div>
              <h1 className="text-2xl font-bold text-[#488BBE] mb-1">Profil {organizationLabel}</h1>
              <p className="text-gray-600">{user?.fullName || 'Nama belum diatur'}</p>
              <p className="text-sm text-gray-500">{user?.email || 'Email belum diatur'}</p>
            </div>
          </div>
        </div>

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

        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'profile' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Informasi {organizationLabel}</h2>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama {organizationLabel}</label>
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                    <textarea value={profileData.address} onChange={(e) => handleInputChange('address', e.target.value)} disabled={!isEditing} rows={3} className={`${inputClass} resize-none`} />
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

export default OrganizationProfile;
