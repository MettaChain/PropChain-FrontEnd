import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReportType = "full" | "tax" | "performance" | "transactions";

const reportTypes: ReportType[] = ["full", "tax", "performance", "transactions"];
const isReportType = (value: string): value is ReportType =>
  reportTypes.includes(value as ReportType);

const reportCards: Array<{
  value: ReportType;
  label: string;
  icon: typeof FileText;
  desc: string;
}> = [
  { value: "full", label: "Full Report", icon: FileText, desc: "Complete portfolio overview" },
  { value: "tax", label: "Tax Summary", icon: Calendar, desc: "IRS-ready tax documents" },
  { value: "performance", label: "Performance", icon: Calendar, desc: "ROI and yield analysis" },
  { value: "transactions", label: "Transactions", icon: Calendar, desc: "Detailed activity log" },
];

interface JsPDFWithTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
  internal: jsPDF["internal"] & {
    getNumberOfPages?: () => number;
  };
}

interface ReportData {
  portfolioValue: number;
  totalProperties: number;
  annualYield: number;
  monthlyIncome: number;
  properties: {
    name: string;
    type: string;
    value: number;
    tokens: number;
    roi: number;
    monthlyIncome: number;
  }[];
  transactions: {
    date: string;
    type: string;
    property: string;
    amount: number;
  }[];
}

const mockReportData: ReportData = {
  portfolioValue: 2847520,
  totalProperties: 12,
  annualYield: 8.4,
  monthlyIncome: 18240,
  properties: [
    { name: "Manhattan Luxury Condo", type: "Residential", value: 850000, tokens: 1200, roi: 12.5, monthlyIncome: 4200 },
    { name: "Miami Beach Resort", type: "Commercial", value: 620000, tokens: 800, roi: 9.8, monthlyIncome: 3100 },
    { name: "Austin Tech Hub Office", type: "Commercial", value: 480000, tokens: 600, roi: 11.2, monthlyIncome: 2800 },
    { name: "Denver Mixed-Use Complex", type: "Mixed-Use", value: 420000, tokens: 500, roi: 8.7, monthlyIncome: 2400 },
    { name: "Seattle Waterfront", type: "Residential", value: 380000, tokens: 450, roi: 7.9, monthlyIncome: 2100 },
    { name: "Chicago Industrial", type: "Industrial", value: 97520, tokens: 150, roi: 6.5, monthlyIncome: 1640 },
  ],
  transactions: [
    { date: "2024-01-15", type: "Dividend", property: "Manhattan Luxury Condo", amount: 4200 },
    { date: "2024-01-12", type: "Purchase", property: "Seattle Waterfront", amount: -25000 },
    { date: "2024-01-10", type: "Dividend", property: "Miami Beach Resort", amount: 3100 },
    { date: "2024-01-08", type: "Sale", property: "Portland Retail", amount: 15000 },
    { date: "2024-01-05", type: "Dividend", property: "Austin Tech Hub", amount: 2800 },
  ],
};

export const PortfolioReport = () => {
  const [reportType, setReportType] = useState<ReportType>("full");
  const [year, setYear] = useState("2024");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    setIsGenerated(false);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const doc = new jsPDF() as JsPDFWithTable;
    const data = mockReportData;

    // Header
    doc.setFillColor(16, 185, 129); // Emerald
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("MettaChain Portfolio Report", 20, 25);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Portfolio Summary
    doc.setFontSize(16);
    doc.text("Portfolio Summary", 20, 55);
    doc.setFontSize(10);
    doc.text(`Total Portfolio Value: $${data.portfolioValue.toLocaleString()}`, 20, 65);
    doc.text(`Total Properties: ${data.totalProperties}`, 20, 72);
    doc.text(`Annual Yield: ${data.annualYield}%`, 20, 79);
    doc.text(`Monthly Income: $${data.monthlyIncome.toLocaleString()}`, 20, 86);

    // Properties Table
    doc.setFontSize(16);
    doc.text("Property Holdings", 20, 100);

    autoTable(doc, {
      startY: 105,
      head: [["Property", "Type", "Value", "Tokens", "ROI", "Monthly Income"]],
      body: data.properties.map((p) => [
        p.name,
        p.type,
        `$${p.value.toLocaleString()}`,
        p.tokens.toString(),
        `${p.roi}%`,
        `$${p.monthlyIncome.toLocaleString()}`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Transactions Table
    const finalY = doc.lastAutoTable?.finalY ?? 105;
    doc.setFontSize(16);
    doc.text("Recent Transactions", 20, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [["Date", "Type", "Property", "Amount"]],
      body: data.transactions.map((t) => [
        t.date,
        t.type,
        t.property,
        `${t.amount >= 0 ? "+" : ""}$${t.amount.toLocaleString()}`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Tax Summary (if full report)
    if (reportType === "full" || reportType === "tax") {
      doc.addPage();
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text("Tax Summary", 20, 20);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Tax Year: ${year}`, 20, 45);
      doc.text("Total Rental Income: $218,880", 20, 55);
      doc.text("Capital Gains: $45,230", 20, 65);
      doc.text("Estimated Tax Liability: $52,822", 20, 75);
      doc.text("Cost Basis: $2,547,290", 20, 85);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Note: This is an estimate. Consult a tax professional for accurate calculations.", 20, 100);
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages?.() ?? 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount} | MettaChain Portfolio Report`, 105, 290, { align: "center" });
    }

    doc.save(`mettachain-portfolio-report-${year}.pdf`);
    setIsGenerating(false);
    setIsGenerated(true);

    setTimeout(() => setIsGenerated(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Export Reports</h3>
          <p className="text-sm text-muted-foreground">Generate PDF reports for tax and analysis</p>
        </div>
        <FileText className="w-5 h-5 text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Report Type</label>
          <Select
            value={reportType}
            onValueChange={(value) => {
              if (isReportType(value)) {
                setReportType(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Portfolio Report</SelectItem>
              <SelectItem value="tax">Tax Summary Only</SelectItem>
              <SelectItem value="performance">Performance Report</SelectItem>
              <SelectItem value="transactions">Transaction History</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Year</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : isGenerated ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reportCards.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setReportType(item.value)}
          >
            <item.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
