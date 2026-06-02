import { useState } from "react";

interface ROIResult {
  totalReturn: number;
  annualYield: number;
  breakEvenMonths: number;
}

const SP500_ANNUAL_RATE = 0.1;

function calcROI(amount: number, months: number, annualRate = 0.08): ROIResult {
  const years = months / 12;
  const totalReturn = amount * Math.pow(1 + annualRate, years) - amount;
  const annualYield = annualRate * 100;
  const breakEvenMonths = Math.ceil(Math.log(2) / Math.log(1 + annualRate) * 12);
  return { totalReturn, annualYield, breakEvenMonths };
}

export default function ROICalculator() {
  const [amount, setAmount] = useState(10000);
  const [months, setMonths] = useState(12);

  const roi = calcROI(amount, months);
  const sp500 = calcROI(amount, months, SP500_ANNUAL_RATE);

  return (
    <div className="p-4 border rounded-xl space-y-4">
      <h3 className="font-semibold text-lg">ROI Calculator</h3>

      <div className="flex gap-4">
        <label className="flex flex-col text-sm">
          Investment (USD)
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="border rounded px-2 py-1 mt-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          Holding Period (months)
          <input
            type="number"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="border rounded px-2 py-1 mt-1"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-green-50 rounded p-2">
          <p className="font-medium">Total Return</p>
          <p className="text-green-700">${roi.totalReturn.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 rounded p-2">
          <p className="font-medium">Annual Yield</p>
          <p className="text-blue-700">{roi.annualYield.toFixed(1)}%</p>
        </div>
        <div className="bg-yellow-50 rounded p-2">
          <p className="font-medium">Break-even</p>
          <p className="text-yellow-700">{roi.breakEvenMonths}mo</p>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        S&P 500 equivalent return: <strong>${sp500.totalReturn.toFixed(2)}</strong>
      </p>
    </div>
  );
}
