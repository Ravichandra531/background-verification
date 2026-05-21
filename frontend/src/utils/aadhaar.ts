/** Strip to up to 12 digits for storage and API. */
export function stripAadhaarDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 12);
}

/** Display format: 1234-1234-1234 */
export function formatAadhaarDisplay(value: string): string {
  const digits = stripAadhaarDigits(value);
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
}
