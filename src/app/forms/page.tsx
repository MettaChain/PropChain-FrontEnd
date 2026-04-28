"use client"

import { useState } from "react"
import {
  AlertConfigurationForm,
  ProfileSettingsForm,
  PurchaseTokenForm,
  SearchFilterForm,
} from "@/components/forms"
import { DEFAULT_FILTERS } from "@/types/property"

export default function FormsPage() {
  const [submittedValues, setSubmittedValues] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 py-10 dark:bg-gray-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Validated Form Examples</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Each form uses React Hook Form with Zod schemas for client-side validation.</p>
        </div>

        <SearchFilterForm
          filters={DEFAULT_FILTERS}
          onApplyFilters={(filters) => setSubmittedValues(JSON.stringify(filters, null, 2))}
          onClearFilters={() => setSubmittedValues("Search filters cleared")}
        />

        <PurchaseTokenForm
          propertyId="property-123"
          propertyName="Oceanview Estate"
          onSubmit={(values) => setSubmittedValues(JSON.stringify(values, null, 2))}
        />

        <ProfileSettingsForm
          onSubmit={(values) => setSubmittedValues(JSON.stringify(values, null, 2))}
        />

        <AlertConfigurationForm
          onSubmit={(values) => setSubmittedValues(JSON.stringify(values, null, 2))}
        />

        {submittedValues && (
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 text-sm text-slate-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
            <h2 className="text-lg font-semibold">Last submitted</h2>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words">{submittedValues}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
