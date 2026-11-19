"use server";

import { createClient } from "@supabase/supabase-js";
import { and, asc, eq, max, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { galleryImages } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { getVideoPosterPath } from "@/lib/images/video-poster";

// Every visitor who opens a video downloads the whole file from Supabase Storage,
// so videos are kept small. Keep in sync with GalleryUploader.
const VIDEO_MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const idSchema = z.string().uuid();
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const galleryInputSchema = z.object({
  url: z.string().url(),
  storagePath: z.string().min(1).max(500),
  fileHash: hashSchema,
  mediaType: z.enum(["image", "video"]),
  altText: z.string().trim().max(180).default(""),
});
const detailsSchema = z.object({
  altText: z.string().trim().max(180),
  caption: z.string().trim().max(120),
});
const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]),
  fileSize: z.number().int().positive().max(VIDEO_MAX_BYTES),
  fileHash: hashSchema,
});

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function refreshGallery() {
  revalidatePath("/");
  revalidatePath("/admin/gallery");
}

export async function checkGalleryDuplicate(fileHash: string) {
  await requireAdmin();
  const parsedHash = hashSchema.safeParse(fileHash);
  if (!parsedHash.success) return { success: false, duplicate: false };

  const [existing] = await getDb()
    .select({ id: galleryImages.id })
    .from(galleryImages)
    .where(eq(galleryImages.fileHash, parsedHash.data))
    .limit(1);

  return { success: true, duplicate: Boolean(existing) };
}

export async function prepareGalleryUpload(input: z.input<typeof uploadRequestSchema>) {
  await requireAdmin();
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Filen er ugyldig." };
  }

  const mediaType: "image" | "video" = parsed.data.mimeType.startsWith("video/")
    ? "video"
    : "image";
  if (mediaType === "image" && parsed.data.fileSize > IMAGE_MAX_BYTES) {
    return { success: false, error: "Billedet må højst fylde 5 MB." };
  }

  const duplicateCheck = await checkGalleryDuplicate(parsed.data.fileHash);
  if (duplicateCheck.duplicate) {
    return { success: false, duplicate: true, error: "Filen findes allerede i galleriet." };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, error: "Billedlageret er ikke konfigureret." };

  const extensionByType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  } as const;
  const storagePath = `uploads/${crypto.randomUUID()}.${extensionByType[parsed.data.mimeType]}`;
  const { data, error } = await supabase.storage
    .from("gallery")
    .createSignedUploadUrl(storagePath);

  if (error || !data?.token) {
    console.error("Failed to create signed gallery upload:", error);
    return { success: false, error: "Upload kunne ikke forberedes." };
  }

  let posterToken: string | undefined;
  if (mediaType === "video") {
    const poster = await supabase.storage
      .from("gallery")
      .createSignedUploadUrl(getVideoPosterPath(storagePath));
    if (poster.error) console.error("Failed to create signed poster upload:", poster.error);
    posterToken = poster.data?.token;
  }

  return {
    success: true,
    storagePath,
    token: data.token,
    mediaType,
    posterPath: posterToken ? getVideoPosterPath(storagePath) : undefined,
    posterToken,
  };
}

export async function addGalleryImage(input: z.input<typeof galleryInputSchema>) {
  await requireAdmin();
  const parsed = galleryInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Mediets oplysninger er ugyldige." };
  }

  try {
    const db = getDb();
    const [duplicate] = await db
      .select({ id: galleryImages.id })
      .from(galleryImages)
      .where(
        or(
          eq(galleryImages.fileHash, parsed.data.fileHash),
          eq(galleryImages.url, parsed.data.url)
        )
      )
      .limit(1);

    if (duplicate) {
      return { success: false, duplicate: true, error: "Filen findes allerede i galleriet." };
    }

    const [lastPosition] = await db
      .select({ value: max(galleryImages.sortOrder) })
      .from(galleryImages);

    await db.insert(galleryImages).values({
      ...parsed.data,
      sortOrder: (lastPosition?.value ?? -1) + 1,
    });

    refreshGallery();
    return { success: true };
  } catch (error) {
    console.error("Failed to add gallery image:", error);
    return { success: false, error: "Mediet kunne ikke gemmes." };
  }
}

export async function updateGalleryImage(
  id: string,
  input: z.input<typeof detailsSchema>
) {
  await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  const parsedInput = detailsSchema.safeParse(input);
  if (!parsedId.success || !parsedInput.success) {
    return { success: false, error: "Oplysningerne er ugyldige." };
  }

  await getDb()
    .update(galleryImages)
    .set(parsedInput.data)
    .where(eq(galleryImages.id, parsedId.data));
  refreshGallery();
  return { success: true };
}

export async function setGalleryImageVisibility(id: string, active: boolean) {
  await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success || typeof active !== "boolean") {
    return { success: false, error: "Mediet kunne ikke opdateres." };
  }

  await getDb()
    .update(galleryImages)
    .set({ active })
    .where(eq(galleryImages.id, parsedId.data));
  refreshGallery();
  return { success: true };
}

export async function reorderGalleryImages(ids: string[]) {
  await requireAdmin();
  const parsedIds = z.array(idSchema).min(1).max(100).safeParse(ids);
  if (!parsedIds.success || new Set(parsedIds.data).size !== parsedIds.data.length) {
    return { success: false, error: "Rækkefølgen er ugyldig." };
  }

  const db = getDb();
  const existing = await db
    .select({ id: galleryImages.id })
    .from(galleryImages)
    .orderBy(asc(galleryImages.sortOrder));
  const existingIds = new Set(existing.map((image) => image.id));
  if (
    existingIds.size !== parsedIds.data.length ||
    parsedIds.data.some((id) => !existingIds.has(id))
  ) {
    return { success: false, error: "Galleriet har ændret sig. Opdater siden og prøv igen." };
  }

  await db.transaction(async (transaction) => {
    for (const [sortOrder, imageId] of parsedIds.data.entries()) {
      await transaction
        .update(galleryImages)
        .set({ sortOrder })
        .where(eq(galleryImages.id, imageId));
    }
  });

  refreshGallery();
  return { success: true };
}

export async function deleteGalleryImage(id: string) {
  await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: "Mediet blev ikke fundet." };

  const db = getDb();
  const [image] = await db
    .select()
    .from(galleryImages)
    .where(and(eq(galleryImages.id, parsedId.data)))
    .limit(1);
  if (!image) return { success: false, error: "Mediet blev ikke fundet." };

  await db.delete(galleryImages).where(eq(galleryImages.id, parsedId.data));

  let warning: string | undefined;
  if (image.storagePath) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const paths = image.mediaType === "video"
        ? [image.storagePath, getVideoPosterPath(image.storagePath)]
        : [image.storagePath];
      const { error } = await supabase.storage.from("gallery").remove(paths);
      if (error) {
        console.error("Failed to remove gallery storage object:", error);
        warning = "Mediet blev fjernet fra galleriet, men lagerfilen kunne ikke slettes.";
      }
    }
  }

  refreshGallery();
  return { success: true, warning };
}
