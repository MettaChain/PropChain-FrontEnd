'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WalletConnector } from '@/components/WalletConnector';

// ─── Types ────────────────────────────────────────────────────────────────────

type CostBasisMethod = 'FIFO' | 'LIFO' | 'HIFO';

interface TaxLot {
  id: string;
  propertyName: string;
  tokenSymbol: string;
  acquiredDate: string;
  soldDate: string;
  quantity: number;
  costBasis: number; // per token
  salePrice: number; // per token
}

// ─── Mock transaction data ────────────────────────────────────────────────────

const MOCK_LOTS: TaxLot[] = [
  { id: '1', propertyName: 'Luxury Downtown Penthouse', tokenSymbol: 'PENT432', acquiredDate: '2023-02-10', soldDate: '2024-03-15', quantity: 100, costBasis: 85, salePrice: 100 },
  { id: '2', propertyName: 'Luxury Downtown Penthouse', tokenSymbol: 'PENT432', acquiredDate: '2022-08-20', soldDate: '2024-03-15', quantity: 50, costBasis: 70, salePrice: 100 },
  { id: '3', propertyName: 'Modern Office Complex', tokenSymbol: 'OFFC01', acquiredDate: '2023-11-05', soldDate: '2024-01-20', quantity: 200, costBasis: 45, salePrice: 42 },
  { id: '4', propertyName: 'Beachfront Villa', tokenSymbol: 'BEACH7', acquiredDate: '2021-06-01', soldDate: '2024-06-30', quantity: 75, costBasis: 120, salePrice: 180 },
  { id: '5', propertyName: 'Beachfront Villa', tokenSymbol: 'BEACH7', acquiredDate: '2023-01-15', soldDate: '2024-06-30', quantity: 25, costBasis: 150, salePrice: 180 },
];

// ─── Cost basis calculation ───────────────────────────────────────────────────

interface GainLoss {
  lot: TaxLot;
  totalCost: number;
  totalProceeds: number;
  gainLoss: number;
  isLongTerm: boolean; // held > 1 year
}

function calcGainLoss(lots: TaxLot[], method: CostBasisMethod): GainLoss[] {
  // Group by token symbol for FIFO/LIFO/HIFO ordering
  const grouped: Record<string, TaxLot[]> = {};
  for (const lot of lots) {
    if (!grouped[lot.tokenSymbol]) grouped[lot.tokenSymbol] = [];
    grouped[lot.tokenSymbol].push(lot);
  }

  const results: GainLoss[] = [];

  for (const symbol of Object.keys(grouped)) {
    const symbolLots = [...grouped[symbol]];

    // Sort by cost basis for HIFO, by date for FIFO/LIFO
    if (method === 'HIFO') {
      symbolLots.sort((a, b) => b.costBasis - a.costBasis);
    } else if (method === 'LIFO') {
      symbolLots.sort((a, b) => new Date(b.acquiredDate).getTime() - new Date(a.acquiredDate).getTime());
    } else {
      // FIFO
      symbolLots.sort((a, b) => new Date(a.acquiredDate).getTime() - new Date(b.acquiredDate).getTime());
    }

    for (const lot of symbolLots) {
      const totalCost = lot.quantity * lot.costBasis;
      const totalProceeds = lot.quantity * lot.salePrice;
      const gainLoss = totalProceeds - totalCost;
      const holdingDays =
        (new Date(lot.soldDate).getTime() - new Date(lot.acquiredDate).getTime()) / 86400000;
      results.push({ lot, totalCost, totalProceeds, gainLoss, isLongTerm: holdingDays > 365 });
    }
  }

  return results;
}

// ─── PDF generation ───────────────────────────────────────────────────────────

async function generatePDF(
  results: GainLoss[],
  taxYear: string,
  method: CostBasisMethod
) {
  // Dynamic import to avoid SSR issues
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });
  const shortTerm = results.filter((r) => !r.isLongTerm);
  const longTerm = results.filter((r) => r.isLongTerm);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const totalST = shortTerm.reduce((s, r) => s + r.gainLoss, 0);
  const totalLT = longTerm.reduce((s, r) => s + r.gainLoss, 0);

  // ── Form 8949 ──────────────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.text(`Form 8949 – Sales and Other Dispositions of Capital Assets`, 14, 18);
  doc.setFontSize(10);
  doc.text(`Tax Year: ${taxYear}  |  Cost Basis Method: ${method}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 26);

  const tableColumns = [
    'Description',
    'Acquired',
    'Sold',
    'Qty',
    'Proceeds',
    'Cost Basis',
    'Gain / (Loss)',
    'Term',
  ];

  const toRow = (r: GainLoss) => [
    `${r.lot.tokenSymbol} – ${r.lot.propertyName}`,
    r.lot.acquiredDate,
    r.lot.soldDate,
    r.lot.quantity.toString(),
    fmt(r.totalProceeds),
    fmt(r.totalCost),
    fmt(r.gainLoss),
    r.isLongTerm ? 'Long' : 'Short',
  ];

  if (shortTerm.length > 0) {
    doc.setFontSize(12);
    doc.text('Part I – Short-Term Transactions (held ≤ 1 year)', 14, 36);
    autoTable(doc, {
      startY: 40,
      head: [tableColumns],
      body: shortTerm.map(toRow),
      foot: [['', '', '', '', '', 'Net Short-Term', fmt(totalST), '']],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      footStyles: { fillColor: [239, 246, 255], fontStyle: 'bold' },
    });
  }

  const afterST = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 40;

  if (longTerm.length > 0) {
    const startY = shortTerm.length > 0 ? afterST + 12 : 36;
    doc.setFontSize(12);
    doc.text('Part II – Long-Term Transactions (held > 1 year)', 14, startY - 4);
    autoTable(doc, {
      startY,
      head: [tableColumns],
      body: longTerm.map(toRow),
      foot: [['', '', '', '', '', 'Net Long-Term', fmt(totalLT), '']],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
      footStyles: { fillColor: [236, 253, 245], fontStyle: 'bold' },
    });
  }

  // ── Schedule D ─────────────────────────────────────────────────────────────
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Schedule D – Capital Gains and Losses', 14, 18);
  doc.setFontSize(10);
  doc.text(`Tax Year: ${taxYear}  |  Cost Basis Method: ${method}`, 14, 26);

  autoTable(doc, {
    startY: 32,
    head: [['Category', 'Net Gain / (Loss)']],
    body: [
      ['Short-Term Net Capital Gain or (Loss)', fmt(totalST)],
      ['Long-Term Net Capital Gain or (Loss)', fmt(totalLT)],
      ['Total Net Capital Gain or (Loss)', fmt(totalST + totalLT)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: { 1: { halign: 'right' } },
  });

  doc.save(`PropChain_TaxReport_${taxYear}_${method}.pdf`);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaxReportPage() {
  const [taxYear, setTaxYear] = useState('2024');
  const [method, setMethod] = useState<CostBasisMethod>('FIFO');
  const [generating, setGenerating] = useState(false);

  const results = calcGainLoss(MOCK_LOTS, method);
  const shortTerm = results.filter((r) => !r.isLongTerm);
  const longTerm = results.filter((r) => r.isLongTerm);
  const totalST = shortTerm.reduce((s, r) => s + r.gainLoss, 0);
  const totalLT = longTerm.reduce((s, r) => s + r.gainLoss, 0);
  const totalNet = totalST + totalLT;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generatePDF(results, taxYear, method);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3" aria-label="PropChain home">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">PropChain</span>
            </Link>
            <WalletConnector />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tax Report Generator</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Generate IRS-compatible Form 8949 and Schedule D reports for your PropChain transactions.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <div className="flex flex-wrap gap-6 items-end">
            {/* Tax year */}
            <div>
              <label htmlFor="tax-year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tax Year
              </label>
              <select
                id="tax-year"
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2"
              >
                {['2024', '2023', '2022', '2021'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Cost basis method */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cost Basis Method
              </legend>
              <div className="flex gap-3" role="group">
                {(['FIFO', 'LIFO', 'HIFO'] as CostBasisMethod[]).map((m) => (
                  <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="cost-basis"
                      value={m}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              aria-busy={generating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 focus:ring-4 focus:ring-blue-300 text-white font-semibold py-2 px-6 rounded-lg transition-colors focus:outline-none"
            >
              {generating ? 'Generating PDF…' : 'Download PDF (Form 8949 + Schedule D)'}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Short-Term Net', value: totalST, color: totalST >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
            { label: 'Long-Term Net', value: totalLT, color: totalLT >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
            { label: 'Total Net', value: totalNet, color: totalNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{fmt(value)}</p>
            </div>
          ))}
        </div>

        {/* Transaction table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Form 8949 Preview — {taxYear} ({method})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Form 8949 capital gains and losses">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Description', 'Acquired', 'Sold', 'Qty', 'Proceeds', 'Cost Basis', 'Gain / (Loss)', 'Term'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((r) => (
                  <tr key={r.lot.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {r.lot.tokenSymbol} – {r.lot.propertyName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.lot.acquiredDate}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.lot.soldDate}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.lot.quantity}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{fmt(r.totalProceeds)}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{fmt(r.totalCost)}</td>
                    <td className={`px-4 py-3 font-semibold ${r.gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {fmt(r.gainLoss)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.isLongTerm ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                        {r.isLongTerm ? 'Long' : 'Short'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700 font-semibold">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Total Net Gain / (Loss)</td>
                  <td className={`px-4 py-3 ${totalNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {fmt(totalNet)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
          This report is for informational purposes only. Consult a tax professional for advice.
        </p>
      </main>
    </div>
  );
}
