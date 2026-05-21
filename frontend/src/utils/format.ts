export function formatDateGB(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' }
): string {
  return new Date(value).toLocaleDateString('en-GB', options);
}
