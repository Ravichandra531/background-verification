'use client';

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Candidate, VerificationLog, ReportData, User } from '../types';
import {
  Mail,
  Phone,
  Fingerprint,
  CreditCard,
  MapPin,
  Calendar,
  ShieldAlert,
  Play,
  Printer,
  FileText,
  ChevronLeft,
  Loader2,
  X,
} from 'lucide-react';

interface CandidateDetailsProps {
  candidateId: string;
  onBack: () => void;
  user: User;
}

function getLatestLogsByType(logs: VerificationLog[]): VerificationLog[] {
  const latest = new Map<string, VerificationLog>();
  for (const log of logs) {
    const existing = latest.get(log.verificationType);
    if (!existing || new Date(log.verifiedAt) > new Date(existing.verifiedAt)) {
      latest.set(log.verificationType, log);
    }
  }
  return Array.from(latest.values()).sort(
    (a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
  );
}

function statusClass(status: string) {
  if (status === 'verified') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'partial') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export default function CandidateDetails({ candidateId, onBack, user }: CandidateDetailsProps) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/candidates/${candidateId}`);
      setCandidate(response.data.candidate);
    } catch (error) {
      console.error('Error fetching candidate details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [candidateId]);

  const handleStartVerification = async (type: 'aadhaar' | 'pan' | 'all') => {
    setVerifying(true);
    setActionError(null);
    try {
      await api.post(`/api/verifications/${candidateId}/start`, { verificationType: type });
      await fetchDetails();
    } catch {
      setActionError('Verification failed. Ensure the backend and mock API are running.');
    } finally {
      setVerifying(false);
    }
  };

  const handleGenerateReport = async () => {
    setActionError(null);
    try {
      const response = await api.get(`/api/reports/${candidateId}`);
      setReportData(response.data.report);
      setShowReportModal(true);
    } catch {
      setActionError('Unable to load report.');
    }
  };

  if (loading && !candidate) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <h3 className="text-lg font-semibold text-slate-900">Candidate not found</h3>
        <button type="button" onClick={onBack} className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
          Back to list
        </button>
      </div>
    );
  }

  const logs = getLatestLogsByType(candidate.verificationLogs || []);

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to candidates
        </button>
        <button
          type="button"
          onClick={handleGenerateReport}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <FileText className="h-4 w-4" />
          Generate report
        </button>
      </div>

      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{candidate.fullName}</h1>
              <p className="mt-0.5 font-mono text-xs text-slate-400">{candidate.id}</p>
            </div>
            <span className={`rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${statusClass(candidate.status)}`}>
              {candidate.status}
            </span>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: 'Email', value: candidate.email, icon: Mail },
              { label: 'Phone', value: candidate.phone, icon: Phone },
              { label: 'Aadhaar', value: candidate.aadhaarNumber, icon: Fingerprint, mono: true },
              { label: 'PAN', value: candidate.panNumber, icon: CreditCard, mono: true },
              {
                label: 'Date of birth',
                value: candidate.dob
                  ? new Date(candidate.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'N/A',
                icon: Calendar,
              },
            ].map(({ label, value, icon: Icon, mono }) => (
              <div key={label}>
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className={`mt-1 flex items-center gap-2 text-sm text-slate-900 ${mono ? 'font-mono' : ''}`}>
                  <Icon className="h-4 w-4 text-slate-400" />
                  {value}
                </dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-slate-500">Address</dt>
              <dd className="mt-1 flex items-start gap-2 text-sm text-slate-900">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                {candidate.address}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm print:hidden">
          <h2 className="text-sm font-semibold text-slate-900">Run verification</h2>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => handleStartVerification('all')}
              disabled={verifying}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Verify Aadhaar & PAN
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStartVerification('aadhaar')}
                disabled={verifying}
                className="rounded-md border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Aadhaar only
              </button>
              <button
                type="button"
                onClick={() => handleStartVerification('pan')}
                disabled={verifying}
                className="rounded-md border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                PAN only
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm print:hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Verification logs</h2>
          <p className="text-xs text-slate-500">Latest check per document type</p>
        </div>
        {logs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">No verifications yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {logs.map((log) => (
              <li key={log.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium capitalize text-slate-900">{log.verificationType}</span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                      log.verificationStatus === 'completed'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {log.verificationStatus === 'completed' ? 'Verified' : 'Failed'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(log.verifiedAt).toLocaleString('en-GB')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {log.responsePayload?.message || log.responsePayload?.error || 'Processed via mock API.'}
                </p>
                <button
                  type="button"
                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  className="mt-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  {expandedLogId === log.id ? 'Hide details' : 'Show API payload'}
                </button>
                {expandedLogId === log.id && (
                  <pre className="mt-2 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    {JSON.stringify({ request: log.requestPayload, response: log.responsePayload }, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showReportModal && reportData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="report-title" className="text-sm font-semibold text-slate-900">
                Verification report
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div id="verification-report-print" className="overflow-y-auto p-6 text-sm text-slate-800">
              <div className="border-b border-slate-200 pb-4 text-center">
                <h3 className="text-lg font-semibold text-slate-900">Background Verification Report</h3>
                <p className="text-xs text-slate-500">Generated {new Date(reportData.generatedAt).toLocaleString('en-GB')}</p>
              </div>
              <div className="mt-4 space-y-1">
                <p><span className="text-slate-500">Candidate:</span> {reportData.candidateInfo.fullName}</p>
                <p><span className="text-slate-500">Email:</span> {reportData.candidateInfo.email}</p>
                <p><span className="text-slate-500">Aadhaar:</span>{' '}
                  {reportData.verifications.find((v) => v.type === 'aadhaar')?.status === 'completed' ? 'Verified' : 'Pending / Failed'}
                </p>
                <p><span className="text-slate-500">PAN:</span>{' '}
                  {reportData.verifications.find((v) => v.type === 'pan')?.status === 'completed' ? 'Verified' : 'Pending / Failed'}
                </p>
                <p><span className="text-slate-500">Overall:</span> {reportData.verificationStatus}</p>
                <p><span className="text-slate-500">Verified by:</span> {reportData.verifiedBy || user.name}</p>
              </div>
              <table className="mt-6 w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.verifications.map((v) => (
                    <tr key={v.type}>
                      <td className="py-2 capitalize">{v.type}</td>
                      <td className="py-2">{v.status === 'completed' ? 'Verified' : 'Failed'}</td>
                      <td className="py-2 text-right">{new Date(v.verifiedAt).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-8 flex justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <div>
                  <p className="font-medium text-slate-700">{reportData.verifiedBy || user.name}</p>
                  <p>{reportData.verifiedByEmail || user.email}</p>
                </div>
                <div className="rounded border border-dashed border-slate-300 px-4 py-2 text-center text-[10px]">
                  Digital seal placeholder
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
