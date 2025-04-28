import React from 'react';

const SchoolSettingsPage = () => {
  return (
    <main className="flex flex-row mx-auto w-full max-w-none h-screen bg-white max-md:flex-col max-md:max-w-[991px] max-sm:max-w-screen-sm">
      <div className="box-border flex-1 p-5 max-md:p-2.5 max-sm:p-1.5">
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

        <section className="mb-5">
          <div className="flex gap-5 items-center p-5 bg-white rounded-xl border-solid border-[0.3px] border-zinc-500 max-md:flex-col max-md:items-start max-sm:p-2.5">
            <div className="relative">
              <img
                src="URL_PROFILE_IMAGE"
                alt="School Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <button
                aria-label="Edit profile photo"
                className="absolute right-0 top-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
              >
                <span className="material-icons text-white text-sm">photo_camera</span>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-bold text-neutral-600">
                SMA Veteran 007 Jakarta
              </h2>
              <p className="text-xs text-neutral-600">Admin</p>
              <p className="text-xs text-neutral-600">
                Jakarta, Indonesia
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
              <button className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-md cursor-pointer">
                Edit
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500">Nama Sekolah</span>
                <span className="text-base text-neutral-600">
                  SMA Veteran 007 Jakarta
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500">Alamat</span>
                <span className="text-base text-neutral-600">
                  Jl. Bintaro Raya, RT.4/RW.10, Bintaro, Kec. Pesanggrahan,
                  Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12330
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500">Nomor Telepon</span>
                <span className="text-base text-neutral-600">
                  +62 | 858-1484-2474
                </span>
              </div>
            </div>
          </article>

          <article className="p-5 bg-white rounded-xl border-solid border-[0.3px] border-zinc-500 max-md:flex-col max-md:items-start max-sm:p-2.5">
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="text-xl font-semibold text-primary">
                Pengaturan Akun
              </h3>
              <button className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-md cursor-pointer">
                Edit
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500">Email</span>
                <span className="text-base text-neutral-600">
                  smaveteranjakarta@gmail.com
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500">Password</span>
                <span className="text-base text-neutral-600">********</span>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
};

export default SchoolSettingsPage;
