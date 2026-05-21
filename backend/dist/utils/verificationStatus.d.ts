export declare const REQUIRED_VERIFICATION_TYPES: readonly ["aadhaar", "pan"];
export type VerificationType = (typeof REQUIRED_VERIFICATION_TYPES)[number];
export interface StatusLog {
    verificationType: string;
    verificationStatus: string;
    verifiedAt: Date | string;
}
/** Latest log per document type (aadhaar / pan), by most recent verifiedAt. */
export declare function getLatestLogPerType(logs: StatusLog[]): Map<string, StatusLog>;
/**
 * Overall candidate status from verification history:
 * - verified: both Aadhaar and PAN latest checks completed
 * - failed: both types attempted and latest for each is failed
 * - partial: mixed results, or only one type verified/attempted
 * - pending: no verification logs
 */
export declare function computeCandidateStatus(logs: StatusLog[]): string;
//# sourceMappingURL=verificationStatus.d.ts.map