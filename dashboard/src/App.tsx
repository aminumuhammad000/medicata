import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar, type DashboardTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OnboardingFlow } from './components/OnboardingFlow';
import { MedicalWallpaper } from './components/MedicalWallpaper';
import { OverviewView } from './views/OverviewView';
import { TriageView } from './views/TriageView';
import { AppointmentsView } from './views/AppointmentsView';
import { PrescriptionsView } from './views/PrescriptionsView';
import { RecordsView } from './views/RecordsView';
import { SecurityView } from './views/SecurityView';
import { SettingsView } from './views/SettingsView';
import { WalletView } from './views/WalletView';
import { DoctorDashboardView } from './views/DoctorDashboardView';
import { PharmacyDashboardView } from './views/PharmacyDashboardView';
import {
  PharmaciesView,
  RemindersView,
  ChatsView,
  DoctorLabsView,
  DoctorHistoryView,
  PharmacyDispenseView,
  PharmacySettlementView
} from './views/ExtraViews';
import { NotFoundView } from './views/NotFoundView';

import {
  initialPatientProfile,
  initialVitals,
  doctorsList,
  initialAppointments,
  initialPrescriptions,
  initialHealthRecords,
  initialNotifications,
  initialWalletBalance,
  initialWalletTransactions,
  initialPharmacyOrders,
  initialPharmacyStock
} from './data/mockData';
import type { PatientProfile, Appointment, Prescription, HealthRecord, NotificationItem, WalletTransaction, PharmacyOrder, DrugStockItem } from './types';
import { CheckCircle2, Info, X } from 'lucide-react';
import { api } from './services/api';

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
    if (['overview', 'triage', 'appointments', 'prescriptions', 'records', 'security', 'wallet', 'settings', 'schedule', 'prescribe', 'inventory', 'pharmacies', 'reminders', 'chats', 'labs', 'history', 'dispense', 'settlement'].includes(path)) {
      return path as DashboardTab;
    }
    if (path && path !== 'index.html') {
      return '404';
    }
    return 'overview';
  });

  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [records, setRecords] = useState<HealthRecord[]>(initialHealthRecords);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' } | null>(null);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [walletBalance, setWalletBalance] = useState<number>(initialWalletBalance);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(initialWalletTransactions);
  const [pharmacyOrders, setPharmacyOrders] = useState<PharmacyOrder[]>(initialPharmacyOrders);
  const [pharmacyStock, setPharmacyStock] = useState<DrugStockItem[]>(initialPharmacyStock);

  // Load data from server
  useEffect(() => {
    if (!profile.isOnboarded) return;

    const loadData = async () => {
      // First verify profile/token
      const meRes = await api.getMe();
      if (meRes.error) {
        api.logout();
        setProfile(prev => ({ ...prev, isOnboarded: false }));
        return;
      }

      if (meRes.data) {
        const user = meRes.data;
        setProfile(prev => ({
          ...prev,
          id: user.id,
          role: user.role.toLowerCase(),
          email: user.email,
          name: user.full_name,
          phone: user.phone_number || '',
          whatsapp: user.whatsapp_number || '',
          isOnboarded: true
        }));
      }

      // Load general/role-specific data
      if (profile.role === 'patient') {
        const [aptRes, rxRes, notifRes, walletBalRes, walletTxRes] = await Promise.all([
          api.getMyConsultations(),
          api.getMyPrescriptions(),
          api.getMyNotifications(),
          api.getWalletBalance(),
          api.getWalletTransactions()
        ]);

        if (aptRes.data) {
          setAppointments(aptRes.data.map((c: any) => ({
            id: c.id,
            doctor: c.doctor || { name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', rating: 5.0, experience: 12, image: '' },
            date: new Date(c.scheduled_at).toLocaleDateString(),
            time: new Date(c.scheduled_at).toLocaleTimeString(),
            type: c.mode === 'video' ? 'Video Consult' : 'AI Follow-up',
            status: c.status,
            roomUrl: c.room_url || '',
            triageSummary: c.reason
          })));
        }
        if (rxRes.data) {
          setPrescriptions(rxRes.data.map((p: any) => ({
            id: p.id,
            token: p.prescription_token || `RX-${p.id.slice(0,4)}`,
            medication: p.medication,
            genericName: p.generic_name || p.medication,
            dosage: p.dosage,
            instructions: p.instructions || '',
            quantity: p.quantity || '1 unit',
            refillsRemaining: p.refills_remaining || 0,
            prescribedBy: p.doctor_name || 'Dr. Sarah Jenkins',
            dateIssued: new Date(p.created_at).toLocaleDateString(),
            validUntil: p.valid_until ? new Date(p.valid_until).toLocaleDateString() : '',
            status: p.refills_remaining > 0 ? 'Active' : 'Expired',
            qrHash: p.qr_hash || '0x_verified',
            pharmacyRouting: p.pharmacy_routing || 'None'
          })));
        }
        if (notifRes.data) {
          setNotifications(notifRes.data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleTimeString(),
            read: n.read,
            type: n.notification_type || 'system'
          })));
        }
        if (walletBalRes.data) {
          setWalletBalance(walletBalRes.data.balance || 0);
        }
        if (walletTxRes.data) {
          setWalletTransactions(walletTxRes.data);
        }
      } else if (profile.role === 'doctor') {
        const [aptRes, rxRes, notifRes] = await Promise.all([
          api.getMyConsultations(),
          api.getMyPrescriptions(),
          api.getMyNotifications()
        ]);

        if (aptRes.data) {
          setAppointments(aptRes.data.map((c: any) => ({
            id: c.id,
            doctor: c.doctor || { name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', rating: 5.0, experience: 12, image: '' },
            date: new Date(c.scheduled_at).toLocaleDateString(),
            time: new Date(c.scheduled_at).toLocaleTimeString(),
            type: c.mode === 'video' ? 'Video Consult' : 'AI Follow-up',
            status: c.status,
            roomUrl: c.room_url || '',
            triageSummary: c.reason
          })));
        }
        if (rxRes.data) {
          setPrescriptions(rxRes.data.map((p: any) => ({
            id: p.id,
            token: p.prescription_token || `RX-${p.id.slice(0,4)}`,
            medication: p.medication,
            genericName: p.generic_name || p.medication,
            dosage: p.dosage,
            instructions: p.instructions || '',
            quantity: p.quantity || '1 unit',
            refillsRemaining: p.refills_remaining || 0,
            prescribedBy: p.doctor_name || 'Dr. Sarah Jenkins',
            dateIssued: new Date(p.created_at).toLocaleDateString(),
            validUntil: p.valid_until ? new Date(p.valid_until).toLocaleDateString() : '',
            status: p.refills_remaining > 0 ? 'Active' : 'Expired',
            qrHash: p.qr_hash || '0x_verified',
            pharmacyRouting: p.pharmacy_routing || 'None'
          })));
        }
        if (notifRes.data) {
          setNotifications(notifRes.data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleTimeString(),
            read: n.read,
            type: n.notification_type || 'system'
          })));
        }
      } else if (profile.role === 'pharmacy') {
        const [ordersRes, stockRes, notifRes] = await Promise.all([
          api.getMyOrders(),
          api.getPharmacyStock(),
          api.getMyNotifications()
        ]);

        if (ordersRes.data) {
          setPharmacyOrders(ordersRes.data.map((o: any) => ({
            id: o.id,
            patient_name: o.patient_name || 'Patient',
            status: o.status,
            total_amount: o.total_amount || 0,
            created_at: o.created_at,
            items: o.items || []
          })));
        }
        if (stockRes.data) {
          setPharmacyStock(stockRes.data.map((s: any) => ({
            id: s.id,
            drug_name: s.drug_name || 'Drug',
            drug_category: s.drug_category || 'General',
            drug_brand: s.drug_brand || 'Generic',
            price: s.price || 0,
            quantity: s.quantity || 0,
            expiry_date: s.expiry_date || '',
            is_available: s.is_available !== false
          })));
        }
        if (notifRes.data) {
          setNotifications(notifRes.data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleTimeString(),
            read: n.read,
            type: n.notification_type || 'system'
          })));
        }
      }
    };

    loadData();
  }, [profile.isOnboarded]);

  const handleAddFunds = async (amountKobo: number) => {
    const res = await api.addMoneyToWallet(amountKobo, 'virtual_account');
    if (res.error) {
      showToast(res.error, 'info');
      return;
    }
    setWalletBalance(prev => prev + amountKobo);
    const txRes = await api.getWalletTransactions();
    if (txRes.data) {
      setWalletTransactions(txRes.data);
    }
  };

  const handleWithdrawFunds = (amountKobo: number): boolean => {
    if (walletBalance < amountKobo) return false;
    
    api.withdrawMoney(amountKobo, 'Sterling Bank').then(res => {
      if (res.error) {
        showToast(res.error, 'info');
      } else {
        api.getWalletTransactions().then(txRes => {
          if (txRes.data) {
            setWalletTransactions(txRes.data);
          }
        });
      }
    });

    setWalletBalance(prev => prev - amountKobo);
    return true;
  };

  const handleAddPrescription = async (rx: Omit<Prescription, 'id' | 'token' | 'qrHash'>) => {
    const res = await api.createPrescription({
      medication: rx.medication,
      dosage: rx.dosage,
      instructions: rx.instructions,
      refills_remaining: rx.refillsRemaining
    });

    if (res.error) {
      showToast(res.error, 'info');
      return;
    }

    const rxRes = await api.getMyPrescriptions();
    if (rxRes.data) {
      setPrescriptions(rxRes.data.map((p: any) => ({
        id: p.id,
        token: p.prescription_token || `RX-${p.id.slice(0,4)}`,
        medication: p.medication,
        genericName: p.generic_name || p.medication,
        dosage: p.dosage,
        instructions: p.instructions || '',
        quantity: p.quantity || '1 unit',
        refillsRemaining: p.refills_remaining || 0,
        prescribedBy: p.doctor_name || 'Dr. Sarah Jenkins',
        dateIssued: new Date(p.created_at).toLocaleDateString(),
        validUntil: p.valid_until ? new Date(p.valid_until).toLocaleDateString() : '',
        status: p.refills_remaining > 0 ? 'Active' : 'Expired',
        qrHash: p.qr_hash || '0x_verified',
        pharmacyRouting: p.pharmacy_routing || 'None'
      })));
    }
  };

  const handleUpdateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    const res = await api.updateConsultationStatus(id, status);
    if (res.error) {
      showToast(res.error, 'info');
      return;
    }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleUpdateOrderStatus = async (id: string, status: PharmacyOrder['status']) => {
    const res = await api.updateOrderStatus(id, status);
    if (res.error) {
      showToast(res.error, 'info');
      return;
    }
    setPharmacyOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleRegisterDrug = async (drug: Omit<DrugStockItem, 'id'>) => {
    const drugRes = await api.createDrug({
      name: drug.drug_name,
      category: drug.drug_category
    });

    if (drugRes.error) {
      showToast(drugRes.error, 'info');
      return;
    }

    const drugId = drugRes.data?.id;
    if (drugId) {
      await api.updatePharmacyStock({
        drug_id: drugId,
        price: drug.price,
        quantity: drug.quantity,
        is_available: drug.is_available,
        expiry_date: drug.expiry_date
      });

      const stockRes = await api.getPharmacyStock();
      if (stockRes.data) {
        setPharmacyStock(stockRes.data.map((s: any) => ({
          id: s.id,
          drug_name: s.drug_name || 'Drug',
          drug_category: s.drug_category || 'General',
          drug_brand: s.drug_brand || 'Generic',
          price: s.price || 0,
          quantity: s.quantity || 0,
          expiry_date: s.expiry_date || '',
          is_available: s.is_available !== false
        })));
      }
    }
  };

  const handlePlaceOrder = async (_order: Omit<PharmacyOrder, 'id' | 'created_at'>) => {
    const res = await api.createOrder({
      prescription_id: undefined,
      delivery_address: 'Home Address',
      contact_info: profile.phone,
      is_delivery: true
    });

    if (res.error) {
      showToast(res.error, 'info');
      return;
    }

    const ordersRes = await api.getMyOrders();
    if (ordersRes.data) {
      setPharmacyOrders(ordersRes.data.map((o: any) => ({
        id: o.id,
        patient_name: o.patient_name || 'Patient',
        status: o.status,
        total_amount: o.total_amount || 0,
        created_at: o.created_at,
        items: o.items || []
      })));
    }
  };

  const handleDispensePrescription = async (id: string) => {
    const res = await api.dispensePrescription(id);
    if (res.error) {
      showToast(res.error, 'info');
      return;
    }
    
    const rxRes = await api.getMyPrescriptions();
    if (rxRes.data) {
      setPrescriptions(rxRes.data.map((p: any) => ({
        id: p.id,
        token: p.prescription_token || `RX-${p.id.slice(0,4)}`,
        medication: p.medication,
        genericName: p.generic_name || p.medication,
        dosage: p.dosage,
        instructions: p.instructions || '',
        quantity: p.quantity || '1 unit',
        refillsRemaining: p.refills_remaining || 0,
        prescribedBy: p.doctor_name || 'Dr. Sarah Jenkins',
        dateIssued: new Date(p.created_at).toLocaleDateString(),
        validUntil: p.valid_until ? new Date(p.valid_until).toLocaleDateString() : '',
        status: p.refills_remaining > 0 ? 'Active' : 'Expired',
        qrHash: p.qr_hash || '0x_verified',
        pharmacyRouting: p.pharmacy_routing || 'None'
      })));
    }
  };

  const handleToggleDark = () => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // Synchronize browser history / URL path
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '').toLowerCase();
      if (['overview', 'triage', 'appointments', 'prescriptions', 'records', 'security', 'wallet', 'settings', 'schedule', 'prescribe', 'inventory', 'pharmacies', 'reminders', 'chats', 'labs', 'history', 'dispense', 'settlement'].includes(path)) {
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
    <div className="min-h-screen bg-[#EBEFF5] dark:bg-[#070C16] text-slate-800 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      <MedicalWallpaper isDark={isDark} />
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        profile={profile}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        isDark={isDark}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className={`${isSidebarCollapsed ? 'lg:pl-[88px]' : 'lg:pl-[232px]'} flex flex-col flex-1 min-h-screen transition-all duration-300`}>
        
        {/* Top Header */}
        <Header
          profile={profile}
          notifications={notifications}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onNavigateTab={handleTabChange}
          onOpenTriage={() => handleTabChange('triage')}
          onClearNotification={handleClearNotification}
          showToast={showToast}
          onResetOnboarding={handleResetOnboarding}
          isDark={isDark}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onToggleDark={handleToggleDark}
        />

        {/* Dynamic Views */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {profile.role === 'doctor' ? (
            <>
              {(activeTab === 'overview' || activeTab === 'schedule' || activeTab === 'prescribe') && (
                <DoctorDashboardView
                  activeSection={activeTab === 'schedule' ? 'schedule' : activeTab === 'prescribe' ? 'prescribe' : 'overview'}
                  appointments={appointments}
                  prescriptions={prescriptions}
                  onAddPrescription={handleAddPrescription}
                  onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  showToast={showToast}
                />
              )}

              {activeTab === 'labs' && (
                <DoctorLabsView showToast={showToast} />
              )}

              {activeTab === 'history' && (
                <DoctorHistoryView />
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

              {!['overview', 'schedule', 'prescribe', 'labs', 'history', 'settings'].includes(activeTab) && (
                <NotFoundView
                  onNavigateHome={() => handleTabChange('overview')}
                  onNavigateTriage={() => handleTabChange('overview')}
                  onNavigateAppointments={() => handleTabChange('overview')}
                />
              )}
            </>
          ) : profile.role === 'pharmacy' ? (
            <>
              {(activeTab === 'overview' || activeTab === 'inventory') && (
                <PharmacyDashboardView
                  activeSection={activeTab === 'inventory' ? 'inventory' : 'overview'}
                  orders={pharmacyOrders}
                  stock={pharmacyStock}
                  onAddDrug={handleRegisterDrug}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  showToast={showToast}
                />
              )}

              {activeTab === 'dispense' && (
                <PharmacyDispenseView
                  prescriptions={prescriptions}
                  onDispense={handleDispensePrescription}
                  showToast={showToast}
                />
              )}

              {activeTab === 'settlement' && (
                <PharmacySettlementView showToast={showToast} />
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

              {!['overview', 'inventory', 'dispense', 'settlement', 'settings'].includes(activeTab) && (
                <NotFoundView
                  onNavigateHome={() => handleTabChange('overview')}
                  onNavigateTriage={() => handleTabChange('overview')}
                  onNavigateAppointments={() => handleTabChange('overview')}
                />
              )}
            </>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewView
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

              {activeTab === 'wallet' && (
                <WalletView
                  balance={walletBalance}
                  transactions={walletTransactions}
                  onAddFunds={handleAddFunds}
                  onWithdrawFunds={handleWithdrawFunds}
                  showToast={showToast}
                />
              )}

              {activeTab === 'pharmacies' && (
                <PharmaciesView
                  prescriptions={prescriptions}
                  onPlaceOrder={handlePlaceOrder}
                  showToast={showToast}
                />
              )}

              {activeTab === 'reminders' && (
                <RemindersView showToast={showToast} />
              )}

              {activeTab === 'chats' && (
                <ChatsView />
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
            </>
          )}
        </main>

        {/* Subtle Footer */}
        <footer className="py-2.5 px-8 bg-transparent text-[10px] text-slate-400/40 flex flex-col sm:flex-row items-center justify-between gap-1.5 hover:text-slate-400/70 transition-colors duration-500">
          <span className="tracking-wide">Medicata Health © 2026 &nbsp;•&nbsp; Zero-Knowledge Encrypted Clinical Telemetry</span>
          <div className="flex items-center gap-3.5">
            <button onClick={() => handleTabChange('security')} className="hover:text-primary/80 transition-colors cursor-pointer">
              Enclave Specs
            </button>
            <span className="opacity-30">·</span>
            <a href="mailto:support@medicata.ai" className="hover:text-primary/80 transition-colors">
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
