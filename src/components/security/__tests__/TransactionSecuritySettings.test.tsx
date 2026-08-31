import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionSecuritySettings } from '../TransactionSecuritySettings';
import { useTransactionSecurityStore } from '@/store/transactionSecurityStore';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('@/store/transactionSecurityStore', () => ({
  useTransactionSecurityStore: jest.fn(),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,QUJD'),
}));

jest.mock('@/utils/security/transactionSecurity', () => ({
  buildOtpAuthUri: jest.fn(
    ({ issuer, accountName }: { issuer: string; accountName: string }) =>
      `otpauth://totp/${issuer}:${accountName}?secret=SECRET`
  ),
  formatTrustedDeviceExpiry: jest.fn((timestamp: number) =>
    new Date(timestamp).toLocaleDateString()
  ),
  getSecurityDeviceId: jest.fn(() => 'device-test-1'),
  getSecurityDeviceLabel: jest.fn(() => 'Test Browser'),
}));

jest.mock('@/utils/security/totp', () => ({
  normalizeTotpCode: jest.fn((code: string) => code.trim()),
}));

const defaultSettings = {
  thresholdEth: 2,
  twoFactorRequired: true,
  totpEnabled: true,
  hardwareWalletEnabled: true,
  trustedDeviceBypass: true,
  trustedDeviceDurationDays: 30,
  totpIssuer: 'PropChain',
  totpAccountLabel: 'Primary wallet',
  totpSecret: null,
};

const storeState = {
  settings: { ...defaultSettings },
  trustedDevices: [] as { id: string; label: string; trustUntil: number }[],
  lastVerifiedAt: null as number | null,
  lastVerificationMethod: null as string | null,
  updateSettings: jest.fn(),
  enrollTotp: jest.fn(() => ({
    secret: 'MOCK-SECRET',
    otpauthUri: 'otpauth://totp/PropChain:Primary%20wallet?secret=MOCK-SECRET',
  })),
  verifyTotpCode: jest.fn().mockResolvedValue(true),
  trustDevice: jest.fn(() => ({
    id: 'device-test-1',
    label: 'Test Browser',
    createdAt: 1,
    lastUsedAt: 1,
    trustUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })),
  revokeTrustedDevice: jest.fn(),
  clearTrustedDevices: jest.fn(),
  setLastVerification: jest.fn(),
  resetSecurity: jest.fn(),
  getActiveTrustedDevice: jest.fn(() => null),
};

const mockedStore = useTransactionSecurityStore as jest.Mock;

describe('TransactionSecuritySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeState.settings = { ...defaultSettings };
    storeState.trustedDevices = [];
    storeState.lastVerifiedAt = null;
    storeState.lastVerificationMethod = null;
    storeState.getActiveTrustedDevice.mockReturnValue(null);
    mockedStore.mockReturnValue(storeState);
  });

  it('renders the security section with the store settings reflected', () => {
    render(<TransactionSecuritySettings />);

    expect(screen.getByText('Transaction Security')).toBeInTheDocument();

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(4);
    expect(switches[0]).toHaveAttribute('data-state', 'checked');
    expect(switches[1]).toHaveAttribute('data-state', 'checked');
    expect(switches[2]).toHaveAttribute('data-state', 'checked');
    expect(switches[3]).toHaveAttribute('data-state', 'checked');
  });

  it('persists the step-up verification toggle via the store', () => {
    render(<TransactionSecuritySettings />);

    fireEvent.click(screen.getAllByRole('switch')[0]);

    expect(storeState.updateSettings).toHaveBeenCalledWith({
      twoFactorRequired: false,
    });
  });

  it('persists the totp toggle via the store', () => {
    render(<TransactionSecuritySettings />);

    fireEvent.click(screen.getAllByRole('switch')[1]);

    expect(storeState.updateSettings).toHaveBeenCalledWith({
      totpEnabled: false,
    });
  });

  it('persists the hardware wallet toggle via the store', () => {
    render(<TransactionSecuritySettings />);

    fireEvent.click(screen.getAllByRole('switch')[2]);

    expect(storeState.updateSettings).toHaveBeenCalledWith({
      hardwareWalletEnabled: false,
    });
  });

  it('persists the trusted device bypass toggle via the store', () => {
    render(<TransactionSecuritySettings />);

    fireEvent.click(screen.getAllByRole('switch')[3]);

    expect(storeState.updateSettings).toHaveBeenCalledWith({
      trustedDeviceBypass: false,
    });
  });

  it('reflects the persisted enabled state of each toggle on render', () => {
    storeState.settings = {
      ...defaultSettings,
      twoFactorRequired: false,
      totpEnabled: false,
      hardwareWalletEnabled: false,
      trustedDeviceBypass: false,
    };

    render(<TransactionSecuritySettings />);

    const switches = screen.getAllByRole('switch');
    switches.forEach((sw) =>
      expect(sw).toHaveAttribute('data-state', 'unchecked')
    );

    // Current policy summary mirrors the saved settings.
    expect(screen.getByText('2FA off')).toBeInTheDocument();
    expect(screen.queryByText('2FA on')).not.toBeInTheDocument();
  });

  it('shows the current policy summary from persisted settings', () => {
    render(<TransactionSecuritySettings />);

    expect(screen.getByText('2FA on')).toBeInTheDocument();
    // Threshold appears both in the header badge and the policy summary.
    expect(screen.getAllByText('2.00 ETH').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Enabled')).toHaveLength(3); // TOTP, hardware wallet, trusted bypass
  });

  it('saves a new high-value threshold', () => {
    render(<TransactionSecuritySettings />);

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /save threshold/i }));

    expect(storeState.updateSettings).toHaveBeenCalledWith({
      thresholdEth: 5,
    });
    expect(toast.success).toHaveBeenCalledWith('Security threshold saved');
  });

  it('clamps out-of-range thresholds to the allowed bounds', () => {
    render(<TransactionSecuritySettings />);

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.click(screen.getByRole('button', { name: /save threshold/i }));

    expect(storeState.updateSettings).toHaveBeenCalledWith({
      thresholdEth: 25,
    });
  });

  it('keeps the trust-this-browser button disabled until a verification exists', () => {
    storeState.lastVerifiedAt = null;
    render(<TransactionSecuritySettings />);

    const trustButton = screen.getByRole('button', {
      name: /trust this browser/i,
    });
    expect(trustButton).toBeDisabled();

    fireEvent.click(trustButton);
    expect(storeState.trustDevice).not.toHaveBeenCalled();
  });

  it('trusts the current browser once a verification exists', () => {
    storeState.lastVerifiedAt = Date.now();
    storeState.lastVerificationMethod = 'totp';
    render(<TransactionSecuritySettings />);

    fireEvent.click(
      screen.getByRole('button', { name: /trust this browser/i })
    );

    expect(storeState.trustDevice).toHaveBeenCalledWith(
      'device-test-1',
      'Test Browser'
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Trusted')
    );
  });

  it('shows the last verification method banner', () => {
    storeState.lastVerifiedAt = Date.now();
    storeState.lastVerificationMethod = 'totp';
    render(<TransactionSecuritySettings />);

    expect(
      screen.getByText(/last verified via totp/i)
    ).toBeInTheDocument();
  });

  it('lists trusted devices and revokes them', () => {
    storeState.trustedDevices = [
      {
        id: 'device-a',
        label: 'Work laptop',
        trustUntil: Date.now() + 1000,
      },
    ];
    render(<TransactionSecuritySettings />);

    expect(screen.getByText('Work laptop')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '' }));

    expect(storeState.revokeTrustedDevice).toHaveBeenCalledWith('device-a');
  });

  it('shows the active trusted device state', () => {
    storeState.trustedDevices = [
      {
        id: 'device-test-1',
        label: 'Test Browser',
        trustUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
    ];

    render(<TransactionSecuritySettings />);

    expect(screen.getByText('Trusted now')).toBeInTheDocument();
    // Appears in the active-device card and again in the devices list.
    expect(screen.getAllByText('Test Browser').length).toBeGreaterThanOrEqual(2);
  });

  it('enrolls a totp secret and copies it to the clipboard', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    render(<TransactionSecuritySettings />);

    fireEvent.click(
      screen.getByRole('button', { name: /set up authenticator/i })
    );

    expect(storeState.enrollTotp).toHaveBeenCalled();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('MOCK-SECRET');
    expect(toast.success).toHaveBeenCalledWith('Authenticator setup started');
  });

  it('shows the qr code and secret after enrolling totp', async () => {
    storeState.settings = {
      ...defaultSettings,
      totpSecret: 'MOCK-SECRET',
    };

    render(<TransactionSecuritySettings />);

    expect(await screen.findByText('MOCK-SECRET')).toBeInTheDocument();
    expect(
      await screen.findByAltText('Authenticator QR code')
    ).toBeInTheDocument();
  });

  it('disables the verify button until a 6-digit code is entered', () => {
    storeState.settings = {
      ...defaultSettings,
      totpSecret: 'MOCK-SECRET',
    };

    render(<TransactionSecuritySettings />);

    expect(
      screen.getByRole('button', { name: /verify authenticator/i })
    ).toBeDisabled();
  });

  it('copies the secret with the copy button', async () => {
    storeState.settings = {
      ...defaultSettings,
      totpSecret: 'MOCK-SECRET',
    };
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<TransactionSecuritySettings />);

    await waitFor(() => expect(screen.getByText('MOCK-SECRET')).toBeInTheDocument());

    const copyButtons = screen
      .getAllByRole('button')
      .filter((button) => button.querySelector('svg'));
    fireEvent.click(copyButtons[copyButtons.length - 1]);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('MOCK-SECRET');
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Authenticator secret copied'
    );
  });
});
