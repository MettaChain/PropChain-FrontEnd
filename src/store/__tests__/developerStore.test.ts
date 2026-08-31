import { act, renderHook } from '@testing-library/react';
import { useDeveloperStore } from '../developerStore';
import type { DeveloperProfile } from '@/types/developer';

const mockDeveloper = (overrides: Partial<DeveloperProfile> = {}): DeveloperProfile => ({
  id: 'dev-new',
  walletAddress: '0xNewWallet1234567890NewWallet1234567890NewWallet12',
  name: 'New Dev Co',
  company: 'New Dev Co LLC',
  description: 'A fresh developer',
  propertyIds: ['prop-9'],
  verificationStatus: 'pending',
  documents: [],
  createdAt: '2024-03-01T00:00:00Z',
  ...overrides,
});

describe('developerStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Restore the seeded mock developers.
    useDeveloperStore.setState({
      developers: [
        mockDeveloper({
          id: 'dev-1',
          walletAddress: '0xAbCd1234567890AbCd1234567890AbCd12345678',
          name: 'Skyline Properties',
          propertyIds: ['prop-1', 'prop-2'],
          verificationStatus: 'verified',
          verifiedAt: '2024-01-15T10:00:00Z',
        }),
        mockDeveloper({
          id: 'dev-2',
          walletAddress: '0xDeF0987654321DeF0987654321DeF098765432',
          name: 'Urban Ventures',
          propertyIds: ['prop-3'],
          verificationStatus: 'pending',
        }),
      ],
    });
  });

  it('is seeded with mock verified developers', () => {
    const { result } = renderHook(() => useDeveloperStore());
    expect(result.current.developers).toHaveLength(2);
    expect(result.current.developers[0].name).toBe('Skyline Properties');
  });

  it('upserts a new developer', () => {
    const { result } = renderHook(() => useDeveloperStore());

    act(() => {
      result.current.upsertDeveloper(mockDeveloper());
    });

    expect(result.current.developers).toHaveLength(3);
    expect(result.current.developers[0].id).toBe('dev-new');
  });

  it('upserting an existing developer updates the profile in place', () => {
    const { result } = renderHook(() => useDeveloperStore());

    act(() => {
      result.current.upsertDeveloper(
        mockDeveloper({ id: 'dev-1', name: 'Skyline Rebranded' }),
      );
    });

    expect(result.current.developers).toHaveLength(2);
    const dev1 = result.current.developers.find((d) => d.id === 'dev-1');
    expect(dev1?.name).toBe('Skyline Rebranded');
  });

  it('looks up a developer by wallet address case-insensitively', () => {
    const { result } = renderHook(() => useDeveloperStore());

    const found = result.current.getDeveloperByWallet(
      '0xabcd1234567890abcd1234567890abcd12345678',
    );
    expect(found?.name).toBe('Skyline Properties');
    expect(result.current.getDeveloperByWallet('0xNope...')).toBeUndefined();
  });

  it('looks up a developer by property id', () => {
    const { result } = renderHook(() => useDeveloperStore());

    expect(result.current.getDeveloperByProperty('prop-3')?.name).toBe('Urban Ventures');
    expect(result.current.getDeveloperByProperty('prop-9')).toBeUndefined();
  });

  it('marks a developer as verified with a verifiedAt timestamp', () => {
    const { result } = renderHook(() => useDeveloperStore());

    act(() => {
      result.current.updateVerificationStatus('dev-2', 'verified');
    });

    const dev2 = result.current.developers.find((d) => d.id === 'dev-2');
    expect(dev2?.verificationStatus).toBe('verified');
    expect(dev2?.verifiedAt).toBeTruthy();
  });

  it('records the rejection reason when rejecting a developer', () => {
    const { result } = renderHook(() => useDeveloperStore());

    act(() => {
      result.current.updateVerificationStatus('dev-2', 'rejected', 'Documents incomplete');
    });

    const dev2 = result.current.developers.find((d) => d.id === 'dev-2');
    expect(dev2?.verificationStatus).toBe('rejected');
    expect(dev2?.rejectionReason).toBe('Documents incomplete');
  });

  it('persists developer state across store instances', () => {
    const { result } = renderHook(() => useDeveloperStore());

    act(() => {
      result.current.upsertDeveloper(mockDeveloper());
    });

    const { result: result2 } = renderHook(() => useDeveloperStore());
    expect(result2.current.developers).toHaveLength(3);
    expect(result2.current.developers[0].id).toBe('dev-new');
  });
});
