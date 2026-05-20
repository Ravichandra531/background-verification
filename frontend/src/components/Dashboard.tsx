'use client';

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Candidate, User } from '../types';
import { Users, CheckCircle2, AlertCircle, Clock, ArrowRight, Plus } from 'lucide-react';

interface DashboardProps {
  user: User;
  onNavigate: (view: 'dashboard' | 'candidates' | 'admin' | 'add-candidate', extra?: { candidateId?: string }) => void;
}

function statusClass(status: string) {
  if (status === 'verified') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'partial') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, failed: 0, partial: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/api/candidates?page=1&limit=100');
        const list = response.data.candidates || [];
        setRecentCandidates(list.slice(0, 5));
        setStats({
          total: list.length,
          verified: list.filter((c: Candidate) => c.status === 'verified').length,
          pending: list.filter((c: Candidate) => c.status === 'pending').length,
          failed: list.filter((c: Candidate) => c.status === 'failed').length,
          partial: list.filter((c: Candidate) => c.status === 'partial').length,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  const metrics = [
    { label: 'Total Candidates', value: stats.total, icon: Users },
    { label: 'Verified', value: stats.verified, icon: CheckCircle2 },
    { label: 'Pending', value: stats.pending, icon: Clock, note: stats.partial > 0 ? `${stats.partial} partial` : undefined },
    { label: 'Failed', value: stats.failed, icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Welcome, {user.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage candidates and run Aadhaar & PAN identity checks.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate('add-candidate')}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Candidate
          </button>
          <button
            type="button"
            onClick={() => onNavigate('candidates')}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, note }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Icon className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-semibold text-slate-900">{value}</span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">{label}</p>
            {note && <p className="mt-0.5 text-xs text-amber-700">{note}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Candidates</h2>
            <p className="text-xs text-slate-500">Latest registrations</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('candidates')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            View all
          </button>
        </div>

        {recentCandidates.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No candidates yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{candidate.fullName}</div>
                      <div className="text-xs text-slate-500">{candidate.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${statusClass(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(candidate.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigate('candidates', { candidateId: candidate.id })}
                        className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
