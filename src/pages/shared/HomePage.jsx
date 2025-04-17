"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const ScrollButton = ({ direction = "down" }) => {
  const imageSrc =
    direction === "down"
      ? "/scroll-down.png"
      : "/scroll-up.png";

  const handleClick = () => {
    if (direction === "down") {
      window.scrollBy({
        top: window.innerHeight,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.div
      className="fixed right-8 bottom-8 flex flex-col items-center cursor-pointer z-30"
      onClick={handleClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.img
        src={imageSrc}
        alt={direction === "down" ? "Scroll Down" : "Scroll Up"}
        className="w-[42px] h-[58px] object-contain"
        animate={{ y: [0, 5, 0] }}
        transition={{ 
          repeat: Infinity, 
          duration: 1.5,
          ease: "easeInOut" 
        }}
      />
    </motion.div>
  );
};

const ServiceCard = ({ title, boldTitle, thumbnailSrc, onClick }) => {
  return (
    <motion.article 
      className="relative w-[314px] h-[314px] flex flex-col justify-center items-center bg-white rounded-full group"
      whileHover={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <motion.div 
          className="absolute inset-0 rounded-full bg-gradient-to-b from-[#91D9E1] via-[#5F6EC3] to-[#91D9E1]"
          animate={{ 
            backgroundPosition: ["0% 0%", "0% 100%", "0% 0%"] 
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear"
          }}
          style={{ 
            backgroundSize: "100% 200%"
          }}
        />
        <div className="absolute inset-[3px] bg-white rounded-full" />
      </div>
      
      <div className="h-[120px] w-[180px] mb-5 z-10">
        {thumbnailSrc && (
          <img 
            src={thumbnailSrc} 
            alt={`${title} ${boldTitle}`} 
            className="object-contain w-full h-full"
          />
        )}
      </div>
      <h3 className="z-10">
        <span className="text-[#6AA2CC]">{title} </span>
        <span className="text-[#6AA2CC] font-bold">{boldTitle}</span>
      </h3>
      <motion.button 
        className="z-10 w-[117px] h-[25px] mt-5 text-base font-bold text-white bg-[#488BBE] hover:bg-[#3399E9] rounded-[44px]"
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Selengkapnya
      </motion.button>
    </motion.article>
  );
};

const HeroSection = ({ activeSlide, handleNextSlide }) => {
  const heroData = [
    {
      title: "Kenali Diri Kamu",
      subtitle: "Lebih Dekat",
      description: "Jelajahi diri kamu bersama kami",
      buttonText: "Mulai Sekarang",
      buttonAction: () => window.location.href = "/login",
      image: "/landing-hero-1.png"
    },
    {
      title: "Kolaborasi",
      subtitle: "/ Kemitraan",
      description: "Berkembang bersama ahli terpercaya kami.",
      buttonText: "Kontak Kami",
      buttonAction: () => window.location.href = "/kontak",
      image: "/landing-hero-2.png"
    }
  ];

  const currentHero = heroData[activeSlide];

  return (
    <section className="pt-[140px] min-h-[700px] md:min-h-[810px] flex flex-col mx-auto">
      <div className="relative max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          {/* Hero Image Container - Fixed Height to Prevent Shifting */}
          <div className="w-full md:w-1/2 h-[300px] md:h-[500px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                src={currentHero.image}
                alt="Hero Illustration"
                className="w-auto h-full object-contain"
              />
            </AnimatePresence>
          </div>
          
          {/* Hero Content Container */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl text-[#8CC3EE] leading-tight md:leading-[56px]">
                  <span className="font-bold block">{currentHero.title}</span>
                  <span className="font-light">{currentHero.subtitle}</span>
                </h1>
                <p className="mt-7 text-base leading-8 text-zinc-500">
                  {currentHero.description}
                </p>
                {activeSlide === 0 ? (
                  <motion.button 
                    className="mt-7 px-8 h-[43px] rounded-full text-base font-bold text-[#8CC3EE] border border-[#8CC3EE] hover:bg-[#E2F9FF]"
                    onClick={currentHero.buttonAction}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentHero.buttonText}
                  </motion.button>
                ) : (
                  <motion.button 
                    className="mt-7 w-[161px] h-[43px] text-base rounded-full font-bold text-[#8CC3EE] border border-[#8CC3EE] hover:bg-[#E2F9FF]"
                    onClick={currentHero.buttonAction}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentHero.buttonText}
                  </motion.button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Fixed position navigation arrows */}
        <button 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/70 hover:bg-white/90 rounded-full p-2 w-12 h-12 flex items-center justify-center shadow-md"
          onClick={() => handleNextSlide('prev')}
          aria-label="Previous slide"
        >
          <span className="material-icons text-3xl text-[#8CC3EE]">arrow_back_ios</span>
        </button>
        
        <button 
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/70 hover:bg-white/90 rounded-full p-2 w-12 h-12 flex items-center justify-center shadow-md"
          onClick={() => handleNextSlide('next')}
          aria-label="Next slide"
        >
          <span className="material-icons text-3xl text-[#8CC3EE]">arrow_forward_ios</span>
        </button>
      </div>
      
      {/* Slide Indicators */}
      <div className="flex justify-center mt-10 gap-3.5">
        <button
          className={`rounded-full h-[11px] w-[11px] ${activeSlide === 0 ? "bg-[#8CC3EE]" : "border border-[#8CC3EE]"}`}
          onClick={() => handleNextSlide('goto', 0)}
          aria-label="Slide 1"
        />
        <button
          className={`rounded-full h-[11px] w-[11px] ${activeSlide === 1 ? "bg-[#8CC3EE]" : "border border-[#8CC3EE]"}`}
          onClick={() => handleNextSlide('goto', 1)}
          aria-label="Slide 2"
        />
      </div>
    </section>
  );
};

const ServicesSection = () => {
  // Service data
  const services = [
    {
      title: "Konseling",
      boldTitle: "Klinis",
      thumbnailSrc: "/layanan-kami-1.png",
      action: () => window.location.href = "/layanan/klinis"
    },
    {
      title: "Konseling",
      boldTitle: "Pendidikan",
      thumbnailSrc: "/layanan-kami-2.png",
      action: () => window.location.href = "/layanan/pendidikan"
    },
    {
      title: "Konseling",
      boldTitle: "Karir",
      thumbnailSrc: "/layanan-kami-3.png",
      action: () => window.location.href = "/layanan/karir"
    }
  ];

  return (
    <section 
      id="services" 
      className="min-h-[810px] flex flex-col justify-center"
      style={{ 
        background: "linear-gradient(to bottom, #FFFFFF, #BFE9F3, #FFFFFF)",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        width: "100%",
        height: "810px"
      }}
    >
      <h2 className="mt-16 mb-16 text-center text-4xl md:text-5xl">
        <span className="text-[#488BBE] font-normal">Layanan </span>
        <span className="text-[#8CC3EE] font-extrabold">Kami</span>
      </h2>
      <div className="flex flex-wrap gap-10 justify-center mb-16 px-4">
        {services.map((service, index) => (
          <ServiceCard 
            key={index}
            title={service.title}
            boldTitle={service.boldTitle}
            thumbnailSrc={service.thumbnailSrc}
            onClick={service.action}
          />
        ))}
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="min-h-[810px] flex flex-col justify-center">
      <h2 className="text-center mb-6 text-4xl md:text-5xl">
        <span className="text-[#8CC3EE] font-extrabold">Kata mereka</span>{" "}
        <span className="text-[#488BBE] font-normal">yang telah menjalaninya bersama Ruangdiri.id</span>
      </h2>
      <p className="text-center text-base text-zinc-500 max-w-[800px] mx-auto mb-16 px-4">
        Kisah mereka yang sudah menggunakan layanan Ruangdiri.id Kamu juga bisa
        seperti mereka, karena ceritamu layak didengar
      </p>
      
      <div className="flex justify-center px-4">
        <motion.img
          src="/testimonials.svg"
          alt="Testimonials"
          className="object-contain max-w-full md:max-w-[1105px] w-full"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </section>
  );
};

const ClientsSection = () => {
  const clients = [
    { name: "BRI", logo: "/logo/client/bri-logo.png" },
    { name: "FIFGROUP", logo: "/logo/client/fifgroup-logo.png" },
    { name: "NRA", logo: "/logo/client/nra-logo.png" },
    { name: "Sosro", logo: "/logo/client/sosro-logo.png" },
    { name: "BANK INDONESIA", logo: "/logo/client/bank-indonesia-logo.png" },
    { name: "Asuransi Asei", logo: "/logo/client/asei-logo.png" },
    { name: "Ford", logo: "/logo/client/ford-logo.png" }
  ];

  return (
    <section id="clients" className="bg-white">
      <div className="pt-16 pb-16 max-w-[1440px] mx-auto">
        <h2 className="text-center mb-16">
          <span className="text-[#488BBE] font-normal text-4xl md:text-5xl">Klien </span>
          <span className="text-[#8CC3EE] font-extrabold text-4xl md:text-5xl">Kami</span>
        </h2>
        <motion.div 
          className="flex flex-wrap gap-10 items-center justify-center px-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {clients.map((client, index) => (
            <motion.img
              key={index}
              src={client.logo}
              alt={`${client.name} Logo`}
              className="object-contain h-12 md:h-16"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

function Homepage() {
  const [activeTab, setActiveTab] = useState("Beranda");
  const [activeSlide, setActiveSlide] = useState(0);
  const [currentSection, setCurrentSection] = useState("hero");
  const [showScrollDown, setShowScrollDown] = useState(true);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const sectionsRef = useRef({});
  const mainContentRef = useRef(null);
  const isInitialMount = useRef(true);
  
  // Handle scroll event to determine current section
  const handleScroll = () => {
    const scrollPosition = window.scrollY + window.innerHeight / 2;
    
    // Check each section to determine the current one
    Object.entries(sectionsRef.current).forEach(([id, section]) => {
      if (section) {
        const { offsetTop, offsetHeight } = section;
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          setCurrentSection(id);
          
          // Toggle scroll buttons based on section
          if (id === "clients") {
            setShowScrollDown(false);
            setShowScrollUp(true);
          } else {
            setShowScrollDown(true);
            setShowScrollUp(false);
          }
        }
      }
    });
  };
  
  // Initialize section refs after render
  useEffect(() => {
    // Wait for elements to be rendered
    const timer = setTimeout(() => {
      sectionsRef.current = {
        hero: document.getElementById("hero"),
        services: document.getElementById("services"),
        testimonials: document.getElementById("testimonials"),
        clients: document.getElementById("clients")
      };
      
      // Run initial scroll check to set correct section
      handleScroll();
    }, 100);
    
    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);
  
  // Handle slide navigation
  const handleNextSlide = (action, index) => {
    if (action === 'next') {
      setActiveSlide(activeSlide === 0 ? 1 : 0);
    } else if (action === 'prev') {
      setActiveSlide(activeSlide === 0 ? 1 : 0);
    } else if (action === 'goto' && index !== undefined) {
      setActiveSlide(index);
    }
  };
  
  return (
    <div className="bg-white overflow-x-hidden">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
      />
      
      <Navbar activeTab={activeTab} />
      
      {/* Add spacing after navbar to fix the tight layout */}
      <main ref={mainContentRef} className="pt-[20px]">
        <section id="hero" ref={el => sectionsRef.current.hero = el}>
          <HeroSection 
            activeSlide={activeSlide}
            handleNextSlide={handleNextSlide}
          />
        </section>
        
        <section id="services" ref={el => sectionsRef.current.services = el}>
          <ServicesSection />
        </section>
        
        <section id="testimonials" ref={el => sectionsRef.current.testimonials = el}>
          <TestimonialsSection />
        </section>
        
        <section id="clients" ref={el => sectionsRef.current.clients = el}>
          <ClientsSection />
        </section>
      </main>
      
      <Footer />
      
      {/* Scroll Buttons */}
      <AnimatePresence>
        {showScrollDown && <ScrollButton direction="down" />}
        {showScrollUp && <ScrollButton direction="up" />}
      </AnimatePresence>
    </div>
  );
}

export default Homepage;