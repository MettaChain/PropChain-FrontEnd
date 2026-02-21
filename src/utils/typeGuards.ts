export type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === "object" && value !== null;
};

export const hasStringField = <K extends string>(
  value: UnknownRecord,
  key: K,
): value is UnknownRecord & Record<K, string> => {
  return typeof value[key] === "string";
};

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

export const getErrorCode = (error: unknown): number | string | undefined => {
  if (isRecord(error)) {
    const { code } = error;
    if (typeof code === "number" || typeof code === "string") {
      return code;
    }
  }

  return undefined;
};
