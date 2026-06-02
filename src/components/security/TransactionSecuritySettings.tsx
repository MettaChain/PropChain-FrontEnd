'use client';

import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, Smartphone, Wallet, Clock3, Trash2, RefreshCcw, Info, Clipboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useTransactionSecurityStore } from '@/store/transactionSecurityStore';
import {
  buildOtpAuthUri,
  formatTrustedDeviceExpiry,
  getSecurityDeviceId,
  getSecurityDeviceLabel,
} from '@/utils/security/transactionSecurity';
import { normalizeTotpCode } from '@/utils/security/totp';
import { toast } from 'sonner';

const MIN_THRESHOLD = 0.5;
const MAX_THRESHOLD = 25;

export function TransactionSecuritySettings() {
  const {
    settings,
    trustedDevices,
    lastVerifiedAt,
    lastVerificationMethod,
    updateSettings,
    enrollTotp,
    verifyTotpCode,
    trustDevice,
    revokeTrustedDevice,
  } = useTransactionSecurityStore();

  const [threshold, setThreshold] = useState(settings.thresholdEth);
  const [otpCode, setOtpCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState(getSecurityDeviceLabel());

  useEffect(() => {
    setThreshold(settings.thresholdEth);
  }, [settings.thresholdEth]);

  useEffect(() => {
    const secret = settings.totpSecret;
    if (!secret) {
      setQrCode('');
      return;
    }

    let active = true;
    setIsGeneratingQr(true);

    QRCode.toDataURL(
      buildOtpAuthUri({
        secret,
        issuer: settings.totpIssuer,
        accountName: settings.totpAccountLabel,
      }),
      {
        width: 220,
        margin: 1,
      }
    )
      .then((dataUrl) => {
        if (active) {
          setQrCode(dataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setQrCode('');
        }
      })
      .finally(() => {
        if (active) {
          setIsGeneratingQr(false);
        }
      });

    return () => {
      active = false;
    };
  }, [settings.totpSecret, settings.totpIssuer, settings.totpAccountLabel]);

  const activeDevice = useMemo(() => {
    const deviceId = getSecurityDeviceId();
    return trustedDevices.find((device) => device.id === deviceId && device.trustUntil > Date.now()) || null;
  }, [trustedDevices]);

  const handleThresholdCommit = () => {
    const safeThreshold = Number.isFinite(threshold)
      ? Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, threshold))
      : MIN_THRESHOLD;
    updateSettings({ thresholdEth: safeThreshold });
    setThreshold(safeThreshold);
    toast.success('Security threshold saved');
  };

  const handleEnrollTotp = () => {
    const result = enrollTotp(settings.totpAccountLabel);
    setOtpCode('');
    toast.success('Authenticator setup started');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(result.secret).catch(() => undefined);
    }
  };

  const handleVerifyTotp = async () => {
    setIsVerifying(true);
    try {
      const isValid = await verifyTotpCode(normalizeTotpCode(otpCode));
      if (isValid) {
        toast.success('Authenticator code verified');
        setOtpCode('');
      } else {
        toast.error('That authenticator code was not accepted');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTrustDevice = () => {
    if (!lastVerifiedAt) {
      toast.error('Verify a transaction first before trusting this browser');
      return;
    }

    const trusted = trustDevice(getSecurityDeviceId(), deviceLabel);
    toast.success(`Trusted ${trusted.label} until ${formatTrustedDeviceExpiry(trusted.trustUntil)}`);
  };

  const handleCopySecret = async () => {
    if (!settings.totpSecret) return;
    if (!navigator.clipboard?.writeText) {
      toast.error('Clipboard access is not available in this browser');
      return;
    }

    await navigator.clipboard.writeText(settings.totpSecret);
    toast.success('Authenticator secret copied');
  };

  return (
    <Card className="w-full border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/90">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          Transaction Security
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Require step-up confirmation for high-value transactions and manage your trusted devices.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="threshold-slider" className="text-sm font-medium">High-value threshold</Label>
                <p className="text-xs text-muted-foreground">
                  Transactions at or above this amount will ask for a second confirmation step.
                </p>
              </div>
              <Badge variant="secondary">{threshold.toFixed(2)} ETH</Badge>
            </div>

            <Slider
              id="threshold-slider"
              min={MIN_THRESHOLD}
              max={MAX_THRESHOLD}
              step={0.5}
              value={[threshold]}
              onValueChange={(values) => setThreshold(values[0] ?? threshold)}
            />

            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={MIN_THRESHOLD}
                max={MAX_THRESHOLD}
                step={0.1}
                value={threshold}
                onChange={(event) => {
                  const nextThreshold = Number(event.target.value);
                  setThreshold(Number.isFinite(nextThreshold) ? nextThreshold : MIN_THRESHOLD);
                }}
                className="max-w-36"
              />
              <Button variant="outline" onClick={handleThresholdCommit}>
                Save threshold
              </Button>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60 md:col-span-2">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    Require step-up verification
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Keep additional confirmation enabled for all transactions at or above the threshold.
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorRequired}
                  onCheckedChange={(checked) => updateSettings({ twoFactorRequired: checked })}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4" />
                    TOTP authenticator
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Support Google Authenticator, 1Password, and similar apps.
                  </p>
                </div>
                <Switch
                  checked={settings.totpEnabled}
                  onCheckedChange={(checked) => updateSettings({ totpEnabled: checked })}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4" />
                    Hardware wallet confirmation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow Ledger/Trezor style confirmation for sensitive transactions.
                  </p>
                </div>
                <Switch
                  checked={settings.hardwareWalletEnabled}
                  onCheckedChange={(checked) => updateSettings({ hardwareWalletEnabled: checked })}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60 md:col-span-2">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-sm">
                    <Clock3 className="h-4 w-4" />
                    Trusted device bypass
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    A verified browser can skip the second step for a limited time after confirmation.
                  </p>
                </div>
                <Switch
                  checked={settings.trustedDeviceBypass}
                  onCheckedChange={(checked) => updateSettings({ trustedDeviceBypass: checked })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label className="text-sm font-medium">Current policy</Label>
                <p className="text-xs text-muted-foreground">Stored locally in your browser.</p>
              </div>
              <Badge variant={settings.twoFactorRequired ? 'default' : 'secondary'}>
                {settings.twoFactorRequired ? '2FA on' : '2FA off'}
              </Badge>
            </div>

            <div className="space-y-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Threshold</span>
                <span className="font-medium">{settings.thresholdEth.toFixed(2)} ETH</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">TOTP</span>
                <span className="font-medium">{settings.totpEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hardware wallet</span>
                <span className="font-medium">{settings.hardwareWalletEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trusted bypass</span>
                <span className="font-medium">{settings.trustedDeviceBypass ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  The transaction modal explains exactly why a second check is needed and will offer
                  authenticator, hardware-wallet, or trusted-device paths when the threshold is crossed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">Authenticator setup</Label>
                <p className="text-xs text-muted-foreground">
                  Scan the QR code in your authenticator app, then verify the 6-digit code.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleEnrollTotp}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Regenerate secret
              </Button>
            </div>

            {settings.totpSecret ? (
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                  {isGeneratingQr ? (
                    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                      Generating QR...
                    </div>
                  ) : qrCode ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrCode}
                      alt="Authenticator QR code"
                      className="h-[220px] w-[220px]"
                    />
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                      QR code unavailable
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Secret</p>
                      <p className="truncate font-mono text-sm">{settings.totpSecret}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCopySecret}>
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totp-code">Verify code</Label>
                    <InputOTP
                      id="totp-code"
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => setOtpCode(value)}
                      inputMode="numeric"
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }, (_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleVerifyTotp} disabled={isVerifying || otpCode.length !== 6}>
                      Verify authenticator
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDeviceLabel(getSecurityDeviceLabel())}
                    >
                      Refresh device label
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Current browser trust label: <span className="font-medium text-foreground">{deviceLabel}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-muted-foreground">
                <p>Enabling TOTP will generate an authenticator secret and QR code for your app.</p>
                <Button className="mt-4" variant="outline" onClick={handleEnrollTotp}>
                  Set up authenticator
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label className="text-sm font-medium">Trusted devices</Label>
                <p className="text-xs text-muted-foreground">
                  You can mark this browser as trusted after passing 2FA.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleTrustDevice} disabled={!lastVerifiedAt}>
                Trust this browser
              </Button>
            </div>

            <div className="space-y-3">
              {lastVerifiedAt && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                  Last verified via {lastVerificationMethod || 'security flow'}.
                </div>
              )}

              {activeDevice ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100">
                  <p className="font-medium">Trusted now</p>
                  <p>{activeDevice.label}</p>
                  <p className="text-xs">Expires {formatTrustedDeviceExpiry(activeDevice.trustUntil)}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-muted-foreground">
                  No active trusted device for this browser yet.
                </div>
              )}

              {trustedDevices.length > 0 ? (
                trustedDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{device.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Trusted until {formatTrustedDeviceExpiry(device.trustUntil)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => revokeTrustedDevice(device.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
