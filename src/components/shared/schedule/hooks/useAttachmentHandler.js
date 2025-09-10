// src/components/shared/schedule/hooks/useAttachmentHandler.js

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { createScheduleApi } from '../lib/scheduleApi';

export const useAttachmentHandler = (initialData = null, organizationType = 'school') => {
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // File validation constants
  const maxSize = 15 * 1024 * 1024; // 15MB
  const maxTotalSize = 50 * 1024 * 1024; // 50MB total
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  // Upload attachments mutation
  const uploadAttachmentsMutation = useMutation({
    mutationFn: async ({ scheduleIds, files }) => {
      const scheduleApi = createScheduleApi(organizationType);
      return await scheduleApi.uploadAttachments(scheduleIds, files);
    },
  });

 const deleteAttachmentMutation = useMutation({
    mutationFn: async ({ scheduleId, attachmentId, date, startTime, endTime }) => {
      // URL diubah, tanpa attachmentId di akhir
      const url = `/schedules/${scheduleId}/attachments`;
      
      // Data yang akan dikirim di body
      const body = { 
        attachmentId, // Asumsi backend butuh ini di body
        date, 
        startTime, 
        endTime 
      };

      // Mengirim request DELETE dengan body
      const response = await apiClient.delete(url, { data: body });
      
      return { scheduleId, attachmentId, success: true, data: response.data };
    },
  });

  // Initialize attachments from initial data
  const initializeAttachments = (data) => {
    if (data?.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
      const existingAttachments = data.attachments.map((att) => ({
        ...att,
        id: att.id || `existing-${Date.now()}-${Math.random()}`,
        isExisting: true,
        name: att.originalName || att.fileName || `File ${att.id}`,
        size: att.fileSize || 0,
        type: att.fileType?.startsWith('image/') ? 'image' : 'document',
        fileType: att.fileType || 'application/octet-stream',
        downloadUrl: att.fileUrl || '',
      }));
      setAttachments(existingAttachments);
    } else {
      setAttachments([]);
    }
  };

  // Handle file selection
  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    let currentTotalSize = attachments.reduce((sum, att) => sum + att.size, 0);
    const validFiles = [];

    files.forEach((file) => {
      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File ${file.name} terlalu besar. Maksimal 15MB per file.`);
        return;
      }

      // Validate total size
      if (currentTotalSize + file.size > maxTotalSize) {
        toast.error('Total ukuran file melebihi batas 50MB');
        return;
      }

      // Validate file type
      if (type === 'image' && !allowedImageTypes.includes(file.type)) {
        toast.error(`File ${file.name} bukan format gambar yang didukung`);
        return;
      }

      if (type === 'document' && !allowedDocTypes.includes(file.type)) {
        toast.error(`File ${file.name} bukan format dokumen yang didukung`);
        return;
      }

      // Check for duplicates
      const isDuplicate = attachments.some((att) => att.name === file.name && att.size === file.size);

      if (isDuplicate) {
        toast.error(`File ${file.name} sudah dipilih`);
        return;
      }

      const attachment = {
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: type,
        fileType: file.type,
      };

      // Generate preview for images
      if (type === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target.result;
          setAttachments((prev) =>
            prev.map((att) => (att.id === attachment.id ? { ...att, preview: e.target.result } : att))
          );
        };
        reader.readAsDataURL(file);
      }

      validFiles.push(attachment);
      currentTotalSize += file.size;
    });

    if (validFiles.length > 0) {
      setAttachments((prev) => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file berhasil dipilih`);
    }

    // Clear input
    e.target.value = '';
  };

  // Remove attachment
  const removeAttachment = (attachmentId) => {
    const attachmentToRemove = attachments.find((att) => att.id === attachmentId);

    if (!attachmentToRemove) {
      toast.error('Attachment tidak ditemukan');
      return;
    }

    // Handle removing existing attachments vs new attachments
    if (attachmentToRemove.isExisting && initialData?.id) {
      // For existing attachments, call delete API
      toast('Hapus lampiran dari server?', {
        description: `Lampiran "${attachmentToRemove.name}" akan dihapus secara permanen.`,
        action: {
          label: 'Ya, Hapus',
          onClick: async () => {
            try {
              // Ambil info tanggal dari jadwal yang ada
              const dateInfo = initialData.dates?.[0];

              if (!dateInfo) {
                  toast.error("Data tanggal jadwal tidak ditemukan, tidak bisa hapus lampiran.");
                  return;
              }

              // Panggil mutation dengan payload yang lengkap untuk body
              await deleteAttachmentMutation.mutateAsync({
                scheduleId: initialData.id,
                attachmentId: attachmentToRemove.id,
                date: dateInfo.date,
                startTime: dateInfo.startTime,
                endTime: dateInfo.endTime,
              });

              // Remove from local state after successful deletion
              setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
              toast.success('Lampiran berhasil dihapus dari server');
            } catch (error) {
              console.error('Failed to delete attachment:', error);
              toast.error('Gagal menghapus lampiran', {
                description: error.message || 'Terjadi kesalahan saat menghapus lampiran',
              });
            }
          },
          className: '!bg-red-600 hover:!bg-red-700 !text-white !border-red-600 hover:!border-red-700 !ml-auto',
        },
        cancel: {
          label: 'Batal',
          onClick: () => {},
          className:
            '!bg-transparent hover:!bg-gray-100 !text-gray-700 !border !border-gray-300 hover:!border-gray-400',
        },
        duration: 10000,
        className: '!bg-white !border !border-gray-200 !shadow-lg',
        position: 'top-center',
      });
    } else {
      // For new attachments, just remove from local state
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
      toast.success('File dihapus dari daftar lampiran');
    }
  };

  // Get upload base URL
  const getUploadBaseUrl = () => {
    return import.meta.env.VITE_UPLOAD_URL || import.meta.env.VITE_API_URL || '';
  };

  // Clear all attachments
  const clearAttachments = () => {
    setAttachments([]);
    setPreviewAttachment(null);
  };

  // Get new attachments to upload
  const getNewAttachments = () => {
    return attachments.filter((att) => !att.isExisting);
  };

  return {
    // State
    attachments,
    uploadingAttachments,
    previewAttachment,

    // Setters
    setAttachments,
    setUploadingAttachments,
    setPreviewAttachment,

    // Actions
    handleFileSelect,
    removeAttachment,
    initializeAttachments,
    clearAttachments,
    getNewAttachments,
    getUploadBaseUrl,

    // Mutations
    uploadAttachmentsMutation,
    deleteAttachmentMutation,

    // Validation constants
    maxSize,
    maxTotalSize,
    allowedImageTypes,
    allowedDocTypes,
  };
};