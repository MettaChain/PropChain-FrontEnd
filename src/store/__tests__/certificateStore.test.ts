import { act, renderHook } from '@testing-library/react';
import { useCertificateStore } from '../certificateStore';
import type { NFTCertificate } from '@/types/certificate';

const mockCertificate = (overrides: Partial<NFTCertificate> = {}): NFTCertificate => ({
  id: 'cert-1',
  propertyId: 'prop-1',
  propertyName: 'Test Property',
  propertyAddress: '1 Test St',
  propertyImage: null,
  tokenAmount: 10,
  tokenSymbol: 'TST',
  walletAddress: '0xAbCd...W1',
  purchaseDate: '2024-01-15T10:00:00Z',
  transactionHash: '0xtxhash123',
  network: 'ethereum',
  contractAddress: '0x1234...5678',
  ownershipPercentage: 1,
  ...overrides,
});

describe('certificateStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useCertificateStore.setState({ certificates: [] });
  });

  it('starts with no certificates', () => {
    const { result } = renderHook(() => useCertificateStore());
    expect(result.current.certificates).toEqual([]);
    expect(
      result.current.getCertificate('prop-1', '0xAbCd...W1'),
    ).toBeUndefined();
  });

  it('adds a certificate', () => {
    const { result } = renderHook(() => useCertificateStore());

    act(() => {
      result.current.addCertificate(mockCertificate());
    });

    expect(result.current.certificates).toHaveLength(1);
    expect(result.current.certificates[0].id).toBe('cert-1');
  });

  it('replaces a certificate for the same property and wallet', () => {
    const { result } = renderHook(() => useCertificateStore());

    act(() => {
      result.current.addCertificate(mockCertificate({ id: 'cert-1', tokenAmount: 10 }));
      result.current.addCertificate(mockCertificate({ id: 'cert-2', tokenAmount: 25 }));
    });

    expect(result.current.certificates).toHaveLength(1);
    expect(result.current.certificates[0].id).toBe('cert-2');
    expect(result.current.certificates[0].tokenAmount).toBe(25);
  });

  it('keeps separate certificates for different wallets', () => {
    const { result } = renderHook(() => useCertificateStore());

    act(() => {
      result.current.addCertificate(mockCertificate({ walletAddress: '0xAbCd...W1' }));
      result.current.addCertificate(mockCertificate({ walletAddress: '0xEfGh...W2' }));
    });

    expect(result.current.certificates).toHaveLength(2);
  });

  it('keeps separate certificates for different properties', () => {
    const { result } = renderHook(() => useCertificateStore());

    act(() => {
      result.current.addCertificate(mockCertificate({ propertyId: 'prop-1' }));
      result.current.addCertificate(mockCertificate({ propertyId: 'prop-2' }));
    });

    expect(result.current.certificates).toHaveLength(2);
  });

  it('getCertificate returns the matching certificate', () => {
    const { result } = renderHook(() => useCertificateStore());

    act(() => {
      result.current.addCertificate(
        mockCertificate({ propertyId: 'prop-1', walletAddress: '0xAbCd...W1' }),
      );
      result.current.addCertificate(
        mockCertificate({ propertyId: 'prop-2', walletAddress: '0xAbCd...W1' }),
      );
    });

    const found = result.current.getCertificate('prop-2', '0xAbCd...W1');
    expect(found?.propertyId).toBe('prop-2');
  });

  it('getCertificate returns undefined when nothing matches', () => {
    const { result } = renderHook(() => useCertificateStore());

    act(() => {
      result.current.addCertificate(mockCertificate());
    });

    expect(result.current.getCertificate('prop-9', '0xAbCd...W1')).toBeUndefined();
    expect(result.current.getCertificate('prop-1', '0xOther...W9')).toBeUndefined();
  });

  it('persists certificates across store instances', () => {
    const { result } = renderHook(() => useCertificateStore());

    act(() => {
      result.current.addCertificate(mockCertificate());
    });

    const { result: result2 } = renderHook(() => useCertificateStore());
    expect(result2.current.certificates).toHaveLength(1);
    expect(result2.current.certificates[0].id).toBe('cert-1');
  });
});
