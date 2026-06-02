'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Code, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { InvestmentCalculatorWidget } from '@/components/widget/InvestmentCalculatorWidget';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://propchain.io';

export default function WidgetEmbedCodePage() {
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#1e40af');
  const [brandName, setBrandName] = useState('PropChain');
  const [logoUrl, setLogoUrl] = useState('');
  const [investment, setInvestment] = useState(1000);
  const [yieldRate, setYieldRate] = useState(8);
  const [ctaText, setCtaText] = useState('Invest on PropChain');
  const [compact, setCompact] = useState(false);
  const [copied, setCopied] = useState(false);

  const widgetWidth = compact ? '400px' : '600px';
  const widgetHeight = compact ? '450px' : '800px';

  const generateEmbedCode = useCallback(() => {
    const params = new URLSearchParams();
    params.set('primaryColor', primaryColor);
    params.set('secondaryColor', secondaryColor);
    params.set('brandName', brandName);
    if (logoUrl) params.set('logo', logoUrl);
    params.set('investment', String(investment));
    params.set('yield', String(yieldRate));
    params.set('ctaText', ctaText);
    if (compact) params.set('compact', 'true');

    const widgetUrl = `${BASE_URL}/widget/investment-calculator?${params.toString()}`;

    return `<iframe 
  src="${widgetUrl}" 
  width="100%" 
  height="${widgetHeight.replace('px', '')}" 
  style="border: none; border-radius: 16px; max-width: ${widgetWidth};"
  title="PropChain Investment Calculator"
  loading="lazy"
  allow="clipboard-write"
></iframe>`;
  }, [primaryColor, secondaryColor, brandName, logoUrl, investment, yieldRate, ctaText, compact, widgetHeight, widgetWidth]);

  const handleCopy = async () => {
    const code = generateEmbedCode();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link href="/developers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Developers
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Widget Embed Generator
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customization Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Widget Configuration</CardTitle>
                <CardDescription>Customize the appearance and behavior of your investment calculator widget</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Your Brand"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo URL (optional)</Label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setSecondaryColor(e.target.value);
                      }}
                      className="w-16 h-10"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Default Investment: ${investment.toLocaleString()}</Label>
                  <Slider
                    value={[investment]}
                    min={50}
                    max={50000}
                    step={50}
                    onValueChange={(v) => setInvestment(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Annual Yield: {yieldRate}%</Label>
                  <Slider
                    value={[yieldRate]}
                    min={0}
                    max={20}
                    step={0.5}
                    onValueChange={(v) => setYieldRate(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="compact"
                    checked={compact}
                    onChange={(e) => setCompact(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="compact">Compact Mode</Label>
                </div>
              </CardContent>
            </Card>

            {/* Embed Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Embed Code
                </CardTitle>
                <CardDescription>Copy and paste this code into your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {generateEmbedCode()}
                  </pre>
                  <Button
                    onClick={handleCopy}
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-24 self-start">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>This is how your widget will look</CardDescription>
              </CardHeader>
              <CardContent className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <InvestmentCalculatorWidget
                  theme={{
                    primaryColor,
                    secondaryColor,
                    backgroundColor: '#ffffff',
                    textColor: '#111827',
                    logoUrl: logoUrl || undefined,
                    brandName,
                  }}
                  defaultInvestment={investment}
                  defaultYield={yieldRate}
                  ctaText={ctaText}
                  compact={compact}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Integration Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">URL Parameters</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Parameter</th>
                      <th className="text-left py-2 pr-4">Type</th>
                      <th className="text-left py-2 pr-4">Default</th>
                      <th className="text-left py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-2 pr-4 font-mono">primaryColor</td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2 pr-4">#2563eb</td>
                      <td className="py-2">Primary brand color</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">secondaryColor</td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2 pr-4">#1e40af</td>
                      <td className="py-2">Hover state color</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">brandName</td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2 pr-4">PropChain</td>
                      <td className="py-2">Brand name displayed in widget</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">logo</td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2 pr-4">-</td>
                      <td className="py-2">Logo URL (optional)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">investment</td>
                      <td className="py-2 pr-4">number</td>
                      <td className="py-2 pr-4">1000</td>
                      <td className="py-2">Default investment amount</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">yield</td>
                      <td className="py-2 pr-4">number</td>
                      <td className="py-2 pr-4">8</td>
                      <td className="py-2">Default annual yield %</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">ctaText</td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2 pr-4">Invest on PropChain</td>
                      <td className="py-2">CTA button text</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">compact</td>
                      <td className="py-2 pr-4">boolean</td>
                      <td className="py-2 pr-4">false</td>
                      <td className="py-2">Enable compact mode</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Pro Tips</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">compact=true</code> for sidebar placements</li>
                <li>• The widget is fully responsive and will adapt to your container width</li>
                <li>• All CTA clicks open in a new tab with <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">noopener</code> security</li>
                <li>• The widget loads asynchronously with <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">loading="lazy"</code> for optimal performance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
