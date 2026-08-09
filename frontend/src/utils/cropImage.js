// Pure canvas cropping helper used by ImageCropDialog. Kept separate from
// the component so it's easy to unit-test / reuse elsewhere if needed.

export const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const createImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/**
 * Crops `imageSrc` (a data URL or object URL) to `pixelCrop`
 * ({ x, y, width, height }, as reported by react-easy-crop's
 * onCropComplete) and resolves to a File named `fileName`, mime type
 * `image/jpeg` at 0.9 quality (keeps upload size reasonable).
 */
export async function getCroppedImageFile(imageSrc, pixelCrop, fileName = "cropped.jpg") {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  });
}

// Backward compatibility
export async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  // rotation abhi ignore hoga
  return getCroppedImageFile(imageSrc, pixelCrop);
}

export default getCroppedImg;