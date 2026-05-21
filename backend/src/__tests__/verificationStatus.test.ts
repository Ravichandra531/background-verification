import {
  computeCandidateStatus,
  getLatestLogPerType,
} from '../utils/verificationStatus.js';

const log = (
  type: string,
  status: string,
  at: string
) => ({
  verificationType: type,
  verificationStatus: status,
  verifiedAt: at,
});

describe('verification status logic', () => {
  it('returns pending when there are no logs', () => {
    expect(computeCandidateStatus([])).toBe('pending');
  });

  it('returns partial when only Aadhaar is verified', () => {
    const status = computeCandidateStatus([
      log('aadhaar', 'completed', '2026-01-02T10:00:00Z'),
    ]);
    expect(status).toBe('partial');
  });

  it('returns partial when only PAN is verified', () => {
    const status = computeCandidateStatus([
      log('pan', 'completed', '2026-01-02T10:00:00Z'),
    ]);
    expect(status).toBe('partial');
  });

  it('returns verified only when both Aadhaar and PAN are completed', () => {
    const status = computeCandidateStatus([
      log('aadhaar', 'completed', '2026-01-02T10:00:00Z'),
      log('pan', 'completed', '2026-01-02T11:00:00Z'),
    ]);
    expect(status).toBe('verified');
  });

  it('returns failed when both types latest checks failed', () => {
    const status = computeCandidateStatus([
      log('aadhaar', 'failed', '2026-01-02T10:00:00Z'),
      log('pan', 'failed', '2026-01-02T11:00:00Z'),
    ]);
    expect(status).toBe('failed');
  });

  it('returns partial when one completed and one failed', () => {
    const status = computeCandidateStatus([
      log('aadhaar', 'completed', '2026-01-02T10:00:00Z'),
      log('pan', 'failed', '2026-01-02T11:00:00Z'),
    ]);
    expect(status).toBe('partial');
  });

  it('uses the latest log per type when re-verified', () => {
    const status = computeCandidateStatus([
      log('aadhaar', 'failed', '2026-01-01T10:00:00Z'),
      log('aadhaar', 'completed', '2026-01-02T10:00:00Z'),
      log('pan', 'completed', '2026-01-02T11:00:00Z'),
    ]);
    expect(status).toBe('verified');

    const latest = getLatestLogPerType([
      log('aadhaar', 'failed', '2026-01-01T10:00:00Z'),
      log('aadhaar', 'completed', '2026-01-02T10:00:00Z'),
    ]);
    expect(latest.get('aadhaar')?.verificationStatus).toBe('completed');
  });

  it('stays partial after single-doc verify in a separate run', () => {
    const afterAadhaarOnly = computeCandidateStatus([
      log('aadhaar', 'completed', '2026-01-02T10:00:00Z'),
    ]);
    expect(afterAadhaarOnly).toBe('partial');

    const afterBothRuns = computeCandidateStatus([
      log('aadhaar', 'completed', '2026-01-02T10:00:00Z'),
      log('pan', 'completed', '2026-01-03T10:00:00Z'),
    ]);
    expect(afterBothRuns).toBe('verified');
  });
});
