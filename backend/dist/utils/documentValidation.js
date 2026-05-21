export const AADHAAR_REGEX = /^[0-9]{12}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export function stripAadhaarDigits(value) {
    return value.replace(/\D/g, '').slice(0, 12);
}
export function isValidAadhaar(value) {
    return Boolean(value && AADHAAR_REGEX.test(stripAadhaarDigits(value)));
}
export function normalizePan(value) {
    return (value ?? '').trim().toUpperCase();
}
export function isValidPan(value) {
    return isValidPanFormat(normalizePan(value));
}
export function isValidPanFormat(value) {
    return PAN_REGEX.test(value);
}
//# sourceMappingURL=documentValidation.js.map