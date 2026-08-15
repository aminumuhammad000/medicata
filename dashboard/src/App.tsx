import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar, type DashboardTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OnboardingFlow } from './components/OnboardingFlow';
import { OverviewView } from './views/OverviewView';
import { TriageView } from './views/TriageView';
import { AppointmentsView } from './views/AppointmentsView';
import { PrescriptionsView } from './views/PrescriptionsView';
import { RecordsView } from './views/RecordsView';
import { SecurityView } from './views/SecurityView';
import { SettingsView } from './views/SettingsView';
import { NotFoundView } from './views/NotFoundView';

import {
  initialPatientProfile,
  initialVitals,
  doctorsList,
  initialAppointments,
  initialPrescriptions,
  initialHealthRecords,
  initialNotifications
} from './data/mockData';
import type { PatientProfile, Appointment, Prescription, HealthRecord, NotificationItem } from './types';
import { CheckCircle2, Info, X } from 'lucide-react';

export const App: React.FC = () => {
  // Persistent or state-driven Profile
  const [profile, setProfile] = useState<PatientProfile>(() => {
    const saved = localStorage.getItem('medicata_patient_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return initialPatientProfile;
  });

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    if (['overview', 'triage', 'appointments', 'prescriptions', 'records', 'security', 'settings'].includes(path)) {
      return path as DashboardTab;
    }
    if (path && path !== 'index.html') {
      return '404';
    }
    return 'overview';
  });

  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [records, setRecords] = useState<HealthRecord[]>(initialHealthRecords);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

  // Synchronize browser history / URL path
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '').toLowerCase();
      if (['overview', 'triage', 'appointments', 'prescriptions', 'records', 'security', 'settings'].includes(path)) {
        setActiveTab(path as DashboardTab);
      } else if (!path || path === 'index.html') {
        setActiveTab('overview');
      } else {
        setActiveTab('404');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    const newPath = tab === 'overview' ? '/' : `/${tab}`;
    window.history.pushState({}, '', newPath);
  };

  const showToast = (message: string, type: 'info' | 'success' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 3200);
  };

  const handleCompleteOnboarding = (updatedProfile: PatientProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('medicata_patient_profile', JSON.stringify(updatedProfile));
    showToast(`Welcome to Medicata, ${updatedProfile.name.split(' ')[0]}! Vault established.`, 'success');
  };

  const handleResetOnboarding = () => {
    const reset = { ...profile, isOnboarded: false };
    setProfile(reset);
    localStorage.setItem('medicata_patient_profile', JSON.stringify(reset));
    showToast("Profile reset. Please complete initialization.", "info");
  };

  const handleAddAppointment = (apt: Appointment) => {
    setAppointments(prev => [apt, ...prev]);
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Consultation Confirmed',
        message: `Video consult with ${apt.doctor.name} scheduled for ${apt.date}.`,
        time: 'Just now',
        read: false,
        type: 'appointment'
      },
      ...prev
    ]);
  };

  const handleRefillRequest = (id: string) => {
    setPrescriptions(prev => prev.map(p => {
      if (p.id === id && p.refillsRemaining > 0) {
        return { ...p, refillsRemaining: p.refillsRemaining - 1 };
      }
      return p;
    }));
  };

  const handleUploadRecord = (rec: HealthRecord) => {
    setRecords(prev => [rec, ...prev]);
  };

  const handleClearNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // If user has not finished onboarding, render the step-by-step biometric setup
  if (!profile.isOnboarded) {
    return (
      <OnboardingFlow
        onComplete={handleCompleteOnboarding}
        initialProfile={profile}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        profile={profile}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onResetOnboarding={handleResetOnboarding}
      />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        
        {/* Top Header */}
        <Header
          profile={profile}
          notifications={notifications}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onNavigateTab={handleTabChange}
          onOpenTriage={() => handleTabChange('triage')}
          onClearNotification={handleClearNotification}
          showToast={showToast}
        />

        {/* Dynamic Views */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {activeTab === 'overview' && (
            <OverviewView
              profile={profile}
              vitals={initialVitals}
              appointments={appointments}
              prescriptions={prescriptions}
              records={records}
              onNavigateTab={handleTabChange}
              showToast={showToast}
            />
          )}

          {activeTab === 'triage' && (
            <TriageView
              profile={profile}
              onBookSpecialist={(_spec) => {
                handleTabChange('appointments');
              }}
              showToast={showToast}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              doctors={doctorsList}
              appointments={appointments}
              onAddAppointment={handleAddAppointment}
              showToast={showToast}
            />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionsView
              prescriptions={prescriptions}
              onRefillRequest={handleRefillRequest}
              showToast={showToast}
            />
          )}

          {activeTab === 'records' && (
            <RecordsView
              records={records}
              onUploadRecord={handleUploadRecord}
              showToast={showToast}
            />
          )}

          {activeTab === 'security' && (
            <SecurityView
              profile={profile}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              profile={profile}
              onUpdateProfile={(up) => {
                setProfile(up);
                localStorage.setItem('medicata_patient_profile', JSON.stringify(up));
              }}
              showToast={showToast}
            />
          )}

          {activeTab === '404' && (
            <NotFoundView
              onNavigateHome={() => handleTabChange('overview')}
              onNavigateTriage={() => handleTabChange('triage')}
              onNavigateAppointments={() => handleTabChange('appointments')}
            />
          )}
        </main>

        {/* Subtle Footer */}
        <footer className="py-4 px-8 border-t border-slate-200/80 bg-white/50 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 Medicata Health Inc. Hardware-Isolated Patient Portal.</span>
          <div className="flex items-center gap-4">
            <button onClick={() => handleTabChange('security')} className="hover:text-primary transition-colors cursor-pointer">
              Enclave Specs
            </button>
            <button onClick={() => handleTabChange('404')} className="hover:text-primary transition-colors cursor-pointer">
              404 Preview
            </button>
            <a href="mailto:support@medicata.ai" className="hover:text-primary transition-colors">
              Support
            </a>
          </div>
        </footer>

      </div>

      {/* Global Floating Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-navy text-white text-xs font-semibold shadow-2xl border border-white/10"
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <Info size={16} className="text-primary shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/60 hover:text-white ml-1 cursor-pointer"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default App;
