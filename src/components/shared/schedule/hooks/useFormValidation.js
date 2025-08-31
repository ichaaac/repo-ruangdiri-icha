// src/components/shared/schedule/hooks/useFormValidation.js

import dayjs from 'dayjs';
import { toast } from 'sonner';

export const useFormValidation = () => {
  const convertTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const validateForm = (formData, mode = 'create', initialData = null) => {
    const now = dayjs();

    if (!formData.agenda.trim()) {
      toast.error('Agenda wajib diisi');
      return false;
    }

    // Check for duplicate dates when multiple date is enabled
    if (formData.multipleDate && formData.dates.length > 1) {
      const dateSet = new Set();
      const duplicateDates = [];

      formData.dates.forEach((dateInfo) => {
        if (dateSet.has(dateInfo.date)) {
          duplicateDates.push(dayjs(dateInfo.date).format('DD/MM/YYYY'));
        } else {
          dateSet.add(dateInfo.date);
        }
      });

      if (duplicateDates.length > 0) {
        toast.error(`Tidak dapat menambahkan jadwal dengan tanggal yang sama: ${duplicateDates.join(', ')}`);
        return false;
      }
    }

    // Date and time validation
    for (let i = 0; i < formData.dates.length; i++) {
      const dateInfo = formData.dates[i];
      const scheduleDateTime = dayjs(`${dateInfo.date} ${dateInfo.startTime}`, 'YYYY-MM-DD HH:mm');

      // Only prevent schedules that are more than 5 minutes in the past
      if (mode === 'create' && scheduleDateTime.isBefore(now.subtract(5, 'minute'))) {
        toast.error(`Tidak dapat mengatur jadwal di masa lalu (${scheduleDateTime.format('DD/MM/YYYY HH:mm')})`);
        return false;
      }

      if (dateInfo.startTime === dateInfo.endTime) {
        toast.error(
          `Waktu mulai dan selesai tidak boleh sama pada tanggal ${dayjs(dateInfo.date).format('DD/MM/YYYY')}. Minimal durasi 15 menit.`
        );
        return false;
      }

      // Check if start time is after end time
      const startMinutes = convertTimeToMinutes(dateInfo.startTime);
      const endMinutes = convertTimeToMinutes(dateInfo.endTime);

      if (startMinutes >= endMinutes) {
        toast.error(
          `Waktu mulai harus lebih awal dari waktu selesai pada tanggal ${dayjs(dateInfo.date).format('DD/MM/YYYY')}`
        );
        return false;
      }

      const durationMinutes = endMinutes - startMinutes;
      if (durationMinutes < 15) {
        toast.error(`Durasi jadwal minimal 15 menit pada tanggal ${dayjs(dateInfo.date).format('DD/MM/YYYY')}`);
        return false;
      }
    }

    // Specific validation for counseling schedules less than 24 hours from now (edit mode only)
    if (mode === 'edit' && formData.type === 'counseling' && initialData?.startDateTime) {
      const originalScheduleStart = dayjs(initialData.startDateTime);
      const twentyFourHoursFromNow = now.add(24, 'hour');

      if (originalScheduleStart.isBefore(twentyFourHoursFromNow)) {
        toast.error('Tidak dapat mengedit jadwal konseling yang kurang dari 24 jam dari sekarang.');
        return false;
      }
    }

    if (formData.type === 'counseling') {
      if (!formData.selectedPsychologist) {
        toast.error('Psikolog wajib dipilih untuk konseling');
        return false;
      }
      if (formData.selectedParticipants.length === 0) {
        toast.error('Minimal satu partisipan harus ditambahkan untuk konseling');
        return false;
      }
      if (formData.selectedParticipants.length > 2) {
        toast.error('Maksimal dua klien untuk konseling');
        return false;
      }
      if (!formData.location.trim()) {
        toast.error('Lokasi wajib dipilih untuk konseling');
        return false;
      }
    }

    return true;
  };

  const parseErrorMessage = (message) => {
    if (!message) return 'An error occurred';

    const isoDatePattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)/g;
    const dateTimePattern = /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/g;

    let parsedMessage = message;

    parsedMessage = parsedMessage.replace(isoDatePattern, (match) => {
      try {
        const date = new Date(match);
        const dateStr = date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const timeStr = date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return `${dateStr} ${timeStr}`;
      } catch (e) {
        return match;
      }
    });

    parsedMessage = parsedMessage.replace(dateTimePattern, (match) => {
      try {
        const date = new Date(match);
        const dateStr = date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const timeStr = date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return `${dateStr} ${timeStr}`;
      } catch (e) {
        return match;
      }
    });

    return parsedMessage;
  };

  return {
    validateForm,
    parseErrorMessage,
    convertTimeToMinutes,
  };
};