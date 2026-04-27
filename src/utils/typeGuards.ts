export type UnknownRecord = Record<string, unknown>;

/**
 * Checks if a value is a non-null object and not an array.
 * 
 * @param value - The value to check.
 * @returns True if the value is an object, false otherwise.
 */
export const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Checks if an object has a specific string field.
 * 
 * @param value - The value to check.
 * @param key - The key to look for.
 * @returns True if the value is an object and the key is a string.
 */
export const hasStringField = <K extends string>(
  value: unknown,
  key: K,
): value is UnknownRecord & Record<K, string> => {
  return isRecord(value) && typeof value[key] === "string";
};

/**
 * Extracts a human-readable error message from various error types.
 * 
 * @param error - The error object or value to extract the message from.
 * @param fallback - The default message to return if no message is found.
 * @returns The extracted error message or the fallback.
 */
export const getErrorMessage = (
  error: unknown,
  fallback = "Unknown error occurred",
): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback;
};

/**
 * Extracts an error code from an error object.
 * 
 * @param error - The error object to extract the code from.
 * @returns The error code (number or string) or undefined if not found.
 */
export const getErrorCode = (error: unknown): number | string | undefined => {
  if (isRecord(error)) {
    const { code } = error;
    if (typeof code === "number" || typeof code === "string") {
      return code;
    }
  }

  return undefined;
};
