import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/layout/Navbar";
import HeroSection from "../../components/home/HeroSection";
import Footer from "../../components/layout/Footer";

const layananData = [
  {
    tab: "Konseling Klinis",
    number: "01",
    title: "Konseling Klinis",
    description:
      "Konseling klinis kami ditujukan untuk membantu Anda mengatasi tantangan kesehatan mental seperti kecemasan, depresi, dan trauma. Bersama psikolog klinis berpengalaman, kami menyediakan ruang yang aman dan terstruktur untuk proses perubahan dan pertumbuhan diri yang berkelanjutan dan bermakna.",
    image: "/landing/layanan-konseling-klinis.jpg",
  },
  {
    tab: "Konseling Pendidikan",
    number: "02",
    title: "Konseling Pendidikan",
    description:
      "Layanan konseling pendidikan membantu pelajar atau karyawan dalam menghadapi berbagai tantangan akademik dan pengembangan diri. Kami memberikan dukungan untuk perencanaan karir, manajemen stres belajar, dan pengembangan potensi akademik.",
    image: "/landing/layanan-konseling-pendidikan.jpg",
  },
  {
    tab: "Konseling Karir",
    number: "03",
    title: "Konseling Karir",
    description:
      "Konseling karir kami membantu Anda menemukan jalur profesional yang sesuai dengan minat, nilai, dan keterampilan Anda. Dengan pendekatan yang terstruktur, kami membantu Anda membuat keputusan karir yang tepat dan merencanakan langkah-langkah untuk mencapai tujuan profesional Anda.",
    image: "/landing/layanan-konseling-karir.jpg",
  },
];

const keunggulanItems = [
  { icon: "/landing/icon-keseimbangan.svg", title: "Keseimbangan Hidup", desc: "Pelan-pelan bantu kamu menemukan ritme hidup yang lebih seimbang, agar Anda  bisa menjalani hari dengan lebih tenang." },
  { icon: "/landing/icon-didampingi.svg", title: "Didampingi Ahli", desc: "Didukung oleh profesional yang memahami kondisi kamu, dengan pendekatan yang sesuai untukmu." },
  { icon: "/landing/icon-ruang-aman.svg", title: "Ruang Aman", desc: "Tempat untuk bercerita tanpa takut dihakimi, di mana Anda bisa merasa benar-benar didengar." },
  { icon: "/landing/icon-waktu-fleksibel.svg", title: "Waktu Fleksibel", desc: "Bisa disesuaikan dengan waktu dan kebutuhanmu, sehingga tetap nyaman dijalani." },
  { icon: "/landing/icon-privasi.svg", title: "Privasi Terjaga", desc: "Sesi konselingmu aman dan bersifat rahasia, sehingga kamu bisa berbagi dengan lebih nyaman dan percaya diri." },
  { icon: "/landing/icon-dukungan.svg", title: "Dukungan yang Tulus", desc: "Kami mendengarkan, bukan menghakimi, dengan empati di setiap percakapan." },
];

const faqItems = [
  { q: "Apa itu Ruang Diri?", a: "Ruang Diri adalah platform kesehatan mental yang membantu kamu memahami perasaan, mengelola pikiran, dan menjalani hari dengan lebih tenang melalui layanan konseling dan fitur pendukung." },
  { q: "Apakah semua cerita yang dibagikan aman?", a: "Ya, semua cerita yang Anda bagikan bersifat rahasia dan dilindungi. Kami menjaga privasi setiap pengguna agar kamu bisa berbagi dengan aman dan nyaman tanpa rasa khawatir." },
  { q: "Bagaimana cara memulai konsultasi?", a: "Anda cukup memilih layanan yang tersedia, menentukan jadwal yang sesuai, lalu memulai sesi bersama psikolog. Prosesnya dibuat sederhana agar mudah diikuti." },
  { q: "Apakah harus punya masalah besar untuk mulai?", a: "Tidak. Anda tidak perlu menunggu sampai merasa sangat terbebani. Ruang Diri bisa menjadi tempat untuk bercerita, memahami diri, dan menjaga kesehatan mental sejak dini." },
  { q: "Apakah Ruang diri bisa melakukan konsultasi tatap muka?", a: "Ruang Diri adalah platform kesehatan mental yang membantu Anda memahami perasaan, mengelola pikiran, dan menjalani hari dengan lebih tenang melalui layanan konseling dan fitur pendukung." },
];

function Homepage() {
  const [currentSection, setCurrentSection] = useState("hero");
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const sectionsRef = useRef({});

  // Auto-rotate layanan tabs every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % layananData.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
        {/* Figma: column, gap 48px, padding 80px 80px 0, width 1440, bg #FFFFFF */}
        <section
          id="layanan"
          ref={(el) => (sectionsRef.current.layanan = el)}
          style={{ maxWidth: 1440, margin: "0 auto", padding: "60px 80px 0", display: "flex", flexDirection: "column", gap: 36 }}
        >
          {/* Title block: column, center, gap 8px, width 1296 */}
          <div style={{ maxWidth: 1296, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
            <h2 style={{ fontWeight: 600, fontSize: 40, lineHeight: "56px" }}>
              <span style={{ color: "#0F172B" }}>Layanan </span>
              <span style={{ color: "#227BCC" }}>Ruang Diri</span>
            </h2>
            <p style={{ fontWeight: 400, fontSize: 18, lineHeight: "1.4em", color: "#6F7480" }}>
              Layanan yang dirancang untuk membantu Anda memahami diri dan menjalani hari dengan lebih tenang.
            </p>
          </div>

          {/* Tabs: row, center, gap 16px */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {layananData.map((item, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 60,
                  fontSize: 16,
                  lineHeight: "1.4em",
                  fontWeight: 500,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: activeTab === i ? "#EFF4FF" : "#ECEEF0",
                  color: activeTab === i ? "#227BCC" : "#3F4555",
                  transition: "all 0.2s",
                }}
              >
                {item.tab}
              </button>
            ))}
          </div>

          {/* Image & Text: row, center, gap 48px */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
            {/* Image container: 292x379, radius 24px */}
            <div style={{ width: 292, height: 379, borderRadius: 24, overflow: "hidden", flexShrink: 0 }}>
              <img src={currentLayanan.image} alt={currentLayanan.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            {/* Text card: fill, border 1px #DADDE1, radius 24px, padding 32px, bg #FDFEFF */}
            <div style={{
              flex: 1,
              minWidth: 300,
              border: "1px solid #DADDE1",
              borderRadius: 24,
              padding: 32,
              backgroundColor: "#FDFEFF",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}>
              {/* Number badge: padding 24px, bg #EFF4FF, radius 16px */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                padding: 24,
                backgroundColor: "#EFF4FF",
                borderRadius: 16,
                alignSelf: "flex-start",
              }}>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: 36,
                  lineHeight: "1.11em",
                  color: "#227BCC",
                }}>
                  {currentLayanan.number}
                </span>
              </div>

              {/* Title + Description: column, gap 12px */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 style={{ fontWeight: 500, fontSize: 24, lineHeight: "1.2em", color: "#0F172B" }}>
                  {currentLayanan.title}
                </h3>
                <p style={{ fontWeight: 400, fontSize: 16, lineHeight: "1.4em", color: "#6F7480" }}>
                  {currentLayanan.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== KEUNGGULAN SECTION ===== */}
        <section
          id="keunggulan"
          ref={(el) => (sectionsRef.current.keunggulan = el)}
          style={{ position: "relative", width: "100%", overflow: "hidden", backgroundColor: "#FFFFFF" }}
        >
          {/* Snow decoration background */}
          <img
            src="/landing/snow-decoration.svg"
            alt=""
            style={{ position: "absolute", top: 0, left: -134, width: 2271, height: "100%", opacity: 0.18, pointerEvents: "none", zIndex: 0 }}
          />

          <div style={{ position: "relative", zIndex: 1, padding: "80px 80px", display: "flex", flexDirection: "column", alignItems: "center", gap: 48, maxWidth: 1440, margin: "0 auto" }}>
            {/* Title */}
            <div style={{ textAlign: "center", width: "100%", maxWidth: 1296 }}>
              <h2 style={{ fontWeight: 600, fontSize: 40, lineHeight: "1.4em" }}>
                <span style={{ color: "#0F172B" }}>Kenapa Perusahaan Memilih </span>
                <span style={{ color: "#227BCC" }}>Ruang Diri</span>
                <span style={{ color: "#0F172B" }}>?</span>
              </h2>
              <p style={{ fontWeight: 400, fontSize: 18, lineHeight: "1.4em", color: "#6F7480", marginTop: 8 }}>
                Solusi tepat untuk membantu karyawan menjaga kesehatan mental dan keseimbangan hidup.
              </p>
            </div>

            {/* Features layout - relative container with absolute items */}
            <div style={{ position: "relative", width: "100%", height: 500 }}>

              {/* Center: Logo with orbit circles */}
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 548, height: 548 }}>
                {[0, 34, 64.5].map((inset, i) => (
                  <div key={i} style={{ position: "absolute", inset, borderRadius: "50%", border: "1.2px solid #D7E4FF" }} />
                ))}
                <div style={{
                  position: "absolute", inset: 99, borderRadius: "50%", backgroundColor: "#F0F5FF",
                  display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden",
                }}>
                  <img src="/landing/logo-keunggulan.png" alt="" style={{ width: 280, height: 260, objectFit: "contain" }} />
                </div>
              </div>

              {/* Feature items positioned around the circle */}
              {[
                { item: keunggulanItems[0], style: { left: 0, top: 30, width: 376 } },
                { item: keunggulanItems[2], style: { left: -20, top: 200, width: 376 } },
                { item: keunggulanItems[5], style: { left: 20, top: 380, width: 376 } },
                { item: keunggulanItems[1], style: { right: 0, top: 30, width: 376 } },
                { item: keunggulanItems[3], style: { right: -30, top: 200, width: 376 } },
                { item: keunggulanItems[4], style: { right: -10, top: 380, width: 392 } },
              ].map(({ item, style }, i) => (
                <div key={i} style={{ position: "absolute", display: "flex", alignItems: "flex-start", gap: 12, ...style }}>
                  <img src={item.icon} alt="" style={{ width: 72, height: 72, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <h4 style={{ fontWeight: 500, fontSize: 20, lineHeight: "1.4em", color: "#0F172B" }}>{item.title}</h4>
                    <p style={{ fontWeight: 400, fontSize: 16, lineHeight: "1.4em", color: "#3F4555" }}>{item.desc}</p>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section
          id="kontak"
          ref={(el) => (sectionsRef.current.kontak = el)}
          className="relative overflow-hidden w-full py-24 px-6"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(228,245,255,0.6) 100%)" }}
        >
          {/* Wave top (rotated 180°) */}
          <svg className="absolute top-0 left-0 w-full pointer-events-none" viewBox="0 0 1440 389" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ transform: "rotate(180deg)" }}>
            <path d="M0 389C0 389 200 200 400 250C600 300 750 100 1000 150C1250 200 1440 50 1440 50V389H0Z" fill="url(#waveTopGrad)" fillOpacity="0.15"/>
            <defs><linearGradient id="waveTopGrad" x1="0" y1="0" x2="1440" y2="389"><stop stopColor="#C8DEFF"/><stop offset="1" stopColor="#E4F5FF"/></linearGradient></defs>
          </svg>
          {/* Wave bottom */}
          <svg className="absolute bottom-0 left-0 w-full pointer-events-none" viewBox="0 0 1440 389" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 0C0 0 250 200 500 150C750 100 900 300 1150 250C1400 200 1440 350 1440 350V389H0Z" fill="url(#waveBotGrad)" fillOpacity="0.15"/>
            <defs><linearGradient id="waveBotGrad" x1="0" y1="0" x2="1440" y2="389"><stop stopColor="#E4F5FF"/><stop offset="1" stopColor="#C8DEFF"/></linearGradient></defs>
          </svg>

          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <h2 className="font-bold text-3xl md:text-[40px] md:leading-[1.3em] text-[#0F172B] max-w-[800px]">
              Mulai perjalananmu untuk merasa lebih baik, satu langkah kecil dari sekarang
            </h2>
            <p className="text-lg text-[#6F7480] leading-relaxed">
              Kami di sini untuk mendengarkan dan membantu Anda memahami semuanya.
            </p>
            <a
              href="/kontak"
              className="inline-flex items-center gap-2 px-6 py-4 mt-4 bg-[#227BCC] rounded-xl no-underline hover:opacity-90 transition-opacity"
            >
              <span className="font-semibold text-xl text-white">Konsultasi Sekarang</span>
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.3965 10.9598L22.9808 10.9598L22.9808 19.5441" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.96 22.981L22.8606 11.0804" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </section>

        {/* ===== FAQ SECTION ===== */}
        <section
          id="faq"
          ref={(el) => (sectionsRef.current.faq = el)}
          style={{ maxWidth: 1440, margin: "0 auto", padding: "80px 80px", backgroundColor: "#F8FAFC" }}
        >
          <div style={{ display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Left side */}
            <div style={{ flex: "0 0 auto", maxWidth: 480 }}>
              <h2 style={{ fontWeight: 600, fontSize: 32, lineHeight: "1.4em", color: "#227BCC" }}>
                Pertanyaan yang Sering Diajukan
              </h2>
              <p style={{ marginTop: 12, fontWeight: 400, fontSize: 16, lineHeight: "1.6em", color: "#6F7480" }}>
                Temukan jawaban dari hal-hal yang mungkin sedang kamu pikirkan sebelum memulai di Ruang Diri.
              </p>
              <img src="/landing/faq-illustration.svg" alt="" style={{ marginTop: 32, width: "100%", maxWidth: 400 }} className="hidden lg:block" />
            </div>

            {/* Right: Accordion */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 300 }}>
              {faqItems.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    style={{
                      borderRadius: 24,
                      backgroundColor: isOpen ? "#EFF4FF" : "transparent",
                      transition: "background-color 0.2s",
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : i)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "20px 24px", cursor: "pointer",
                        background: "none", border: "none", textAlign: "left",
                      }}
                    >
                      <span style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 600, fontSize: 18, lineHeight: "1.4em", color: "#0F172B",
                      }}>
                        {item.q}
                      </span>
                      <img
                        src="/landing/faq-chevron.svg"
                        alt=""
                        style={{
                          width: 20, height: 20, flexShrink: 0, marginLeft: 16,
                          transition: "transform 0.2s",
                          transform: isOpen ? "rotate(0deg)" : "rotate(180deg)",
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: "0 24px 20px",
                        fontWeight: 400, fontSize: 16, lineHeight: "1.6em", color: "#0F172B",
                      }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Homepage;
