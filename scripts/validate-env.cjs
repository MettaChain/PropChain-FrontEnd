/**
 * Environment Validation Script
 *
 * Run with: npm run validate:env
 * Or: node scripts/validate-env.cjs
 *
 * `.cjs` rather than `.js`: package.json sets "type": "module", so a `.js` file
 * here is ESM and cannot `require`. CommonJS is what lets ts-node register a
 * loader and pull in the TypeScript schema synchronously.
 *
 * Exit codes:
 * 0 - Validation successful
 * 1 - Validation failed
 *
 * This script does NOT define its own schema. It loads the canonical zod schema
 * from `src/config/env/schema.ts` through `ts-node/register`, so CI and runtime
 * validate against one definition (#1089).
 *
 * It previously carried a hand-rolled copy of the schema, which had drifted:
 * eleven variables were validated at runtime but not here, and `AUTH_SECRET` /
 * `CSRF_SECRET` were validated here but not at runtime. `src/config/env/schema.ts`
 * and `src/config/env/introspect.ts` are both free of `@/` imports so they load
 * under plain Node.
 */

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    target: "es2020",
    moduleResolution: "node",
    esModuleInterop: true,
    skipLibCheck: true,
  },
  // package.json sets "type": "module", which would otherwise mark every .ts in
  // scope as ESM and make require() of the schema fail. These two modules are
  // deliberately free of app imports, so loading them as CommonJS is safe.
  moduleTypes: {
    "src/config/env/schema.ts": "cjs",
    "src/config/env/introspect.ts": "cjs",
  },
});

const { envSchema, envRequirementsSchema, sensitiveVariables } = require("../src/config/env/schema.ts");
const { describeSchema } = require("../src/config/env/introspect.ts");

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

/** Formats zod issues the same way the runtime validator does. */
function formatIssues(error) {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

/** Validates process.env against the canonical base schema. */
function validateBase() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Environment validation failed:\n${formatIssues(result.error)}`);
  }
  return result.data;
}

/**
 * Validates the environment-specific requirements.
 *
 * Production only warns, matching `validateEnvRequirements` at runtime: a
 * production build is allowed to complete without every live Web3 value, and
 * failing the build here would diverge from the app's own behaviour.
 */
function validateRequirements(config) {
  const env = config.NODE_ENV;
  const result = envRequirementsSchema.shape[env].safeParse(config);
  if (result.success) return [];

  const errors = formatIssues(result.error);
  if (env === "production") {
    return [`Requirements for 'production' are not fully met:\n${errors}`];
  }
  throw new Error(`Environment-specific requirements for '${env}' not met:\n${errors}`);
}

/** Masks a value so a secret is never echoed to CI logs. */
function display(key, value) {
  if (value === undefined || value === "") return "Not set";
  return sensitiveVariables.includes(key) ? "Configured (hidden)" : String(value);
}

function main() {
  logSection("Environment Variable Validation");
  const nodeEnv = process.env.NODE_ENV || "development";
  logInfo(`Current environment: ${nodeEnv}`);
  logInfo("Schema source: src/config/env/schema.ts (single definition)");

  try {
    logSection("Step 1: Validating Against The Canonical Schema");
    const config = validateBase();
    const summary = describeSchema(config.NODE_ENV);
    logSuccess(`All ${summary.total} known variables are valid`);
    if (summary.alwaysRequired.length > 0) {
      logInfo(`Always required: ${summary.alwaysRequired.join(", ")}`);
    }

    logSection("Step 2: Validating Environment-Specific Requirements");
    if (summary.requiredForEnv.length > 0) {
      logInfo(`Required for '${config.NODE_ENV}': ${summary.requiredForEnv.join(", ")}`);
    }
    const requirementWarnings = validateRequirements(config);
    if (requirementWarnings.length === 0) {
      logSuccess(`Environment-specific requirements for '${config.NODE_ENV}' are met`);
    } else {
      requirementWarnings.forEach((w) => logWarning(w));
    }

    logSection("Step 3: Configuration Summary");
    console.log("\nApplication Settings:");
    console.log(`  - App Name: ${display("NEXT_PUBLIC_APP_NAME", config.NEXT_PUBLIC_APP_NAME)}`);
    console.log(`  - App URL: ${display("NEXT_PUBLIC_APP_URL", config.NEXT_PUBLIC_APP_URL)}`);
    console.log(`  - Node Environment: ${config.NODE_ENV}`);
    console.log(`  - Debug Mode: ${config.NEXT_PUBLIC_DEBUG_MODE ? "Enabled" : "Disabled"}`);

    console.log("\nFeature Flags:");
    console.log(`  - Analytics: ${config.NEXT_PUBLIC_ANALYTICS_ENABLED ? "Enabled" : "Disabled"}`);
    console.log(
      `  - Error Reporting: ${config.NEXT_PUBLIC_ERROR_REPORTING_ENABLED ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `  - Maintenance Mode: ${config.NEXT_PUBLIC_MAINTENANCE_MODE ? "Enabled" : "Disabled"}`,
    );
    console.log(`  - Mock Data: ${config.NEXT_PUBLIC_USE_MOCK_DATA ? "Enabled" : "Disabled"}`);
    console.log(`  - Demo Routes: ${config.NEXT_PUBLIC_ENABLE_DEMOS ? "Enabled" : "Disabled"}`);

    console.log("\nSecrets:");
    console.log(`  - AUTH_SECRET: ${display("AUTH_SECRET", config.AUTH_SECRET)}`);
    console.log(`  - CSRF_SECRET: ${display("CSRF_SECRET", config.CSRF_SECRET)}`);

    console.log("\nWeb3 Configuration:");
    for (const key of [
      "ETHEREUM_MAINNET_RPC_URL",
      "POLYGON_MAINNET_RPC_URL",
      "BSC_MAINNET_RPC_URL",
      "LOCAL_RPC_URL",
      "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
    ]) {
      console.log(`  - ${key}: ${display(key, config[key])}`);
    }

    logSection("Step 4: Security Check");
    const warnings = [];
    if (config.NODE_ENV === "production" && config.NEXT_PUBLIC_DEBUG_MODE) {
      warnings.push("Debug mode is enabled in production - this may expose sensitive information");
    }
    if (config.NODE_ENV === "production" && config.NEXT_PUBLIC_ENABLE_DEMOS) {
      warnings.push("Demo routes are enabled in production - they should 404 there");
    }
    if (config.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID === "your-walletconnect-project-id") {
      warnings.push("WalletConnect Project ID is still set to the example value");
    }
    if (
      config.ETHEREUM_MAINNET_RPC_URL &&
      config.ETHEREUM_MAINNET_RPC_URL.includes("YOUR_INFURA_PROJECT_ID")
    ) {
      warnings.push("Ethereum RPC URL contains a placeholder - replace with an actual API key");
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

main();
