/**
 * Type-safe dot-path accessor for the comparison table (#1054).
 * Replaces the previous `(obj: any, path: string): any` signature.
 */
export function getNestedValue<T extends object>(
  obj: T,
  path: string
): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (current, key) =>
        current != null && typeof current === 'object'
          ? (current as Record<string, unknown>)[key]
          : undefined,
      obj
    );
}
