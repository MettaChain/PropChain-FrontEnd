/**
 * Environment Configuration Module
 *
 * This module provides type-safe access to environment variables
 * with validation at application startup.
 *
 * Usage:
 * import { env } from '@/config/env';
 *
 * // Access environment variables
 * const appName = env.NEXT_PUBLIC_APP_NAME;
 */

import {
  validateEnv,
  validateEnvRequirements,
  envSchema,
  EnvConfig,
} from "./schema";

// Singleton instance for validated environment config
let validatedEnvConfig: EnvConfig | null = null;

/**
 * Initialize and validate environment variables
 * This function should be called at application startup
 * @returns Validated environment configuration
 * @throws Error if validation fails
 */
export function initEnv(): EnvConfig {
  if (validatedEnvConfig) {
    return validatedEnvConfig;
  }

  try {
    // Validate base schema
    validatedEnvConfig = validateEnv();

    // Validate environment-specific requirements
    validateEnvRequirements(validatedEnvConfig);

    // Log initialization in development
    if (validatedEnvConfig.NEXT_PUBLIC_DEBUG_MODE) {
      console.log("[EnvConfig] Environment initialized:", {
        NODE_ENV: validatedEnvConfig.NODE_ENV,
        NEXT_PUBLIC_APP_NAME: validatedEnvConfig.NEXT_PUBLIC_APP_NAME,
        NEXT_PUBLIC_APP_URL: validatedEnvConfig.NEXT_PUBLIC_APP_URL,
      });
    }

    return validatedEnvConfig;
  } catch (error) {
    console.error("[EnvConfig] Environment validation failed:", error);
    throw error;
  }
}

/**
 * Get the validated environment configuration
 * Initializes if not already done
 * @returns Validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  if (!validatedEnvConfig) {
    return initEnv();
  }
  return validatedEnvConfig;
}

/**
 * Check if the application is running in a specific environment
 */
export function isEnvironment(
  env: "development" | "staging" | "production",
): boolean {
  return getEnvConfig().NODE_ENV === env;
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return getEnvConfig().NEXT_PUBLIC_DEBUG_MODE;
}

/**
 * Check if the application is in maintenance mode
 */
export function isMaintenanceMode(): boolean {
  return getEnvConfig().NEXT_PUBLIC_MAINTENANCE_MODE;
}

/**
 * Get RPC URL for a specific chain
 * @param chain - The chain identifier (ethereum, polygon, bsc)
 * @returns RPC URL or undefined if not configured
 */
export function getRpcUrl(
  chain: "ethereum" | "polygon" | "bsc",
): string | undefined {
  const config = getEnvConfig();

  switch (chain) {
    case "ethereum":
      return config.ETHEREUM_MAINNET_RPC_URL;
    case "polygon":
      return config.POLYGON_MAINNET_RPC_URL;
    case "bsc":
      return config.BSC_MAINNET_RPC_URL;
    default:
      return undefined;
  }
}

/**
 * Get WalletConnect Project ID
 */
export function getWalletConnectProjectId(): string | undefined {
  return getEnvConfig().NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
}

/**
 * Get supported locales as an array
 */
export function getSupportedLocales(): string[] {
  const config = getEnvConfig();
  return config.NEXT_PUBLIC_SUPPORTED_LOCALES.split(",").map((locale: string) =>
    locale.trim(),
  );
}

/**
 * Get the default locale
 */
export function getDefaultLocale(): string {
  return getEnvConfig().NEXT_PUBLIC_DEFAULT_LOCALE;
}

/**
 * Re-export schema types and functions for convenience
 */
export {
  envSchema,
  type EnvConfig,
  validateEnv,
  validateEnvRequirements,
} from "./schema";

// Export the singleton instance for easy access via named export
export const env = new Proxy({} as EnvConfig, {
  get(_, prop) {
    const config = getEnvConfig();
    return config[prop as keyof EnvConfig];
  },
});

/**
 * Validate environment on module load (for early detection)
 * This runs validation when the module is first imported
 */
if (typeof window === "undefined") {
  // Only run on server-side
  try {
    initEnv();
  } catch (error) {
    // Log but don't throw during module load to allow Next.js to handle gracefully
    console.warn("[EnvConfig] Early validation warning:", error);
  }
}
