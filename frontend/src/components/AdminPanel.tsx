'use client';

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Candidate, AdminStats } from '../types';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Trash2, 
  Layers, 
  Loader2,
  Mail,
} from 'lucide-react';

interface AdminPanelProps {
  onViewCandidate: (id: string) => void;
}

export default function AdminPanel({ onViewCandidate }: AdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'candidates'>('stats');

  const [candStatus, setCandStatus] = useState('all');
  const [candPage, setCandPage] = useState(1);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (active) setLoading(true);
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/users')
        ]);
        if (active) {
          setStats(statsRes.data.stats);
          setUsers(usersRes.data.users || []);
        }
      } catch (error) {
        console.error('Error loading admin details:', error);
      }

      try {
        const statusParam = candStatus !== 'all' ? `&status=${candStatus}` : '';
        const res = await api.get(`/api/admin/candidates?page=${candPage}&limit=10${statusParam}`);
        if (active) {
          setAllCandidates(res.data.candidates || []);
        }
      } catch (error) {
        console.error('Error loading global candidates:', error);
      }

      if (active) setLoading(false);
    };

    Promise.resolve().then(() => {
      loadData();
    });

    return () => {
      active = false;
    };
  }, [candPage, candStatus]);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this user's permissions to "${nextRole}"?`)) return;

    try {
      setLoading(true);
      await api.patch(`/api/admin/users/${userId}/role`, { role: nextRole });
      const [statsRes, usersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users')
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      console.error(err);
      alert('Failed to modify user role authorization.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Warning: Deleting this candidate will permanently remove all logs. Proceed?')) return;
    try {
      setLoading(true);
      await api.delete(`/api/admin/candidates/${candidateId}`);
      const [statsRes, usersRes, res] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get(`/api/admin/candidates?page=${candPage}&limit=10${candStatus !== 'all' ? `&status=${candStatus}` : ''}`)
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users || []);
      setAllCandidates(res.data.candidates || []);
    } catch (err) {
      console.error(err);
      alert('Delete candidate operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Warning: Deleting this user will permanently purge all their candidate records and verification history logs. Proceed?')) return;
    try {
      setLoading(true);
      await api.delete(`/api/admin/users/${userId}`);
      const [statsRes, usersRes, res] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get(`/api/admin/candidates?page=${candPage}&limit=10${candStatus !== 'all' ? `&status=${candStatus}` : ''}`)
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users || []);
      setAllCandidates(res.data.candidates || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Delete user operation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-zinc-500 text-sm font-medium">Synchronizing administrative interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 animate-fade-in">
      
      <div className="p-6 rounded-2xl border border-zinc-200/85 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <span>RBAC Control Center</span>
          </h2>
          <p className="text-xs text-zinc-500">System audits, user profiles, and directory records (Global View)</p>
        </div>

        <div className="flex items-center space-x-1.5 bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'stats' ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-250'
            }`}
          >
            Audits
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'users' ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-250'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'candidates' ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-250'
            }`}
          >
            Candidates
          </button>
        </div>
      </div>

      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl">
              <Users className="w-5 h-5 text-indigo-500 mb-3" />
              <h3 className="text-2xl font-bold text-zinc-955 dark:text-zinc-50">{stats.users.total}</h3>
              <p className="text-xs text-zinc-400 font-semibold mt-1">Platform Members</p>
            </div>
            <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl">
              <Layers className="w-5 h-5 text-indigo-500 mb-3" />
              <h3 className="text-2xl font-bold text-zinc-955 dark:text-zinc-50">{stats.candidates.total}</h3>
              <p className="text-xs text-zinc-400 font-semibold mt-1">Global Candidate Count</p>
            </div>
            <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl">
              <UserCheck className="w-5 h-5 text-indigo-500 mb-3" />
              <h3 className="text-2xl font-bold text-zinc-955 dark:text-zinc-50">{stats.verifications.total}</h3>
              <p className="text-xs text-zinc-400 font-semibold mt-1">Completed Vetting Cycles</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl space-y-6">
            <h4 className="text-sm font-bold text-zinc-955 dark:text-zinc-50">Identity Verification Breakdown</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 rounded-xl">
                <span className="text-emerald-500 dark:text-emerald-400 font-bold block text-xl">{stats.candidates.verified}</span>
                <span className="text-[10px] text-zinc-450 uppercase font-semibold mt-1 tracking-wider block">Verified</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800/30 rounded-xl">
                <span className="text-zinc-500 dark:text-zinc-450 font-bold block text-xl">{stats.candidates.pending}</span>
                <span className="text-[10px] text-zinc-455 uppercase font-semibold mt-1 tracking-wider block">Pending</span>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/20 rounded-xl">
                <span className="text-amber-500 dark:text-amber-400 font-bold block text-xl">{stats.candidates.partial}</span>
                <span className="text-[10px] text-zinc-455 uppercase font-semibold mt-1 tracking-wider block">Partial</span>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 rounded-xl">
                <span className="text-rose-500 dark:text-rose-400 font-bold block text-xl">{stats.candidates.failed}</span>
                <span className="text-[10px] text-zinc-455 uppercase font-semibold mt-1 tracking-wider block">Failed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl space-y-6">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">User Directory</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/60 pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="pb-3">User Details</th>
                  <th className="pb-3">Active Candidates</th>
                  <th className="pb-3">Security Role</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{u.name}</div>
                      <div className="text-xs text-zinc-500 flex items-center space-x-1 mt-0.5 font-mono">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {u._count?.candidates || 0} Registered
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' 
                          ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50' 
                          : 'bg-zinc-150 dark:bg-zinc-800 text-zinc-660 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/35 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-semibold transition-colors"
                        >
                          Change permissions
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete user and all their records"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'candidates' && (
        <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">All Candidate Records</h3>
            
            <div className="flex items-center space-x-2 bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200 rounded-lg p-1">
              {['all', 'pending', 'verified', 'partial', 'failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => { setCandStatus(st); setCandPage(1); }}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    candStatus === st ? 'bg-indigo-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-850'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {allCandidates.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-sm">
                No candidate records fit the criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800/60 pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="pb-3">Candidate Details</th>
                    <th className="pb-3">Created By (Owner)</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {allCandidates.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{c.fullName}</div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5 select-all">{c.id}</div>
                      </td>
                      <td className="py-4">
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{c.createdBy?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{c.createdBy?.email}</div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.status === 'verified'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'
                            : c.status === 'failed'
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50'
                            : c.status === 'partial'
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border border-zinc-205 dark:border-zinc-700/50'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onViewCandidate(c.id)}
                            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-indigo-50 hover:text-indigo-650 dark:hover:bg-indigo-950/30 text-xs font-semibold transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(c.id)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete candidate system-wide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
