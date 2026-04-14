import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { screeningApi } from "@/components/shared/screening/lib/screeningApi";
import { createBookingApi } from "@/components/shared/booking/lib/bookingApi";

const STATUS_VALUE_MAP = { stable: 3, monitored: 2, at_risk: 1 };

// Map Indonesian risk labels from API to chart values
const RISK_VALUE_MAP = {
  "Stabil": 3, "Ringan": 3, "stable": 3, "low": 3,
  "Sedang": 2, "monitored": 2, "medium": 2,
  "Mengkhawatirkan": 1, "Sangat Mengkhawatirkan": 1, "Berisiko": 1, "at_risk": 1, "high": 1, "critical": 1,
};

const STATUS_TEXT_MAP = {
  cancelled: "Dibatalkan",
  completed: "Selesai",
  rescheduled: "Diubah",
  confirmed: "Terkonfirmasi",
  pending: "Menunggu",
  scheduled: "Dijadwalkan",
};

const METHOD_LABEL_MAP = {
  online: "Daring",
  offline: "Luring",
  chat: "Chat",
  organization: "Organisasi",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const pad = (n) => String(n).padStart(2, "0");

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  return `${pad(h)}.${pad(m)}`;
};

const transformScreeningsToChart = (screenings) => {
  // Generate last 6 months (including current)
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${pad(d.getMonth())}`,
      month: MONTH_NAMES[d.getMonth()],
    });
  }

  if (!screenings?.length) {
    return months.map(m => ({ month: m.month, value: null }));
  }

  // Group screenings by month, keep latest per month
  const grouped = {};
  for (const s of screenings) {
    const d = new Date(s.date || s.createdAt);
    const key = `${d.getFullYear()}-${pad(d.getMonth())}`;
    if (!grouped[key] || new Date(s.date || s.createdAt) > new Date(grouped[key].date || grouped[key].createdAt)) {
      grouped[key] = s;
    }
  }

  return months.map(m => {
    const s = grouped[m.key];
    if (!s) return { month: m.month, value: null };
    const risk = s.screeningStatus || s.overallRisk || s.assessment?.overallRisk || s.riskLevel || s.assessment?.riskLevel;
    return {
      month: m.month,
      value: RISK_VALUE_MAP[risk] ?? STATUS_VALUE_MAP[risk] ?? 2,
    };
  });
};

const transformToUpcomingSession = (bookings) => {
  if (!bookings?.length) return null;

  const now = new Date();
  const today = new Date(now.toDateString());
  const upcoming = bookings
    .filter((b) => ["scheduled", "confirmed", "pending"].includes(b.status) && new Date(b.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  if (!upcoming) return null;

  const d = new Date(upcoming.date);
  const dayName = DAY_NAMES[d.getDay()];
  const monthName = MONTH_NAMES_ID[d.getMonth()];
  const method = METHOD_LABEL_MAP[upcoming.method] || upcoming.method || "";
  const startTime = formatTime(upcoming.startTime);
  const endTime = formatTime(upcoming.endTime);

  return {
    id: upcoming.id,
    rawDate: upcoming.date,
    date: String(d.getDate()),
    day: dayName,
    fullDate: `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()}`,
    time: startTime && endTime ? `${startTime} - ${endTime} WIB` : "",
    startTime: upcoming.startTime,
    endTime: upcoming.endTime,
    title: `Sesi Konseling Baru (${method})`,
    platform: upcoming.methodDisplay || upcoming.platform || method,
    method: upcoming.method,
    psychologistId: upcoming.psychologist?.id || null,
    psychologistName: upcoming.psychologistName || upcoming.psychologist?.fullName || "-",
    zoomLink: upcoming.zoomLink || upcoming.meetingLink || null,
  };
};

const transformToHistory = (bookings) => {
  if (!bookings?.length) return [];

  return bookings
    .filter((b) => ["completed", "cancelled", "rescheduled"].includes(b.status))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((b) => {
      const d = new Date(b.date);
      const dayName = DAY_NAMES[d.getDay()];
      const monthName = MONTH_NAMES_ID[d.getMonth()];
      const startTime = formatTime(b.startTime);
      const endTime = formatTime(b.endTime);

      return {
        id: b.id,
        title: "Riwayat Konseling",
        counselor: b.psychologistName || b.psychologist?.fullName || "-",
        platform: b.methodDisplay || METHOD_LABEL_MAP[b.method] || b.platform || "-",
        date: `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()}`,
        time: startTime && endTime ? `${startTime} - ${endTime} WIB` : "",
        status: b.status,
        statusText: STATUS_TEXT_MAP[b.status] || b.status,
      };
    });
};

export const useStudentDashboard = (userType = "student") => {
  const bookingApi = useMemo(() => createBookingApi(userType), [userType]);

  const screeningsQuery = useQuery({
    queryKey: ["studentDashboard", "screenings"],
    queryFn: () => screeningApi.getMyScreenings({ limit: 100 }),
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
  });

  const bookingsQuery = useQuery({
    queryKey: ["studentDashboard", "bookings"],
    queryFn: async () => {
      const result = await bookingApi.getBookingHistory();
      return result;
    },
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
  });

  const chartData = useMemo(() => {
    const raw = screeningsQuery.data;
    // Handle various API response structures
    let screenings = [];
    if (Array.isArray(raw)) {
      screenings = raw;
    } else if (raw?.data) {
      if (Array.isArray(raw.data)) {
        screenings = raw.data;
      } else if (Array.isArray(raw.data?.data)) {
        screenings = raw.data.data;
      } else if (Array.isArray(raw.data?.screenings)) {
        screenings = raw.data.screenings;
      }
    }
    return transformScreeningsToChart(screenings);
  }, [screeningsQuery.data]);
  const upcomingSession = useMemo(() => transformToUpcomingSession(bookingsQuery.data?.data?.data || []), [bookingsQuery.data]);
  const counselingHistory = useMemo(() => transformToHistory(bookingsQuery.data?.data?.data || []), [bookingsQuery.data]);

  return {
    chartData,
    upcomingSession,
    counselingHistory,
    isLoading: screeningsQuery.isLoading || bookingsQuery.isLoading,
    isError: screeningsQuery.isError || bookingsQuery.isError,
    refetch: () => {
      screeningsQuery.refetch();
      bookingsQuery.refetch();
    },
  };
};
