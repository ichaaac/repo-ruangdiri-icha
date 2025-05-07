import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-b from-[#A4DCE9] to-[#5A5FBA] py-14">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center px-14 py-14 max-md:flex-col max-md:gap-5 max-md:px-5 max-md:py-8 max-sm:p-5">
          {/* Logo Section */}
          <div className="flex flex-col gap-2.5 items-start p-2.5 h-[109px] w-[120px]">
            <div>
              <img
                src="/logo/ruang-diri-logo.svg"
                alt="Ruang Diri Logo"
                className="w-[100px] h-[89px] brightness-0 invert" // Makes the logo white
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex gap-12 items-center ml-44 max-md:justify-center max-md:w-full max-md:ml-0 max-sm:flex-col max-sm:gap-5">
            <a
              href="#"
              className="text-sm text-white cursor-pointer max-sm:text-base hover:underline"
            >
              Pusat Bantuan
            </a>
            <a
              href="#"
              className="text-sm text-white cursor-pointer max-sm:text-base hover:underline"
            >
              Artikel
            </a>
          </nav>

          {/* Social Media Icon */}
          <div className="ml-auto pr-14 max-md:pr-0 max-sm:mt-5">
            <a 
              href="https://www.instagram.com/performaplus.sdm" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Instagram @performaplus.sdm"
            >
              <img 
                src="/logo/instagram-logo.png" 
                alt="Instagram"
                className="w-6 h-6 brightness-0 invert" // Makes the logo white
              />
            </a>
          </div>
        </div>
        <div className="border-t border-white/30 w-[90%] mx-auto my-8"></div>
        <div className="text-sm text-center text-white px-4 pb-14">
          <span>© 2025</span>{" "}
          <a href="https://ruangdiri.id/" className="text-white underline hover:text-white/80">
            Ruangdiri.id
          </a>
          <span>. All Rights Reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;