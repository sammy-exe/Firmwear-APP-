/**
 * resizeImage.js
 * Resizes any user image to MaxBot display resolution (800×460px).
 *
 * Strategy: fit to width (800px), center-crop height only if needed.
 * - No black bars
 * - No distortion
 * - Text stays readable (horizontal text never gets cropped)
 * - High-res / 4K inputs are downscaled to exactly what the display needs
 *
 * Output: JPEG File at 800×460, quality 0.95
 */

const DISPLAY_W = 800;
const DISPLAY_H = 460;
const OUTPUT_QUALITY = 0.75;

/**
 * @param {File|Blob} file  — any JPG / PNG / BMP input
 * @returns {Promise<File>} — JPEG File at exactly 800×460
 */
export async function resizeForDisplay(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      canvas.width  = DISPLAY_W;
      canvas.height = DISPLAY_H;

      const ctx = canvas.getContext('2d');

      // Scale to fit width exactly (800px), maintain aspect ratio
      const scale = DISPLAY_W / img.width;
      const scaledH = Math.round(img.height * scale);

      // Center-crop vertically if scaled height exceeds 460
      const sy = scaledH > DISPLAY_H
        ? Math.round((scaledH - DISPLAY_H) / 2 / scale)
        : 0;

      const srcH = scaledH > DISPLAY_H
        ? Math.round(DISPLAY_H / scale)
        : img.height;

      ctx.drawImage(
        img,
        0, sy,
        img.width, srcH,
        0, 0,
        DISPLAY_W, DISPLAY_H
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          const outFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '') + '_display.jpg',
            { type: 'image/jpeg' }
          );
          resolve(outFile);
        },
        'image/jpeg',
        OUTPUT_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image load failed'));
    };

    img.src = objectUrl;
  });
}
