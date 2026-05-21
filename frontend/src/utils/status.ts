export function getStatusBadgeClasses(status: string): string {
  if (status === 'verified') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'partial') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}
