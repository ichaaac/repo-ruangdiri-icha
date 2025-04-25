import React from "react";

/**
 * Company Profile Page Component
 * Displays company profile information
 */
const ProfilePage = () => {
  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">Profil Perusahaan</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-primary-variant1 mb-4">Informasi Umum</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Nama Perusahaan</label>
            <p className="text-lg">PT Mencari Cinta Sejati</p>
          </div>
          
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Industri</label>
            <p className="text-lg">Technology</p>
          </div>
          
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Tahun Berdiri</label>
            <p className="text-lg">2015</p>
          </div>
          
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Jumlah Karyawan</label>
            <p className="text-lg">400</p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-500 mb-1">Alamat</label>
            <p className="text-lg">Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta 12190</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-primary-variant1 mb-4">Kontak</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Email</label>
            <p className="text-lg">info@mencari-cinta-sejati.com</p>
          </div>
          
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Telepon</label>
            <p className="text-lg">+62 | 821-2345-6789</p>
          </div>
          
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Website</label>
            <p className="text-lg">www.mencari-cinta-sejati.com</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary-variant1 mb-4">Deskripsi Perusahaan</h2>
        
        <p className="text-base text-zinc-700 mb-4">
          PT Mencari Cinta Sejati adalah perusahaan teknologi yang berfokus pada pengembangan 
          aplikasi dan layanan digital untuk membantu orang menemukan kebahagiaan dan cinta 
          dalam hidup mereka. Kami berkomitmen untuk menciptakan lingkungan kerja yang sehat 
          secara mental dan fisik bagi seluruh karyawan kami.
        </p>
        
        <p className="text-base text-zinc-700">
          Perusahaan kami telah berkembang pesat sejak didirikan pada tahun 2015, dengan berbagai 
          produk inovatif yang telah membantu jutaan pengguna di seluruh Indonesia. Kami percaya 
          bahwa kesehatan mental yang baik adalah kunci keberhasilan, baik secara pribadi maupun 
          profesional.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;