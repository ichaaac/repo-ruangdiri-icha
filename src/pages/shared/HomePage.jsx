import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import HeroSection from "../../components/home/HeroSection";
import Footer from "../../components/layout/Footer";

const ScrollButton = ({ direction = "down", onScroll }) => {
  const imageSrc = direction === "down" ? "/scroll-down.png" : "/scroll-up.png";

  return (
    <motion.div
    className="fixed right-8 bottom-8 flex flex-col items-center cursor-pointer z-30"
      onClick={onScroll}
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
      className="relative w-[323px] h-[323px] flex flex-col justify-center items-center bg-white rounded-full group"
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
        <span className="text-[#488BBE]">{title} </span>
        <span className="text-[#488BBE] font-bold">{boldTitle}</span>
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

function Homepage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [currentSection, setCurrentSection] = useState("hero");
  const [showScrollDown, setShowScrollDown] = useState(true);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const sectionsRef = useRef({});
  const sectionOrderRef = useRef(["hero", "services", "testimonials", "clients"]);
  
  // Handle scroll event to determine current section
  const handleScroll = () => {
    const scrollPosition = window.scrollY + window.innerHeight / 3;
    setHasScrolled(true);
    
    Object.entries(sectionsRef.current).forEach(([id, section]) => {
      if (section) {
        const { offsetTop, offsetHeight } = section;
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          setCurrentSection(id);
          
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
  
  useEffect(() => {
    const timer = setTimeout(() => {
      sectionsRef.current = {
        hero: document.getElementById("hero"),
        services: document.getElementById("services"),
        testimonials: document.getElementById("testimonials"),
        clients: document.getElementById("clients")
      };
      
      handleScroll();
    }, 100);
    
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);
  
  const handleNextSlide = (action, index) => {
    if (action === 'next') {
      setActiveSlide(1);
    } else if (action === 'prev') {
      setActiveSlide(0);
    } else if (action === 'goto' && index !== undefined) {
      setActiveSlide(index);
    }
  };
  
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const navbarHeight = 123;
      const yOffset = -navbarHeight; 
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };
  
  // Improved scroll to next section function
  const scrollToNextSection = () => {
    const currentIndex = sectionOrderRef.current.indexOf(currentSection);
    const nextSectionId = sectionOrderRef.current[currentIndex + 1];
    
    if (nextSectionId) {
      scrollToSection(nextSectionId);
    }
  };
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const ServicesSection = () => {
    const services = [
      {
        title: "Konseling",
        boldTitle: "Klinis",
        thumbnailSrc: "/layanan-kami-1.svg",
        action: () => window.location.href = "/layanan/klinis"
      },
      {
        title: "Konseling",
        boldTitle: "Pendidikan",
        thumbnailSrc: "/layanan-kami-2.svg",
        action: () => window.location.href = "/layanan/pendidikan"
      },
      {
        title: "Konseling",
        boldTitle: "Karir",
        thumbnailSrc: "/layanan-kami-3.svg",
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
          <span className="text-[#488BBE] font-extrabold">Kami</span>
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
    // Reference to track if component has mounted already
    const hasAnimatedRef = useRef(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    
    useEffect(() => {
      // Only animate once when the component first mounts
      if (!hasAnimatedRef.current) {
        setShouldAnimate(true);
        hasAnimatedRef.current = true;
      }
    }, []);
    
    return (
      <section id="testimonials" className="min-h-[810px] flex flex-col justify-center">
        <h2 className="text-center mb-6 text-4xl md:text-5xl">
          <span className="text-[#488BBE] font-extrabold">Kata mereka</span>{" "}
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
            initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
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
            <span className="text-[#488BBE] font-extrabold text-4xl md:text-5xl">Kami</span>
          </h2>
          <div className="flex flex-wrap gap-10 items-center justify-center px-4 mb-16">
            {clients.map((client, index) => (
              <img
                key={index}
                src={client.logo}
                alt={`${client.name} Logo`}
                className="object-contain h-12 md:h-16 hover:scale-110 transition-transform duration-300"
              />
            ))}
          </div>
        </div>
      </section>
    );
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
      
      <Navbar activeSection={currentSection} onSectionClick={scrollToSection} />
      
      <main className="pt-[20px]">
        <section id="hero" ref={el => sectionsRef.current.hero = el}>
          <HeroSection activeSlide={activeSlide} handleNextSlide={handleNextSlide} />
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
      
      <AnimatePresence>
        {showScrollDown && <ScrollButton direction="down" onScroll={scrollToNextSection} />}
        {showScrollUp && <ScrollButton direction="up" onScroll={scrollToTop} />}
      </AnimatePresence>
    </div>
  );
}

export default Homepage;