import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComplianceAuditLog } from '../ComplianceAuditLog';
import { useKycStore } from '@/store/kycStore';
import type { ComplianceLogEntry } from '@/types/kyc';

describe('ComplianceAuditLog', () => {
  beforeEach(() => {
    useKycStore.getState().resetKyc();
  });

  it('shows an empty state when there is no compliance activity', () => {
    render(<ComplianceAuditLog />);

    expect(
      screen.getByText('No compliance activity yet.')
    ).toBeInTheDocument();
  });

  it('renders a human-readable label for each audit entry', () => {
    useKycStore.setState({
      auditLog: [
        {
          id: 'log-1',
          timestamp: '2026-08-01T10:00:00.000Z',
          event: 'document_uploaded',
          details: { name: 'passport.pdf' },
        },
        {
          id: 'log-2',
          timestamp: '2026-08-01T10:05:00.000Z',
          event: 'verification_approved',
          details: { provider: 'TrustLayer Mock' },
        },
      ],
    });

    render(<ComplianceAuditLog />);

    expect(screen.getByText('Document uploaded')).toBeInTheDocument();
    expect(screen.getByText('Verification approved')).toBeInTheDocument();
    expect(screen.queryByText('No compliance activity yet.')).not.toBeInTheDocument();
  });

  it('renders the event details for each entry', () => {
    useKycStore.setState({
      auditLog: [
        {
          id: 'log-1',
          timestamp: '2026-08-01T10:00:00.000Z',
          event: 'transaction_blocked',
          details: { valueEth: 25, allowed: false },
        },
      ],
    });

    render(<ComplianceAuditLog />);

    expect(screen.getByText('Transaction blocked')).toBeInTheDocument();
    expect(screen.getByText('valueEth: 25')).toBeInTheDocument();
    expect(screen.getByText('allowed: false')).toBeInTheDocument();
  });

  it('covers all known event types with labels', () => {
    const events: ComplianceLogEntry['event'][] = [
      'threshold_updated',
      'document_uploaded',
      'liveness_started',
      'liveness_passed',
      'liveness_failed',
      'verification_submitted',
      'verification_approved',
      'verification_rejected',
      'transaction_screened',
      'transaction_blocked',
    ];

    useKycStore.setState({
      auditLog: events.map((event, index) => ({
        id: `log-${index}`,
        timestamp: `2026-08-01T10:0${index}:00.000Z`,
        event,
        details: {},
      })),
    });

    render(<ComplianceAuditLog />);

    expect(screen.getByText('Threshold updated')).toBeInTheDocument();
    expect(screen.getByText('Document uploaded')).toBeInTheDocument();
    expect(screen.getByText('Liveness started')).toBeInTheDocument();
    expect(screen.getByText('Liveness passed')).toBeInTheDocument();
    expect(screen.getByText('Liveness failed')).toBeInTheDocument();
    expect(screen.getByText('Verification submitted')).toBeInTheDocument();
    expect(screen.getByText('Verification approved')).toBeInTheDocument();
    expect(screen.getByText('Verification rejected')).toBeInTheDocument();
    expect(screen.getByText('Transaction screened')).toBeInTheDocument();
    expect(screen.getByText('Transaction blocked')).toBeInTheDocument();
  });
});
