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
          <div style={{ maxWidth: 1440, margin: "0 auto", padding: "60px 80px 80px" }}>
            {/* Back link */}
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#227BCC", ...FONT, fontWeight: 500, fontSize: 16, marginBottom: 40 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 10H5M5 10L10 5M5 10L10 15" stroke="#227BCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Kembali ke Beranda
            </Link>

            <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
              {/* Left side */}
              <div style={{ flex: "1 1 50%", position: "relative" }}>
                {/* Badge */}
                <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: 24, backgroundColor: "#E8F5FF", marginBottom: 20 }}>
                  <span style={{ ...FONT, fontWeight: 600, fontSize: 14, color: "#227BCC" }}>Dukungan Pelanggan</span>
                </div>

                <h1 style={{ ...FONT, fontWeight: 700, fontSize: 48, lineHeight: "1.2em", color: "#0F172B", marginBottom: 16 }}>
                  Kontak <span style={{ color: "#227BCC" }}>Kami</span>
                </h1>

                <p style={{ ...FONT, fontWeight: 400, fontSize: 16, lineHeight: "1.6em", color: "#6F7480", marginBottom: 40 }}>
                  Punya pertanyaan  tentang fitur Ruang Diri atau ingin menjadwalkan demo? Tim kami siap membantu organisasi Anda bertransformasi ke era digital.
                </p>

                {/* Contact cards */}
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
              </div>

              {/* Right side - Form */}
              <div style={{ flex: "1 1 50%", backgroundColor: "#FFFFFF", borderRadius: 24, padding: "44px 40px", boxShadow: "0 4px 32px rgba(0,0,0,0.06)", border: "1px solid #F0F2F5" }}>
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
