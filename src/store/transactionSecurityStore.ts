import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildOtpAuthUri, createTrustedDeviceId } from '@/utils/security/transactionSecurity';
import { generateTotpSecret, verifyTotpCode } from '@/utils/security/totp';

export type TransactionSecurityMethod = 'totp' | 'hardware-wallet' | 'trusted-device';

export interface TrustedDevice {
  id: string;
  label: string;
  createdAt: number;
  lastUsedAt: number;
  trustUntil: number;
}

export interface TransactionSecuritySettings {
  thresholdEth: number;
  twoFactorRequired: boolean;
  totpEnabled: boolean;
  hardwareWalletEnabled: boolean;
  trustedDeviceBypass: boolean;
  trustedDeviceDurationDays: number;
  totpIssuer: string;
  totpAccountLabel: string;
  totpSecret: string | null;
}

export interface TransactionSecurityState {
  settings: TransactionSecuritySettings;
  trustedDevices: TrustedDevice[];
  lastVerifiedAt: number | null;
  lastVerificationMethod: TransactionSecurityMethod | null;
}

export interface TransactionSecurityActions {
  updateSettings: (settings: Partial<TransactionSecuritySettings>) => void;
  enrollTotp: (accountLabel?: string) => { secret: string; otpauthUri: string };
  verifyTotpCode: (code: string) => Promise<boolean>;
  trustDevice: (deviceId?: string, label?: string) => TrustedDevice;
  revokeTrustedDevice: (deviceId: string) => void;
  clearTrustedDevices: () => void;
  setLastVerification: (method: TransactionSecurityMethod) => void;
  resetSecurity: () => void;
  getActiveTrustedDevice: (deviceId?: string) => TrustedDevice | null;
}

export type TransactionSecurityStore = TransactionSecurityState & TransactionSecurityActions;

const DEFAULT_SETTINGS: TransactionSecuritySettings = {
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

function buildTrustedDevice(deviceId: string, label: string, durationDays: number): TrustedDevice {
  const now = Date.now();
  return {
    id: deviceId,
    label,
    createdAt: now,
    lastUsedAt: now,
    trustUntil: now + durationDays * 24 * 60 * 60 * 1000,
  };
}

export const useTransactionSecurityStore = create<TransactionSecurityStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      trustedDevices: [],
      lastVerifiedAt: null,
      lastVerificationMethod: null,

      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      enrollTotp: (accountLabel) => {
        const secret = generateTotpSecret();
        const state = get();
        const updatedSettings = {
          ...state.settings,
          totpEnabled: true,
          totpSecret: secret,
          totpAccountLabel: accountLabel || state.settings.totpAccountLabel,
        };

        set({
          settings: updatedSettings,
        });

        return {
          secret,
          otpauthUri: buildOtpAuthUri({
            secret,
            issuer: updatedSettings.totpIssuer,
            accountName: updatedSettings.totpAccountLabel,
          }),
        };
      },

      verifyTotpCode: async (code) => {
        const secret = get().settings.totpSecret;
        if (!secret) return false;

        const isValid = await verifyTotpCode({
          secret,
          code,
        });

        if (isValid) {
          set({
            lastVerifiedAt: Date.now(),
            lastVerificationMethod: 'totp',
          });
        }

        return isValid;
      },

      trustDevice: (deviceId = createTrustedDeviceId(), label = 'This browser') => {
        const durationDays = get().settings.trustedDeviceDurationDays;
        const trustedDevice = buildTrustedDevice(deviceId, label, durationDays);

        set((state) => ({
          trustedDevices: [
            trustedDevice,
            ...state.trustedDevices.filter((device) => device.id !== trustedDevice.id),
          ],
          lastVerifiedAt: Date.now(),
          lastVerificationMethod: 'trusted-device',
        }));

        return trustedDevice;
      },

      revokeTrustedDevice: (deviceId) => {
        set((state) => ({
          trustedDevices: state.trustedDevices.filter((device) => device.id !== deviceId),
        }));
      },

      clearTrustedDevices: () => {
        set({ trustedDevices: [] });
      },

      setLastVerification: (method) => {
        set({
          lastVerifiedAt: Date.now(),
          lastVerificationMethod: method,
        });
      },

      resetSecurity: () => {
        set({
          settings: DEFAULT_SETTINGS,
          trustedDevices: [],
          lastVerifiedAt: null,
          lastVerificationMethod: null,
        });
      },

      getActiveTrustedDevice: (deviceId) => {
        if (!deviceId) return null;

        const device = get().trustedDevices.find((entry) => entry.id === deviceId);
        if (!device) return null;

        if (device.trustUntil <= Date.now()) {
          return null;
        }

        return device;
      },
    }),
    {
      name: 'propchain-transaction-security',
      partialize: (state) => ({
        settings: state.settings,
        trustedDevices: state.trustedDevices,
        lastVerifiedAt: state.lastVerifiedAt,
        lastVerificationMethod: state.lastVerificationMethod,
      }),
    }
  )
);
