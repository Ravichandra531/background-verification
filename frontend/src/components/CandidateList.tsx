'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { Candidate } from '../types';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  Loader2,
  Calendar,
  Phone,
  Mail,
  User,
  MapPin,
  Fingerprint,
  CreditCard
} from 'lucide-react';

// Zod schemas matching backend validations exactly
const candidateFormSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .trim()
    .toLowerCase(),
  phone: z.string()
    .regex(/^[0-9]{10}$/, 'Phone must be a valid 10-digit number')
    .trim(),
  aadhaarNumber: z.string()
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().regex(/^[0-9]{12}$/, 'Aadhaar must be a valid 12-digit number')),
  panNumber: z.string()
    .trim()
    .transform((val) => val.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must be in valid format (e.g., ABCDE1234F)')),
  dob: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must not exceed 500 characters')
    .trim(),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

interface CandidateListProps {
  onViewDetails: (candidateId: string) => void;
  openCreateImmediately?: boolean;
  onClearCreateFlag?: () => void;
}

export default function CandidateList({ onViewDetails, openCreateImmediately, onClearCreateFlag }: CandidateListProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCandidates, setTotalCandidates] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form hook
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
  });

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      
      const response = await api.get(`/api/candidates?page=${page}&limit=${limit}${statusParam}${searchParam}`);
      setCandidates(response.data.candidates || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalCandidates(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, limit]);

  const openAddModal = useCallback(() => {
    setServerError(null);
    reset({
      fullName: '',
      email: '',
      phone: '',
      aadhaarNumber: '',
      panNumber: '',
      dob: '',
      address: '',
    });
    setIsAddModalOpen(true);
  }, [reset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch list when filters change
    void loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    if (!openCreateImmediately) return;
    queueMicrotask(() => {
      openAddModal();
      onClearCreateFlag?.();
    });
  }, [openCreateImmediately, openAddModal, onClearCreateFlag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCandidates();
  };

  const openEditModal = async (candidate: Candidate) => {
    setServerError(null);
    setSelectedCandidate(candidate);
    
    try {
      setLoading(true);
      const res = await api.get(`/api/candidates/${candidate.id}`);
      const fullDetails = res.data.candidate;
      
      const formattedDOB = fullDetails.dob ? new Date(fullDetails.dob).toISOString().split('T')[0] : '';
      
      reset({
        fullName: fullDetails.fullName,
        email: fullDetails.email,
        phone: fullDetails.phone,
        aadhaarNumber: '123412341234',
        panNumber: 'ABCDE1234F',
        dob: formattedDOB,
        address: fullDetails.address,
      });
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Failed to get candidate editable details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CandidateFormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await api.post('/api/candidates', data);
      setIsAddModalOpen(false);
      loadCandidates();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setServerError(err.response?.data?.error || 'Failed to create candidate. Please verify details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: CandidateFormValues) => {
    if (!selectedCandidate) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const payload: Partial<CandidateFormValues> = { ...data };
      if (payload.aadhaarNumber === '123412341234') delete payload.aadhaarNumber;
      if (payload.panNumber === 'ABCDE1234F') delete payload.panNumber;

      await api.put(`/api/candidates/${selectedCandidate.id}`, payload);
      setIsEditModalOpen(false);
      loadCandidates();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setServerError(err.response?.data?.error || 'Failed to update candidate details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (candidateId: string) => {
    try {
      await api.delete(`/api/candidates/${candidateId}`);
      setDeleteConfirmId(null);
      loadCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
    }
  };

  const statusChip = (status: string) => {
    if (status === 'verified') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'partial') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-2.5 pl-9 pr-20 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            Search
          </button>
        </form>

        {/* Filter and Action */}
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 p-1">
            {['all', 'pending', 'verified', 'partial', 'failed'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`rounded px-3 py-1.5 text-xs font-medium capitalize ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading && candidates.length === 0 ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center">
            <User className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h4 className="text-sm font-semibold text-slate-700">No candidates found</h4>
            <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
              Adjust your search or add a new candidate.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4 w-1/4">Candidate details</th>
                    <th className="px-5 py-4 w-1/4">Contact details</th>
                    <th className="px-5 py-4 w-1/6">Status</th>
                    <th className="px-5 py-4 w-1/6">Created</th>
                    <th className="px-5 py-4 w-1/6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 w-1/4">
                        <div className="font-medium text-slate-900 truncate">{candidate.fullName}</div>
                        <div className="mt-1 font-mono text-xs text-slate-400 truncate">{candidate.id}</div>
                      </td>
                      <td className="px-5 py-4 w-1/4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                          <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{candidate.email}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                          <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{candidate.phone}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 w-1/6">
                        <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium capitalize whitespace-nowrap ${statusChip(candidate.status)}`}>
                          {candidate.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 w-1/6 text-slate-500 whitespace-nowrap">
                        {new Date(candidate.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-4 w-1/6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewDetails(candidate.id)}
                            className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(candidate)}
                            className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          {deleteConfirmId === candidate.id ? (
                            <div className="flex items-center space-x-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 rounded-lg p-1">
                              <span className="text-3xs font-bold uppercase tracking-wider text-rose-500 px-1">Confirm?</span>
                              <button
                                onClick={() => handleDelete(candidate.id)}
                                className="px-2 py-1 bg-rose-600 text-white rounded text-3xs font-bold hover:bg-rose-700"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-3xs font-bold"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(candidate.id)}
                              className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
                <span>
                  Page <strong className="text-slate-700">{page}</strong> of <strong className="text-slate-700">{totalPages}</strong> ({totalCandidates} total)
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-md border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-md border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add & Edit Candidate Modals */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {isAddModalOpen ? 'Add candidate' : 'Edit candidate'}
              </h3>
              <button
                type="button"
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {serverError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
                {serverError}
              </div>
            )}

            {/* Form */}
            <form 
              onSubmit={handleSubmit(isAddModalOpen ? handleCreate : handleUpdate)}
              className="space-y-4 overflow-y-auto flex-1 pr-1"
            >
              {/* Full name */}
              <div className="space-y-1">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('fullName')}
                    type="text"
                    placeholder="John Doe"
                    className="w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                {errors.fullName && (
                  <span className="text-2xs text-rose-500 mt-1 block">{errors.fullName.message}</span>
                )}
              </div>

              {/* Email & Phone side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="john@test.com"
                      className="w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                  {errors.email && (
                    <span className="text-2xs text-rose-500 mt-1 block">{errors.email.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      {...register('phone')}
                      type="text"
                      placeholder="9876543210"
                      className="w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                  {errors.phone && (
                    <span className="text-2xs text-rose-500 mt-1 block">{errors.phone.message}</span>
                  )}
                </div>
              </div>

              {/* Aadhaar & PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Aadhaar Number (12 digits)
                  </label>
                  <div className="relative group">
                    <Fingerprint className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      {...register('aadhaarNumber')}
                      type="text"
                      inputMode="numeric"
                      placeholder="123412341234"
                      maxLength={12}
                      disabled={isEditModalOpen}
                      className="w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-4 text-sm disabled:bg-slate-50 disabled:opacity-50 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                  {errors.aadhaarNumber && (
                    <span className="text-2xs text-rose-500 mt-1 block">{errors.aadhaarNumber.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    PAN Card (ABCDE1234F)
                  </label>
                  <div className="relative group">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      {...register('panNumber', {
                        onChange: (e) => {
                          e.target.value = e.target.value.toUpperCase();
                        },
                      })}
                      type="text"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      disabled={isEditModalOpen}
                      className="w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-4 text-sm uppercase disabled:bg-slate-50 disabled:opacity-50 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                  {errors.panNumber && (
                    <span className="text-2xs text-rose-500 mt-1 block">{errors.panNumber.message}</span>
                  )}
                </div>
              </div>

              {/* DOB Date */}
              <div className="space-y-1">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Date of Birth
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('dob')}
                    type="date"
                    className="w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                {errors.dob && (
                  <span className="text-2xs text-rose-500 mt-1 block">{errors.dob.message}</span>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Home Address (Min 10 chars)
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-4 h-4 w-4 text-slate-400" />
                  <textarea
                    {...register('address')}
                    rows={3}
                    placeholder="Enter full residential address..."
                    className="w-full resize-none rounded-md border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                {errors.address && (
                  <span className="text-2xs text-rose-500 mt-1 block">{errors.address.message}</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{isAddModalOpen ? 'Save Candidate' : 'Apply Changes'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
