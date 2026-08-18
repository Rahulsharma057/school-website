// Kisi bhi file URL (Cloudinary image/PDF) ko browser me "download" trigger
// karke save karwata hai, sirf naye tab me open karne ke bajaye.
// Fetch fail ho (CORS/network) to safe fallback: naye tab me khol do.
export async function downloadFile(url, filename) {
  if (!url) return;

  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Download failed");

    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename || "file";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(objectUrl);
  } catch (err) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// URL extension dekh ke image hai ya nahi decide karta hai — preview
// thumbnail dikhani hai ya generic file icon.
export function isImageUrl(url) {
  if (!url) return false;
  return /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(url);
}