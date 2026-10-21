import { z } from "zod"

/**
 * Validation of the image list a property gallery is rendered from.
 *
 * The gallery is fed by data that reaches the browser from the API, so the
 * list cannot be trusted to be well formed: it can be empty, hold entries
 * that are not strings, hold addresses `next/image` cannot load, or repeat the
 * same address several times. Rendering such a list unvalidated produces
 * broken images, duplicated entries and an unreadable lightbox.
 *
 * The rules implemented here are the ones the renderer can actually honour:
 *
 * 1. an entry must be a string;
 * 2. it must not be empty once trimmed;
 * 3. it must be a source `next/image` accepts — an absolute `http(s)` URL or
 *    a root relative path (`/images/foo.jpg`). A relative path without the
 *    leading slash and a `data:` URL are rejected by `next/image` itself, so
 *    they are rejected here as well;
 * 4. the same address must not be listed twice;
 * 5. at most `GALLERY_MAX_IMAGES` images are rendered, so a gallery with a
 *    pathological number of images cannot lock up the page.
 *
 * Every rule is reported per entry, so the caller can tell the user exactly
 * which images were skipped and why.
 */

/** Maximum number of images a single gallery renders. */
export const GALLERY_MAX_IMAGES = 50

/** Why a gallery entry was rejected. */
export type GalleryImageIssueReason =
  | "notAString"
  | "empty"
  | "invalidSource"
  | "duplicate"

/** A single gallery entry that was rejected. */
export interface GalleryImageIssue {
  /** Zero based position of the entry in the original list. */
  index: number
  /** The rejected value, kept as-is so the caller can log or display it. */
  value: unknown
  /** The rule the entry broke. */
  reason: GalleryImageIssueReason
}

/** Outcome of validating a gallery image list. */
export interface GalleryValidationResult {
  /** The entries that can be rendered, in their original order. */
  images: string[]
  /** The entries that were rejected, in their original order. */
  issues: GalleryImageIssue[]
  /** Number of valid entries dropped because the gallery was too long. */
  droppedCount: number
}

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i

/**
 * Reports whether a gallery address can be rendered by `next/image`.
 *
 * @param value - The address to check.
 * @returns `true` for an absolute `http(s)` URL or a root relative path.
 */
export function isSupportedImageSource(value: string): boolean {
  if (value.startsWith("/")) return true
  if (!ABSOLUTE_URL_PATTERN.test(value)) return false

  try {
    return Boolean(new URL(value).hostname)
  } catch {
    return false
  }
}

/**
 * Schema for a single gallery image address.
 *
 * `next/image` only accepts an absolute `http(s)` URL or a path that starts
 * with a slash, so those are the only two shapes that are considered valid
 * here. The schema also trims the address, so the parsed value is the one
 * that is rendered.
 */
export const galleryImageSchema = z
  .string({ error: "Image address must be text." })
  .trim()
  .min(1, "Image address cannot be empty.")
  .refine((value) => isSupportedImageSource(value), {
    message: "Image address must be an http(s) URL or a path that starts with '/'.",
  })

/**
 * Explains why an address was rejected.
 *
 * @param value - The rejected value.
 * @returns The reason code matching the rule the value broke.
 */
function reasonForRejectedValue(value: unknown): GalleryImageIssueReason {
  if (typeof value !== "string") return "notAString"
  if (value.trim().length === 0) return "empty"
  return "invalidSource"
}

/**
 * Validates the image list of a gallery.
 *
 * @param input - The raw list, usually straight from the API.
 * @returns The renderable images, the rejected entries with their reason and
 * the number of valid entries that were dropped because the gallery was
 * longer than `GALLERY_MAX_IMAGES`.
 */
export function validateGalleryImages(input: unknown): GalleryValidationResult {
  if (!Array.isArray(input)) {
    return { images: [], issues: [], droppedCount: 0 }
  }

  const images: string[] = []
  const issues: GalleryImageIssue[] = []
  const seen = new Set<string>()
  let droppedCount = 0

  input.forEach((value, index) => {
    const parsed = galleryImageSchema.safeParse(value)

    if (!parsed.success) {
      issues.push({ index, value, reason: reasonForRejectedValue(value) })
      return
    }

    if (seen.has(parsed.data)) {
      issues.push({ index, value, reason: "duplicate" })
      return
    }

    seen.add(parsed.data)

    if (images.length < GALLERY_MAX_IMAGES) {
      images.push(parsed.data)
    } else {
      droppedCount += 1
    }
  })

  return { images, issues, droppedCount }
}

/**
 * Normalises the property name a gallery is labelled with.
 *
 * The name ends up in the alternative text of every image, so an empty or
 * whitespace only name is reported as missing and the caller falls back to a
 * generic label.
 *
 * @param value - The property name to normalise.
 * @returns The trimmed name, or an empty string when there is no usable name.
 */
export function normalizeGalleryPropertyName(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim()
}
