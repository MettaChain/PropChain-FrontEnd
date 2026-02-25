import {z} from "zod";

/**
 * Environment variable validation schema using Zod
 * This schema defines all required and optional environment variables
 * with their validation rules
 */

// Define the environment schema
const envSchema = z.object({
  // Application General Settings
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("PropChain"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000/"),
  NODE_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  ANALYZE: z.string().optional().default("false"),

  // API Configurations
  NEXT_PUBLIC_PROPERTY_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_ANALYTICS_API_URL: z.string().url().optional(),

  // Web3 / Blockchain RPC Configurations
  ETHEREUM_MAINNET_RPC_URL: z.string().url().optional(),
  POLYGON_MAINNET_RPC_URL: z.string().url().optional(),
  BSC_MAINNET_RPC_URL: z.string().url().optional(),

  // Wallet Connect Configuration
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional(),

  // Feature Flags
  NEXT_PUBLIC_ANALYTICS_ENABLED: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  NEXT_PUBLIC_ERROR_REPORTING_ENABLED: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  NEXT_PUBLIC_DEBUG_MODE: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  NEXT_PUBLIC_MAINTENANCE_MODE: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  // Internationalization (i18n)
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("en"),
  NEXT_PUBLIC_SUPPORTED_LOCALES: z.string().default("en,es,fr,de,zh,ar,he"),

  // External Services (Optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),

  // Development/Testing Only
  NEXT_PUBLIC_USE_MOCK_DATA: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  NEXT_PUBLIC_SKIP_AUTH: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
});

/**
 * Schema for environment-specific validation
 * Different environments may have different requirements
 */
const envRequirementsSchema = z.object({
  development: z.object({
    // Development-specific requirements (usually none required)
    ETHEREUM_MAINNET_RPC_URL: z.string().url().optional(),
  }),
  staging: z.object({
    // Staging requires valid RPC URLs
    ETHEREUM_MAINNET_RPC_URL: z.string().url(),
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string(),
  }),
  production: z.object({
    // Production has stricter requirements
    ETHEREUM_MAINNET_RPC_URL: z.string().url(),
    POLYGON_MAINNET_RPC_URL: z.string().url(),
    BSC_MAINNET_RPC_URL: z.string().url(),
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1),
  }),
});

/**
 * Type for the validated environment variables
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Type for environment-specific requirements
 */
export type EnvRequirements = z.infer<typeof envRequirementsSchema>;

/**
 * Validates the environment variables against the schema
 * @returns Validated environment configuration
 * @throws Error if validation fails
 */
export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}

/**
 * Validates environment-specific requirements
 * @param config - The validated environment configuration
 * @throws Error if environment-specific requirements are not met
 */
export function validateEnvRequirements(config: EnvConfig): void {
  const env = config.NODE_ENV;
  const requirements = envRequirementsSchema[env] as z.ZodType<any>;

  const result = requirements.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("\n");
    throw new Error(
      `Environment-specific requirements for '${env}' are not met:\n${errors}`,
    );
  }
}

/**
 * Gets a description of each environment variable for documentation
 */
export const envVariableDescriptions: Record<keyof EnvConfig, string> = {
  NEXT_PUBLIC_APP_NAME: "Application name displayed in UI",
  NEXT_PUBLIC_APP_URL:
    "Base URL for the application (include protocol and trailing slash)",
  NODE_ENV: "Current deployment environment (development, staging, production)",
  ANALYZE: 'Enable build analysis (set to "true" for bundle analysis)',
  NEXT_PUBLIC_PROPERTY_API_URL:
    "Property API endpoint for fetching property data",
  NEXT_PUBLIC_ANALYTICS_API_URL: "Analytics API endpoint",
  ETHEREUM_MAINNET_RPC_URL: "Ethereum Mainnet RPC URL",
  POLYGON_MAINNET_RPC_URL: "Polygon Mainnet RPC URL",
  BSC_MAINNET_RPC_URL: "Binance Smart Chain Mainnet RPC URL",
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
    "WalletConnect Project ID (required for WalletConnect)",
  NEXT_PUBLIC_ANALYTICS_ENABLED: "Enable/disable analytics tracking",
  NEXT_PUBLIC_ERROR_REPORTING_ENABLED: "Enable/disable error reporting",
  NEXT_PUBLIC_DEBUG_MODE: "Enable/disable debug mode",
  NEXT_PUBLIC_MAINTENANCE_MODE: "Enable/disable maintenance mode",
  NEXT_PUBLIC_DEFAULT_LOCALE: "Default language",
  NEXT_PUBLIC_SUPPORTED_LOCALES: "Supported locales (comma-separated)",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "Google Analytics Measurement ID",
  NEXT_PUBLIC_SENTRY_DSN: "Sentry DSN for error tracking",
  NEXT_PUBLIC_USE_MOCK_DATA: "Use mock data mode (bypasses real API calls)",
  NEXT_PUBLIC_SKIP_AUTH: "Skip authentication for development",
};

/**
 * Variables that should be marked as sensitive
 */
export const sensitiveVariables: (keyof EnvConfig)[] = [
  "ETHEREUM_MAINNET_RPC_URL",
  "POLYGON_MAINNET_RPC_URL",
  "BSC_MAINNET_RPC_URL",
  "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
  "NEXT_PUBLIC_SENTRY_DSN",
];

export {envSchema, envRequirementsSchema};
