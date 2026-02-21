"use client";

import { I18nDemo } from "@/components/I18nDemo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WalletConnector } from "@/components/WalletConnector";

export default function I18nDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PropChain - i18n Demo
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <WalletConnector />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Internationalization Demo
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Test the multi-language support and formatting features of PropChain
          </p>
        </div>

        <I18nDemo />
      </main>
    </div>
  );
}
