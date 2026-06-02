import { useKycStore } from '../kycStore';

describe('kyc store', () => {
  beforeEach(() => {
    useKycStore.getState().resetKyc();
  });

  it('updates the configured threshold', () => {
    useKycStore.getState().setThreshold(25);

    expect(useKycStore.getState().profile.thresholdEth).toBe(25);
    expect(useKycStore.getState().auditLog[0].event).toBe('threshold_updated');
  });

  it('records document uploads and verification approval', () => {
    useKycStore.getState().addDocuments([
      {
        id: 'doc-1',
        name: 'passport.pdf',
        type: 'application/pdf',
        size: 1024,
        uploadedAt: '2026-04-26T00:00:00.000Z',
      },
    ]);
    useKycStore.getState().startLivenessCheck();
    useKycStore.getState().completeLivenessCheck(true);
    useKycStore.getState().submitVerification();

    expect(useKycStore.getState().profile.status).toBe('verified');
    expect(useKycStore.getState().profile.documents).toHaveLength(1);
    expect(useKycStore.getState().auditLog.some((entry) => entry.event === 'verification_approved')).toBe(true);
  });

  it('logs blocked transaction screenings', () => {
    useKycStore.getState().logTransactionScreening(25, true, false);

    expect(useKycStore.getState().auditLog[0].event).toBe('transaction_blocked');
    expect(useKycStore.getState().auditLog[0].details.allowed).toBe(false);
  });
});
