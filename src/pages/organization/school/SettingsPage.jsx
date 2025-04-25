import React from "react";

const SchoolSettingsPage = () => {
  return (
    <main className="flex mx-auto w-full h-screen bg-white max-md:flex-col max-md:max-w-[991px] max-sm:max-w-screen-sm">
      <article className="flex flex-col flex-1 gap-5 p-5 max-md:p-2.5">
        {/* Header Section */}
        <header className="flex gap-5 justify-end items-center max-sm:justify-between">
          <div className="flex items-center text-sm font-bold max-sm:text-xs">
            <span className="text-primary">ID /</span>
            <span className="text-zinc-500">EN</span>
          </div>
          <button
            aria-label="Notifications"
            className="flex items-center justify-center w-8 h-8 text-zinc-500"
          >
            <span className="material-icons">notifications</span>
          </button>
        </header>

        {/* Profile Section */}
        <section className="flex flex-col gap-5">
          <div className="flex gap-2.5 items-center">
            <h1 className="text-xl font-semibold text-primary max-sm:text-lg">
              Profil
            </h1>
            <div className="flex-1 h-px bg-zinc-500" />
          </div>

          <article className="flex gap-5 items-center p-5 bg-white rounded-xl border-solid border-[0.3px] border-zinc-500 max-md:flex-col max-md:items-start max-sm:p-2.5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                <img
                  src="URL_PROFILE_IMAGE"
                  alt="School profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 p-1 bg-primary rounded-full text-white"
              >
                <span className="material-icons text-sm">photo_camera</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-bold text-neutral-600">
                SMA Veteran 007 Jakarta
              </h2>
              <p className="text-xs text-neutral-600">Admin</p>
              <p className="text-xs text-neutral-600">Jakarta, Indonesia</p>
            </div>
          </article>
        </section>

        {/* School Information Section */}
        <section className="flex flex-col gap-5">
          <article className="p-5 bg-white rounded-xl border-solid border-[0.3px] border-zinc-500 max-md:flex-col max-md:items-start max-sm:p-2.5">
            <div className="flex gap-2.5 items-center mb-4">
              <h2 className="text-xl font-semibold text-primary max-sm:text-lg">
                Informasi Sekolah
              </h2>
              <div className="flex-1 h-px" />
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-500">Nama Sekolah</label>
                <p className="text-base text-neutral-600">
                  SMA Veteran 007 Jakarta
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-500">Alamat</label>
                <p className="text-base text-neutral-600">
                  Jl. Bintaro Raya, RT.4/RW.10, Bintaro, Kec. Pesanggrahan, Kota
                  Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12330
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-500">Nomor Telepon</label>
                <p className="text-base text-neutral-600">
                  +62 | 858-1484-2474
                </p>
              </div>

              <button className="self-end px-1.5 py-1 text-xs font-semibold bg-primary rounded-md text-white max-sm:text-xs">
                Edit
              </button>
            </div>
          </article>
        </section>

        {/* Account Settings Section */}
        <section className="flex flex-col gap-5">
          <article className="p-5 bg-white rounded-xl border-solid border-[0.3px] border-zinc-500 max-md:flex-col max-md:items-start max-sm:p-2.5">
            <div className="flex gap-2.5 items-center mb-4">
              <h2 className="text-xl font-semibold text-primary max-sm:text-lg">
                Pengaturan Akun
              </h2>
              <div className="flex-1 h-px" />
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-500">Email</label>
                <p className="text-base text-neutral-600">
                  smaveteranjakarta@gmail.com
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-500">Password</label>
                <p className="text-base text-neutral-600">********</p>
              </div>

              <button className="self-end px-1.5 py-1 text-xs font-semibold bg-primary rounded-md text-white max-sm:text-xs">
                Edit
              </button>
            </div>
          </article>
        </section>
      </article>
    </main>
  );
};

export default SchoolSettingsPage;