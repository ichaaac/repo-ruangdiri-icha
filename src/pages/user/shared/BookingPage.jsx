const BookingPage = () => {
  return (
    <div className="w-[1440px] h-[810px] relative bg-white overflow-hidden">
      {/* Background Gradient */}
      <div className="w-[1440px] h-96 left-0 top-0 absolute bg-gradient-to-b from-teal-200 to-indigo-500" />

      {/* Logo */}
      <div className="w-24 left-[670px] top-[26px] absolute inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
        <img src="/logo/ruang-diri-logo.svg" alt="RuangDiri Logo" className="w-full h-auto" />
      </div>

      {/* Pilih Jenis Konseling Title */}
      <div className="left-[526px] top-[173px] absolute justify-start text-white text-4xl font-bold font-['Public_Sans']">
        Pilih Jenis Konseling
      </div>

      {/* Separator Line under title */}
      <div className="w-48 h-0 left-[621px] top-[243px] absolute outline outline-[0.50px] outline-offset-[-0.25px] outline-white"></div>

      {/* Counseling Type Cards */}
      <div className="left-[286px] top-[284px] absolute inline-flex justify-start items-center gap-5">
        {/* Luring Card */}
        <div className="w-72 h-80 bg-radial-[at_104%_-13%] from-sky-100 to-white rounded-2xl shadow-[0px_5px_11px_0px_rgba(0,0,0,0.07)] shadow-[0px_20px_20px_0px_rgba(0,0,0,0.06)] shadow-[0px_46px_27px_0px_rgba(0,0,0,0.04)] shadow-[0px_81px_32px_0px_rgba(0,0,0,0.01)] shadow-[0px_127px_35px_0px_rgba(0,0,0,0.00)] inline-flex flex-col justify-start items-center gap-6">
          <div className="w-72 flex flex-col justify-start items-center gap-6">
            <img
              className="w-72 h-48 rounded-tl-2xl rounded-tr-2xl object-cover"
              src="/placeholder.svg?height=192&width=288"
              alt="In-person counseling"
            />
          </div>
          <div className="self-stretch text-center justify-start text-primary-V1 text-base font-bold font-['Public_Sans']">
            Luring
          </div>
          <div className="w-56 justify-start text-TEXT-NEW text-sm font-normal font-['Public_Sans'] leading-tight">
            Konseling yang dilakukan secara tatap muka dengan psikolog selama 1 jam.
          </div>
        </div>

        {/* Daring (Zoom) Card */}
        <div className="w-72 h-80 bg-radial-[at_104%_-13%] from-sky-100 to-white rounded-2xl shadow-[0px_5px_11px_0px_rgba(0,0,0,0.07)] shadow-[0px_20px_20px_0px_rgba(0,0,0,0.06)] shadow-[0px_46px_27px_0px_rgba(0,0,0,0.04)] shadow-[0px_81px_32px_0px_rgba(0,0,0,0.01)] shadow-[0px_127px_35px_0px_rgba(0,0,0,0.00)] inline-flex flex-col justify-start items-center gap-6">
          <div className="w-72 flex flex-col justify-start items-center gap-6">
            <img
              className="w-72 h-48 rounded-tl-2xl rounded-tr-2xl object-cover"
              src="/placeholder.svg?height=192&width=288"
              alt="Online video call counseling"
            />
          </div>
          <div className="self-stretch text-center justify-start text-primary-V1 text-base font-bold font-['Public_Sans']">
            Daring (Zoom)
          </div>
          <div className="w-56 justify-start text-TEXT-NEW text-sm font-normal font-['Public_Sans'] leading-tight">
            Konseling yang dilakukan secara virtual dengan psikolog menggunakan platform percakapan audiovisual selama 1
            jam.
          </div>
        </div>

        {/* Chat Card */}
        <div className="w-72 h-80 bg-radial-[at_104%_-13%] from-sky-100 to-white rounded-2xl shadow-[0px_5px_11px_0px_rgba(0,0,0,0.07)] shadow-[0px_20px_20px_0px_rgba(0,0,0,0.06)] shadow-[0px_46px_27px_0px_rgba(0,0,0,0.04)] shadow-[0px_81px_32px_0px_rgba(0,0,0,0.01)] shadow-[0px_127px_35px_0px_rgba(0,0,0,0.00)] inline-flex flex-col justify-start items-center gap-6">
          <div className="w-72 flex flex-col justify-start items-center gap-6">
            <img
              className="w-72 h-48 rounded-tl-2xl rounded-tr-2xl object-cover"
              src="/placeholder.svg?height=192&width=288"
              alt="Chat counseling"
            />
          </div>
          <div className="self-stretch text-center justify-start text-primary-V1 text-base font-bold font-['Public_Sans']">
            Chat
          </div>
          <div className="w-56 justify-start text-TEXT-NEW text-sm font-normal font-['Public_Sans'] leading-tight">
            Konseling melalui ruang chat dengan psikolog selama 15 menit dalam satu sesi.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="left-[671px] top-[759px] absolute text-center justify-start text-text text-xs font-normal font-['Public_Sans']">
        Ruang Diri • 2025
      </div>
    </div>
  )
}

export default BookingPage
