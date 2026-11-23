import * as inspectionTypes from '../types/inspection';
import * as barrel from '../types';
import {
  InspectionCategory,
  InspectionSeverity,
  InspectionStatus,
  type InspectionFinding,
  type InspectionReport,
  type InspectorProfile,
} from '../types';

const inspector: InspectorProfile = {
  id: 'insp-1',
  displayName: 'Dana Whitfield',
  licenseNumber: 'OR-CCB-204918',
  country: 'US',
  yearsExperience: 12,
  rating: 4.8,
  completedInspections: 640,
  contactEmail: 'dana@example.com',
};

const finding: InspectionFinding = {
  id: 'fnd-1',
  category: InspectionCategory.Electrical,
  severity: InspectionSeverity.Major,
  title: 'Missing GFCI protection',
  description: 'Bathroom receptacles are not GFCI protected.',
  location: 'Primary bathroom',
  estimatedRepairCost: 320,
  isBlocking: true,
  photos: ['reports/insp-1/bathroom.jpg'],
};

const report: InspectionReport = {
  id: 'rep-1',
  propertyId: 'prop-42',
  status: InspectionStatus.Completed,
  inspector,
  scheduledAt: '2026-11-02T09:00:00.000Z',
  completedAt: '2026-11-02T12:30:00.000Z',
  publishedAt: '2026-11-03T08:00:00.000Z',
  summary: 'One blocking electrical defect.',
  findings: [finding],
  conditionScore: 82,
  currency: 'USD',
  totalEstimatedRepairCost: 320,
  reportUrl: 'https://example.com/reports/rep-1.pdf',
};

describe('inspection types', () => {
  it('models a complete report with findings and inspector details', () => {
    expect(report.inspector.displayName).toBe('Dana Whitfield');
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]).toMatchObject({
      severity: InspectionSeverity.Major,
      category: InspectionCategory.Electrical,
      isBlocking: true,
    });
    expect(report.currency).toBe('USD');
  });

  it('defines the inspection status and severity enums', () => {
    expect(Object.values(InspectionStatus)).toEqual([
      'scheduled',
      'in-progress',
      'completed',
      'cancelled',
      'disputed',
    ]);
    expect(Object.values(InspectionSeverity)).toEqual([
      'info',
      'minor',
      'moderate',
      'major',
      'critical',
    ]);
  });

  it('keeps the status and severity value sets distinct', () => {
    // A finding severity must never be usable where a report status is expected.
    const statuses = new Set<string>(Object.values(InspectionStatus));
    for (const severity of Object.values(InspectionSeverity)) {
      expect(statuses.has(severity)).toBe(false);
    }
  });

  it('exports every type from the types barrel', () => {
    expect(barrel.InspectionStatus).toBe(InspectionStatus);
    expect(barrel.InspectionSeverity).toBe(InspectionSeverity);
    expect(barrel.InspectionCategory).toBe(InspectionCategory);
  });

  it('contains no runtime behaviour beyond the enums', () => {
    const runtimeExports = Object.entries(inspectionTypes);
    expect(runtimeExports.map(([name]) => name).sort()).toEqual([
      'InspectionCategory',
      'InspectionSeverity',
      'InspectionStatus',
    ]);
    for (const [, value] of runtimeExports) {
      expect(typeof value).not.toBe('function');
    }
  });
});
