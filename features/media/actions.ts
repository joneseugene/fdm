"use server";

import { z } from "zod";

import { IMAGE_PRESET_NAMES } from "@/lib/images";
import { defineAction } from "@/server/core/action";
import { storeImage } from "./server/images";

/**
 * Upload an image for the editor. Returns the stored image (URL, size and
 * blur preview); it shows on the site once the section is saved.
 */
export const uploadImageAction = defineAction({
  permissions: ["content.edit"],
  input: z.instanceof(FormData),
  handler: async (form) => {
    const preset = z.enum(IMAGE_PRESET_NAMES).catch("photo").parse(form.get("preset"));
    return storeImage(form, preset);
  },
});
