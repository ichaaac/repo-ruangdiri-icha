import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { loginSchema } from "../../../schemas/validationSchema";

const WaveTop = () => (
  <svg className="absolute top-0 left-0 pointer-events-none" width="1172" height="458" viewBox="0 0 1172 458" fill="none">
    <path d="M825.574 280.31C679.818 288.283 540.881 250.084 402.09 224.228C354.398 215.337 303.796 207.766 254.172 212.458C174.818 219.96 115.339 257.196 78.0215 296.554C40.7042 335.912 18.5425 379.491 -23.993 417.197C-41.3108 432.557 -63.7012 447.217 -90 458V-29H1152.22C1181.12 35.9616 1182.28 105.225 1129.12 164.508C1072.16 228.002 953.388 273.325 825.574 280.31Z" fill="url(#waveTopGrad)" fillOpacity="0.3" />
    <defs>
      <linearGradient id="waveTopGrad" x1="1255" y1="114" x2="358.5" y2="63" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" /><stop offset="0.898" stopColor="#74D2E8" />
      </linearGradient>
    </defs>
  </svg>
);

const WaveBottom = () => (
  <svg className="absolute bottom-0 right-0 pointer-events-none" width="1184" height="458" viewBox="0 0 1184 458" fill="none">
    <path d="M346.426 177.689C492.182 169.717 631.119 207.916 769.91 233.772C817.602 242.663 868.204 250.234 917.828 245.542C997.182 238.04 1056.66 200.804 1093.98 161.446C1131.3 122.088 1153.46 78.5092 1195.99 40.8032C1213.31 25.4432 1235.7 10.783 1262 0V487H19.7804C-9.11719 422.038 -10.2814 352.775 42.8776 293.492C99.8411 229.998 218.612 184.675 346.426 177.689Z" fill="url(#waveBotGrad)" fillOpacity="0.3" />
    <defs>
      <linearGradient id="waveBotGrad" x1="44" y1="44" x2="813.5" y2="395" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" /><stop offset="0.898" stopColor="#74D2E8" />
      </linearGradient>
    </defs>
  </svg>
);

const LoginIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M8.583 6.417a.833.833 0 0 1 1.167 0l1.583 1.583H2.5a.833.833 0 1 0 0 1.667h8.667L9.583 12.417a.833.833 0 1 0 1.167 1.166l2.991-2.991a.833.833 0 0 0 0-1.175L9.75 6.417a.833.833 0 0 0-1.167 0ZM16.667 15.833H10.833a.833.833 0 1 0 0 1.667h5.834A1.667 1.667 0 0 0 18.333 15.833V4.167A1.667 1.667 0 0 0 16.667 2.5h-5.834a.833.833 0 1 0 0 1.667h5.834v11.666Z" fill="white" />
  </svg>
);

const TIMEZONE_MAP = {
  Jakarta: "WIB", Makassar: "WITA", Jayapura: "WIT",
};
const OFFSET_MAP = { "-420": "WIB", "-480": "WITA", "-540": "WIT" };
const DEFAULT_TZ = "WIB";

const ERROR_MESSAGES = {
  emailRequired: "Email harus diisi",
  passwordRequired: "Password harus diisi",
  emailInvalid: "Format email tidak valid",
  credentials: "Email atau password tidak sesuai",
  blocked: "Akun Anda belum diaktivasi atau diblokir",
  rateLimit: "Terlalu banyak percobaan login. Coba lagi nanti",
  generic: "Terjadi kesalahan saat login",
};

const STORAGE_KEYS = {
  rememberedEmail: "rememberedEmail",
  rememberMe: "rememberMe",
  tempEmail: "tempEmail",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const detectTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    for (const [city, zone] of Object.entries(TIMEZONE_MAP)) {
      if (tz.includes(city)) return zone;
    }
    return OFFSET_MAP[String(new Date().getTimezoneOffset())] || DEFAULT_TZ;
  } catch {
    return DEFAULT_TZ;
  }
};

const getErrorForStatus = (error) => {
  const status = error.response?.status;
  if (status === 401) return ERROR_MESSAGES.credentials;
  if (status === 403) return ERROR_MESSAGES.blocked;
  if (status === 429) return ERROR_MESSAGES.rateLimit;
  return error.response?.data?.message || error.message || ERROR_MESSAGES.generic;
};

const INPUT_BASE = "w-full h-11 px-4 py-2 rounded-lg text-base text-[#434343] outline-none transition-colors";
const INPUT_DEFAULT = `${INPUT_BASE} bg-[rgba(239,241,249,0.6)] placeholder:text-[#ABAFB1]`;
const INPUT_ERROR = `${INPUT_BASE} bg-red-50 ring-1 ring-red-400 placeholder:text-red-300`;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const { login, isLoading } = useAuth();

  useEffect(() => {
    const isRefresh = performance.getEntriesByType("navigation")[0]?.type === "reload";
    if (isRefresh) {
      setEmail("");
      setPassword("");
      sessionStorage.removeItem(STORAGE_KEYS.tempEmail);
      localStorage.removeItem(STORAGE_KEYS.rememberMe);
    } else {
      const saved = localStorage.getItem(STORAGE_KEYS.rememberedEmail);
      const temp = sessionStorage.getItem(STORAGE_KEYS.tempEmail);
      if (saved) { setEmail(saved); setRememberMe(true); }
      else if (temp) setEmail(temp);
    }
  }, []);

  const validateField = (field) => {
    const isEmail = field === "email";
    const val = isEmail ? email : password;

    if (!val || (isEmail && !val.trim())) {
      isEmail ? setEmailError(true) : setPasswordError(true);
      setErrorMessage(isEmail ? ERROR_MESSAGES.emailRequired : ERROR_MESSAGES.passwordRequired);
      return false;
    }
    if (isEmail && !EMAIL_REGEX.test(val)) {
      setEmailError(true);
      setErrorMessage(ERROR_MESSAGES.emailInvalid);
      return false;
    }

    isEmail ? setEmailError(false) : setPasswordError(false);
    if (!(isEmail ? passwordError : emailError)) setErrorMessage("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    setErrorMessage("");

    if (!validateField("email")) { emailRef.current?.focus(); return; }
    if (!validateField("password")) { passwordRef.current?.focus(); return; }

    try { loginSchema.parse({ email, password, rememberMe }); }
    catch (err) {
      if (err.errors?.[0]) { setErrorMessage(err.errors[0].message); return; }
    }

    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.rememberedEmail, email);
      localStorage.setItem(STORAGE_KEYS.rememberMe, "true");
    } else {
      localStorage.removeItem(STORAGE_KEYS.rememberedEmail);
      localStorage.removeItem(STORAGE_KEYS.rememberMe);
    }

    try {
      await login.mutateAsync({
        email: email.toLowerCase().trim(),
        password,
        rememberMe,
        timezone: detectTimezone(),
      });
      sessionStorage.removeItem(STORAGE_KEYS.tempEmail);
    } catch (error) {
      const msg = getErrorForStatus(error);
      setErrorMessage(msg);
      if (error.response?.status === 401) { setEmailError(true); setPasswordError(true); }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#BEEBF5]">
        <span className="material-icons animate-spin text-blue-600 text-3xl">sync</span>
      </div>
    );
  }

  const isSubmitting = login.isPending;

  return (
    <div className="relative w-full min-h-screen bg-[#BEEBF5] overflow-hidden flex items-center justify-center">
      <WaveTop />
      <WaveBottom />

      <main className="relative z-10 w-full max-w-[554px] mx-4 bg-white rounded-[30px] px-10 sm:px-20 pt-[60px] pb-20 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <img src="/logo/ruang-diri-icon.png" alt="Ruang Diri" className="w-[120px] h-[113px] object-contain" />
          <h1 className="text-4xl font-bold text-center leading-tight pt-2">
            <span className="text-[#434343]">Welcome to </span>
            <span className="text-[#155DFC]">Ruang Diri</span>
          </h1>
          <p className="text-center text-[#434343] text-base max-w-[315px] mt-1">
            Mulai perjalanan memahami diri, satu langkah lebih dekat setiap hari.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-8" noValidate>
          <div className="w-full flex flex-col gap-5">
            <div>
              <input
                ref={emailRef}
                type="email"
                placeholder="Email"
                className={emailError && emailTouched ? INPUT_ERROR : INPUT_DEFAULT}
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) { setEmailError(false); setErrorMessage(""); } }}
                onBlur={() => { setEmailTouched(true); sessionStorage.setItem(STORAGE_KEYS.tempEmail, email); }}
                disabled={isSubmitting}
                maxLength={50}
                autoComplete="username"
              />
              {emailError && emailTouched && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errorMessage}</p>
              )}
            </div>

            <div>
              <div className={`flex items-center rounded-lg h-11 px-4 transition-colors ${
                passwordError && passwordTouched ? "bg-red-50 ring-1 ring-red-400" : "bg-[rgba(239,241,249,0.6)]"
              }`}>
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="flex-1 bg-transparent text-base text-[#434343] outline-none placeholder:text-[#ABAFB1]"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordError) { setPasswordError(false); setErrorMessage(""); } }}
                  onBlur={() => setPasswordTouched(true)}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-2 text-[#888] hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  <span className="material-icons text-xl">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
              {passwordError && passwordTouched && !emailError && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errorMessage}</p>
              )}
            </div>
          </div>

          {errorMessage && !emailError && !passwordError && (
            <p className="text-red-500 text-sm text-center">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 h-12 bg-[#155DFC] hover:bg-[#1250d9] text-white text-base font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="material-icons animate-spin text-white">sync</span>
            ) : (
              <>
                <LoginIcon />
                <span>Login</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Login;
