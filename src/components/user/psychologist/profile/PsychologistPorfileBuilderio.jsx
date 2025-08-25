"use client";
import React from "react";

const ProfileField = ({ label, value, icon, className = "" }) => {
  return (
    <div className={`flex flex-col gap-2.5 items-start ${className}`}>
      <label className="text-xs font-light text-zinc-500">
        {label}
      </label>
      <div className="flex gap-2.5 justify-center items-center w-full px-2.5 py-2 bg-white rounded-md border border-solid border-neutral-200 h-[49px]">
        <div className="flex gap-3 items-center flex-1">
          <div className="flex gap-2.5 items-center flex-1">
            <span className="text-base font-light text-zinc-300">
              {value}
            </span>
          </div>
          <div className="bg-neutral-400 h-[34px] w-[0.5px]" />
          <div className="text-neutral-500">
            <span className="material-icons text-[27px]">{icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileAvatar = () => {
  return (
    <div className="relative">
      <div className="w-[97px] h-[97px] rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center">
        <span className="material-icons text-white text-4xl">person</span>
      </div>
      <div className="absolute bottom-2 right-2 w-[22px] h-[22px] bg-[#488BBE] rounded-full flex items-center justify-center">
        <span className="material-icons text-white text-sm">camera_alt</span>
      </div>
    </div>
  );
};

const EditButton = () => {
  return (
    <button className="flex gap-3 justify-center items-center px-1.5 py-1 h-7 bg-blue-500 rounded-md hover:bg-blue-600 transition-colors">
      <span className="text-xs font-semibold leading-5 text-white">
        Edit
      </span>
    </button>
  );
};

const PsychologistProfile = () => {
  const leftColumnFields = [
    {
      label: "Nama Lengkap",
      value: "Restu Al Oji .MPsi. Psikolog",
      icon: "account_circle"
    },
    {
      label: "Email",
      value: "restu@gmail.com",
      icon: "mail"
    },
    {
      label: "No. SIPP (Surat Izin Praktik Psikolog)",
      value: "3255511451100",
      icon: "badge"
    },
    {
      label: "No. STR (Surat Tanda Registrasi)",
      value: "3255511451100",
      icon: "badge"
    }
  ];

  const rightColumnFields = [
    {
      label: "Keahlian Bidang",
      value: "Konseling Karir",
      icon: "star"
    },
    {
      label: "Spesialisasi",
      value: "Konseling Karir",
      icon: "workspace_premium"
    },
    {
      label: "Jenis Praktik",
      value: "Konseling Karir",
      icon: "business_center"
    },
    {
      label: "Lama Praktik",
      value: "5 Tahun",
      icon: "schedule"
    }
  ];

  return (
    <main className="relative bg-white min-h-screen w-full max-w-[1440px] mx-auto">
      <div className="px-[59px] py-0 max-md:px-[60px] max-sm:px-[50px]">
        {/* Header Section */}
        <header className="relative w-full h-[142px]">
          <h1 className="absolute text-xl font-semibold leading-5 text-blue-500 left-[79px] top-[92px] max-sm:left-5 max-sm:text-lg">
            Informasi Diri
          </h1>
          <div className="absolute h-0 bg-zinc-500 left-[223px] top-[99px] right-0 border-t border-zinc-500" />
        </header>

        {/* Profile Avatar */}
        <div className="absolute left-[198px] top-[136px] max-md:left-[5%] max-sm:left-5">
          <ProfileAvatar />
        </div>

        {/* Form Fields Container */}
        <section className="relative top-[150px] left-[198px] max-md:left-[5%] max-sm:left-5">
          <div className="flex gap-20 items-start w-full max-w-[983px] max-md:flex-col max-md:gap-10 max-sm:gap-8">
            {/* Left Column */}
            <div className="flex flex-col gap-5 w-full max-w-[454px]">
              {leftColumnFields.map((field, index) => (
                <ProfileField
                  key={index}
                  label={field.label}
                  value={field.value}
                  icon={field.icon}
                  className="w-full"
                />
              ))}
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-5 w-full max-w-[453px]">
              {rightColumnFields.map((field, index) => (
                <ProfileField
                  key={index}
                  label={field.label}
                  value={field.value}
                  icon={field.icon}
                  className="w-full"
                />
              ))}
            </div>
          </div>

          {/* Edit Button */}
          <div className="absolute right-0 top-[357px] max-md:relative max-md:top-8 max-md:flex max-md:justify-end max-sm:top-5">
            <EditButton />
          </div>
        </section>
      </div>
    </main>
  );
};

export default PsychologistProfile;
