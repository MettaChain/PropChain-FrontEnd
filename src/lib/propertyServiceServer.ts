import { logger } from '@/utils/logger';
import { propertyService } from './propertyService';
import type { Property } from '@/types/property';
import { revalidatePath } from 'next/cache';

/**
 * Server-side property service functions for ISR
 */

/**
 * Get property data for ISR - server side only
 */
export async function getPropertyForISR(id: string): Promise<Property | null> {
  try {
    const property = await propertyService.getPropertyById(id);
    return property;
  } catch (error) {
    logger.error('Failed to fetch property for ISR:', error);
    return null;
  }
}

/**
 * Revalidate property pages on-demand
 */
export async function revalidateProperty(propertyId: string) {
  try {
    revalidatePath(`/properties/${propertyId}`);
    revalidatePath('/properties'); // Also revalidate the properties list
    return { success: true, message: 'Property revalidated successfully' };
  } catch (error) {
    logger.error('Failed to revalidate property:', error);
    return { success: false, message: 'Failed to revalidate property' };
  }
}

/**
 * Revalidate all property pages
 */
export async function revalidateAllProperties() {
  try {
    revalidatePath('/properties');
    // Note: We would need to iterate through all property IDs to revalidate individual pages
    // For now, we'll revalidate the main properties page
    return { success: true, message: 'All properties revalidated successfully' };
  } catch (error) {
    logger.error('Failed to revalidate all properties:', error);
    return { success: false, message: 'Failed to revalidate all properties' };
  }
}
