/**
 * Browser-side helpers shared by the meal-photo and nutrition-label scan flows.
 * Only imported by client components, so it ships to the browser bundle.
 */

/**
 * Shrinks a photo to a max dimension and re-encodes as JPEG so the upload stays
 * small (phone photos are often several MB). Falls back to the original data URL
 * if the browser can't decode/redraw it.
 *
 * Labels pass a larger `maxDim`/`quality` than plates: the fine print has to stay
 * legible for the model to read the numbers accurately.
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

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not load that image."));
      image.src = originalDataUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return originalDataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return originalDataUrl;
  }
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
