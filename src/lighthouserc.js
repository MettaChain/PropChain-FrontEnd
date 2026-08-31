module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      staticDistDir: './frontend/dist', // Points directly to the built bundle output
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.90 }],
        // Task Requirement: Enforce strict performance budgets for LCP and CLS
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP <= 2.5s (Good threshold)
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],   // CLS <= 0.1 (Good threshold)
      },
    },
    upload: {
      target: 'temporary-public-storage', // Uploads auditable HTML reports for triage
    },
  },
};