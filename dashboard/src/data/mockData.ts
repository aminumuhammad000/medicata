import type { PatientProfile, VitalSign, Doctor, Appointment, Prescription, HealthRecord, NotificationItem } from '../types';

export const initialPatientProfile: PatientProfile = {
  id: 'PT-9821-ENCLAVE',
  name: 'Alex Rivera',
  email: 'alex.rivera@medicata.health',
  phone: '+1 (555) 389-2049',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  age: 32,
  gender: 'Non-Binary',
  bloodType: 'O Positive (O+)',
  allergies: ['Penicillin', 'Sulfa Antibiotics'],
  chronicConditions: ['Migraine with Aura (Controlled)'],
  emergencyContact: {
    name: 'Elena Rivera',
    relationship: 'Sister',
    phone: '+1 (555) 891-2311'
  },
  enclaveKey: '0x8f2a...9b41-ZK-AES256',
  isEnclaveVerified: true,
  isOnboarded: true
};

export const initialVitals: VitalSign[] = [
  {
    id: 'v1',
    label: 'Heart Rate',
    value: '72',
    unit: 'BPM',
    status: 'normal',
    trend: 'stable',
    lastUpdated: '12 mins ago'
  },
  {
    id: 'v2',
    label: 'Blood Oxygen',
    value: '99',
    unit: '%',
    status: 'normal',
    trend: 'up',
    lastUpdated: '12 mins ago'
  },
  {
    id: 'v3',
    label: 'Blood Pressure',
    value: '118 / 76',
    unit: 'mmHg',
    status: 'normal',
    trend: 'stable',
    lastUpdated: '4 hours ago'
  },
  {
    id: 'v4',
    label: 'Core Temperature',
    value: '98.4',
    unit: '°F',
    status: 'normal',
    trend: 'stable',
    lastUpdated: '6 hours ago'
  }
];

export const doctorsList: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Chen, MD',
    specialty: 'Neurology & Headache Medicine',
    hospital: 'Johns Hopkins Medicine',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=250&q=80',
    rating: 4.98,
    reviewCount: 412,
    availableSlot: 'Today, 3:30 PM EST',
    consultationFee: '$0 (Medicata Priority Tier)',
    npi: 'NPI #1982740291'
  },
  {
    id: 'doc-2',
    name: 'Dr. Marcus Vance, MD, FACC',
    specialty: 'Cardiovascular Medicine',
    hospital: 'Harvard Health & Brigham Women’s',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80',
    rating: 4.95,
    reviewCount: 320,
    availableSlot: 'Tomorrow, 10:00 AM EST',
    consultationFee: '$0 (Medicata Priority Tier)',
    npi: 'NPI #1489023418'
  },
  {
    id: 'doc-3',
    name: 'Dr. Emily Al-Mansoor, MD',
    specialty: 'Internal Medicine & Immunology',
    hospital: 'Mayo Clinic Health System',
    avatar: 'https://images.unsplash.com/photo-1594824813504-89d4c7a65977?auto=format&fit=crop&w=250&q=80',
    rating: 4.97,
    reviewCount: 518,
    availableSlot: 'Today, 5:15 PM EST',
    consultationFee: '$0 (Medicata Priority Tier)',
    npi: 'NPI #1783920194'
  },
  {
    id: 'doc-4',
    name: 'Dr. Jonathan Reynolds, MD',
    specialty: 'Dermatology & Skin Oncology',
    hospital: 'Stanford Health Care',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=250&q=80',
    rating: 4.92,
    reviewCount: 280,
    availableSlot: 'Wednesday, 2:00 PM EST',
    consultationFee: '$0 (Medicata Priority Tier)',
    npi: 'NPI #1192840182'
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: 'apt-8842',
    doctor: doctorsList[0],
    date: 'Today, Aug 14',
    time: '3:30 PM - 4:00 PM EST',
    type: 'Video Consult',
    status: 'Confirmed',
    roomUrl: 'https://telehealth.medicata.ai/room/enc-8842',
    triageSummary: 'Follow-up on cranial tension symptoms and preventative medication efficacy.'
  },
  {
    id: 'apt-7719',
    doctor: doctorsList[2],
    date: 'Next Tuesday, Aug 19',
    time: '11:00 AM - 11:30 AM EST',
    type: 'Video Consult',
    status: 'Pending',
    roomUrl: 'https://telehealth.medicata.ai/room/enc-7719',
    triageSummary: 'Annual comprehensive metabolic & immunity panel review.'
  }
];

export const initialPrescriptions: Prescription[] = [
  {
    id: 'rx-01',
    token: 'RX-8842-ZK-MEDICATA',
    medication: 'Sumatriptan Succinate',
    genericName: 'Sumatriptan 50mg Tablets',
    dosage: '50 mg',
    instructions: 'Take 1 tablet orally at the onset of migraine aura. Repeat after 2 hours if required. Max 200mg/24h.',
    quantity: '9 Oral Tablets',
    refillsRemaining: 3,
    prescribedBy: 'Dr. Sarah Chen, MD (Johns Hopkins)',
    dateIssued: 'Aug 10, 2026',
    validUntil: 'Feb 10, 2027',
    status: 'Active',
    qrHash: '0x8842f10b89cd4a7e91...ZK_SIGNED',
    pharmacyRouting: 'Express 30-Min Courier Handover Available'
  },
  {
    id: 'rx-02',
    token: 'RX-6719-ZK-MEDICATA',
    medication: 'Ergocalciferol (Vitamin D2)',
    genericName: 'Vitamin D2 50,000 IU Capsules',
    dosage: '50,000 IU',
    instructions: 'Take 1 capsule weekly with food for 8 weeks.',
    quantity: '8 Capsules',
    refillsRemaining: 1,
    prescribedBy: 'Dr. Emily Al-Mansoor, MD (Mayo Clinic)',
    dateIssued: 'Jul 24, 2026',
    validUntil: 'Jan 24, 2027',
    status: 'Active',
    qrHash: '0x6719ac4092bb83f12...ZK_SIGNED',
    pharmacyRouting: 'Fulfilled by CVS Health Care Node'
  }
];

export const initialHealthRecords: HealthRecord[] = [
  {
    id: 'rec-01',
    title: 'Comprehensive Neurological Evaluation Brief',
    category: 'Clinical Notes',
    date: 'Aug 10, 2026',
    provider: 'Dr. Sarah Chen, MD · Johns Hopkins',
    fileSize: '1.4 MB',
    hash: 'SHA256: 0x8a92...e41f',
    status: 'Verified'
  },
  {
    id: 'rec-02',
    title: 'Advanced Lipid & Metabolic Panel (LabCorp)',
    category: 'Lab Diagnostics',
    date: 'Jul 22, 2026',
    provider: 'LabCorp Diagnostic Network',
    fileSize: '840 KB',
    hash: 'SHA256: 0x1f94...cc82',
    status: 'Verified'
  },
  {
    id: 'rec-03',
    title: 'Resting Electrocardiogram (12-Lead ECG)',
    category: 'Cardiology Report',
    date: 'Jun 15, 2026',
    provider: 'Brigham & Women’s Hospital',
    fileSize: '3.2 MB',
    hash: 'SHA256: 0x55dc...901a',
    status: 'Verified'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Appointment in 45 Minutes',
    message: 'HD Video Consult with Dr. Sarah Chen begins at 3:30 PM EST. Room is open for audio check.',
    time: '10m ago',
    read: false,
    type: 'appointment'
  },
  {
    id: 'n2',
    title: 'Prescription Refill Ready',
    message: 'Sumatriptan 50mg is ready for 30-min express courier delivery or local pickup.',
    time: '2h ago',
    read: false,
    type: 'prescription'
  },
  {
    id: 'n3',
    title: 'Zero-Knowledge Key Rotated',
    message: 'Device hardware enclave successfully synchronized with Medicata HSM vault.',
    time: '1d ago',
    read: true,
    type: 'security'
  }
];
