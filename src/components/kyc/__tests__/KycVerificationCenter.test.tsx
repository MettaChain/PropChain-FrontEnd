import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { KycVerificationCenter } from '../KycVerificationCenter';
import { useKycStore } from '@/store/kycStore';
import type { KycDocument } from '@/types/kyc';

const makeFile = (name: string, type: string): File =>
  new File(['content'], name, { type });

describe('KycVerificationCenter', () => {
  beforeEach(() => {
    useKycStore.getState().resetKyc();
  });

  it('renders the provider and initial unverified status', () => {
    render(<KycVerificationCenter />);

    expect(
      screen.getByText(/provider: trustlayer mock/i)
    ).toBeInTheDocument();
    expect(screen.getByText('unverified')).toBeInTheDocument();
    expect(screen.getByText(/liveness: not_started/i)).toBeInTheDocument();
  });

  it('saves a new threshold through the store', () => {
    render(<KycVerificationCenter />);

    const input = screen.getByLabelText('KYC threshold (ETH)');
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(useKycStore.getState().profile.thresholdEth).toBe(25);
    expect(
      useKycStore.getState().auditLog[0].event
    ).toBe('threshold_updated');
  });

  it('records uploaded documents in the store', async () => {
    render(<KycVerificationCenter />);

    await act(async () => {
      fireEvent.change(screen.getByTestId('kyc-file-input'), {
        target: { files: [makeFile('passport.pdf', 'application/pdf')] },
      });
    });

    const profile = useKycStore.getState().profile;
    expect(profile.documents).toHaveLength(1);
    expect(profile.documents[0].name).toBe('passport.pdf');
    expect(profile.status).toBe('pending');
    expect(
      screen.getByText('1 document(s) uploaded')
    ).toBeInTheDocument();
  });

  it('runs the liveness check and advances the step after it passes', async () => {
    jest.useFakeTimers();
    try {
      render(<KycVerificationCenter />);

      fireEvent.click(
        screen.getByRole('button', { name: /run liveness check/i })
      );

      expect(useKycStore.getState().profile.livenessStatus).toBe('pending');

      await act(async () => {
        jest.advanceTimersByTime(1200);
      });

      expect(useKycStore.getState().profile.livenessStatus).toBe('passed');
      expect(
        screen.getByText('Liveness status: passed')
      ).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('gates submission until documents and liveness are complete', async () => {
    render(<KycVerificationCenter />);

    fireEvent.click(
      screen.getByRole('button', { name: /submit verification/i })
    );

    // Without documents or a passed liveness check the profile is rejected.
    expect(useKycStore.getState().profile.status).toBe('rejected');
    expect(
      useKycStore.getState().profile.rejectedReason
    ).toContain('Upload documents and pass liveness');
  });

  it('approves verification once all steps are complete', async () => {
    const documents: KycDocument[] = [
      {
        id: 'doc-1',
        name: 'passport.pdf',
        type: 'application/pdf',
        size: 1024,
        uploadedAt: '2026-08-01T10:00:00.000Z',
      },
    ];
    useKycStore.getState().addDocuments(documents);
    useKycStore.getState().completeLivenessCheck(true);

    render(<KycVerificationCenter />);

    fireEvent.click(
      screen.getByRole('button', { name: /submit verification/i })
    );

    await waitFor(() => {
      expect(useKycStore.getState().profile.status).toBe('verified');
    });

    expect(
      screen.getByRole('button', { name: /view compliance log/i })
    ).toBeInTheDocument();
    expect(
      useKycStore.getState().auditLog.some(
        (entry) => entry.event === 'verification_approved'
      )
    ).toBe(true);
  });

  it('shows a rejected state after a failed liveness attempt', () => {
    useKycStore.getState().startLivenessCheck();
    useKycStore.getState().completeLivenessCheck(false);

    render(<KycVerificationCenter />);

    expect(useKycStore.getState().profile.status).toBe('rejected');
    expect(
      screen.getByText('Liveness status: failed')
    ).toBeInTheDocument();
  });

  it('resets the flow back to defaults', () => {
    useKycStore.getState().addDocuments([
      {
        id: 'doc-1',
        name: 'passport.pdf',
        type: 'application/pdf',
        size: 1024,
        uploadedAt: '2026-08-01T10:00:00.000Z',
      },
    ]);

    render(<KycVerificationCenter />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    const profile = useKycStore.getState().profile;
    expect(profile.documents).toHaveLength(0);
    expect(profile.status).toBe('unverified');
  });

  it('updates the completion progress as steps are completed', async () => {
    const { container } = render(<KycVerificationCenter />);

    const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
    expect(indicator).toHaveStyle('transform: translateX(-100%)');

    await act(async () => {
      fireEvent.change(screen.getByTestId('kyc-file-input'), {
        target: { files: [makeFile('passport.pdf', 'application/pdf')] },
      });
    });

    // One of three steps complete → 33% filled.
    expect(indicator.style.transform).toMatch(/translateX\(-66\.\d+%\)/);
  });
});
