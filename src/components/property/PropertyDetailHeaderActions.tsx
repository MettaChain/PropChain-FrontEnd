'use client';

import { PriceAlertBell } from '@/components/PriceAlertBell';
import { WalletConnector } from '@/components/WalletConnector';

/**
 * Issue #1093 — the client island in the property detail header.
 *
 * This was `src/components/PropertyDetailClient.tsx`, a name that promised a
 * client rendering of the whole property detail and delivered two buttons. The
 * misleading name is most of why a second, unrelated `PropertyDetailClient`
 * grew under `src/app/properties/[id]/` taking a different prop shape: nothing
 * about the old name said "header actions", so the obvious name was still free.
 *
 * It also took a `propertyId` prop it never read. That is gone; the bell and the
 * connector both resolve their own state.
 *
 * `AppHeader` supplies the flex row, so this returns a fragment.
 *
 * @returns The interactive controls for the property detail header.
 */
export function PropertyDetailHeaderActions() {
  return (
    <>
      <PriceAlertBell />
      <WalletConnector />
    </>
  );
}

export default PropertyDetailHeaderActions;
