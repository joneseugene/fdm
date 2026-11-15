/** Shared (client + server) limits and presets for uploaded images. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

/**
 * How large each kind of image is stored. Bigger than any screen shows it,
 * smaller than a phone photo; next/image then serves each device its size.
 */
export const IMAGE_PRESETS = {
  /** Full-width backgrounds (hero). */
  wide: { maxSize: 2560, quality: 80 },
  /** Cards and portraits. */
  photo: { maxSize: 1600, quality: 80 },
  /** Logos and icons (keeps transparency). */
  logo: { maxSize: 512, quality: 90 },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;
export const IMAGE_PRESET_NAMES = Object.keys(IMAGE_PRESETS) as [ImagePreset, ...ImagePreset[]];
