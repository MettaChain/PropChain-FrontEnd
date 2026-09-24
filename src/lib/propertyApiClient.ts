/**
 * Real fetch-based client for NEXT_PUBLIC_PROPERTY_API_URL. Services should
 * call this instead of returning MOCK_PROPERTIES directly. Mocks stay
 * available via NEXT_PUBLIC_USE_MOCKS for Storybook/tests, but the default
 * (unset) path now hits a real endpoint when the URL is configured.
 */
import type { Property } from '@/types/property';

const API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL;
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export function shouldUseMocks(): boolean {
  return USE_MOCKS || !API_URL;
}

export async function fetchPropertiesFromApi(): Promise<Property[]> {
  if (!API_URL) {
    throw new Error(
      'NEXT_PUBLIC_PROPERTY_API_URL is not configured; call shouldUseMocks() before fetching.'
    );
  }

  const res = await fetch(`${API_URL}/properties`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Property API request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<Property[]>;
}
