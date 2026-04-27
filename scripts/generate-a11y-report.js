const fs = require('fs');
const path = require('path');

const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
const reportDir = path.join(process.cwd(), 'a11y-report');

// Create report directory
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Read test results
if (!fs.existsSync(resultsPath)) {
  console.log('No test results found');
  process.exit(0);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Filter accessibility tests
const a11yTests = results.suites
  ?.flatMap(suite => suite.tests || [])
  .filter(test => test.title?.includes('Accessibility') || test.location?.file?.includes('accessibility.spec'));

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  totalA11yTests: a11yTests?.length || 0,
  passedTests: a11yTests?.filter(t => t.status === 'passed').length || 0,
  failedTests: a11yTests?.filter(t => t.status === 'failed').length || 0,
  tests: a11yTests || [],
};

// Write report
fs.writeFileSync(
  path.join(reportDir, 'a11y-report.json'),
  JSON.stringify(report, null, 2)
);

// Generate HTML report
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #007bff;
      padding-bottom: 10px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .summary-item {
      padding: 20px;
      border-radius: 4px;
      text-align: center;
    }
    .total {
      background-color: #e3f2fd;
      color: #1976d2;
    }
    .passed {
      background-color: #e8f5e9;
      color: #388e3c;
    }
    .failed {
      background-color: #ffebee;
      color: #d32f2f;
    }
    .summary-number {
      font-size: 32px;
      font-weight: bold;
    }
    .summary-label {
      font-size: 14px;
      margin-top: 5px;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
    }
    .status-passed {
      color: #388e3c;
      font-weight: 500;
    }
    .status-failed {
      color: #d32f2f;
      font-weight: 500;
    }
    .timestamp {
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Accessibility Test Report</h1>
    <div class="summary">
      <div class="summary-item total">
        <div class="summary-number">${report.totalA11yTests}</div>
        <div class="summary-label">Total Tests</div>
      </div>
      <div class="summary-item passed">
        <div class="summary-number">${report.passedTests}</div>
        <div class="summary-label">Passed</div>
      </div>
      <div class="summary-item failed">
        <div class="summary-number">${report.failedTests}</div>
        <div class="summary-label">Failed</div>
      </div>
    </div>

    ${report.totalA11yTests > 0 ? `
    <h2>Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${report.tests.map(test => `
        <tr>
          <td>${test.title || 'Unknown Test'}</td>
          <td class="status-${test.status}">${test.status || 'unknown'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p>No accessibility tests found.</p>'}

    <div class="timestamp">Generated: ${report.timestamp}</div>
  </div>
</body>
</html>
`;

fs.writeFileSync(
  path.join(reportDir, 'a11y-report.html'),
  htmlContent
);

console.log('Accessibility report generated');
