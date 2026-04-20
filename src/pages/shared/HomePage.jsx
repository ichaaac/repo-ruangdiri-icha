import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import HeroSection from "../../components/home/HeroSection";
import Footer from "../../components/layout/Footer";

const layananData = [
  {
    number: "01",
    title: "Konseling Klinis",
    description:
      "Konseling klinis kami ditujukan untuk membantu Anda mengatasi tantangan kesehatan mental seperti kecemasan, depresi, dan trauma. Bersama psikolog klinis berpengalaman, kami menyediakan ruang yang aman dan terstruktur untuk proses perubahan dan pertumbuhan diri yang berkelanjutan dan bermakna.",
    image: "/landing/layanan-konseling-klinis.jpg",
  },
  {
    number: "02",
    title: "Konseling Pendidikan",
    description:
      "Layanan konseling pendidikan membantu pelajar atau karyawan dalam menghadapi berbagai tantangan akademik dan pengembangan diri. Kami memberikan dukungan untuk perencanaan karir, manajemen stres belajar, dan pengembangan potensi akademik.",
    image: "/landing/layanan-konseling-pendidikan.jpg",
  },
  {
    number: "03",
    title: "Konseling Karir",
    description:
      "Konseling karir kami membantu Anda menemukan jalur profesional yang sesuai dengan minat, nilai, dan keterampilan Anda. Dengan pendekatan yang terstruktur, kami membantu Anda membuat keputusan karir yang tepat dan merencanakan langkah-langkah untuk mencapai tujuan profesional Anda.",
    image: "/landing/layanan-konseling-karir.jpg",
  },
];

const keunggulanItems = [
  { icon: "/landing/icon-keseimbangan.svg", title: "Keseimbangan Hidup", desc: "Pelan-pelan bantu kamu menemukan ritme hidup yang lebih seimbang, agar Anda bisa menjalani hari dengan lebih tenang." },
  { icon: "/landing/icon-ruang-aman.svg", title: "Ruang Aman", desc: "Tempat untuk bercerita tanpa takut dihakimi, di mana Anda bisa merasa benar-benar didengar." },
  { icon: "/landing/icon-dukungan.svg", title: "Dukungan yang Tulus", desc: "Kami mendengarkan, bukan menghakimi, dengan empati di setiap percakapan." },
  { icon: "/landing/icon-didampingi.svg", title: "Didampingi Ahli", desc: "Didukung oleh profesional yang memahami kondisi kamu, dengan pendekatan yang sesuai untukmu." },
  { icon: "/landing/icon-waktu-fleksibel.svg", title: "Waktu Fleksibel", desc: "Bisa disesuaikan dengan waktu dan kebutuhanmu, sehingga tetap nyaman dijalani." },
  { icon: "/landing/icon-privasi.svg", title: "Privasi Terjaga", desc: "Sesi konselingmu aman dan bersifat rahasia, sehingga kamu bisa berbagi dengan lebih nyaman dan percaya diri." },
];

const faqItems = [
  { q: "Apa itu Ruang Diri?", a: "Ruang Diri adalah platform kesehatan mental yang membantu kamu memahami perasaan, mengelola pikiran, dan menjalani hari dengan lebih tenang melalui layanan konseling dan fitur pendukung." },
  { q: "Apakah semua cerita yang dibagikan aman?", a: "Ya, semua cerita yang Anda bagikan bersifat rahasia dan dilindungi. Kami menjaga privasi setiap pengguna agar kamu bisa berbagi dengan aman dan nyaman tanpa rasa khawatir." },
  { q: "Bagaimana cara memulai konsultasi?", a: "Anda cukup memilih layanan yang tersedia, menentukan jadwal yang sesuai, lalu memulai sesi bersama psikolog. Prosesnya dibuat sederhana agar mudah diikuti." },
  { q: "Apakah harus punya masalah besar untuk mulai?", a: "Tidak. Anda tidak perlu menunggu sampai merasa sangat terbebani. Ruang Diri bisa menjadi tempat untuk bercerita, memahami diri, dan menjaga kesehatan mental sejak dini." },
  { q: "Apakah Ruang diri bisa melakukan konsultasi tatap muka?", a: "Ruang Diri adalah platform kesehatan mental yang membantu Anda memahami perasaan, mengelola pikiran, dan menjalani hari dengan lebih tenang melalui layanan konseling dan fitur pendukung." },
];

// Arrow icon SVG
const ArrowIcon = ({ size = 18, color = "#FDFEFF" }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M7.5 5.25L12 5.25L12 9.75" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.625 12.375L11.8125 6.1875" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Homepage() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState("hero");
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const sectionsRef = useRef({});

  const [userSelectedTab, setUserSelectedTab] = useState(false);

  useEffect(() => {
    if (userSelectedTab) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % layananData.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [userSelectedTab]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 3;
      Object.entries(sectionsRef.current).forEach(([id, el]) => {
        if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
          setCurrentSection(id);
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const currentLayanan = layananData[activeTab];

  return (
    <div className="overflow-x-hidden" style={{ backgroundColor: "#FDFEFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />

      <Navbar activeSection={currentSection} onSectionClick={scrollToSection} />

      <main style={{ paddingTop: 76 }}>

        {/* Hero */}
        <div ref={(el) => (sectionsRef.current.hero = el)}>
          <HeroSection />
        </div>

        {/* ===== LAYANAN SECTION ===== */}
        <section
          id="layanan"
          ref={(el) => (sectionsRef.current.layanan = el)}
          className="w-full"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <div className="mx-auto px-6 pt-10 pb-6 lg:px-20 lg:pt-16 lg:pb-0" style={{ maxWidth: 1440 }}>
            <div className="flex flex-col gap-6 lg:gap-9">

              {/* Title */}
              <div className="flex flex-col gap-2 text-center mx-auto w-full" style={{ maxWidth: 1296 }}>
                <h2 style={{ fontWeight: 600, lineHeight: "1.2em" }} className="text-2xl lg:text-[40px] lg:leading-[1.4em]">
                  <span style={{ color: "#0F172B" }}>Layanan </span>
                  <span style={{ color: "#227BCC" }}>Ruang Diri</span>
                </h2>
                <p className="text-base lg:text-[18px]" style={{ fontWeight: 400, lineHeight: "1.4em", color: "#6F7480" }}>
                  Layanan yang dirancang untuk membantu Anda memahami diri dan menjalani hari dengan lebih tenang.
                </p>
              </div>

              {/* Mobile: 3 stacked cards (Figma mobile design) */}
              <div className="flex flex-col gap-6 lg:hidden">
                {layananData.map((item) => (
                  <div
                    key={item.number}
                    style={{ border: "1px solid #DADDE1", borderRadius: 24, padding: 32, backgroundColor: "#FDFEFF", display: "flex", flexDirection: "column", gap: 24 }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", padding: "16px 24px", backgroundColor: "#EFF4FF", borderRadius: 16, alignSelf: "flex-start" }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: 24, lineHeight: "40px", color: "#227BCC" }}>
                        {item.number}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <h3 style={{ fontWeight: 500, fontSize: 20, lineHeight: "1.4em", color: "#0F172B" }}>{item.title}</h3>
                      <p style={{ fontWeight: 400, fontSize: 14, lineHeight: "1.4em", color: "#6F7480" }}>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabs + image + single card */}
              <div className="hidden lg:flex flex-col gap-6">
                {/* Tabs */}
                <div className="flex justify-center items-center gap-4 flex-wrap">
                  {layananData.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveTab(i); setUserSelectedTab(true); }}
                      style={{
                        padding: "12px 24px", borderRadius: 60, fontSize: 16, lineHeight: "1.4em",
                        fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "pointer", border: "none",
                        backgroundColor: activeTab === i ? "#EFF4FF" : "#ECEEF0",
                        color: activeTab === i ? "#227BCC" : "#3F4555",
                        transition: "all 0.2s",
                      }}
                    >
                      {item.tab || item.title}
                    </button>
                  ))}
                </div>

                {/* Image + Text card */}
                <div className="flex justify-center items-center gap-12">
                  <div style={{ width: 292, height: 379, borderRadius: 24, overflow: "hidden", flexShrink: 0 }}>
                    <img src={currentLayanan.image} alt={currentLayanan.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, border: "1px solid #DADDE1", borderRadius: 24, padding: 32, backgroundColor: "#FDFEFF", display: "flex", flexDirection: "column", gap: 24 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", padding: 24, backgroundColor: "#EFF4FF", borderRadius: 16, alignSelf: "flex-start" }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: 36, lineHeight: "1.11em", color: "#227BCC" }}>
                        {currentLayanan.number}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <h3 style={{ fontWeight: 500, fontSize: 24, lineHeight: "1.2em", color: "#0F172B" }}>{currentLayanan.title}</h3>
                      <p style={{ fontWeight: 400, fontSize: 16, lineHeight: "1.4em", color: "#6F7480" }}>{currentLayanan.description}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ===== KEUNGGULAN SECTION ===== */}
        <section
          id="keunggulan"
          ref={(el) => (sectionsRef.current.keunggulan = el)}
          className="relative w-full overflow-hidden"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          {/* Desktop snow bg */}
          <img
            src="/landing/snow-decoration.svg"
            alt=""
            className="absolute top-0 pointer-events-none hidden lg:block"
            style={{ left: -134, width: 2271, height: "100%", opacity: 0.18, zIndex: 0 }}
          />

          <div className="relative z-10 mx-auto px-6 pt-10 pb-6 lg:px-20 lg:py-20" style={{ maxWidth: 1440 }}>
            <div className="flex flex-col gap-8 lg:gap-12">

              {/* Title */}
              <div className="text-center w-full" style={{ maxWidth: 1296, margin: "0 auto" }}>
                <h2 className="text-2xl lg:text-[40px]" style={{ fontWeight: 600, lineHeight: "1.4em" }}>
                  <span style={{ color: "#0F172B" }}>Kenapa Perusahaan Memilih </span>
                  <span style={{ color: "#227BCC" }}>Ruang Diri</span>
                  <span style={{ color: "#0F172B" }}>?</span>
                </h2>
                <p className="text-base lg:text-[18px] mt-3" style={{ fontWeight: 400, lineHeight: "1.4em", color: "#6F7480" }}>
                  Solusi tepat untuk membantu karyawan menjaga kesehatan mental dan keseimbangan hidup.
                </p>
              </div>

              {/* Mobile: vertical list (Figma mobile) */}
              <div className="flex flex-col gap-7 lg:hidden">
                {keunggulanItems.map((item, i) => (
                  <div key={i} className="flex flex-col gap-4">
                    <img src={item.icon} alt="" style={{ width: 56, height: 56, flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <h4 style={{ fontWeight: 500, fontSize: 18, lineHeight: "1.4em", color: "#0F172B" }}>{item.title}</h4>
                      <p style={{ fontWeight: 400, fontSize: 14, lineHeight: "1.4em", color: "#3F4555" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: absolute layout with center logo */}
              <div className="hidden lg:block relative w-full" style={{ height: 500 }}>
                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 548, height: 548 }}>
                  {[0, 34, 64.5].map((inset, i) => (
                    <div key={i} style={{ position: "absolute", inset, borderRadius: "50%", border: "1.2px solid #D7E4FF" }} />
                  ))}
                  <div style={{ position: "absolute", inset: 99, borderRadius: "50%", backgroundColor: "#F0F5FF", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                    <img src="/landing/logo-keunggulan.png" alt="" style={{ width: 280, height: 260, objectFit: "contain" }} />
                  </div>
                </div>
                {[
                  { item: keunggulanItems[0], style: { left: 0, top: 30, width: 376 } },
                  { item: keunggulanItems[2], style: { left: -20, top: 200, width: 376 } },
                  { item: keunggulanItems[5], style: { left: 20, top: 380, width: 376 } },
                  { item: keunggulanItems[1], style: { right: 0, top: 30, width: 376 } },
                  { item: keunggulanItems[3], style: { right: -30, top: 200, width: 376 } },
                  { item: keunggulanItems[4], style: { right: -10, top: 380, width: 392 } },
                ].map(({ item, style }, i) => (
                  <div key={i} style={{ position: "absolute", display: "flex", alignItems: "flex-start", gap: 12, zIndex: 1, ...style }}>
                    <img src={item.icon} alt="" style={{ width: 72, height: 72, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <h4 style={{ fontWeight: 500, fontSize: 20, lineHeight: "1.4em", color: "#0F172B" }}>{item.title}</h4>
                      <p style={{ fontWeight: 400, fontSize: 16, lineHeight: "1.4em", color: "#3F4555" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section
          id="kontak"
          ref={(el) => (sectionsRef.current.kontak = el)}
          className="relative overflow-hidden w-full"
          style={{ backgroundColor: "#E8EFFF" }}
        >
          {/* Wave decorations — desktop only */}
          <div className="hidden lg:block">
            <svg className="absolute top-0 left-0 w-full pointer-events-none" viewBox="0 0 1440 389" fill="none" preserveAspectRatio="none" style={{ transform: "rotate(180deg)" }}>
              <path d="M0 389C0 389 200 200 400 250C600 300 750 100 1000 150C1250 200 1440 50 1440 50V389H0Z" fill="url(#waveTopGrad)" fillOpacity="0.15"/>
              <defs><linearGradient id="waveTopGrad" x1="0" y1="0" x2="1440" y2="389"><stop stopColor="#C8DEFF"/><stop offset="1" stopColor="#E4F5FF"/></linearGradient></defs>
            </svg>
            <svg className="absolute bottom-0 left-0 w-full pointer-events-none" viewBox="0 0 1440 389" fill="none" preserveAspectRatio="none">
              <path d="M0 0C0 0 250 200 500 150C750 100 900 300 1150 250C1400 200 1440 350 1440 350V389H0Z" fill="url(#waveBotGrad)" fillOpacity="0.15"/>
              <defs><linearGradient id="waveBotGrad" x1="0" y1="0" x2="1440" y2="389"><stop stopColor="#E4F5FF"/><stop offset="1" stopColor="#C8DEFF"/></linearGradient></defs>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-9 text-center px-6 py-20 lg:py-24 mx-auto" style={{ maxWidth: 1440 }}>
            <div className="flex flex-col gap-3 items-center">
              <h2 className="text-2xl lg:text-[40px]" style={{ fontWeight: 600, lineHeight: "1.4em", color: "#0F172B", maxWidth: 800 }}>
                Mulai perjalananmu untuk merasa lebih baik, satu langkah kecil dari sekarang
              </h2>
              <p className="text-base lg:text-[24px]" style={{ fontWeight: 400, lineHeight: "1.4em", color: "#6F7480" }}>
                Kami di sini untuk mendengarkan dan membantu Anda memahami semuanya.
              </p>
            </div>
            <button
              onClick={() => navigate("/kontak")}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
              style={{ padding: "16px 24px", borderRadius: 12, backgroundColor: "#155DFC", border: "none" }}
            >
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 16, lineHeight: "1.4em", color: "#FDFEFF" }}>
                Konsultasi Sekarang
              </span>
              <div style={{ transform: "rotate(-45deg)", display: "flex" }}>
                <ArrowIcon size={18} color="#FDFEFF" />
              </div>
            </button>
          </div>
        </section>

        {/* ===== FAQ SECTION ===== */}
        <section
          id="faq"
          ref={(el) => (sectionsRef.current.faq = el)}
          className="w-full"
          style={{ backgroundColor: "#FDFEFF" }}
        >
          <div className="mx-auto px-6 py-10 lg:px-20 lg:py-20" style={{ maxWidth: 1440 }}>
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

              {/* Left */}
              <div className="w-full lg:flex-none lg:max-w-[480px]">
                <h2 className="text-xl lg:text-[32px]" style={{ fontWeight: 600, lineHeight: "1.4em", color: "#2563EB" }}>
                  Pertanyaan yang Sering Diajukan
                </h2>
                <p className="mt-2 text-base" style={{ fontWeight: 400, lineHeight: "1.8em", color: "#101415" }}>
                  Temukan jawaban dari hal-hal yang mungkin sedang kamu pikirkan sebelum memulai di Ruang Diri.
                </p>
                <img src="/landing/faq-illustration.svg" alt="" className="hidden lg:block mt-8 w-full max-w-[400px]" />
              </div>

              {/* Accordion */}
              <div className="flex-1 flex flex-col gap-5 w-full">
                {faqItems.map((item, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div
                      key={i}
                      style={{ borderRadius: 24, backgroundColor: isOpen ? "#EDF2FF" : "transparent", transition: "background-color 0.2s" }}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? -1 : i)}
                        className="w-full flex items-center justify-between gap-4 text-left"
                        style={{ padding: "20px", cursor: "pointer", background: "none", border: "none" }}
                      >
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 16, lineHeight: "1.4em", color: "#0F172B", flex: 1 }}>
                          {item.q}
                        </span>
                        <div style={{ flexShrink: 0, width: 20, height: 20, transition: "transform 0.2s", transform: isOpen ? "rotate(0deg)" : "rotate(180deg)" }}>
                          <img src="/landing/faq-chevron.svg" alt="" style={{ width: 20, height: 20 }} />
                        </div>
                      </button>
                      {isOpen && (
                        <div style={{ padding: "0 20px 20px", fontWeight: 400, fontSize: 14, lineHeight: "1.6em", color: "#0F172B" }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default Homepage;
