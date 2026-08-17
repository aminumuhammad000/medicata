export interface PatientProfile {
  id: string;
  role?: 'patient' | 'doctor' | 'pharmacy';
  name: string;
  email: string;
  phone: string;
  avatar: string;
  age: number;
  gender: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  enclaveKey: string;
  isEnclaveVerified: boolean;
  isOnboarded: boolean;
  whatsapp?: string;
  genotype?: string;
  height?: number;
  weight?: number;
  bodyType?: string;
  licenseNumber?: string;
  specialty?: string;
  hospitalAffiliation?: string;
  consultationFee?: string;
  experience?: number;
  languages?: string[];
  pharmacyName?: string;
  address?: string;
  openingHours?: string;
  verificationDocs?: string[];
  acceptedTerms?: boolean;
}

export interface VitalSign {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface TriageMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  content: string;
  timestamp: string;
  vitalsData?: {
    heartRate?: number;
    spo2?: number;
    temp?: number;
    bp?: string;
  };
  triageReport?: {
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Emergency';
    primaryVector: string;
    clinicalConfidence: string;
    suggestedSpecialist: string;
    recommendedAction: string;
  };
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  availableSlot: string;
  consultationFee: string;
  npi: string;
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  type: 'Video Consult' | 'In-Clinic' | 'AI Follow-up';
  status: 'Confirmed' | 'Completed' | 'Pending' | 'Cancelled';
  roomUrl?: string;
  triageSummary?: string;
}

export interface Prescription {
  id: string;
  token: string;
  medication: string;
  genericName: string;
  dosage: string;
  instructions: string;
  quantity: string;
  refillsRemaining: number;
  prescribedBy: string;
  dateIssued: string;
  validUntil: string;
  status: 'Active' | 'Fulfilled' | 'Expired';
  qrHash: string;
  pharmacyRouting: string;
}

export interface HealthRecord {
  id: string;
  title: string;
  category: 'Lab Diagnostics' | 'Imaging' | 'Clinical Notes' | 'Cardiology Report';
  date: string;
  provider: string;
  fileSize: string;
  hash: string;
  status: 'Verified' | 'Pending Audit';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'triage' | 'appointment' | 'prescription' | 'security';
}

export interface WalletTransaction {
  id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'earnings';
  amount: number;
  description: string;
  created_at: string;
}

export interface PharmacyOrder {
  id: string;
  patient_name: string;
  status: 'pending' | 'processing' | 'ready_for_pickup' | 'picked_up' | 'completed' | 'delivered';
  total_amount: number;
  created_at: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

export interface DrugStockItem {
  id: string;
  drug_name: string;
  drug_category: string;
  drug_brand: string;
  price: number;
  quantity: number;
  expiry_date: string;
  is_available: boolean;
}
