// src/components/shared/chats/utils/imageLoader.js
// Utility untuk load images dengan custom headers (untuk ngrok dan backend)

/**
 * Load image dengan fetch API dan custom headers, lalu convert ke blob URL
 * @param {string} imageUrl - URL gambar yang akan di-load
 * @returns {Promise<string>} - Blob URL yang bisa digunakan di <img> tag
 */
export const loadImageWithHeaders = async (imageUrl) => {
  try {
    if (!imageUrl || imageUrl.trim() === '') {
      throw new Error('Image URL is empty');
    }

    console.log('🔄 Loading image with headers:', imageUrl);

    // Fetch image dengan custom headers untuk ngrok
    const response = await fetch(imageUrl, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Convert response ke blob
    const blob = await response.blob();

    // Create blob URL
    const blobUrl = URL.createObjectURL(blob);

    console.log('✅ Image loaded successfully:', blobUrl);

    return blobUrl;
  } catch (error) {
    console.error('❌ Failed to load image:', error);
    throw error;
  }
};

/**
 * Revoke blob URL untuk free up memory
 * @param {string} blobUrl - Blob URL yang akan di-revoke
 */
export const revokeImageUrl = (blobUrl) => {
  if (blobUrl && blobUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(blobUrl);
      console.log('🗑️ Revoked blob URL:', blobUrl);
    } catch (error) {
      console.warn('⚠️ Failed to revoke blob URL:', error);
    }
  }
};
