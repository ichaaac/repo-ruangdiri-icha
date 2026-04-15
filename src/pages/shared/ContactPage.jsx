import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const FONT = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

function ContactPage() {
  const [form, setForm] = useState({ nama: "", email: "", telepon: "", pesan: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = encodeURIComponent(`Halo, saya ${form.nama}.\n\n${form.pesan}\n\nEmail: ${form.email}\nTelepon: ${form.telepon}`);
    window.open(`https://wa.me/6281542322127?text=${msg}`, "_blank");
  };

  return (
    <div style={{ backgroundColor: "#FDFEFF", ...FONT, minHeight: "100vh" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" />
      <Navbar activeSection="kontak" onSectionClick={() => {}} />

      <main style={{ paddingTop: 76 }}>
        <div style={{ background: "linear-gradient(180deg, #FAFBFE 0%, #FFFFFF 100%)", position: "relative", overflow: "hidden" }}>
          {/* Top gradient line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #227BCC 0%, #60B5F6 100%)" }} />

          <div style={{ maxWidth: 1440, margin: "0 auto", padding: "60px 80px 80px" }}>
            {/* Back link */}
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#227BCC", ...FONT, fontWeight: 500, fontSize: 16, marginBottom: 40 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 10H5M5 10L10 5M5 10L10 15" stroke="#227BCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Kembali ke Beranda
            </Link>

            <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
              {/* Left side */}
              <div style={{ flex: "0 0 460", maxWidth: 460, position: "relative" }}>
                {/* Badge */}
                <div style={{ display: "inline-block", padding: "6px 20px", borderRadius: 100, backgroundColor: "#227BCC", marginBottom: 20 }}>
                  <span style={{ ...FONT, fontWeight: 500, fontSize: 14, color: "#FFFFFF" }}>Dukungan Pelanggan</span>
                </div>

                <h1 style={{ ...FONT, fontWeight: 700, fontSize: 48, lineHeight: "1.2em", color: "#0F172B", marginBottom: 16 }}>
                  Kontak <span style={{ color: "#227BCC", fontStyle: "italic" }}>Kami</span>
                </h1>

                <p style={{ ...FONT, fontWeight: 400, fontSize: 16, lineHeight: "1.6em", color: "#6F7480", marginBottom: 40 }}>
                  Punya pertanyaan  tentang fitur Ruang Diri atau ingin menjadwalkan demo? Tim kami siap membantu organisasi Anda bertransformasi ke era digital.
                </p>

                {/* Contact cards - full width */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Email */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 28px", borderRadius: 16, backgroundColor: "#FFFFFF", border: "1px solid #E8ECF1" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "#EFF4FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#227BCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div>
                      <p style={{ ...FONT, fontWeight: 600, fontSize: 16, color: "#0F172B", marginBottom: 2 }}>Email</p>
                      <p style={{ ...FONT, fontWeight: 400, fontSize: 14, color: "#6F7480" }}>icha@ariakarsa.com</p>
                    </div>
                  </div>

                  {/* Telepon */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 28px", borderRadius: 16, backgroundColor: "#FFFFFF", border: "1px solid #E8ECF1" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div>
                      <p style={{ ...FONT, fontWeight: 600, fontSize: 16, color: "#0F172B", marginBottom: 2 }}>Telepon</p>
                      <p style={{ ...FONT, fontWeight: 400, fontSize: 14, color: "#6F7480" }}>+62 815-4232-2127</p>
                    </div>
                  </div>
                </div>

                {/* Decorative diamond + circles at bottom */}
                <div style={{ position: "relative", marginTop: 40, height: 120, pointerEvents: "none" }}>
                  {/* Diamond */}
                  <div style={{ position: "absolute", left: 180, top: 10, width: 24, height: 24, backgroundColor: "#D7E4FF", transform: "rotate(45deg)", borderRadius: 4 }} />
                  {/* Dashed circles */}
                  <svg style={{ position: "absolute", left: 120, top: 20 }} width="160" height="100" viewBox="0 0 160 100" fill="none">
                    <circle cx="80" cy="80" r="78" stroke="#D7E4FF" strokeWidth="1.2" strokeDasharray="6 4" />
                    <circle cx="80" cy="80" r="58" stroke="#D7E4FF" strokeWidth="1.2" strokeDasharray="6 4" />
                  </svg>
                </div>

                {/* Small dot decoration near text */}
                <div style={{ position: "absolute", top: 200, right: -10, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#D7E4FF", pointerEvents: "none" }} />
              </div>

              {/* Right side - Form */}
              <div style={{ flex: 1, backgroundColor: "#FFFFFF", borderRadius: 24, padding: "44px 40px", boxShadow: "0 4px 32px rgba(0,0,0,0.06)", border: "1px solid #F0F2F5", minWidth: 500 }}>
                <h2 style={{ ...FONT, fontWeight: 700, fontSize: 24, color: "#0F172B", marginBottom: 8 }}>Kirim Pesan</h2>
                <p style={{ ...FONT, fontWeight: 400, fontSize: 14, color: "#6F7480", marginBottom: 32 }}>
                  Isi formulir di bawah ini dan kami akan segera menghubungi Anda
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <label style={{ ...FONT, fontWeight: 600, fontSize: 14, color: "#0F172B", display: "block", marginBottom: 8 }}>Nama</label>
                    <input
                      name="nama" value={form.nama} onChange={handleChange} required
                      placeholder="Masukkan nama Anda"
                      style={{ ...FONT, width: "100%", padding: "14px 20px", borderRadius: 100, border: "1px solid #E0E3E8", backgroundColor: "#F8FAFC", fontSize: 14, color: "#0F172B", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ ...FONT, fontWeight: 600, fontSize: 14, color: "#0F172B", display: "block", marginBottom: 8 }}>Email</label>
                    <input
                      name="email" type="email" value={form.email} onChange={handleChange} required
                      placeholder="nama@email.com"
                      style={{ ...FONT, width: "100%", padding: "14px 20px", borderRadius: 100, border: "1px solid #E0E3E8", backgroundColor: "#F8FAFC", fontSize: 14, color: "#0F172B", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ ...FONT, fontWeight: 600, fontSize: 14, color: "#0F172B", display: "block", marginBottom: 8 }}>No.Telepon</label>
                    <input
                      name="telepon" value={form.telepon} onChange={handleChange}
                      placeholder="0877-1111-2222"
                      style={{ ...FONT, width: "100%", padding: "14px 20px", borderRadius: 100, border: "1px solid #E0E3E8", backgroundColor: "#F8FAFC", fontSize: 14, color: "#0F172B", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ ...FONT, fontWeight: 600, fontSize: 14, color: "#0F172B", display: "block", marginBottom: 8 }}>Pesan</label>
                    <textarea
                      name="pesan" value={form.pesan} onChange={handleChange} required rows={5}
                      placeholder="Tuliskan pesan atau pertanyaan Anda di sini..."
                      style={{ ...FONT, width: "100%", padding: "14px 20px", borderRadius: 16, border: "1px solid #E0E3E8", backgroundColor: "#F8FAFC", fontSize: 14, color: "#0F172B", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="hover:opacity-90 transition-opacity"
                    style={{ ...FONT, width: "100%", padding: "16px 24px", borderRadius: 100, backgroundColor: "#227BCC", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8 }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 16, color: "#FFFFFF" }}>Kirim</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14.6673 1.33334L7.33398 8.66668M14.6673 1.33334L10.0007 14.6667L7.33398 8.66668M14.6673 1.33334L1.33398 6.00001L7.33398 8.66668" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ContactPage;
