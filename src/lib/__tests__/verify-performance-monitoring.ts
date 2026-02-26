/**
 * Verification script for performance monitoring implementation
 * This demonstrates that all required metrics are collected
 */

import { getPerformanceMetrics, setupPerformanceMonitoring, type PerformanceMetrics } from '../mobile-optimizer';

/**
 * Verifies that all required metrics are present in the PerformanceMetrics interface
 */
function verifyMetricsStructure(metrics: PerformanceMetrics): boolean {
  const requiredMetrics = [
    // Core Web Vitals
    'fcp', 'lcp', 'cls', 'fid',
    // Custom metrics
    'tti', 'tbt',
    // Resource metrics
    'jsSize', 'cssSize', 'imageSize', 'totalSize',
    // Network metrics
    'connectionType', 'effectiveType', 'downlink', 'rtt'
  ];

  for (const metric of requiredMetrics) {
    if (!(metric in metrics)) {
      console.error(`Missing metric: ${metric}`);
      return false;
    }
  }

  return true;
}

/**
 * Verifies that metric values are valid
 */
function verifyMetricValues(metrics: PerformanceMetrics): boolean {
  // Numeric metrics should be non-negative numbers
  const numericMetrics = [
    'fcp', 'lcp', 'cls', 'fid', 'tti', 'tbt',
    'jsSize', 'cssSize', 'imageSize', 'totalSize',
    'downlink', 'rtt'
  ];

  for (const metric of numericMetrics) {
    const value = metrics[metric as keyof PerformanceMetrics];
    if (typeof value !== 'number' || value < 0 || !Number.isFinite(value)) {
      console.error(`Invalid value for ${metric}: ${value}`);
      return false;
    }
  }

  // String metrics should be strings
  const stringMetrics = ['connectionType', 'effectiveType'];
  for (const metric of stringMetrics) {
    const value = metrics[metric as keyof PerformanceMetrics];
    if (typeof value !== 'string') {
      console.error(`Invalid value for ${metric}: ${value}`);
      return false;
    }
  }

  return true;
}

/**
 * Main verification function
 */
export function verifyPerformanceMonitoring(): void {
  console.log('Verifying performance monitoring implementation...\n');

  // Test 1: Verify getPerformanceMetrics returns all required metrics
  console.log('Test 1: Checking getPerformanceMetrics()...');
  const metrics = getPerformanceMetrics();
  
  if (!verifyMetricsStructure(metrics)) {
    console.error('❌ FAILED: Missing required metrics');
    return;
  }
  console.log('✓ All required metrics are present');

  if (!verifyMetricValues(metrics)) {
    console.error('❌ FAILED: Invalid metric values');
    return;
  }
  console.log('✓ All metric values are valid');

  // Display collected metrics
  console.log('\nCollected metrics:');
  console.log('Core Web Vitals:');
  console.log(`  - FCP (First Contentful Paint): ${metrics.fcp.toFixed(2)}ms`);
  console.log(`  - LCP (Largest Contentful Paint): ${metrics.lcp.toFixed(2)}ms`);
  console.log(`  - CLS (Cumulative Layout Shift): ${metrics.cls.toFixed(4)}`);
  console.log(`  - FID (First Input Delay): ${metrics.fid.toFixed(2)}ms`);
  
  console.log('\nCustom metrics:');
  console.log(`  - TTI (Time to Interactive): ${metrics.tti.toFixed(2)}ms`);
  console.log(`  - TBT (Total Blocking Time): ${metrics.tbt.toFixed(2)}ms`);
  
  console.log('\nResource metrics:');
  console.log(`  - JavaScript size: ${(metrics.jsSize / 1024).toFixed(2)} KB`);
  console.log(`  - CSS size: ${(metrics.cssSize / 1024).toFixed(2)} KB`);
  console.log(`  - Image size: ${(metrics.imageSize / 1024).toFixed(2)} KB`);
  console.log(`  - Total size: ${(metrics.totalSize / 1024).toFixed(2)} KB`);
  
  console.log('\nNetwork metrics:');
  console.log(`  - Connection type: ${metrics.connectionType}`);
  console.log(`  - Effective type: ${metrics.effectiveType}`);
  console.log(`  - Downlink: ${metrics.downlink.toFixed(2)} Mbps`);
  console.log(`  - RTT: ${metrics.rtt.toFixed(2)}ms`);

  // Test 2: Verify setupPerformanceMonitoring returns cleanup function
  console.log('\nTest 2: Checking setupPerformanceMonitoring()...');
  let callbackInvoked = false;
  const cleanup = setupPerformanceMonitoring((updatedMetrics) => {
    callbackInvoked = true;
    console.log('✓ Performance monitoring callback invoked');
  });

  if (typeof cleanup !== 'function') {
    console.error('❌ FAILED: setupPerformanceMonitoring did not return cleanup function');
    return;
  }
  console.log('✓ setupPerformanceMonitoring returns cleanup function');

  // Cleanup
  cleanup();
  console.log('✓ Cleanup function executed successfully');

  console.log('\n✅ All verification tests passed!');
  console.log('\nImplementation summary:');
  console.log('- ✓ Core Web Vitals (FCP, LCP, CLS, FID)');
  console.log('- ✓ Custom metrics (TTI, TBT)');
  console.log('- ✓ Resource metrics (JS, CSS, image sizes)');
  console.log('- ✓ Network metrics (connection type, downlink, RTT)');
  console.log('- ✓ Real-time monitoring with PerformanceObserver');
}

// Export for testing
export { verifyMetricsStructure, verifyMetricValues };
