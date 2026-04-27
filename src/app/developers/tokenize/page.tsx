'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Coins, 
  FileText, 
  Rocket, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Info,
  ShieldCheck,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const STEPS = [
  { id: 1, title: 'Property Details', icon: Building2 },
  { id: 2, title: 'Tokenization Parameters', icon: Coins },
  { id: 3, title: 'Legal Documents', icon: FileText },
  { id: 4, title: 'Deployment Preview', icon: Rocket },
  { id: 5, title: 'Review & Submit', icon: CheckCircle2 },
];

export default function TokenizationWizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    totalValue: '',
    tokenSymbol: '',
    tokenPrice: '',
    totalTokens: '',
    legalDocs: [] as File[],
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Sunset Heights Apartment" 
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Input 
                  id="address" 
                  placeholder="Full street address, city, country" 
                  value={formData.address}
                  onChange={(e) => updateFormData({ address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Tell investors about this property..." 
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalValue">Total Valuation (USD)</Label>
                <Input 
                  id="totalValue" 
                  type="number" 
                  placeholder="1,000,000" 
                  value={formData.totalValue}
                  onChange={(e) => updateFormData({ totalValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenSymbol">Token Symbol</Label>
                <Input 
                  id="tokenSymbol" 
                  placeholder="e.g. SUNSET" 
                  value={formData.tokenSymbol}
                  onChange={(e) => updateFormData({ tokenSymbol: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenPrice">Price per Token (USD)</Label>
                <Input 
                  id="tokenPrice" 
                  type="number" 
                  placeholder="100" 
                  value={formData.tokenPrice}
                  onChange={(e) => updateFormData({ tokenPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalTokens">Total Tokens to Issue</Label>
                <Input 
                  id="totalTokens" 
                  type="number" 
                  placeholder="10,000" 
                  value={formData.totalTokens}
                  onChange={(e) => updateFormData({ totalTokens: e.target.value })}
                />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Ensure your token symbol is unique. This will be the ticker symbol used on the PropChain marketplace.
              </p>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="font-medium">Upload Legal Documents</p>
                <p className="text-sm text-gray-500">PDF, DOCX up to 10MB</p>
              </div>
              <Button variant="outline">Select Files</Button>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Required Documents:</h4>
              <ul className="space-y-2">
                {['Property Deed', 'Valuation Report', 'Operating Agreement', 'Tax Records'].map((doc) => (
                  <li key={doc} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="bg-gray-900 text-green-400 font-mono text-xs p-6 overflow-hidden relative">
              <div className="absolute top-2 right-2 flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div className="space-y-1">
                <p>// Deploying PropertyToken contract...</p>
                <p>contract PropertyToken is ERC20 {'{'}</p>
                <p className="pl-4">string public constant NAME = "{formData.name || 'Property'}";</p>
                <p className="pl-4">string public constant SYMBOL = "{formData.tokenSymbol || 'PROP'}";</p>
                <p className="pl-4">uint256 public constant TOTAL_SUPPLY = {formData.totalTokens || '0'} * 10**18;</p>
                <p className="">{'}'}</p>
                <p className="mt-4 text-white animate-pulse">_ Waiting for deployment parameters...</p>
              </div>
            </Card>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm font-bold">Standard ERC-20 Template</p>
                <p className="text-xs text-gray-500">Your property will be tokenized using our audited and secure smart contract infrastructure.</p>
              </div>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-bold text-lg">Final Review</h3>
                <Badge variant="outline">Step 5 of 5</Badge>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <p className="text-gray-500">Property</p>
                  <p className="font-medium">{formData.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Symbol</p>
                  <p className="font-medium">{formData.tokenSymbol || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Valuation</p>
                  <p className="font-medium">${formData.totalValue || '0'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Supply</p>
                  <p className="font-medium">{formData.totalTokens || '0'} Tokens</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Address</p>
                  <p className="font-medium">{formData.address || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="terms" className="rounded border-gray-300" />
              <Label htmlFor="terms" className="text-xs text-gray-500">
                I confirm that all provided information is accurate and I have the legal right to tokenize this property.
              </Label>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/properties" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Tokenize Your Property
          </h1>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
            Guided wizard to help you bring your real estate assets on-chain.
          </p>
        </div>

        {/* Wizard Progress */}
        <div className="mb-12 relative">
          <div className="flex justify-between mb-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep >= step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center gap-2 z-10 transition-colors duration-300 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'} ${isCurrent ? 'ring-4 ring-blue-100 dark:ring-blue-900/30' : ''}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-800 -z-0">
            <motion.div 
              className="h-full bg-blue-600"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <Card className="shadow-2xl border-none overflow-hidden bg-white dark:bg-gray-800">
          <CardContent className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              <div key={currentStep}>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold">{STEPS[currentStep - 1].title}</h2>
                  <p className="text-gray-500 dark:text-gray-400">Please provide the requested information to proceed.</p>
                </div>
                {renderStep()}
              </div>
            </AnimatePresence>

            <div className="mt-12 flex justify-between pt-8 border-t border-gray-100 dark:border-gray-700">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                onClick={currentStep === STEPS.length ? () => alert('Submitted!') : handleNext}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
              >
                {currentStep === STEPS.length ? 'Submit for Review' : 'Next Step'}
                {currentStep !== STEPS.length && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Widget Embed Card */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                  Embed Investment Calculator on Your Website
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Drive more investors to your properties with our embeddable calculator widget. 
                  Customize branding, show projected returns, and add a direct "Invest on PropChain" CTA button.
                </p>
                <Link href="/widget/embed-code">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Get Embed Code
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
