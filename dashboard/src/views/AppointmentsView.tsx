import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Video,
  Clock,
  Star,
  ShieldCheck,
  BadgeCheck,
  X,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Bot
} from 'lucide-react';
import type { Doctor, Appointment } from '../types';

interface AppointmentsViewProps {
  doctors: Doctor[];
  appointments: Appointment[];
  onAddAppointment: (appointment: Appointment) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  doctors,
  appointments,
  onAddAppointment,
  showToast
}) => {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeVideoCall, setActiveVideoCall] = useState<Appointment | null>(null);
  const [bookingDate, setBookingDate] = useState('Tomorrow, Aug 15');
  const [bookingTime, setBookingTime] = useState('10:00 AM - 10:30 AM EST');
  const [bookingReason, setBookingReason] = useState('Follow-up on symptom triage evaluation.');

  // Video call controls state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const handleConfirmBooking = () => {
    if (!selectedDoctor) return;

    const newApt: Appointment = {
      id: `apt-${Date.now().toString().slice(-4)}`,
      doctor: selectedDoctor,
      date: bookingDate,
      time: bookingTime,
      type: 'Video Consult',
      status: 'Confirmed',
      roomUrl: `https://telehealth.medicata.ai/room/enc-${Date.now().toString().slice(-4)}`,
      triageSummary: bookingReason
    };

    onAddAppointment(newApt);
    setSelectedDoctor(null);
    showToast(`Appointment confirmed with ${selectedDoctor.name}!`, "success");
  };

  const card3dClass = `bg-white/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] rounded-2xl p-4 transition-all duration-200 text-left`;

  return (
    <div className="max-w-6xl mx-auto space-y-5 text-left">
      
      {/* Header Card */}
      <div className={`${card3dClass} flex flex-col md:flex-row md:items-center justify-between gap-3 p-4`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Video size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 leading-tight">Specialist Teleconsultations</h2>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-primary/5 dark:bg-primary/10 text-primary dark:text-sky-400 border border-primary/10 dark:border-primary/20">
                Top 1% Physicians
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
              Direct encrypted HD video consults with verified attending physicians from leading academic institutions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-850 text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <div className="w-4.5 h-4.5 rounded bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
              <ShieldCheck size={11} />
            </div>
            <span>End-to-End WebRTC</span>
          </div>
        </div>
      </div>

      {/* Confirmed Appointments Section */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-5.5 h-5.5 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Calendar size={11} />
          </div>
          <h3 className="text-xs font-semibold text-slate-650 dark:text-slate-200">
            Scheduled Consultations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((apt) => (
            <div key={apt.id} className={card3dClass}>
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={apt.doctor.avatar}
                      alt={apt.doctor.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-850"
                    />
                    <div className="text-xs">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-100">{apt.doctor.name}</h4>
                      <p className="text-[10px] text-primary dark:text-sky-400 font-semibold">{apt.doctor.specialty}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{apt.doctor.hospital}</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
                    {apt.status}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-800/40 text-[10px] space-y-1 mb-3">
                  <div className="flex items-center gap-1.5 text-slate-550 dark:text-slate-400 font-medium">
                    <div className="w-5 h-5 rounded bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <Clock size={10} />
                    </div>
                    <span>{apt.date} &bull; {apt.time}</span>
                  </div>
                  {apt.triageSummary && (
                    <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-normal">
                      Focus: {apt.triageSummary}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500">{apt.id}</span>
                <button
                  onClick={() => {
                    setActiveVideoCall(apt);
                    showToast(`Entering consultation room with ${apt.doctor.name}...`, "success");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-[10px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-primary/20"
                >
                  <div className="w-4.5 h-4.5 rounded bg-white/20 flex items-center justify-center">
                    <Video size={11} />
                  </div>
                  <span>Join Room</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Specialist Directory */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold text-slate-650 dark:text-slate-200">
            Available Medical Specialists
          </h3>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Verified Board Certifications</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors.map((doc) => (
            <motion.div
              key={doc.id}
              whileTap={{ scale: 0.98 }}
              className={card3dClass}
            >
              <div>
                <div className="relative mb-2.5">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-full h-28 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                  />
                  <div className="absolute top-1.5 right-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-0.5 shadow-xs border border-slate-200/50 dark:border-slate-800/50">
                    <Star size={9.5} className="text-amber-500 fill-amber-500" />
                    <span>{doc.rating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-0.5">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-100 truncate">{doc.name}</h4>
                  <BadgeCheck size={12} className="text-primary shrink-0" />
                </div>
                <p className="text-[10px] font-semibold text-primary dark:text-sky-400 mb-0.5">{doc.specialty}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-2.5">{doc.hospital}</p>

                <div className="p-2 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-[9.5px] text-slate-500 dark:text-slate-400 mb-3 font-semibold flex items-center justify-between">
                  <span>Next Slot:</span>
                  <span className="text-slate-700 dark:text-slate-200">{doc.availableSlot}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoctor(doc)}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-primary text-white text-[10px] font-semibold transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer border border-slate-750"
              >
                <Calendar size={11} />
                <span>Book Slot</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 relative text-left"
          >
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <img
                src={selectedDoctor.avatar}
                alt={selectedDoctor.name}
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
              />
              <div className="text-xs">
                <h4 className="font-semibold text-slate-700 dark:text-slate-100">{selectedDoctor.name}</h4>
                <p className="text-primary dark:text-sky-400 font-semibold">{selectedDoctor.specialty}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{selectedDoctor.hospital}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-[10.5px]">
              <div>
                <label className="block font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Select Date</label>
                <select
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-750 dark:text-slate-200 font-medium focus:outline-none focus:border-primary text-xs"
                >
                  <option value="Today, Aug 14">Today, Aug 14 (Express Queue)</option>
                  <option value="Tomorrow, Aug 15">Tomorrow, Aug 15</option>
                  <option value="Monday, Aug 18">Monday, Aug 18</option>
                  <option value="Tuesday, Aug 19">Tuesday, Aug 19</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Select Time (EST)</label>
                <select
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-750 dark:text-slate-200 font-medium focus:outline-none focus:border-primary text-xs"
                >
                  <option value="10:00 AM - 10:30 AM EST">10:00 AM - 10:30 AM EST</option>
                  <option value="1:15 PM - 1:45 PM EST">1:15 PM - 1:45 PM EST</option>
                  <option value="3:30 PM - 4:00 PM EST">3:30 PM - 4:00 PM EST</option>
                  <option value="5:00 PM - 5:30 PM EST">5:00 PM - 5:30 PM EST</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Reason for Visit</label>
                <textarea
                  rows={2}
                  value={bookingReason}
                  onChange={e => setBookingReason(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-750 dark:text-slate-200 font-medium focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/60 dark:border-emerald-900/20 flex items-center justify-between">
                <span className="font-semibold text-emerald-800 dark:text-emerald-450">Priority Member Fee:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">$0.00 (Covered)</span>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-4.5 py-2 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-semibold transition-all cursor-pointer border border-primary/20"
              >
                Confirm Booking
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Simulated Live HD Video Consult Room */}
      {activeVideoCall && (
        <div className="fixed inset-0 z-[2000] bg-[#071324] text-white flex flex-col justify-between p-4">
          {/* Call Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 max-w-6xl w-full mx-auto">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <div>
                <h4 className="text-xs font-semibold text-white">{activeVideoCall.doctor.name}</h4>
                <p className="text-[10px] text-slate-400">Encrypted Consultation &bull; WebRTC TLS 1.3</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono font-bold text-emerald-400">
                04:18 Live
              </span>
            </div>
          </div>

          {/* Call Viewport Grid */}
          <div className="max-w-6xl w-full mx-auto my-auto grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
            {/* Doctor Video Main Canvas */}
            <div className="md:col-span-2 bg-slate-900 rounded-2xl relative overflow-hidden border border-white/10 flex items-center justify-center">
              <img
                src={activeVideoCall.doctor.avatar}
                alt={activeVideoCall.doctor.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5">
                <BadgeCheck size={12} className="text-primary" />
                <span>{activeVideoCall.doctor.name} (Attending)</span>
              </div>
            </div>

            {/* Patient Cam & Live AI Telemetry Notes */}
            <div className="flex flex-col gap-3">
              {/* Patient Feed */}
              <div className="h-36 bg-slate-800 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                {isVideoOn ? (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-350">
                    Patient Cam Stream
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-slate-400">Camera Off</div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold">
                  You (Enclave Feed)
                </div>
              </div>

              {/* Real-time AI Assistant Scribe */}
              <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-3.5 text-[10.5px] space-y-1.5 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-primary font-bold">
                  <Bot size={12.5} />
                  <span>Real-time Clinical Scribe</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                  Dr. Chen: &quot;Patient reports tension cephalalgia localized in temporal lobes. Prescribing sumatriptan 50mg with zero opioid involvement.&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Call Controls Bar */}
          <div className="flex items-center justify-center gap-3 py-3 max-w-xs mx-auto w-full">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-500 text-white'
              }`}
            >
              {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-500 text-white'
              }`}
            >
              {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
            </button>
            <button
              onClick={() => {
                setActiveVideoCall(null);
                showToast("Consultation ended. Clinical summary saved to Health Vault.", "info");
              }}
              className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-rose-650/30 cursor-pointer"
            >
              <PhoneOff size={14} />
              <span>Leave Room</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
