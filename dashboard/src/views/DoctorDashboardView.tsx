import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle2,
  Stethoscope,
  PlusCircle,
  FilePlus,
  Trash2,
  Info
} from 'lucide-react';
import type { Appointment, Prescription } from '../types';

interface DoctorDashboardViewProps {
  activeSection: 'overview' | 'schedule' | 'prescribe';
  appointments: Appointment[];
  prescriptions: Prescription[];
  onAddPrescription: (rx: Omit<Prescription, 'id' | 'token' | 'qrHash'>) => void;
  onUpdateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  activeSection,
  appointments,
  prescriptions,
  onAddPrescription,
  onUpdateAppointmentStatus,
  showToast
}) => {
  // Availability schedule slots
  const [scheduleSlots, setScheduleSlots] = useState([
    { id: '1', day: 'Monday', time: '09:00 AM - 12:00 PM' },
    { id: '2', day: 'Wednesday', time: '02:00 PM - 05:00 PM' },
    { id: '3', day: 'Thursday', time: '10:00 AM - 01:00 PM' }
  ]);

  const [newDay, setNewDay] = useState('Monday');
  const [newTime, setNewTime] = useState('09:00 AM - 12:00 PM');

  // Prescription form states
  const [patientName, setPatientName] = useState('');
  const [medication, setMedication] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState('');
  const [validUntil, setValidUntil] = useState('2027-02-17');

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4.5 transition-all duration-200 text-left`;

  // Stats calculation
  const totalConsults = appointments.length;
  const pendingCount = appointments.filter(a => a.status === 'Pending').length;
  const activeRxCount = prescriptions.filter(p => p.status === 'Active').length;

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleSlots(prev => [
      ...prev,
      { id: `slot-${Date.now()}`, day: newDay, time: newTime }
    ]);
    showToast("Availability slot added successfully.", "success");
  };

  const handleRemoveSlot = (id: string) => {
    setScheduleSlots(prev => prev.filter(s => s.id !== id));
    showToast("Availability slot removed.", "info");
  };

  const handlePrescribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !medication || !dosage || !instructions) {
      showToast("Please fill all required clinical prescription fields.", "info");
      return;
    }
    onAddPrescription({
      medication,
      genericName: genericName || medication,
      dosage,
      instructions,
      quantity: quantity || '1 Bottle / Box',
      refillsRemaining: 3,
      prescribedBy: 'Dr. Sarah Jenkins, MD',
      dateIssued: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      validUntil: new Date(validUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Active',
      pharmacyRouting: 'Express 30-Min Courier Handover Available'
    });

    // Reset Form
    setPatientName('');
    setMedication('');
    setGenericName('');
    setDosage('');
    setInstructions('');
    setQuantity('');
    showToast("Prescription issued and signed in Hardware Enclave.", "success");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left">
      
      {/* Active Section Header */}
      <div className={card3dClass}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Stethoscope size={14} />
          </div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 leading-tight">
            {activeSection === 'overview' && "Provider Consultation Desk"}
            {activeSection === 'schedule' && "Availability Schedule Management"}
            {activeSection === 'prescribe' && "Clinical Digital Prescription Console"}
          </h2>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
          {activeSection === 'overview' && "Manage clinical consult requests, check telemetry history, and update appointment outcomes."}
          {activeSection === 'schedule' && "Define active consultation hours. Patients will see these slots during real-time booking."}
          {activeSection === 'prescribe' && "Issue secure, ZK-signed digital prescriptions directly routeable to pharmacies."}
        </p>
      </div>

      {activeSection === 'overview' && (
        <div className="space-y-5">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={card3dClass}>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Today's Load</span>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalConsults} Appointments</span>
            </div>
            <div className={card3dClass}>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Pending Approval</span>
              <span className={`text-xl font-bold ${pendingCount > 0 ? 'text-amber-500' : 'text-slate-850 dark:text-slate-100'}`}>
                {pendingCount} Request{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className={card3dClass}>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Active Signatures</span>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{activeRxCount} Prescriptions</span>
            </div>
            <div className={card3dClass}>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Monthly Fees</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-450">₦180,000.00</span>
            </div>
          </div>

          {/* Appointments List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Patient Bookings</h3>
            
            <div className="space-y-2.5">
              {appointments.map((apt) => (
                <div key={apt.id} className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Alex Rivera</span>
                        <span className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          apt.status === 'Confirmed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20'
                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {apt.date}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {apt.time}</span>
                      </div>
                      
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed italic">
                        "{apt.triageSummary}"
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end md:self-center">
                    {apt.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => onUpdateAppointmentStatus(apt.id, 'Cancelled')}
                          className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[10.5px] font-semibold cursor-pointer transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => onUpdateAppointmentStatus(apt.id, 'Confirmed')}
                          className="h-8 px-3 rounded-lg bg-emerald-650 hover:bg-emerald-700 text-white text-[10.5px] font-semibold cursor-pointer transition-colors"
                        >
                          Accept Request
                        </button>
                      </>
                    )}
                    {apt.status === 'Confirmed' && (
                      <button
                        onClick={() => showToast("Telehealth session connecting via secure ZK-WebRTC channel...", "success")}
                        className="h-8 px-3 rounded-lg bg-primary hover:bg-[#1a64bf] text-white text-[10.5px] font-semibold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Video size={12} />
                        Start Consult
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'schedule' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* Active Slots list (7 cols) */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-250 uppercase tracking-wider mb-3">Defined Hours</h3>
              
              <div className="space-y-2">
                {scheduleSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs">
                    <div>
                      <span className="font-bold text-slate-750 dark:text-slate-200 block">{slot.day}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{slot.time}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveSlot(slot.id)}
                      className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-550 flex items-center justify-center transition-colors cursor-pointer border-none"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <Info size={12} className="text-primary mt-0.5" />
              <p>Patients are restricted from booking consultations outside the hours defined above.</p>
            </div>
          </div>

          {/* Define Hours Form (5 cols) */}
          <div className={`${card3dClass} md:col-span-5`}>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-250 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PlusCircle size={13.5} className="text-primary" />
              Add Slots
            </h3>

            <form onSubmit={handleAddSlot} className="space-y-3">
              <div>
                <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Weekday</label>
                <select
                  value={newDay}
                  onChange={e => setNewDay(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>

              <div>
                <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Time Block</label>
                <select
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                >
                  <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM</option>
                  <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM</option>
                  <option value="01:00 PM - 04:00 PM">01:00 PM - 04:00 PM</option>
                  <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-8 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all shadow-sm shadow-primary/10 mt-2 cursor-pointer"
              >
                Add Hours Block
              </button>
            </form>
          </div>
        </div>
      )}

      {activeSection === 'prescribe' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* Prescribing Console Form (8 cols) */}
          <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-250 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FilePlus size={13.5} className="text-primary" />
              New E-Prescription Form
            </h3>

            <form onSubmit={handlePrescribeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Medication Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sumatriptan Succinate"
                    value={medication}
                    onChange={e => setMedication(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Generic / Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sumatriptan 50mg Tablets"
                    value={genericName}
                    onChange={e => setGenericName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50 mg"
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Total Quantity</label>
                  <input
                    type="text"
                    placeholder="e.g. 9 Oral Tablets"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Usage Instructions</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Take 1 tablet orally at the onset of migraine aura..."
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-100 bg-transparent rounded-xl border border-slate-250 dark:border-slate-700 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-9 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all shadow-sm shadow-primary/10 cursor-pointer"
              >
                Sign & Issue Digital Prescription
              </button>
            </form>
          </div>

          {/* Issued Log Brief (4 cols) */}
          <div className="md:col-span-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-650 dark:text-slate-250 uppercase tracking-wider">Recently Issued</h4>
              
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-750 dark:text-slate-205 block leading-tight">{rx.medication}</span>
                    <span className="text-[9px] text-slate-400 block mt-1">Prescribed: {rx.dateIssued}</span>
                    <span className="text-[9px] text-emerald-500 font-bold block mt-1 font-mono">{rx.token.substring(0, 10)}...</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-start gap-1.5 text-[8.5px] text-slate-400 dark:text-slate-500 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <CheckCircle2 size={11} className="text-emerald-500 mt-0.5 shrink-0" />
              <p>Prescriptions issued are zero-knowledge cryptographically signed and stored on the decentralized vault ledger.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
