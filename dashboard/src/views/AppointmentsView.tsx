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

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <Video size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-navy">Specialist Teleconsultations</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Top 1% Physicians
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Direct encrypted HD video consults with verified attending physicians from leading academic institutions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck size={13} />
            </div>
            <span>End-to-End Encrypted WebRTC</span>
          </div>
        </div>
      </div>

      {/* Confirmed Appointments Section */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
            <Calendar size={14} />
          </div>
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
            Scheduled Consultations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={apt.doctor.avatar}
                      alt={apt.doctor.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-navy">{apt.doctor.name}</h4>
                      <p className="text-xs text-primary font-semibold">{apt.doctor.specialty}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{apt.doctor.hospital}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    apt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {apt.status}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <div className="w-5 h-5 rounded bg-slate-200/80 flex items-center justify-center text-slate-600">
                      <Clock size={12} />
                    </div>
                    <span>{apt.date} &bull; {apt.time}</span>
                  </div>
                  {apt.triageSummary && (
                    <p className="text-[11px] text-slate-500 font-normal">
                      Focus: {apt.triageSummary}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">{apt.id}</span>
                <button
                  onClick={() => {
                    setActiveVideoCall(apt);
                    showToast(`Entering consultation room with ${apt.doctor.name}...`, "success");
                  }}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-primary/30"
                >
                  <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
                    <Video size={13} />
                  </div>
                  <span>Join HD Video Room</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Specialist Directory */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
            Available Medical Specialists
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Verified Board Certifications</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors.map((doc) => (
            <motion.div
              key={doc.id}
              whileHover={{ y: -3 }}
              className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="relative mb-3.5">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-full h-36 rounded-2xl object-cover border border-slate-200"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-lg text-[10px] font-bold text-navy flex items-center gap-1 shadow-xs">
                    <Star size={11} className="text-amber-500 fill-amber-500" />
                    <span>{doc.rating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-1">
                  <h4 className="text-sm font-bold text-navy truncate">{doc.name}</h4>
                  <BadgeCheck size={14} className="text-primary shrink-0" />
                </div>
                <p className="text-xs font-semibold text-primary mb-1">{doc.specialty}</p>
                <p className="text-[11px] text-slate-500 mb-3">{doc.hospital}</p>

                <div className="p-2 rounded-xl bg-slate-50 text-[10px] text-slate-600 mb-4 font-semibold flex items-center justify-between">
                  <span>Next Slot:</span>
                  <span className="text-navy">{doc.availableSlot}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoctor(doc)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar size={13} />
                <span>Book Consult</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 relative"
          >
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-navy cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
              <img
                src={selectedDoctor.avatar}
                alt={selectedDoctor.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
              />
              <div>
                <h4 className="text-base font-bold text-navy">{selectedDoctor.name}</h4>
                <p className="text-xs text-primary font-semibold">{selectedDoctor.specialty}</p>
                <p className="text-[11px] text-slate-500">{selectedDoctor.hospital}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-navy uppercase tracking-wider mb-1.5">Select Date</label>
                <select
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-primary"
                >
                  <option value="Today, Aug 14">Today, Aug 14 (Express Queue)</option>
                  <option value="Tomorrow, Aug 15">Tomorrow, Aug 15</option>
                  <option value="Monday, Aug 18">Monday, Aug 18</option>
                  <option value="Tuesday, Aug 19">Tuesday, Aug 19</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-navy uppercase tracking-wider mb-1.5">Select Consultation Time (EST)</label>
                <select
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-primary"
                >
                  <option value="10:00 AM - 10:30 AM EST">10:00 AM - 10:30 AM EST</option>
                  <option value="1:15 PM - 1:45 PM EST">1:15 PM - 1:45 PM EST</option>
                  <option value="3:30 PM - 4:00 PM EST">3:30 PM - 4:00 PM EST</option>
                  <option value="5:00 PM - 5:30 PM EST">5:00 PM - 5:30 PM EST</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-navy uppercase tracking-wider mb-1.5">Clinical Reason for Visit</label>
                <textarea
                  rows={3}
                  value={bookingReason}
                  onChange={e => setBookingReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="font-semibold text-emerald-900">Priority Member Fee:</span>
                <span className="font-bold text-emerald-800">$0.00 (Covered)</span>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-navy cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-[#1f60b5] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                Confirm Appointment
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Simulated Live HD Video Consult Room */}
      {activeVideoCall && (
        <div className="fixed inset-0 z-50 bg-[#071324] text-white flex flex-col justify-between p-4 sm:p-6">
          {/* Call Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 max-w-6xl w-full mx-auto">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-white">{activeVideoCall.doctor.name}</h4>
                <p className="text-[11px] text-slate-400">Encrypted Consultation &bull; WebRTC TLS 1.3</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-bold text-emerald-400">
                04:18 Live
              </span>
            </div>
          </div>

          {/* Call Viewport Grid */}
          <div className="max-w-6xl w-full mx-auto my-auto grid grid-cols-1 md:grid-cols-3 gap-4 h-[450px]">
            {/* Doctor Video Main Canvas */}
            <div className="md:col-span-2 bg-slate-900 rounded-3xl relative overflow-hidden border border-white/10 flex items-center justify-center">
              <img
                src={activeVideoCall.doctor.avatar}
                alt={activeVideoCall.doctor.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                <BadgeCheck size={14} className="text-primary" />
                <span>{activeVideoCall.doctor.name} (Attending)</span>
              </div>
            </div>

            {/* Patient Cam & Live AI Telemetry Notes */}
            <div className="flex flex-col gap-4">
              {/* Patient Feed */}
              <div className="h-44 bg-slate-800 rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                {isVideoOn ? (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    Patient Video Stream Active
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-400">Camera Off</div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold">
                  You (Patient Enclave)
                </div>
              </div>

              {/* Real-time AI Assistant Scribe */}
              <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-4 text-xs space-y-2 overflow-y-auto">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Bot size={14} />
                  <span>Real-time Clinical Transcription</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  Dr. Chen: &quot;Patient reports tension cephalalgia localized in temporal lobes. Prescribing sumatriptan 50mg with zero opioid involvement.&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Call Controls Bar */}
          <div className="flex items-center justify-center gap-4 py-4 max-w-md mx-auto w-full">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-500 text-white'
              }`}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-500 text-white'
              }`}
            >
              {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button
              onClick={() => {
                setActiveVideoCall(null);
                showToast("Consultation ended. Clinical summary saved to Health Vault.", "info");
              }}
              className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
            >
              <PhoneOff size={16} />
              <span>Leave Consult</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
