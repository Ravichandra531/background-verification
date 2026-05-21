export type UniqueField = 'email' | 'phone' | 'panNumber' | 'aadhaarNumber';
export declare function normalizeCandidateEmail(email: string): string;
export declare function normalizeCandidatePhone(phone: string): string;
export interface CandidateUniqueInput {
    email?: string;
    phone?: string;
    panNumber?: string;
    aadhaarNumber?: string;
}
export declare function findCandidateFieldConflict(input: CandidateUniqueInput, excludeId?: string): Promise<{
    field: UniqueField;
    message: string;
} | null>;
/** Build failed verification results when identity fields duplicate another candidate. */
export declare function buildDuplicateVerificationFailure(types: Array<'aadhaar' | 'pan'>, candidateId: string, conflict: {
    field: UniqueField;
    message: string;
}): Array<{
    type: 'aadhaar' | 'pan';
    requestPayload: Record<string, unknown>;
    responsePayload: Record<string, unknown>;
    verificationStatus: 'failed';
}>;
//# sourceMappingURL=candidateUniqueness.d.ts.map