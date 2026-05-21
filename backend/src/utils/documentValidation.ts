export const AADHAAR_REGEX = /^[0-9]{12}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function stripAadhaarDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 12);
}

export function isValidAadhaar(value: string | null | undefined): boolean {
  return Boolean(value && AADHAAR_REGEX.test(stripAadhaarDigits(value)));
}

export function normalizePan(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

export function isValidPan(value: string | null | undefined): boolean {
  return isValidPanFormat(normalizePan(value));
}

export function isValidPanFormat(value: string): boolean {
  return PAN_REGEX.test(value);
}
