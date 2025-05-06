import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const HeroSection = ({ activeSlide, handleNextSlide }) => {
  const heroData = [
    {
      title: "Kenali Diri",
      subtitle: "kamu",
      caption: "Lebih Dekat",
      description: "Jelajahi diri kamu bersama kami",
      buttonText: "Mulai Sekarang",
      buttonAction: () => window.location.href = "/login",
      image: "/landing-hero-1.svg"
    },
    {
      title: "Kolaborasi / Kemitraan",
      subtitle: "",
      caption: "",
      description: "Berkembang bersama ahli terpercaya kami.",
      buttonText: "Kontak Kami",
      buttonAction: () => window.location.href = "/kontak",
      image: "/landing-hero-2.svg"
    }
  ];

  const currentHero = heroData[activeSlide];

  // Functions to handle arrow clicks with direct state change
  const handlePrevClick = () => {
    handleNextSlide('prev');
  };
  
  const handleNextClick = () => {
    handleNextSlide('next');
  };

  return (
    <section className="pt-[140px] min-h-[700px] md:min-h-[810px] flex flex-col mx-auto relative">
      <div className="relative max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="w-full md:w-1/2 h-[300px] md:h-[500px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.5 }}
                className="h-full flex items-center justify-center"
              >
                <img
                  src={currentHero.image}
                  alt="Hero Illustration"
                  className="w-auto h-full object-contain max-h-[90%]"
                  style={{ maxWidth: "100%", objectFit: "contain" }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="w-full md:w-1/2 text-center md:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {activeSlide === 0 ? (
                  <h1 className="text-4xl md:text-5xl text-[#488BBE] leading-tight md:leading-[56px]">
                    <span className="font-bold">Kenali Diri</span>{" "}
                    <span className="font-normal">kamu</span><br />
                    <span className="font-light">Lebih Dekat</span>
                  </h1>
                ) : (
                  <h1 className="text-4xl md:text-5xl text-[#488BBE] leading-tight md:leading-[56px] whitespace-nowrap">
                    <span className="font-bold">Kolaborasi</span>{" "}
                    <span className="font-light">/ Kemitraan</span>
                  </h1>
                )}
                <p className="mt-7 text-base leading-8 text-[#8B8B8B]">
                  {currentHero.description}
                </p>
                <motion.button 
                  className={`mt-7 ${activeSlide === 0 ? 'px-8' : 'w-[161px]'} h-[43px] rounded-full text-base font-bold text-[#488BBE] border border-[#488BBE] hover:bg-[#E2F9FF]`}
                  onClick={currentHero.buttonAction}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentHero.buttonText}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Fixed arrows with clickable area */}
      {activeSlide > 0 && (
        <div 
          className="absolute top-1/2 left-[5%] transform -translate-y-1/2 cursor-pointer z-10 w-[40px] h-[40px] flex items-center justify-center"
          onClick={handlePrevClick}
          aria-label="Previous slide"
        >
          <svg 
            width="23" 
            height="38" 
            viewBox="0 0 23 38" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none"
          >
            <path d="M20 36L2 19L20 2" stroke="#8CC3EE" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      
      {activeSlide < heroData.length - 1 && (
        <div 
          className="absolute top-1/2 right-[5%] transform -translate-y-1/2 cursor-pointer z-10 w-[40px] h-[40px] flex items-center justify-center"
          onClick={handleNextClick}
          aria-label="Next slide"
        >
          <svg 
            width="23" 
            height="38" 
            viewBox="0 0 23 38" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none"
          >
            <path d="M3 2L21 19L3 36" stroke="#8CC3EE" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      
      <div className="flex justify-center mt-10 gap-3.5">
        <button
          className={`rounded-full h-[11px] w-[11px] ${activeSlide === 0 ? "bg-[#488BBE]" : "border border-[#488BBE]"}`}
          onClick={() => handleNextSlide('goto', 0)}
          aria-label="Slide 1"
        />
        <button
          className={`rounded-full h-[11px] w-[11px] ${activeSlide === 1 ? "bg-[#488BBE]" : "border border-[#488BBE]"}`}
          onClick={() => handleNextSlide('goto', 1)}
          aria-label="Slide 2"
        />
      </div>
    </section>
  );
};

export default HeroSection;