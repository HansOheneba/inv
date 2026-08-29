"use server";

import { requireSupabaseContext } from "@/lib/supabase/context";
import { getCurrentProfile, isOwner } from "@/lib/auth";

const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export interface UploadImageResult {
  error?: string;
  url?: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

/**
 * Uploads a product or variant image to Supabase Storage and returns the public URL.
 */
export async function uploadProductImageAction(
  _prev: UploadImageResult,
  formData: FormData,
): Promise<UploadImageResult> {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) return { error: "Only owners can upload images" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload" };
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Use JPEG, PNG, WebP, or GIF" };
  }

  if (file.size > MAX_BYTES) {
    return { error: "Image must be 5MB or smaller" };
  }

  const scope = String(formData.get("scope") ?? "products").trim() || "products";
  const productId = String(formData.get("productId") ?? "general").trim() || "general";
  const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "jpg";
  const safeName = sanitizeFilename(file.name.replace(/\.[^.]+$/, "")) || "image";
  const path = `${scope}/${productId}/${Date.now()}-${safeName}.${ext ?? "jpg"}`;

  const { supabaseAdmin } = await requireSupabaseContext();
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { error: error.message };

  const { data } = supabaseAdmin.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
