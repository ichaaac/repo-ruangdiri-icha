// src/components/shared/profile/lib/cropUtils.js

/**
 * Creates an image element from a URL.
 * @param {string} url - The URL of the image.
 * @returns {Promise<HTMLImageElement>}
 */
const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues
      image.src = url;
    });
  
  /**
   * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
   * @param {HTMLImageElement} image - Image File url
   * @param {Object} pixelCrop - pixelCrop Object provided by react-easy-crop
   */
  export async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    if (!ctx) {
      return null;
    }
  
    // set canvas size to match the bounding box
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
  
    // draw rotated image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
  
    // As a blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((file) => {
        if (file) {
          file.name = "cropped.jpeg";
          resolve(file);
        } else {
          reject(new Error("Canvas is empty"));
        }
      }, "image/jpeg", 0.95); // Adjust quality to 95%
    });
  }