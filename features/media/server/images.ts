import "server-only";
import { randomUUID } from "node:crypto";
import sharp, { type OutputInfo } from "sharp";

import type { ImageAsset } from "@/features/content/schemas";
import { IMAGE_PRESETS, MAX_UPLOAD_BYTES, type ImagePreset } from "@/lib/images";
import { AppError } from "@/server/core/errors";
import { logger } from "@/server/core/logger";
import { db } from "@/server/db";

const BUCKET = "media";

const SIGNATURES: Array<(b: Uint8Array) => boolean> = [
  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47, // PNG
  (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff, // JPEG
  (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
];

/**
 * Validate an uploaded image by its actual bytes (PNG, JPEG or WebP; SVG is
 * refused — it can carry scripts), then make it fast to deliver:
 *  - auto-rotate from EXIF and strip metadata (also removes GPS location)
 *  - shrink to the preset's size and re-encode as WebP
 *  - build a ~16px blurred preview that is inlined in the page HTML, so
 *    something shows instantly while the real image loads
 * Stored under a random name that is never reused, so it is cached for a year.
 */
export async function storeImage(form: FormData, preset: ImagePreset): Promise<ImageAsset> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw AppError.validation("Choose an image to upload");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw AppError.validation("That image is too large. Use one under 12 MB.");
  }
  const input = new Uint8Array(await file.arrayBuffer());
  if (!SIGNATURES.some((test) => test(input))) {
    throw AppError.validation("Use a PNG, JPEG or WebP image");
  }

  const { maxSize, quality } = IMAGE_PRESETS[preset];
  let output: { data: Buffer; info: OutputInfo };
  let blur: Buffer;
  try {
    output = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 5, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    blur = await sharp(output.data).resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  } catch (error) {
    logger.warn("Image processing failed", { message: (error as Error)?.message });
    throw AppError.validation("That image couldn't be read. Try a different file.");
  }

  const key = `images/${new Date().getUTCFullYear()}/${randomUUID()}.webp`;
  const storage = db().storage.from(BUCKET);
  const { error } = await storage.upload(key, output.data, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw AppError.internal("Upload failed", error);

  return {
    src: storage.getPublicUrl(key).data.publicUrl,
    width: output.info.width,
    height: output.info.height,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}
