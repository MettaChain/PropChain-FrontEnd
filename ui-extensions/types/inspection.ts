/**
 * Property inspection report types (#1359).
 *
 * Mirrors the string-enum + interface conventions in `types/amenity.ts` and
 * `types/staking.ts`: enums for closed value sets, interfaces for payloads, and
 * ISO 8601 strings for timestamps so the shapes survive JSON transport.
 */

export enum InspectionStatus {
  Scheduled = 'scheduled',
  InProgress = 'in-progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  /** Report delivered but rejected by the buyer or lender. */
  Disputed = 'disputed',
}

export enum InspectionSeverity {
  Info = 'info',
  Minor = 'minor',
  Moderate = 'moderate',
  Major = 'major',
  Critical = 'critical',
}

export enum InspectionCategory {
  Structural = 'structural',
  Electrical = 'electrical',
  Plumbing = 'plumbing',
  Roofing = 'roofing',
  Hvac = 'hvac',
  Safety = 'safety',
  Environmental = 'environmental',
  Other = 'other',
}

export interface InspectorProfile {
  /** Stable inspector identifier. */
  id: string;
  displayName: string;
  /** Regulatory or trade licence number. */
  licenseNumber?: string;
  /** ISO 3166-1 alpha-2 country code. */
  country?: string;
  /** Years of active inspection experience. */
  yearsExperience?: number;
  /** Average client rating, 0-5. */
  rating?: number;
  completedInspections?: number;
  contactEmail?: string;
  contactPhone?: string;
}

export interface InspectionFinding {
  id: string;
  category: InspectionCategory;
  severity: InspectionSeverity;
  /** Short label, e.g. "Missing GFCI outlet". */
  title: string;
  /** Long-form description of the defect and its implication. */
  description?: string;
  /** Where in the property the finding was recorded. */
  location?: string;
  /** Estimated cost to remedy, in `currency`. */
  estimatedRepairCost?: number;
  /** Whether the finding blocks the sale/lending decision. */
  isBlocking?: boolean;
  /** Relative file paths or URLs of supporting photos. */
  photos?: string[];
}

export interface InspectionReport {
  id: string;
  /** Property the inspection belongs to. */
  propertyId: string;
  status: InspectionStatus;
  inspector: InspectorProfile;
  /** ISO 8601 date-time the inspection started. */
  scheduledAt: string;
  /** ISO 8601 date-time the on-site inspection finished. */
  completedAt?: string;
  /** ISO 8601 date-time the report was published to the buyer. */
  publishedAt?: string;
  summary?: string;
  findings: InspectionFinding[];
  /**
   * Aggregate condition score, 0-100 where 100 is pristine. Optional because
   * reports are published before the score is calibrated.
   */
  conditionScore?: number;
  /** ISO 4217 currency code for `estimatedRepairCost` values. */
  currency: string;
  /** Total of every finding's `estimatedRepairCost`. */
  totalEstimatedRepairCost?: number;
  /** URL of the signed, downloadable PDF. */
  reportUrl?: string;
}
