import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Clock,
  ShoppingBag,
  BellRing,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  User,
  FlaskConical,
  FilePlus,
  ClipboardList,
  Activity,
  QrCode,
  ShieldAlert,
  Coins,
  ArrowUpRight
} from 'lucide-react';
import type { Prescription, PharmacyOrder } from '../types';

// ==========================================
// 1. PHARMACIES VIEW (Patient portal)
// ==========================================
interface PharmaciesViewProps {
  prescriptions: Prescription[];
  onPlaceOrder: (order: Omit<PharmacyOrder, 'id' | 'created_at'>) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const PharmaciesView: React.FC<PharmaciesViewProps> = ({
  prescriptions,
  onPlaceOrder,
  showToast
}) => {
  const pharmacies = [
    { id: 'p1', name: 'Apex Medicare Hub', address: '22 Broad Street, Lagos Island', hours: '08:00 AM - 10:00 PM', rating: '4.8★' },
    { id: 'p2', name: 'MedPlus Pharmacy', address: 'Block 12, Admiralty Way, Lekki Phase 1', hours: '24 Hours Open', rating: '4.9★' },
    { id: 'p3', name: 'HealthPlus Pharmacy', address: '45 Toyin Street, Ikeja', hours: '09:00 AM - 09:00 PM', rating: '4.6★' }
  ];

  const [selectedPharmacy, setSelectedPharmacy] = useState(pharmacies[0]);
  const [selectedRxId, setSelectedRxId] = useState(prescriptions[0]?.id || '');

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rx = prescriptions.find(p => p.id === selectedRxId);
    if (!rx) {
      showToast("Please select a valid e-prescription.", "info");
      return;
    }
    onPlaceOrder({
      patient_name: 'Alex Rivera',
      status: 'pending',
      total_amount: 500000, // ₦5,000.00 default simulation
      items: [
        { name: rx.medication, quantity: 1, price: 500000 }
      ]
    });
    showToast(`Prescription order submitted to ${selectedPharmacy.name}!`, "success");
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4.5 text-left`;

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      <div className={card3dClass}>
        <div className="flex items-center gap-2">
          <Store className="text-primary w-5 h-5" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">Decentralized Pharmacy Network</h2>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Route ZK-signed clinical prescriptions to audited pharmacy dispensaries for instant home courier delivery or retail locker pickup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Pharmacy Listings (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          {pharmacies.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedPharmacy(p)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                selectedPharmacy.id === p.id
                  ? 'bg-primary/5 border-primary shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 hover:border-primary/45'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 px-1.5 py-0.5 rounded font-bold">{p.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-450 mt-1.5">
                <MapPin size={11} />
                <span>{p.address}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-450 mt-1">
                <Clock size={11} />
                <span>Hours: {p.hours}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Place Order (5 cols) */}
        <div className={`${card3dClass} md:col-span-5`}>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ShoppingBag size={13.5} className="text-primary" />
            Route Prescription
          </h3>

          <form onSubmit={handleOrderSubmit} className="space-y-4">
            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Target Node</label>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">{selectedPharmacy.name}</span>
            </div>

            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Select Prescription</label>
              {prescriptions.length > 0 ? (
                <select
                  value={selectedRxId}
                  onChange={e => setSelectedRxId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                >
                  {prescriptions.map(p => (
                    <option key={p.id} value={p.id}>{p.medication} ({p.quantity})</option>
                  ))}
                </select>
              ) : (
                <span className="block text-[10px] text-rose-500 font-semibold">No active prescriptions available to route.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={prescriptions.length === 0}
              className="w-full h-9 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Dispensation Routing
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. REMINDERS VIEW (Patient portal)
// ==========================================
export const RemindersView: React.FC<{ showToast: (msg: string, type?: 'info' | 'success') => void }> = ({ showToast }) => {
  const [reminders, setReminders] = useState([
    { id: '1', med: 'Sumatriptan Succinate 50mg', time: '08:00 AM', taken: false },
    { id: '2', med: 'Vitamin D2 50,000 IU', time: '12:30 PM', taken: true }
  ]);
  const [newMed, setNewMed] = useState('');
  const [newTime, setNewTime] = useState('08:00 AM');

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed) return;
    setReminders(prev => [...prev, { id: Date.now().toString(), med: newMed, time: newTime, taken: false }]);
    setNewMed('');
    showToast("Medication alert configured.", "success");
  };

  const handleToggleTaken = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, taken: !r.taken } : r));
    showToast("Daily dose marked taken.", "success");
  };

  const handleRemove = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    showToast("Alert removed.", "info");
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4.5 text-left`;

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      <div className={card3dClass}>
        <div className="flex items-center gap-2">
          <BellRing className="text-primary w-5 h-5 animate-bounce" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">Medication Reminders</h2>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Synchronize local reminders with Apple Health or Google Fit telemetry nodes to stay alert on therapy timelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">Today's Regimen</h3>
          <div className="space-y-2">
            {reminders.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-xs">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={r.taken}
                    onChange={() => handleToggleTaken(r.id)}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <div>
                    <span className={`font-bold ${r.taken ? 'line-through text-slate-400' : 'text-slate-750 dark:text-slate-200'}`}>{r.med}</span>
                    <span className="block text-[9px] text-slate-400 font-semibold">{r.time}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(r.id)}
                  className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-550 flex items-center justify-center cursor-pointer border-none"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={`${card3dClass} md:col-span-5`}>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Plus size={14} />
            Configure Alarm
          </h3>
          <form onSubmit={handleAddReminder} className="space-y-3">
            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Drug Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sumatriptan 50mg"
                value={newMed}
                onChange={e => setNewMed(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Alert Time</label>
              <select
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
              >
                <option value="08:00 AM">08:00 AM (Morning)</option>
                <option value="12:30 PM">12:30 PM (Noon)</option>
                <option value="06:00 PM">06:00 PM (Evening)</option>
                <option value="10:00 PM">10:00 PM (Bedtime)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full h-8 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all shadow-sm shadow-primary/10 mt-2 cursor-pointer"
            >
              Add Regimen Alert
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. DOCTOR CHATS VIEW (Patient / Doctor portal)
// ==========================================
export const ChatsView: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'doctor', text: 'Good morning, Alex. How are the tension headache symptoms today?', time: '09:00 AM' },
    { id: '2', sender: 'patient', text: 'Hi Dr. Sarah, much better after the Sumatriptan. Mild aura still exists.', time: '09:12 AM' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'patient', text: inputMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setInputMsg('');
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-0 flex flex-col h-[480px] overflow-hidden`;

  return (
    <div className="max-w-4xl mx-auto space-y-4 text-left">
      <div className={card3dClass}>
        {/* Chats Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <User size={15} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Dr. Sarah Chen, MD</span>
              <span className="text-[9px] text-emerald-500 font-semibold block">Secure Telehealth Channel</span>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-left">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-3 rounded-2xl text-[11px] leading-relaxed ${
                m.sender === 'patient'
                  ? 'bg-primary text-white rounded-tr-xs shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-slate-250 border border-slate-200/50 dark:border-slate-850 rounded-tl-xs'
              }`}>
                <p>{m.text}</p>
                <span className="block text-[8px] opacity-60 text-right mt-1">{m.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs text-slate-700 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-primary hover:bg-[#1a64bf] text-white flex items-center justify-center cursor-pointer border-none"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. DOCTOR LABS VIEW (Doctor portal)
// ==========================================
export const DoctorLabsView: React.FC<{ showToast: (msg: string, type?: 'info' | 'success') => void }> = ({ showToast }) => {
  const [panels, setPanels] = useState([
    { id: '1', patient: 'Alex Rivera', test: 'Lipid & Glucose Profile', date: '2026-08-17', status: 'Pending' },
    { id: '2', patient: 'Alex Rivera', test: 'Full Hematology Panel', date: '2026-08-15', status: 'Approved' }
  ]);
  const [patient, setPatient] = useState('Alex Rivera');
  const [panelName, setPanelName] = useState('Lipid Profile');

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelName) return;
    setPanels(prev => [
      { id: Date.now().toString(), patient, test: panelName, date: new Date().toISOString().split('T')[0], status: 'Pending' },
      ...prev
    ]);
    showToast("Lab test requisition submitted.", "success");
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4.5 text-left`;

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      <div className={card3dClass}>
        <div className="flex items-center gap-2">
          <FlaskConical className="text-primary w-5 h-5" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">Lab Diagnostic Requisition</h2>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Issue audited lab testing panel requests. Results route directly back to patient hardware enclave vaults once verified.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">Requested Diagnostics</h3>
          <div className="space-y-2">
            {panels.map(p => (
              <div key={p.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-750 dark:text-slate-200 block">{p.test}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Patient: {p.patient} &bull; Date: {p.date}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                  p.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${card3dClass} md:col-span-5`}>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FilePlus size={14} />
            New Requisition
          </h3>
          <form onSubmit={handleRequestSubmit} className="space-y-3">
            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Target Patient</label>
              <input
                type="text"
                required
                value={patient}
                onChange={e => setPatient(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Diagnostic Panel</label>
              <select
                value={panelName}
                onChange={e => setPanelName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
              >
                <option value="Lipid Profile">Lipid Profile</option>
                <option value="Glucose Fasting Level">Glucose Fasting Level</option>
                <option value="Genotyping (DNA Sequencer)">Genotyping (DNA Sequencer)</option>
                <option value="Full Hematology Complete">Full Hematology Complete</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full h-8 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all shadow-sm shadow-primary/10 mt-2 cursor-pointer"
            >
              Authorize Lab Order
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. DOCTOR HISTORY VIEW (Doctor portal)
// ==========================================
export const DoctorHistoryView: React.FC = () => {
  const chartList = [
    { date: 'Aug 10, 2026', diagnosis: 'Tension Cephalalgia', notes: 'Patient reports mild relief after cold press. Prescribed Sumatriptan.', telemetry: 'HR: 72 BPM / BP: 118/76' },
    { date: 'Jun 15, 2026', diagnosis: 'Incipient Insomnia', notes: 'Suggested sleep diary hygiene and Garmin wearable telemetry rotation.', telemetry: 'HR: 68 BPM / BP: 120/80' }
  ];

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4.5 text-left`;

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      <div className={card3dClass}>
        <div className="flex items-center gap-2">
          <ClipboardList className="text-primary w-5 h-5" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">Patient Charts Database</h2>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Review encrypted medical chart history. Telemetry files are loaded locally from the hardware enclave upon authorization handshake.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Active Chart: Alex Rivera</h3>
        
        <div className="space-y-3">
          {chartList.map((c, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{c.diagnosis}</span>
                <span className="text-[10px] text-slate-400 font-semibold">{c.date}</span>
              </div>
              
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-medium">"{c.notes}"</p>
              
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                <Activity size={12} className="text-primary" />
                <span>Telemetry Ingestion: {c.telemetry}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. PHARMACY DISPENSE VIEW (Pharmacy portal)
// ==========================================
interface PharmacyDispenseViewProps {
  prescriptions: Prescription[];
  onDispense: (id: string) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const PharmacyDispenseView: React.FC<PharmacyDispenseViewProps> = ({
  prescriptions,
  onDispense,
  showToast
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [matchedRx, setMatchedRx] = useState<Prescription | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const rx = prescriptions.find(p => p.token.toLowerCase() === tokenInput.trim().toLowerCase());
    if (rx) {
      setMatchedRx(rx);
      showToast("E-Prescription matched successfully.", "success");
    } else {
      setMatchedRx(null);
      showToast("Prescription token not found or invalid.", "info");
    }
  };

  const handleDispenseAction = () => {
    if (!matchedRx) return;
    onDispense(matchedRx.id);
    showToast(`Prescription ${matchedRx.medication} marked as Dispensed / Fulfilled.`, "success");
    setMatchedRx(null);
    setTokenInput('');
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4.5 text-left`;

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      <div className={card3dClass}>
        <div className="flex items-center gap-2">
          <QrCode className="text-primary w-5 h-5" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">Verification & Dispensation Desk</h2>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Search zero-knowledge e-prescription tokens (e.g. RX-8842-ZK-MEDICATA) to check cryptographic verification signatures and dispense.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Token Search (5 cols) */}
        <div className={`${card3dClass} md:col-span-5`}>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">Scan Token Code</h3>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Prescription Token</label>
              <input
                type="text"
                required
                placeholder="e.g. RX-8842-ZK-MEDICATA"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-750 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full h-8.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all shadow-sm shadow-primary/10 cursor-pointer"
            >
              Verify Cryptographic Signature
            </button>
          </form>
        </div>

        {/* Verification Summary / Match Card (7 cols) */}
        <div className="md:col-span-7">
          {matchedRx ? (
            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/80 dark:border-emerald-600/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                <CheckCircle2 className="text-emerald-500 w-5.5 h-5.5" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-150 block">ZK-Signature Verified</span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{matchedRx.qrHash}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[9.5px] text-slate-400 block font-semibold">Medication</span>
                  <span className="font-bold text-slate-700 dark:text-slate-205">{matchedRx.medication}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block font-semibold">Instructions</span>
                  <span className="font-medium text-slate-700 dark:text-slate-205">{matchedRx.instructions}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block font-semibold">Refills Left</span>
                  <span className="font-bold text-slate-700 dark:text-slate-205">{matchedRx.refillsRemaining}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block font-semibold">Validity Expire</span>
                  <span className="font-bold text-rose-500">{matchedRx.validUntil}</span>
                </div>
              </div>

              <button
                onClick={handleDispenseAction}
                disabled={matchedRx.refillsRemaining === 0}
                className="w-full h-9 rounded-xl bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                {matchedRx.refillsRemaining > 0 ? "Dispense Medication Unit" : "Refills Exhausted"}
              </button>
            </div>
          ) : (
            <div className="bg-white/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-2">
              <ShieldAlert className="text-slate-350 dark:text-slate-650 w-8 h-8" />
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Awaiting Signature Scan Verification</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. PHARMACY SETTLEMENT VIEW (Pharmacy portal)
// ==========================================
export const PharmacySettlementView: React.FC<{ showToast: (msg: string, type?: 'info' | 'success') => void }> = ({ showToast }) => {
  const [balance, setBalance] = useState(8450000); // in kobo = ₦84,500.00
  const history = [
    { date: 'Aug 16, 2026', ref: 'SET-99021', amount: 3200000, status: 'Settled' },
    { date: 'Aug 10, 2026', ref: 'SET-88102', amount: 5250000, status: 'Settled' }
  ];

  const formatCurrency = (amountKobo: number) => {
    return `₦${(amountKobo / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleWithdraw = () => {
    if (balance <= 0) return;
    setBalance(0);
    showToast("Escrow settlement transfer initiated to registered hospital bank account.", "success");
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4.5 text-left`;

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      <div className={card3dClass}>
        <div className="flex items-center gap-2">
          <Coins className="text-primary w-5 h-5" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">Revenue Settlement</h2>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Review sales records, monitor incoming payments, and withdraw escrow settlement earnings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        <div className="md:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 pb-2 border-b border-slate-100 dark:border-slate-850">Unsettled Balance</span>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{formatCurrency(balance)}</span>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={balance <= 0}
            className="w-full h-9 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all cursor-pointer mt-6 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <ArrowUpRight size={14} />
            Withdraw Settlement
          </button>
        </div>

        <div className={`${card3dClass} md:col-span-6 flex flex-col justify-between`}>
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">Settlement History</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-205 block">{h.ref}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{h.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-750 dark:text-slate-100 block">{formatCurrency(h.amount)}</span>
                    <span className="text-[9.5px] text-emerald-500 font-bold block">{h.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
