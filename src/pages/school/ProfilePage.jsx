import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/school/Navbar";
import Sidebar from "../../components/school/Sidebar";

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [tempProfilePhoto, setTempProfilePhoto] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    schoolName: "SMA Veteran 007",
    address: "Jl. Bintaro Raya, RT.4/RW.10, Bintaro,\nKec. Pesanggrahan, Kota Jakarta\nSelatan, Daerah Khusus Ibukota\nJakarta 12330",
    email: "smaveteran007@gmail.com",
    phone: "821-1234-5678"
  });

  const [originalData, setOriginalData] = useState({...formData});

  // Initialize tempProfilePhoto with profilePhoto
  useEffect(() => {
    setTempProfilePhoto(profilePhoto);
  }, [profilePhoto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation - only allow numbers and dashes
    if (name === 'phone') {
      const validValue = value.replace(/[^0-9-]/g, '');
      setFormData({
        ...formData,
        [name]: validValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    setHasChanges(true);
  };

  const handleSave = () => {
    // Here you would handle the API call to update the profile
    console.log("Saving profile:", formData);
    setOriginalData({...formData});
    setProfilePhoto(tempProfilePhoto); // Commit the temporary photo
    setIsEditing(false);
    setHasChanges(false);
    setShowSuccessModal(true);
  };

  const handleCancel = () => {
    if (hasChanges || tempProfilePhoto !== profilePhoto) {
      setShowCancelModal(true);
    } else {
      resetForm();
    }
  };

  const confirmCancel = () => {
    resetForm();
    setShowCancelModal(false);
  };

  const resetForm = () => {
    // Reset form data and exit editing mode
    setFormData({...originalData});
    setTempProfilePhoto(profilePhoto); // Reset to original photo
    setIsEditing(false);
    setHasChanges(false);
  };
  
  return (
    <div className="min-h-screen bg-[#F8F7FA]">
      <Navbar />
      
      <div className="flex">
        <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
        
        <div 
          className="w-full transition-all duration-300 ease-in-out"
          style={{ 
            marginLeft: sidebarExpanded ? '200px' : '69px', 
            paddingLeft: '36px' 
          }}
        >
          <section 
            className="flex flex-wrap self-end w-full max-w-[1440px] max-md:max-w-full"
            style={{
              background: `url('/layanan-kami-bg.svg')`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >

            <div className="flex flex-wrap flex-auto gap-8 px-20 py-9 max-md:px-5 max-md:max-w-full">
              
              <ProfileFormCard 
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                formData={formData}
                handleChange={handleChange}
                handleSave={handleSave}
                handleCancel={handleCancel}
                profilePhoto={isEditing ? tempProfilePhoto : profilePhoto}
                setProfilePhoto={setTempProfilePhoto}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <SuccessModal onClose={() => setShowSuccessModal(false)} />
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelModal 
            onCancel={() => setShowCancelModal(false)} 
            onConfirm={confirmCancel} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileFormCard({ isEditing, setIsEditing, formData, handleChange, handleSave, handleCancel, profilePhoto, setProfilePhoto }) {
  const fileInputRef = useRef();

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  return (
    <article className="flex flex-col grow shrink-0 py-11 pr-20 pl-7 bg-white rounded-xl basis-0 shadow-[0px_261px_73px_rgba(0,0,0,0)] w-[1145px] h-[618px] max-md:px-5 max-md:max-w-full mx-auto my-6">
      <div className="flex flex-wrap gap-10 max-w-full w-[490px]">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/73c81d79ac744ebdbace89fe9a639d99/84d390ab30367a8ca7cc56ced40fc86cb014f779?placeholderIfAbsent=true"
          alt="Decoration"
          className="object-contain shrink-0 self-end mt-32 aspect-[1.36] w-[19px] max-md:mt-10"
        />
        
        <div className="flex flex-col grow shrink-0 basis-0 w-fit">
          <h1 className="self-start text-3xl font-bold leading-none text-blue-500">
            Profil
          </h1>

          <div className="flex gap-5 justify-between mt-7">
            <div className={`w-[148.39px] h-[148.39px] rounded-full border-4 ${profilePhoto ? 'border-accent' : 'border-[#d9d9d9]'} flex items-center justify-center relative`}>
              {profilePhoto ? (
                <img 
                  src={profilePhoto || "/placeholder.svg"} 
                  alt="Profile" 
                  className="w-[120px] h-[120px] rounded-full object-cover"
                />
              ) : (
                <div className="w-[120px] h-[120px] bg-[#d9d9d9] flex items-center justify-center rounded-full">
                  <span className="material-symbols-outlined text-[60px] text-[#8B8B8B]">
                    photo
                  </span>
                </div>
              )}
              
              {/* Hidden file input */}
              <input 
                ref={fileInputRef}
                id="photo-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoChange}
              />
            </div>
            <div className="flex flex-col my-auto">
              <button 
                className={`gap-2.5 self-start px-5 py-2 text-base leading-none bg-zinc-100 rounded-[50px] text-neutral-500 ${isEditing ? 'hover:bg-zinc-200 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-colors min-h-[35px]`}
                onClick={handleUploadClick}
                disabled={!isEditing}
              >
                Unggah foto baru
              </button>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                At least 800x800 px recommended.
                <br />
                JPG or PNG is allowed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="self-center px-5 py-6 mt-9 max-w-full bg-blue-50 rounded-xl w-[921px]">
        <div className="flex gap-5 max-md:flex-col">
          <div className="w-6/12 max-md:ml-0 max-md:w-full">
            <div className="flex flex-col items-start w-full text-xs leading-5 text-zinc-500 max-md:mt-10">
              <h2 className="text-3xl font-bold leading-none text-blue-500">
                Informasi Sekolah
              </h2>

              <label className="mt-5 text-zinc-400">
                Nama Sekolah
              </label>
              {isEditing ? (
                <input 
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base leading-none bg-white rounded-md min-h-8 w-full border border-zinc-300 focus:outline-none focus:border-primary"
                />
              ) : (
                <div className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base leading-none bg-blue-50 rounded-md min-h-8 w-full">
                  {formData.schoolName}
                </div>
              )}

              <label className="mt-8 text-zinc-400">
                Alamat
              </label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={4}
                  className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base bg-white rounded-md min-h-24 w-full border border-zinc-300 focus:outline-none focus:border-primary resize-none"
                />
              ) : (
                <div className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base bg-blue-50 rounded-md min-h-24 w-full whitespace-pre-line">
                  {formData.address.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i !== formData.address.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ml-5 w-6/12 max-md:ml-0 max-md:w-full">
            <div className="flex flex-col mt-10 w-full text-xs leading-5 max-md:mt-10">
              <label className="self-start text-zinc-400">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 text-zinc-500 w-full border border-zinc-300 focus:outline-none focus:border-primary"
                />
              ) : (
                <div className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base leading-none whitespace-nowrap bg-blue-50 rounded-md min-h-8 text-zinc-500 w-full">
                  {formData.email}
                </div>
              )}

              <label className="self-start mt-8 text-zinc-400">
                No. Telepon
              </label>
              {isEditing ? (
                <div className="flex gap-1.5 mt-1.5 text-base leading-none whitespace-nowrap text-zinc-500">
                  <div className="flex flex-col justify-center p-px bg-white rounded-md">
                    <div className="px-3 py-1.5 rounded bg-neutral-200">
                      +62
                    </div>
                  </div>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="grow shrink-0 px-3 py-1.5 bg-white rounded-md border border-zinc-300 focus:outline-none focus:border-primary basis-0 w-fit max-md:pr-5"
                  />
                </div>
              ) : (
                <div className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base leading-none whitespace-nowrap bg-blue-50 rounded-md min-h-8 text-zinc-500 w-full">
                  +62 | {formData.phone}
                </div>
              )}

              {!isEditing ? (
                <div className="flex justify-end mt-9">
                  <button 
                    className="gap-3 self-stretch px-5 py-1.5 text-white bg-blue-500 hover:bg-blue-600 transition-colors min-h-7 rounded-[50px]"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex gap-2.5 items-center self-end mt-9 whitespace-nowrap">
                  <button 
                    type="button"
                    onClick={handleCancel}
                    className="gap-3 self-stretch px-1.5 py-1 my-auto text-blue-500 min-h-7 rounded-[50px] w-[82px] border border-blue-500"
                  >
                    Batal
                  </button>
                  <button 
                    type="button"
                    onClick={handleSave}
                    className="gap-3 self-stretch px-1.5 py-1 my-auto text-white bg-blue-500 hover:bg-blue-600 transition-colors min-h-7 rounded-[50px] w-[82px]"
                  >
                    Simpan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// Success Modal Component
function SuccessModal({ onClose }) {
  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="bg-white rounded-xl w-[454px] py-10 flex flex-col items-center justify-center relative shadow-lg"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span className="material-icons">close</span>
        </button>
        
        <span className="material-icons text-[80px] text-primary-variant1">
          check_circle
        </span>
        
        <p className="text-xl mt-4 text-primary-variant1 font-bold">
          Profil kamu berhasil diubah!
        </p>
      </motion.div>
    </motion.div>
  );
}

// Cancel Confirmation Modal Component
function CancelModal({ onCancel, onConfirm }) {
  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="bg-white rounded-xl w-[454px] py-8 flex flex-col items-center justify-center relative shadow-lg"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <span className="material-icons text-[80px] text-[#EE4266]">
          error
        </span>
        
        <p className="text-xl mt-4 text-[#EE4266] font-bold">
          Apakah kamu yakin?
        </p>
        
        <p className="text-sm mt-3 text-[#8B8B8B] max-w-[300px] text-center">
          Perubahan yang belum disimpan akan hilang.
        </p>
        
        <div className="w-[80%] h-[1px] bg-gray-200 my-5"></div>
        
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="px-6 py-2 border border-[#EE4266] text-[#EE4266] rounded-[50px] hover:bg-red-50 transition-colors"
          >
            Batal
          </button>
          
          <button 
            onClick={onConfirm}
            className="px-6 py-2 bg-[#EE4266] text-white rounded-[50px] hover:bg-red-700 transition-colors"
          >
            Ya
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ProfilePage;