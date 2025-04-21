"use client";
import React, { useState } from "react";

function Settings() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <section className="rounded-none max-w-[695px]">
      <div className="flex flex-col items-center px-20 pt-10 pb-6 w-full bg-white rounded-xl shadow-[0px_261px_73px_rgba(0,0,0,0)] max-md:px-5 max-md:max-w-full">
        <div className="flex flex-col max-w-full w-[471px]">
          <header className="self-start ml-7 text-3xl font-bold leading-none text-primary max-md:ml-2.5">
            Pengaturan Akun
          </header>

          <EmailSection />
          <PasswordSection
            showOldPassword={showOldPassword}
            setShowOldPassword={setShowOldPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />
        </div>
      </div>
    </section>
  );
}

function EmailSection() {
  return (
    <div className="flex flex-col py-6 pr-3 pl-7 mt-7 w-full whitespace-nowrap bg-blue-50 rounded-xl max-md:pl-5 max-md:max-w-full">
      <label className="self-start text-xs leading-5 text-zinc-400">
        Email
      </label>
      <p className="gap-3 self-stretch px-3 py-1.5 mt-1.5 text-base leading-none rounded-md min-h-8 text-zinc-500">
        smaveteran007@gmail.com
      </p>
    </div>
  );
}

function PasswordSection({
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword
}) {
  return (
    <div className="flex flex-col py-6 pr-2.5 pl-7 mt-6 w-full text-xs leading-loose bg-blue-50 rounded-xl max-md:pl-5 max-md:max-w-full">
      <OldPasswordField
        showPassword={showOldPassword}
        setShowPassword={setShowOldPassword}
      />
      <NewPasswordField
        showPassword={showNewPassword}
        setShowPassword={setShowNewPassword}
      />
      <PasswordRequirements />
      <ConfirmPasswordField
        showPassword={showConfirmPassword}
        setShowPassword={setShowConfirmPassword}
      />
      <ActionButtons />
    </div>
  );
}

function OldPasswordField({ showPassword, setShowPassword }) {
  return (
    <>
      <label className="self-start text-zinc-400">
        Password Lama
      </label>
      <div className="flex items-center px-3 py-1.5 mt-3 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 text-zinc-500 max-md:max-w-full">
        <p className="self-stretch my-auto">
          {showPassword ? "password123" : "***********"}
        </p>
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="object-contain shrink-0 self-stretch my-auto w-4 aspect-square"
        >
          <span className="material-icons text-sm">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </>
  );
}

function NewPasswordField({ showPassword, setShowPassword }) {
  return (
    <>
      <label className="self-start mt-6 text-zinc-400">
        Password Baru
      </label>
      <div className="flex items-center px-3 py-1.5 mt-3 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 text-zinc-500 max-md:max-w-full">
        <p className="self-stretch my-auto">
          {showPassword ? "NewPass123!" : "***********"}
        </p>
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="object-contain shrink-0 self-stretch my-auto w-4 aspect-square"
        >
          <span className="material-icons text-sm">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </>
  );
}

function PasswordRequirements() {
  return (
    <div className="flex gap-3.5 self-start mt-1.5 ml-4 text-xs leading-4 max-md:ml-2.5">
      <div className="text-zinc-500">
        Password harus terdiri dari :<br />{" "}
        <span style={{ color: "rgba(155,202,97,1)" }}>
          Minimal 8 karakter
        </span>
        <br />
        <span style={{ color: "rgba(155,202,97,1)" }}>
          {" "}
          Minimal 1 huruf kapital
        </span>
      </div>
      <div className="self-start mt-4 text-lime-400">
        Minimal 1 angka
        <br />
        Minimal 1 karakter khusus
      </div>
    </div>
  );
}

function ConfirmPasswordField({ showPassword, setShowPassword }) {
  return (
    <>
      <label className="self-start mt-6 text-zinc-400">
        Konfirmasi Password Baru
      </label>
      <div className="flex items-center px-3 py-1.5 mt-3 text-base leading-none text-rose-500 whitespace-nowrap bg-white rounded-md min-h-8 max-md:max-w-full">
        <p className="self-stretch my-auto">
          {showPassword ? "NewPass123" : "***********"}
        </p>
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="object-contain shrink-0 self-stretch my-auto w-4 aspect-square"
        >
          <span className="material-icons text-sm">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </>
  );
}

function ActionButtons() {
  return (
    <div className="flex gap-3 items-center self-end mt-6 font-semibold leading-5 whitespace-nowrap">
      <button className="gap-3 self-stretch px-1.5 py-1 my-auto text-primary min-h-7 rounded-[50px] w-[82px]">
        Batal
      </button>
      <button className="gap-3 self-stretch px-1.5 py-1 my-auto text-white bg-primary min-h-7 rounded-[50px] w-[82px]">
        Simpan
      </button>
    </div>
  );
}

export default Settings;
