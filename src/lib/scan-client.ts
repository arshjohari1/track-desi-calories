/**
 * Browser-side helpers shared by the meal-photo and nutrition-label scan flows.
 * Only imported by client components, so it ships to the browser bundle.
 */

/**
 * Redraws a data URL at a smaller max dimension and re-encodes it as JPEG.
 * Returns the input unchanged if the browser can't decode/redraw it, so every
 * caller degrades to "no shrink" rather than "no image".
 */
async function resizeDataUrl(
  dataUrl: string,
  maxDim: number,
  quality: number,
): Promise<string> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not load that image."));
      image.src = dataUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

/**
 * Shrinks a photo to a max dimension and re-encodes as JPEG so the upload stays
 * small (phone photos are often several MB).
 *
 * Labels pass a larger `maxDim`/`quality` than plates: the fine print has to stay
 * legible for the model to read the numbers accurately.
 *
 * This size is what we send to the AI, not what we persist — see
 * `dataUrlToThumbnail`.
 */
export async function fileToCompressedDataUrl(
  file: File,
  maxDim = 1024,
  quality = 0.85,
): Promise<string> {
  const originalDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });

  return resizeDataUrl(originalDataUrl, maxDim, quality);
}

/**
 * Shrinks an already-compressed data URL down to the size we actually display.
 *
 * Meal photos are only ever rendered in a 48px slot, but we used to persist the
 * full 1024px version — a ~250 KB base64 string per row, read back on every logs
 * page view. 320px covers that slot at 3x DPR with room for a larger view later,
 * and lands around 20-30 KB instead.
 */
export function dataUrlToThumbnail(
  dataUrl: string,
  maxDim = 320,
  quality = 0.8,
): Promise<string> {
  return resizeDataUrl(dataUrl, maxDim, quality);
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<T> & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  }
  return data as T;
}
