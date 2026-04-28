'use client';

import React, { useState } from 'react';
import { Shield, FileSignature, AlertTriangle, Settings, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionAuditTrail } from '@/components/audit/TransactionAuditTrail';
import { toast } from 'sonner';

interface SecuritySettings {
  eip712SigningEnabled: boolean;
  signatureVerificationEnabled: boolean;
  auditTrailEnabled: boolean;
  highValueThreshold: string;
  unusualGasPriceThreshold: string;
  showDetailedWarnings: boolean;
  requireConfirmationForHighRisk: boolean;
}

export default function TransactionSecurityPage() {
  const [settings, setSettings] = useState<SecuritySettings>({
    eip712SigningEnabled: true,
    signatureVerificationEnabled: true,
    auditTrailEnabled: true,
    highValueThreshold: '10',
    unusualGasPriceThreshold: '50',
    showDetailedWarnings: true,
    requireConfirmationForHighRisk: true,
  });

  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const handleSettingChange = (key: keyof SecuritySettings, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    
    toast.success('Setting updated', {
      description: `${key} has been updated`
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'transaction-security-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Settings exported successfully');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          toast.success('Settings imported successfully');
        } catch (error) {
          toast.error('Failed to import settings', {
            description: 'Invalid file format'
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all security settings to defaults?')) {
      setSettings({
        eip712SigningEnabled: true,
        signatureVerificationEnabled: true,
        auditTrailEnabled: true,
        highValueThreshold: '10',
        unusualGasPriceThreshold: '50',
        showDetailedWarnings: true,
        requireConfirmationForHighRisk: true,
      });
      toast.success('Settings reset to defaults');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Transaction Security
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage EIP-712 signing verification and transaction security settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSettings}>
            Export Settings
          </Button>
          <div className="relative">
            <Input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline">
              Import Settings
            </Button>
          </div>
          <Button variant="outline" onClick={resetSettings}>
            Reset to Defaults
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
          <TabsTrigger value="verification">Signature Verification</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* EIP-712 Signing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                EIP-712 Typed Data Signing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="eip712-enabled">Enable EIP-712 Signing</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use cryptographically secure typed data signing for all transactions
                  </p>
                </div>
                <Switch
                  id="eip712-enabled"
                  checked={settings.eip712SigningEnabled}
                  onCheckedChange={(checked) => handleSettingChange('eip712SigningEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="signature-verification">Enable Signature Verification</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Verify all signatures before broadcasting transactions
                  </p>
                </div>
                <Switch
                  id="signature-verification"
                  checked={settings.signatureVerificationEnabled}
                  onCheckedChange={(checked) => handleSettingChange('signatureVerificationEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="audit-trail">Enable Audit Trail</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keep a detailed record of all signed transactions
                  </p>
                </div>
                <Switch
                  id="audit-trail"
                  checked={settings.auditTrailEnabled}
                  onCheckedChange={(checked) => handleSettingChange('auditTrailEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Risk Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Assessment Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="high-value-threshold">High Value Transaction Threshold (ETH)</Label>
                <Input
                  id="high-value-threshold"
                  type="number"
                  step="0.1"
                  value={settings.highValueThreshold}
                  onChange={(e) => handleSettingChange('highValueThreshold', e.target.value)}
                  placeholder="10"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transactions above this value will be flagged as high risk
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gas-price-threshold">Unusual Gas Price Threshold (gwei)</Label>
                <Input
                  id="gas-price-threshold"
                  type="number"
                  step="1"
                  value={settings.unusualGasPriceThreshold}
                  onChange={(e) => handleSettingChange('unusualGasPriceThreshold', e.target.value)}
                  placeholder="50"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gas prices above this threshold will trigger warnings
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Warning Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Warning Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="detailed-warnings">Show Detailed Warnings</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Display comprehensive security warnings and risk assessments
                  </p>
                </div>
                <Switch
                  id="detailed-warnings"
                  checked={settings.showDetailedWarnings}
                  onCheckedChange={(checked) => handleSettingChange('showDetailedWarnings', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="high-risk-confirmation">Require Confirmation for High Risk</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Require additional confirmation steps for high-risk transactions
                  </p>
                </div>
                <Switch
                  id="high-risk-confirmation"
                  checked={settings.requireConfirmationForHighRisk}
                  onCheckedChange={(checked) => handleSettingChange('requireConfirmationForHighRisk', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Signature Verification Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">EIP-712 Signing</span>
                    <Badge variant={settings.eip712SigningEnabled ? "default" : "secondary"}>
                      {settings.eip712SigningEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Cryptographically binds signatures to specific transaction data
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pre-broadcast Verification</span>
                    <Badge variant={settings.signatureVerificationEnabled ? "default" : "secondary"}>
                      {settings.signatureVerificationEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Verifies signature validity before network broadcast
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Security Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Domain separation for different applications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Typed data structure prevents parameter tampering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Human-readable transaction summaries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Replay attack prevention with nonces and deadlines</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Transaction Validation</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Check parameters for security risks and warnings
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">EIP-712 Signing</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Create cryptographically secure typed data signature
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Signature Verification</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Verify signature matches transaction parameters
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Audit Trail Recording</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Record transaction in security audit trail
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">5</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Network Broadcast</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Broadcast verified transaction to blockchain
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Transaction Audit Trail</h2>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage the complete history of signed transactions
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAuditTrail(!showAuditTrail)}
            >
              {showAuditTrail ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showAuditTrail ? 'Hide' : 'Show'} Audit Trail
            </Button>
          </div>

          {showAuditTrail && (
            <TransactionAuditTrail />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
