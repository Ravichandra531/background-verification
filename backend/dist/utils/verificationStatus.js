export const REQUIRED_VERIFICATION_TYPES = ['aadhaar', 'pan'];
/** Latest log per document type (aadhaar / pan), by most recent verifiedAt. */
export function getLatestLogPerType(logs) {
    const latest = new Map();
    for (const log of logs) {
        const existing = latest.get(log.verificationType);
        if (!existing || new Date(log.verifiedAt) > new Date(existing.verifiedAt)) {
            latest.set(log.verificationType, log);
        }
    }
    return latest;
}
/**
 * Overall candidate status from verification history:
 * - verified: both Aadhaar and PAN latest checks completed
 * - failed: both types attempted and latest for each is failed
 * - partial: mixed results, or only one type verified/attempted
 * - pending: no verification logs
 */
export function computeCandidateStatus(logs) {
    if (!logs.length)
        return 'pending';
    const latest = getLatestLogPerType(logs);
    const aadhaar = latest.get('aadhaar');
    const pan = latest.get('pan');
    const aadhaarOk = aadhaar?.verificationStatus === 'completed';
    const panOk = pan?.verificationStatus === 'completed';
    if (aadhaarOk && panOk)
        return 'verified';
    const aadhaarFailed = aadhaar?.verificationStatus === 'failed';
    const panFailed = pan?.verificationStatus === 'failed';
    if (aadhaar && pan && aadhaarFailed && panFailed)
        return 'failed';
    return 'partial';
}
//# sourceMappingURL=verificationStatus.js.map