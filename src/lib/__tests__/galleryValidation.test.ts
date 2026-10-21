import {
  GALLERY_MAX_IMAGES,
  galleryImageSchema,
  isSupportedImageSource,
  normalizeGalleryPropertyName,
  validateGalleryImages,
} from "@/lib/galleryValidation"

describe("isSupportedImageSource", () => {
  it("accepts an absolute http(s) URL", () => {
    expect(isSupportedImageSource("https://images.unsplash.com/photo-1")).toBe(true)
    expect(isSupportedImageSource("http://cdn.example.com/a.jpg")).toBe(true)
  })

  it("accepts a root relative path", () => {
    expect(isSupportedImageSource("/images/property-1.jpg")).toBe(true)
  })

  it("rejects a relative path without a leading slash", () => {
    expect(isSupportedImageSource("images/property-1.jpg")).toBe(false)
  })

  it("rejects a protocol next/image cannot load", () => {
    expect(isSupportedImageSource("data:image/png;base64,AAAA")).toBe(false)
    expect(isSupportedImageSource("ftp://example.com/a.jpg")).toBe(false)
  })

  it("rejects an address without a host", () => {
    expect(isSupportedImageSource("https://")).toBe(false)
  })
})

describe("galleryImageSchema", () => {
  it("trims the address", () => {
    const parsed = galleryImageSchema.parse("  https://images.unsplash.com/photo-1  ")
    expect(parsed).toBe("https://images.unsplash.com/photo-1")
  })

  it("rejects a value that is not text", () => {
    expect(galleryImageSchema.safeParse(42).success).toBe(false)
  })

  it("rejects an empty address", () => {
    expect(galleryImageSchema.safeParse("   ").success).toBe(false)
  })
})

describe("validateGalleryImages", () => {
  it("returns an empty result for a list that is not an array", () => {
    expect(validateGalleryImages(undefined)).toEqual({
      images: [],
      issues: [],
      droppedCount: 0,
    })
  })

  it("keeps valid images in their original order", () => {
    const result = validateGalleryImages([
      "https://images.unsplash.com/photo-1",
      "/images/photo-2.jpg",
      "https://images.unsplash.com/photo-3",
    ])

    expect(result.issues).toHaveLength(0)
    expect(result.droppedCount).toBe(0)
    expect(result.images).toEqual([
      "https://images.unsplash.com/photo-1",
      "/images/photo-2.jpg",
      "https://images.unsplash.com/photo-3",
    ])
  })

  it("trims the addresses it keeps", () => {
    const result = validateGalleryImages(["  https://images.unsplash.com/photo-1  "])

    expect(result.images).toEqual(["https://images.unsplash.com/photo-1"])
  })

  it("reports an entry that is not text", () => {
    const result = validateGalleryImages(["https://images.unsplash.com/photo-1", 7])

    expect(result.images).toEqual(["https://images.unsplash.com/photo-1"])
    expect(result.issues).toEqual([
      { index: 1, value: 7, reason: "notAString" },
    ])
  })

  it("reports an empty address", () => {
    const result = validateGalleryImages(["   "])

    expect(result.images).toEqual([])
    expect(result.issues).toEqual([
      { index: 0, value: "   ", reason: "empty" },
    ])
  })

  it("reports an address next/image cannot load", () => {
    const result = validateGalleryImages(["images/photo-1.jpg"])

    expect(result.images).toEqual([])
    expect(result.issues).toEqual([
      { index: 0, value: "images/photo-1.jpg", reason: "invalidSource" },
    ])
  })

  it("reports a duplicated address and keeps the first occurrence", () => {
    const result = validateGalleryImages([
      "https://images.unsplash.com/photo-1",
      "https://images.unsplash.com/photo-1",
    ])

    expect(result.images).toEqual(["https://images.unsplash.com/photo-1"])
    expect(result.issues).toEqual([
      {
        index: 1,
        value: "https://images.unsplash.com/photo-1",
        reason: "duplicate",
      },
    ])
  })

  it("drops the images that do not fit into the maximum and counts them", () => {
    const images = Array.from(
      { length: GALLERY_MAX_IMAGES + 3 },
      (_unused, index) => `https://images.unsplash.com/photo-${index}`
    )

    const result = validateGalleryImages(images)

    expect(result.images).toHaveLength(GALLERY_MAX_IMAGES)
    expect(result.droppedCount).toBe(3)
    expect(result.issues).toHaveLength(0)
  })
})

describe("normalizeGalleryPropertyName", () => {
  it("trims the name", () => {
    expect(normalizeGalleryPropertyName("  Sunset Villa  ")).toBe("Sunset Villa")
  })

  it("reports a missing name as an empty string", () => {
    expect(normalizeGalleryPropertyName("   ")).toBe("")
    expect(normalizeGalleryPropertyName(undefined)).toBe("")
    expect(normalizeGalleryPropertyName(null)).toBe("")
  })
})
