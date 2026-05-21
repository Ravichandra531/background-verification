'use client';

import React, { useState, useEffect } from 'react';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';
import CandidateList from '../components/CandidateList';
import CandidateDetails from '../components/CandidateDetails';
import AdminPanel from '../components/AdminPanel';
import { User } from '../types';
import { ShieldCheck, LayoutDashboard, Users, Settings, LogOut, PlusCircle, Menu, X } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'candidates' | 'admin'>('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [openCreateImmediately, setOpenCreateImmediately] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (savedToken && savedUser) {
        setUser(JSON.parse(savedUser) as User);
      }
      setLoading(false);
    });
  }, []);

  const handleAuthSuccess = (authenticatedUser: User, jwtToken: string, remember: boolean) => {
    setUser(authenticatedUser);
    if (typeof window !== 'undefined') {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('token', jwtToken);
      storage.setItem('user', JSON.stringify(authenticatedUser));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
    setSelectedCandidateId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  };

  const handleNavigation = (
    targetView: 'dashboard' | 'candidates' | 'admin' | 'add-candidate',
    extra?: { candidateId?: string }
  ) => {
    setIsMobileMenuOpen(false);
    if (targetView === 'add-candidate') {
      setOpenCreateImmediately(true);
      setView('candidates');
      setSelectedCandidateId(null);
    } else if (extra?.candidateId) {
      setSelectedCandidateId(extra.candidateId);
      setView('candidates');
    } else {
      setSelectedCandidateId(null);
      setView(targetView);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Login onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  const navClass = (active: boolean) =>
    active
      ? 'bg-slate-100 text-slate-900 font-medium'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';

  const renderContent = () => {
    if (selectedCandidateId) {
      return (
        <CandidateDetails
          candidateId={selectedCandidateId}
          onBack={() => setSelectedCandidateId(null)}
        />
      );
    }
    switch (view) {
      case 'candidates':
        return (
          <CandidateList
            onViewDetails={(id) => setSelectedCandidateId(id)}
            openCreateImmediately={openCreateImmediately}
            onClearCreateFlag={() => setOpenCreateImmediately(false)}
          />
        );
      case 'admin':
        return <AdminPanel onViewCandidate={(id) => handleNavigation('candidates', { candidateId: id })} />;
      default:
        return <Dashboard user={user} onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden print:hidden">
        <span className="text-sm font-semibold text-slate-900">VerifyBGC</span>
        <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-md p-2 hover:bg-slate-100" aria-label="Menu">
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200 bg-white p-5 transition-transform lg:static lg:translate-x-0 print:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-slate-900">VerifyBGC</span>
        </div>

        <button
          type="button"
          onClick={() => handleNavigation('add-candidate')}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          <PlusCircle className="h-4 w-4" />
          Add Candidate
        </button>

        <nav className="space-y-1">
          <button type="button" onClick={() => handleNavigation('dashboard')} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${navClass(view === 'dashboard' && !selectedCandidateId)}`}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button type="button" onClick={() => handleNavigation('candidates')} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${navClass(view === 'candidates' || !!selectedCandidateId)}`}>
            <Users className="h-4 w-4" />
            Candidates
          </button>
          {user.role === 'admin' && (
            <button type="button" onClick={() => handleNavigation('admin')} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${navClass(view === 'admin')}`}>
              <Settings className="h-4 w-4" />
              Admin
            </button>
          )}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Account</p>
          <p className="mt-2 truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <button type="button" onClick={handleLogout} className="mt-3 flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <div className="mx-auto max-w-5xl p-6">{renderContent()}</div>
      </main>
    </div>
  );
}
