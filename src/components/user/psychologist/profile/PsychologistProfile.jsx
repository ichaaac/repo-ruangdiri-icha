// src/components/user/psychologist/profile/PsychologistProfile.jsx
import { useState } from "react";
import clsx from "clsx";
import ProfilePictureUpload from "@/components/shared/profile/ProfilePictureUpload";

// Icon mapping for fields
const getFieldIcon = (fieldType) => {
  const iconMap = {
    fullName: "account_circle",
    email: "mail_outline",
    sippNumber: "badge",
    registrationNumber: "badge", 
    fieldOfExpertise: "stars",
    specialization: "verified",
    typeOfPractice: "work_outline",
    yearsOfExperience: "schedule"
  };
  return iconMap[fieldType] || "help_outline";
};

// Required fields
const requiredFields = ["fullName", "sippNumber", "fieldOfExpertise", "specialization", "typeOfPractice"];

// Dropdown untuk keahlian bidang
const FieldDropdown = ({
  label,
  fieldType,
  required = false,
  isEditing,
  value,
  onChange,
  placeholder = "",
  options = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="self-stretch flex flex-col gap-2.5 relative">
      <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">
        {required && <span className="text-[#EE4266]">*</span>} {label}
      </div>

      <div className={clsx(
        "self-stretch h-12 px-2.5 py-1.5 bg-white rounded-[5px] flex items-center gap-2.5",
        isEditing ? "outline outline-1 outline-offset-[-1px] outline-TEXT-NEW" : "outline outline-1 outline-offset-[-1px] outline-neutral-200"
      )}>
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 flex items-center">
            {isEditing ? (
              <div className="relative w-full flex items-center">
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full text-left text-TEXT-NEW text-base font-light font-['Public_Sans'] bg-transparent outline-none flex items-center justify-between"
                >
                  <span>{value || placeholder}</span>
                  <span className="material-icons text-TEXT-NEW ml-2">
                    {isOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>
                
                {isOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white rounded-bl-[5px] rounded-br-[5px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.04)] shadow-[0px_9px_5px_0px_rgba(0,0,0,0.03)] shadow-[0px_16px_6px_0px_rgba(0,0,0,0.01)] shadow-[0px_24px_7px_0px_rgba(0,0,0,0.00)] px-1.5 py-3 max-h-36 overflow-y-auto">
                    <div className="flex flex-col gap-3.5">
                      {options.map((option, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelect(option)}
                          className="text-left text-TEXT-NEW text-base font-light font-['Public_Sans'] hover:bg-gray-50 px-2 py-1 rounded"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-zinc-300 text-base font-light font-['Public_Sans']">
                {value || "-"}
              </div>
            )}
          </div>
          <div className="w-0 h-8 border-l border-neutral-400"></div>
          <div className="flex items-center justify-center w-6 h-6">
            <span className="material-icons-outlined" style={{ fontSize: "24px", color: "var(--text, #8a8a8a)" }}>
              {getFieldIcon(fieldType)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Field component dengan styling yang benar
const Field = ({
  label,
  fieldType,
  required = false,
  isEditing,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) => {
  return (
    <div className="self-stretch flex flex-col gap-2.5">
      <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">
        {required && <span className="text-[#EE4266]">*</span>} {label}
      </div>

      <div className={clsx(
        "self-stretch h-12 px-2.5 py-1.5 bg-white rounded-[5px] flex items-center gap-2.5",
        isEditing ? "outline outline-1 outline-offset-[-1px] outline-TEXT-NEW" : "outline outline-1 outline-offset-[-1px] outline-neutral-200"
      )}>
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 flex items-center">
            {isEditing ? (
              <input
                className="w-full text-TEXT-NEW text-base font-light font-['Public_Sans'] bg-transparent outline-none"
                type={type}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
              />
            ) : (
              <div className="text-zinc-300 text-base font-light font-['Public_Sans']">
                {value || "-"}
              </div>
            )}
          </div>
          <div className="w-0 h-8 border-l border-neutral-400"></div>
          <div className="flex items-center justify-center w-6 h-6">
            <span className="material-icons text-[#8B8B8B]" style={{ fontSize: "24px" }}>
              {getFieldIcon(fieldType)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PsychologistProfile = ({
  values,
  onChange,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isSaving = false,
}) => {

  const updateField = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  // Options untuk keahlian bidang
  const fieldOfExpertiseOptions = [
    "Psikolog Klinis Anak",
    "Psikolog Klinis Dewasa", 
    "Psikolog Pendidikan",
    "Psikolog Industri dan Organisasi",
    "Psikolog Umum"
  ];

  return (
    <div className="relative w-full min-h-screen bg-white">
      {/* Header dan divider - responsive dengan padding kanan */}
    <div className="absolute left-[138px] top-[92px] right-[20px] flex items-center gap-4">
      <div className="text-[#488BBA] text-xl font-semibold font-['Public_Sans'] leading-tight">
        Informasi Diri
      </div>
      <div className="flex-1 h-0.5 bg-gray-300" />
    </div>

      {/* Content container */}
      <div className="pt-40">
        {/* avatar + upload dengan z-index tinggi */}
        <div className="absolute left-[258px] top-[136px] z-50">
          <ProfilePictureUpload
            currentProfilePicture={values.profilePicture}
            organizationType="psychologist"
            isOnboarding={false}
            onImageSelect={(imageUrl) => updateField('profilePicture', imageUrl)}
          />
        </div>

        {/* form dengan padding kanan untuk responsive */}
        <div className="absolute left-[257px] top-[286px] right-[200px] inline-flex items-start gap-20 z-20 pointer-events-auto">
          {/* kolom kiri */}
          <div className="w-[454px] inline-flex flex-col gap-5">
            <Field
              label="Nama Lengkap"
              fieldType="fullName"
              required={requiredFields.includes("fullName")}
              isEditing={isEditing}
              value={values.fullName}
              onChange={(val) => updateField('fullName', val)}
              placeholder="Nama lengkap"
            />

            <Field
              label="Email"
              fieldType="email"
              isEditing={isEditing}
              value={values.email}
              onChange={(val) => updateField('email', val)}
              type="email"
              placeholder="email@contoh.com"
            />

            <Field
              label="No. SIPP (Surat Izin Praktik Psikolog)"
              fieldType="sippNumber"
              required={requiredFields.includes("sippNumber")}
              isEditing={isEditing}
              value={values.sippNumber}
              onChange={(val) => updateField('sippNumber', val)}
              placeholder="3255511451100"
            />

            <Field
              label="No. STR (Surat Tanda Registrasi)"
              fieldType="registrationNumber"
              isEditing={isEditing}
              value={values.registrationNumber}
              onChange={(val) => updateField('registrationNumber', val)}
              placeholder="3255511451100"
            />

            {/* Keterangan wajib diisi di bawah STR - hanya saat edit */}
            {isEditing && (
              <div className="justify-center">
                <span className="text-[#EE4266] text-xs font-normal font-['Public_Sans'] leading-snug">*</span>
                <span className="text-TEXT-NEW text-xs font-normal font-['Public_Sans'] leading-snug">Wajib diisi</span>
              </div>
            )}
          </div>

          {/* kolom kanan */}
          <div className="w-[454px] inline-flex flex-col gap-5">
            <FieldDropdown
              label="Keahlian Bidang"
              fieldType="fieldOfExpertise"
              required={requiredFields.includes("fieldOfExpertise")}
              isEditing={isEditing}
              value={values.fieldOfExpertise}
              onChange={(val) => updateField('fieldOfExpertise', val)}
              placeholder="Pilih keahlian bidang"
              options={fieldOfExpertiseOptions}
            />

            <Field
              label="Spesialisasi"
              fieldType="specialization"
              required={requiredFields.includes("specialization")}
              isEditing={isEditing}
              value={values.specialization}
              onChange={(val) => updateField('specialization', val)}
              placeholder="Contoh: CBT, Kecemasan"
            />

            <Field
              label="Jenis Praktik"
              fieldType="typeOfPractice"
              required={requiredFields.includes("typeOfPractice")}
              isEditing={isEditing}
              value={values.typeOfPractice}
              onChange={(val) => updateField('typeOfPractice', val)}
              placeholder="Contoh: Klinik, Pribadi"
            />

            <Field
              label="Lama Praktik (tahun)"
              fieldType="yearsOfExperience"
              isEditing={isEditing}
              value={String(values.yearsOfExperience ?? "")}
              onChange={(val) => updateField('yearsOfExperience', val)}
              type="number"
              placeholder="0"
            />

            {/* tombol dengan container tetap untuk mencegah blinking */}
            <div className="mt-1 h-7 flex justify-end items-center">
              {!isEditing && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="w-20 h-7 px-1.5 py-[3px] bg-[#488BBA] rounded-[5px] flex justify-center items-center hover:bg-[#3a7a9e] transition-colors"
                >
                  <span className="text-white text-xs font-semibold font-['Public_Sans']">Edit</span>
                </button>
              )}
              {isEditing && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="w-20 h-7 px-1.5 py-[3px] bg-white rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#488BBA] flex justify-center items-center disabled:opacity-60 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[#488BBA] text-xs font-semibold font-['Public_Sans'] leading-tight">
                      Batal
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={onSave}
                    className="w-20 h-7 px-1.5 py-[3px] bg-[#488BBA] rounded-[5px] flex justify-center items-center disabled:opacity-60 hover:bg-[#3a7a9e] transition-colors"
                  >
                    <span className="text-white text-xs font-semibold font-['Public_Sans'] leading-tight">
                      {isSaving ? "Menyimpan…" : "Simpan"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychologistProfile;