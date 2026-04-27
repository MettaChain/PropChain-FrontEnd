import { z } from "zod"
import {
  BLOCKCHAIN_NETWORKS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/types/property"

export const purchaseTokenSchema = z.object({
  propertyId: z.string().min(1, "Property selection is required."),
  tokenAmount: z
    .number({ invalid_type_error: "Token amount must be a number." })
    .int("Token amount must be a whole number.")
    .positive("Token amount must be at least 1.")
    .max(100000, "Token amount cannot exceed 100,000."),
  maxPricePerToken: z
    .number({ invalid_type_error: "Max price must be a number." })
    .positive("Max price per token must be greater than zero."),
  purchaseType: z.enum(["market", "bid"]),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms before purchasing." }),
  }),
})

export const searchFilterSchema = z
  .object({
    query: z.string().max(100, "Search query must be 100 characters or less.").optional().or(z.literal("")),
    priceMin: z
      .number({ invalid_type_error: "Minimum price must be a number." })
      .min(0, "Minimum price cannot be negative."),
    priceMax: z
      .number({ invalid_type_error: "Maximum price must be a number." })
      .min(0, "Maximum price cannot be negative."),
    propertyTypes: z.array(z.enum(PROPERTY_TYPES)).default([]),
    blockchains: z.array(z.enum(BLOCKCHAIN_NETWORKS)).default([]),
    roiMin: z
      .number({ invalid_type_error: "Minimum ROI must be a number." })
      .min(0, "Minimum ROI cannot be less than 0%.")
      .max(100, "Minimum ROI cannot exceed 100%."),
    roiMax: z
      .number({ invalid_type_error: "Maximum ROI must be a number." })
      .min(0, "Maximum ROI cannot be less than 0%.")
      .max(100, "Maximum ROI cannot exceed 100%."),
    location: z.string().max(100, "Location must be 100 characters or less.").optional().or(z.literal("")),
    bedrooms: z.array(z.number().int().min(1)).default([]),
    bathrooms: z.array(z.number().int().min(1)).default([]),
    squareFeetMin: z
      .number({ invalid_type_error: "Minimum square feet must be a number." })
      .min(0, "Minimum square feet cannot be negative."),
    squareFeetMax: z
      .number({ invalid_type_error: "Maximum square feet must be a number." })
      .min(0, "Maximum square feet cannot be negative."),
    status: z.array(z.enum(PROPERTY_STATUSES)).default(["active"]),
  })
  .superRefine((values, ctx) => {
    if (values.priceMin > values.priceMax) {
      ctx.addIssue({
        path: ["priceMax"],
        message: "Maximum price must be greater than or equal to minimum price.",
        code: z.ZodIssueCode.custom,
      })
    }

    if (values.roiMin > values.roiMax) {
      ctx.addIssue({
        path: ["roiMax"],
        message: "Maximum ROI must be greater than or equal to minimum ROI.",
        code: z.ZodIssueCode.custom,
      })
    }

    if (values.squareFeetMin > values.squareFeetMax) {
      ctx.addIssue({
        path: ["squareFeetMax"],
        message: "Maximum square feet must be greater than or equal to minimum square feet.",
        code: z.ZodIssueCode.custom,
      })
    }
  })

export const profileSettingsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(50, "Display name cannot exceed 50 characters."),
  email: z.string().email("Enter a valid email address."),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .regex(/^$|^[\d()+\s-]{7,25}$/, "Enter a valid phone number."),
  preferredNetwork: z.enum(BLOCKCHAIN_NETWORKS),
  receiveNewsletter: z.boolean(),
})

export const alertConfigurationSchema = z
  .object({
    alertName: z
      .string()
      .trim()
      .min(3, "Alert name must be at least 3 characters.")
      .max(50, "Alert name cannot exceed 50 characters."),
    propertyTypes: z.array(z.enum(PROPERTY_TYPES)).default([]),
    minRoi: z
      .number({ invalid_type_error: "Minimum ROI must be a number." })
      .min(0, "Minimum ROI cannot be less than 0%.")
      .max(100, "Minimum ROI cannot exceed 100%."),
    maxPrice: z
      .number({ invalid_type_error: "Maximum price must be a number." })
      .min(0, "Maximum price cannot be negative."),
    notifyByEmail: z.boolean(),
    notifyByWallet: z.boolean(),
    frequency: z.enum(["instant", "daily", "weekly"]),
  })
  .superRefine((values, ctx) => {
    if (!values.notifyByEmail && !values.notifyByWallet) {
      ctx.addIssue({
        path: ["notifyByEmail"],
        message: "Select at least one notification channel.",
        code: z.ZodIssueCode.custom,
      })
    }

    if (values.minRoi > 100) {
      ctx.addIssue({
        path: ["minRoi"],
        message: "Minimum ROI cannot exceed 100%.",
        code: z.ZodIssueCode.custom,
      })
    }
  })

export type PurchaseTokenFormValues = z.infer<typeof purchaseTokenSchema>
export type SearchFilterFormValues = z.infer<typeof searchFilterSchema>
export type ProfileSettingsFormValues = z.infer<typeof profileSettingsSchema>
export type AlertConfigurationFormValues = z.infer<typeof alertConfigurationSchema>
