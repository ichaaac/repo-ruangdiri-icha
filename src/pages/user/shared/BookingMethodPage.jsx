import { useState } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';

// --- SVG Icon Components ---

const ClockIcon = ({ color = '#3B82F6', size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <g clipPath="url(#clip_clock)">
      <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.71 15.1798L12.61 13.3298C12.07 13.0098 11.63 12.2398 11.63 11.6098V7.50977" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs>
      <clipPath id="clip_clock">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const LocationIcon = ({ color = '#3B82F6', size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <g clipPath="url(#clip_location)">
      <path d="M12 13.4295C13.7231 13.4295 15.12 12.0326 15.12 10.3095C15.12 8.58633 13.7231 7.18945 12 7.18945C10.2769 7.18945 8.88 8.58633 8.88 10.3095C8.88 12.0326 10.2769 13.4295 12 13.4295Z" stroke={color} strokeWidth="1.5" />
      <path d="M3.61995 8.49C5.58995 -0.169998 18.42 -0.159997 20.38 8.5C21.53 13.58 18.37 17.88 15.6 20.54C13.59 22.48 10.41 22.48 8.38995 20.54C5.62995 17.88 2.46995 13.57 3.61995 8.49Z" stroke={color} strokeWidth="1.5" />
    </g>
    <defs>
      <clipPath id="clip_location">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const VideoIcon = ({ color = '#EC4899', size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <g clipPath="url(#clip_video)">
      <path d="M12.88 20.8596H6.81C3.26 20.8596 2 18.3696 2 16.0496V7.94965C2 4.48965 3.35 3.13965 6.81 3.13965H12.88C16.34 3.13965 17.69 4.48965 17.69 7.94965V16.0496C17.69 19.5096 16.34 20.8596 12.88 20.8596ZM6.81 4.65965C4.2 4.65965 3.52 5.33965 3.52 7.94965V16.0496C3.52 17.2796 3.95 19.3396 6.81 19.3396H12.88C15.49 19.3396 16.17 18.6596 16.17 16.0496V7.94965C16.17 5.33965 15.49 4.65965 12.88 4.65965H6.81Z" fill={color} />
      <path d="M20.7799 18.1105C20.3499 18.1105 19.7999 17.9705 19.1699 17.5305L16.4999 15.6605C16.2999 15.5205 16.1799 15.2905 16.1799 15.0405V8.96048C16.1799 8.71048 16.2999 8.48048 16.4999 8.34048L19.1699 6.47048C20.3599 5.64048 21.2299 5.88048 21.6399 6.09048C22.0499 6.31048 22.7499 6.88048 22.7499 8.33048V15.6605C22.7499 17.1105 22.0499 17.6905 21.6399 17.9005C21.4499 18.0105 21.1499 18.1105 20.7799 18.1105ZM17.6899 14.6405L20.0399 16.2805C20.6599 16.6905 21.1199 16.5105 21.2399 16.4305C21.2499 16.4205 21.2499 16.3505 21.2499 15.6605V8.33048C21.2499 7.64048 21.2499 7.57048 21.2399 7.56048C21.1199 7.48048 20.6599 7.30048 20.0399 7.71048L17.6899 9.35048V14.6405Z" fill={color} />
    </g>
    <defs>
      <clipPath id="clip_video">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const ChatIcon = ({ color = '#8B5CF6', size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M6.58329 16.6664C8.17377 17.4823 10.0034 17.7033 11.7424 17.2895C13.4814 16.8758 15.0154 15.8546 16.0681 14.4099C17.1208 12.9652 17.6228 11.192 17.4838 9.40985C17.3447 7.62772 16.5738 5.95385 15.3098 4.68987C14.0458 3.42589 12.3719 2.65492 10.5898 2.51589C8.8077 2.37686 7.03452 2.87892 5.58981 3.93159C4.1451 4.98425 3.12387 6.51831 2.71014 8.25731C2.29642 9.99631 2.51741 11.8259 3.33329 13.4164L1.66663 18.333L6.58329 16.6664Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// --- Method Config ---

const COUNSELING_METHODS = [
  {
    id: 'luring',
    name: 'Luring',
    description: 'Konseling yang dilakukan secara tatap muka dengan psikolog.',
    duration: '60 Menit',
    image: '/luring.png',
    chipBg: '#DBEAFE',
    accentColor: '#3B82F6',
    hoverColor: '#155DFC',
    chipIconType: 'clock',
    titleIconType: 'location',
    enabled: true,
  },
  {
    id: 'daring',
    name: 'Daring',
    description: 'Konseling yang dilakukan secara virtual dengan psikolog menggunakan platform audiovisual',
    duration: '60 Menit',
    image: '/daring.png',
    chipBg: '#FCE7F3',
    accentColor: '#EC4899',
    hoverColor: '#F43F5E',
    chipIconType: 'video',
    titleIconType: 'video',
    enabled: true,
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Konseling melalui ruang chat dengan psikolog dalam satu sesi',
    duration: '15 Menit',
    image: '/chat.png',
    chipBg: '#F3E8FF',
    accentColor: '#8B5CF6',
    hoverColor: '#8E5CFF',
    chipIconType: 'chat',
    titleIconType: 'chat',
    enabled: true,
  },
];

// --- Icon Renderer ---

const renderIcon = (type, color, size) => {
  switch (type) {
    case 'clock': return <ClockIcon color={color} size={size} />;
    case 'location': return <LocationIcon color={color} size={size} />;
    case 'video': return <VideoIcon color={color} size={size} />;
    case 'chat': return <ChatIcon color={color} size={size} />;
    default: return null;
  }
};

// --- Sub-Components ---

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div
      className="flex items-center justify-center mb-4"
      style={{ width: 56, height: 56, borderRadius: 60, backgroundColor: '#F6F6F6', padding: 16 }}
    >
      <span className="material-icons" style={{ fontSize: 24, color: '#9CA3AF' }}>
        event_busy
      </span>
    </div>
    <p
      className="text-center mb-1"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 500, color: '#0F172B' }}
    >
      Belum ada metode konseling tersedia
    </p>
    <p
      className="text-center"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 400, color: '#3F4555' }}
    >
      Saat ini belum ada metode konseling yang dapat dipilih
    </p>
  </div>
);

const MethodCard = ({ method, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const isEnabled = method.enabled !== false;

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-200"
      style={{
        border: `2px solid ${hovered ? method.hoverColor : '#E5E7EB'}`,
        cursor: isEnabled ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => isEnabled && onSelect(method)}
    >
      {/* Image with duration chip */}
      <div className="relative">
        <img
          src={method.image}
          alt={method.name}
          className="w-full object-cover"
          style={{ height: 165 }}
        />
        <div
          className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ backgroundColor: method.chipBg }}
        >
          {renderIcon(method.chipIconType, method.accentColor, 16)}
          <span className="text-sm font-medium" style={{ color: method.accentColor }}>
            {method.duration}
          </span>
        </div>
        {!isEnabled && (
          <div
            className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF' }}
          >
            Segera Hadir
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 20, gap: 12, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 32, height: 32, backgroundColor: method.chipBg }}
          >
            {renderIcon(method.titleIconType, method.accentColor, 18)}
          </div>
          <h3
            className="font-semibold text-base"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1F2937' }}
          >
            {method.name}
          </h3>
        </div>

        <p
          className="leading-relaxed"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 400, lineHeight: '140%', color: '#1F2937' }}
        >
          {method.description}
        </p>

        {/* Action */}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          <span
            className="text-sm transition-colors"
            style={{ color: hovered ? method.hoverColor : '#9CA3AF' }}
          >
            {isEnabled ? 'Pilih metode ini' : 'Segera hadir'}
          </span>
          <span
            className="material-icons transition-colors"
            style={{ fontSize: 18, color: hovered ? method.hoverColor : '#9CA3AF' }}
          >
            chevron_right
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

const BookingMethodPage = () => {
  const navigate = useNavigate();
  const { userType = 'student' } = useOutletContext() || {};

  const handleMethodSelect = (method) => {
    if (method.id === 'chat') {
      navigate(`/user/${userType}/booking-chat`);
      return;
    }
    navigate(`/booking-session/${userType}`, {
      state: {
        selectedMethod: {
          id: method.id,
          name: method.name,
          description: method.description,
        },
      },
    });
  };

  const methods = COUNSELING_METHODS;

  return (
    <div className="min-h-screen bg-white">
      {/* Header with wave gradient background */}
      <div
        className="relative overflow-hidden bg-[#BBF2FF]/60"
        style={{ marginTop: -64, paddingTop: 64 }}
      >
        {/* Top Left Decorative Wave */}
        <svg
          className="pointer-events-none absolute top-0 left-0"
          xmlns="http://www.w3.org/2000/svg"
          width="532"
          height="300"
          viewBox="0 0 532 300"
          fill="none"
        >
          <path
            d="M185.574 124.31C39.8177 132.283 -99.119 94.0838 -237.91 68.2276C-285.602 59.3374 -336.204 51.7664 -385.828 56.4581C-465.182 63.9603 -524.661 101.196 -561.979 140.554C-599.296 179.912 -621.458 223.491 -663.993 261.197C-681.311 276.557 -703.701 291.217 -730 302V-185H512.22C541.117 -120.038 542.281 -50.7751 489.122 8.5083C432.159 72.0016 313.388 117.325 185.574 124.31Z"
            fill="url(#paint0_linear_booking_top)"
            fillOpacity="0.6"
          />
          <defs>
            <linearGradient
              id="paint0_linear_booking_top"
              x1="615"
              y1="-41.9999"
              x2="-281.5"
              y2="-92.9999"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop offset="0.898175" stopColor="#BBF2FF" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Right Decorative Wave */}
        <svg
          className="pointer-events-none absolute right-0 bottom-0"
          xmlns="http://www.w3.org/2000/svg"
          width="930"
          height="300"
          viewBox="0 0 930 300"
          fill="none"
        >
          <path
            d="M346.426 134.689C492.182 126.717 631.119 164.916 769.91 190.772C817.602 199.663 868.204 207.234 917.828 202.542C997.182 195.04 1056.66 157.804 1093.98 118.446C1131.3 79.0884 1153.46 35.5092 1195.99 -2.19681C1213.31 -17.5568 1235.7 -32.217 1262 -43V444H19.7804C-9.11719 379.038 -10.2814 309.775 42.8776 250.492C99.8411 186.998 218.612 141.675 346.426 134.689Z"
            fill="url(#paint0_linear_booking_bottom)"
            fillOpacity="0.6"
          />
          <defs>
            <linearGradient
              id="paint0_linear_booking_bottom"
              x1="44.0001"
              y1="0.999972"
              x2="813.5"
              y2="352"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop offset="0.898175" stopColor="#BBF2FF" />
            </linearGradient>
          </defs>
        </svg>

        {/* Header Content */}
        <div className="relative z-10 px-6 lg:px-10 pt-8 pb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm mb-6" style={{ gap: 8 }}>
            <Link to={`/user/${userType}/dashboard`} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer">Home</Link>
            <span className="text-[#F59E0B] text-xs">&#9654;</span>
            <Link to={`/user/${userType}/screening`} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer">Asesmen Ruang Diri</Link>
            <span className="text-[#F59E0B] text-xs">&#9654;</span>
            <span className="text-[#1F2937] font-semibold">Booking Sesi Konseling</span>
          </nav>

          {/* Title */}
          <h1
            className="font-bold mb-3"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 28, lineHeight: '110%', color: '#1F2937' }}
          >
            Booking Sesi Konseling
          </h1>
          <p
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 16, color: '#1F2937' }}
          >
            Halaman ini digunakan untuk memilih metode konseling yang paling nyaman untukmu
          </p>
        </div>
      </div>

      {/* Method Cards */}
      <div className="px-6 lg:px-10 pt-6 pb-10">
        {methods.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {methods.map((method) => (
              <MethodCard
                key={method.id}
                method={method}
                onSelect={handleMethodSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingMethodPage;
