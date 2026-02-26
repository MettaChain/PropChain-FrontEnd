/**
 * Environment Validation Script
 *
 * This script validates environment variables before deployment.
 * Run with: npm run validate:env
 * Or: node scripts/validate-env.js
 *
 * Exit codes:
 * 0 - Validation successful
 * 1 - Validation failed
 *
 * Note: This script uses simple validation logic without external dependencies
 * to ensure it runs in any environment.
 */

// Helper function for URL validation
function isValidUrl(val) {
  if (!val) return false;
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
}

// Environment variable schema definition - using inline validators
const envSchema = {
  NEXT_PUBLIC_APP_NAME: {
    validate: (v) => v && v.length > 0,
    default: "PropChain",
  },
  NEXT_PUBLIC_APP_URL: {
    validate: (v) => !v || isValidUrl(v),
    default: "http://localhost:3000/",
  },
  NODE_ENV: {
    validate: (v) => ["development", "staging", "production"].includes(v),
    default: "development",
  },
  ANALYZE: {
    validate: (v) => !v || v === "true" || v === "false",
    default: "false",
  },
  NEXT_PUBLIC_PROPERTY_API_URL: {
    validate: (v) => !v || isValidUrl(v),
    default: undefined,
  },
  NEXT_PUBLIC_ANALYTICS_API_URL: {
    validate: (v) => !v || isValidUrl(v),
    default: undefined,
  },
  ETHEREUM_MAINNET_RPC_URL: {
    validate: (v) => !v || isValidUrl(v),
    default: undefined,
  },
  POLYGON_MAINNET_RPC_URL: {
    validate: (v) => !v || isValidUrl(v),
    default: undefined,
  },
  BSC_MAINNET_RPC_URL: {
    validate: (v) => !v || isValidUrl(v),
    default: undefined,
  },
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: {
    validate: (v) => !v || typeof v === "string",
    default: undefined,
  },
  NEXT_PUBLIC_ANALYTICS_ENABLED: {
    validate: (v) => !v || v === "true" || v === "false",
    default: "false",
  },
  NEXT_PUBLIC_ERROR_REPORTING_ENABLED: {
    validate: (v) => !v || v === "true" || v === "false",
    default: "true",
  },
  NEXT_PUBLIC_DEBUG_MODE: {
    validate: (v) => !v || v === "true" || v === "false",
    default: "false",
  },
  NEXT_PUBLIC_MAINTENANCE_MODE: {
    validate: (v) => !v || v === "true" || v === "false",
    default: "false",
  },
  NEXT_PUBLIC_DEFAULT_LOCALE: {
    validate: (v) => typeof v === "string",
    default: "en",
  },
  NEXT_PUBLIC_SUPPORTED_LOCALES: {
    validate: (v) => typeof v === "string",
    default: "en,es,fr,de,zh,ar,he",
  },
  NEXT_PUBLIC_GA_MEASUREMENT_ID: {
    validate: (v) => !v || typeof v === "string",
    default: undefined,
  },
  NEXT_PUBLIC_SENTRY_DSN: {
    validate: (v) => !v || isValidUrl(v),
    default: undefined,
  },
  NEXT_PUBLIC_USE_MOCK_DATA: {
    validate: (v) => !v || v === "true" || v === "false",
    default: "false",
  },
  NEXT_PUBLIC_SKIP_AUTH: {
    validate: (v) => !v || v === "true" || v === "false",
    default: "false",
  },
};

// Environment-specific requirements
const envRequirements = {
  development: {
    ETHEREUM_MAINNET_RPC_URL: {validate: (v) => !v || isValidUrl(v)},
  },
  staging: {
    ETHEREUM_MAINNET_RPC_URL: {validate: isValidUrl},
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: {
      validate: (v) => typeof v === "string",
    },
  },
  production: {
    ETHEREUM_MAINNET_RPC_URL: {validate: isValidUrl},
    POLYGON_MAINNET_RPC_URL: {validate: isValidUrl},
    BSC_MAINNET_RPC_URL: {validate: isValidUrl},
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: {validate: (v) => v && v.length > 0},
  },
};

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}
function logSection(title) {
  log(colors.cyan, `\n${"=".repeat(60)}\n  ${title}\n${"=".repeat(60)}`);
}
function logSuccess(message) {
  log(colors.green, `✓ ${message}`);
}
function logError(message) {
  log(colors.red, `✗ ${message}`);
}
function logWarning(message) {
  log(colors.yellow, `⚠ ${message}`);
}
function logInfo(message) {
  log(colors.blue, `ℹ ${message}`);
}

function validateEnv() {
  const errors = [];
  const config = {};
  for (const [key, schema] of Object.entries(envSchema)) {
    const value = process.env[key] ?? schema.default;
    config[key] = value;
    if (!schema.validate(value)) {
      errors.push(`${key}: Invalid value`);
    }
  }
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
  return config;
}

function validateEnvRequirements(config) {
  const nodeEnv = config.NODE_ENV;
  const requirements = envRequirements[nodeEnv];
  const errors = [];
  for (const [key, schema] of Object.entries(requirements)) {
    const value = config[key];
    if (!schema.validate(value)) {
      errors.push(`${key}: Required for ${nodeEnv}`);
    }
  }
  if (errors.length > 0) {
    throw new Error(
      `Environment-specific requirements for '${nodeEnv}' not met:\n${errors.join("\n")}`,
    );
  }
}

function transformBool(val) {
  return val === "true";
}

async function main() {
  logSection("Environment Variable Validation");
  const nodeEnv = process.env.NODE_ENV || "development";
  logInfo(`Current environment: ${nodeEnv}`);
  try {
    logSection("Step 1: Validating Environment Variables");
    const config = validateEnv();
    logSuccess("All required environment variables are valid");

    logSection("Step 2: Validating Environment-Specific Requirements");
    validateEnvRequirements(config);
    logSuccess(`Environment-specific requirements for '${nodeEnv}' are met`);

    logSection("Step 3: Configuration Summary");
    console.log("\nApplication Settings:");
    console.log(`  - App Name: ${config.NEXT_PUBLIC_APP_NAME}`);
    console.log(`  - App URL: ${config.NEXT_PUBLIC_APP_URL}`);
    console.log(`  - Node Environment: ${config.NODE_ENV}`);
    console.log(
      `  - Debug Mode: ${transformBool(config.NEXT_PUBLIC_DEBUG_MODE) ? "Enabled" : "Disabled"}`,
    );
    console.log("\nFeature Flags:");
    console.log(
      `  - Analytics: ${transformBool(config.NEXT_PUBLIC_ANALYTICS_ENABLED) ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `  - Error Reporting: ${transformBool(config.NEXT_PUBLIC_ERROR_REPORTING_ENABLED) ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `  - Maintenance Mode: ${transformBool(config.NEXT_PUBLIC_MAINTENANCE_MODE) ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `  - Mock Data: ${transformBool(config.NEXT_PUBLIC_USE_MOCK_DATA) ? "Enabled" : "Disabled"}`,
    );
    console.log("\nWeb3 Configuration:");
    console.log(
      `  - Ethereum RPC: ${config.ETHEREUM_MAINNET_RPC_URL ? "Configured" : "Using default"}`,
    );
    console.log(
      `  - Polygon RPC: ${config.POLYGON_MAINNET_RPC_URL ? "Configured" : "Using default"}`,
    );
    console.log(
      `  - BSC RPC: ${config.BSC_MAINNET_RPC_URL ? "Configured" : "Using default"}`,
    );
    console.log(
      `  - WalletConnect Project ID: ${config.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? "Configured" : "Not set"}`,
    );

    logSection("Step 4: Security Check");
    const warnings = [];
    if (nodeEnv === "production") {
      if (!config.ETHEREUM_MAINNET_RPC_URL) {
        warnings.push(
          "Ethereum RPC URL not set - using default (not recommended for production)",
        );
      }
      if (!config.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
        warnings.push(
          "WalletConnect Project ID not set - WalletConnect will not work",
        );
      }
      if (transformBool(config.NEXT_PUBLIC_DEBUG_MODE)) {
        warnings.push(
          "Debug mode is enabled in production - this may expose sensitive information",
        );
      }
    }
    if (
      config.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ===
      "your-walletconnect-project-id"
    ) {
      warnings.push("WalletConnect Project ID is still set to example value");
    }
    if (
      config.ETHEREUM_MAINNET_RPC_URL &&
      config.ETHEREUM_MAINNET_RPC_URL.includes("YOUR_INFURA_PROJECT_ID")
    ) {
      warnings.push(
        "Ethereum RPC URL contains placeholder - replace with actual API key",
      );
    }

    if (warnings.length > 0) {
      warnings.forEach((w) => logWarning(w));
    } else {
      logSuccess("No security issues detected");
    }

    logSection("Validation Complete");
    logSuccess("Environment validation passed!\n");
    process.exit(0);
  } catch (error) {
    logSection("Validation Failed");
    logError(error.message);
    console.log("\n");
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Unexpected error: ${error}`);
  process.exit(1);
});
