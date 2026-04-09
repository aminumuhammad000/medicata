import AsyncStorage from '@react-native-async-storage/async-storage';

// Use machine's IP address for Expo Go on mobile device (localhost won't work on physical devices)
const API_BASE_URL = 'http://192.168.100.10:8080/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private async loadToken() {
    this.token = await AsyncStorage.getItem('auth_token');
  }

  private async saveToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  private async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || data.message || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API Request Error:', error);
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Auth endpoints
  async register(data: {
    full_name: string;
    email: string;
    password: string;
    phone_number: string;
    whatsapp_number?: string;
    role: any;
  }) {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data?.token) {
      await this.saveToken(response.data.token);
    }

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      await this.saveToken(response.data.token);
    }

    return response;
  }

  async verify(code: string) {
    return this.request<any>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async sendVerification(email: string) {
    return this.request<{ message: string; code: string }>('/auth/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string; reset_code: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, code: string, new_password: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password }),
    });
  }

  async logout() {
    await this.clearToken();
  }

  // Patient onboarding endpoints
  async updatePatientHealthInfo(data: {
    date_of_birth?: string;
    gender?: string;
    allergies?: string;
    existing_conditions?: string;
  }) {
    return this.request<any>('/patient/health-info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePatientProfile(data: {
    bio?: string;
    height?: number;
    weight?: number;
    body_type?: string;
    address?: string;
    city?: string;
    state?: string;
  }) {
    return this.request<any>('/patient/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Doctor onboarding endpoints
  async updateDoctorProfessionalInfo(data: {
    medical_license_number: string;
    specialty: string;
    years_of_experience?: number;
    clinic_hospital_affiliation?: string;
    profile_photo?: string;
    clinic_hospital_address?: string;
  }) {
    return this.request<any>('/doctor/professional-info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDoctorBio(data: {
    bio?: string;
    languages_spoken?: string;
    working_hours?: string;
  }) {
    return this.request<any>('/doctor/bio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Pharmacy onboarding endpoint
  async updatePharmacyInfo(data: {
    pharmacy_name: string;
    pharmacy_address: string;
    pharmacy_license: string;
    pharmacy_contact_info: string;
    opening_hours: string;
  }) {
    return this.request<any>('/pharmacy/info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Consultation endpoints
  async bookConsultation(data: {
    doctor_id: string;
    scheduled_at: string;
    mode: string;
    reason: string;
    symptoms?: string;
    files_reports?: string;
    additional_notes?: string;
  }) {
    return this.request<any>('/consultations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyConsultations() {
    return this.request<any[]>('/consultations');
  }

  async updateConsultationStatus(id: string, status: string, is_follow_up?: boolean) {
    return this.request<any>(`/consultations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, is_follow_up }),
    });
  }

  async addConsultationNotes(id: string, notes: string) {
    return this.request<any>(`/consultations/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  async addPatientFeedback(id: string, rating: number) {
    return this.request<any>(`/consultations/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  // Prescription endpoints
  async createPrescription(data: {
    consultation_id?: string;
    patient_id: string;
    items: Array<{
      drug_id: string;
      dosage: string;
      frequency: string;
      duration_days: number;
      quantity: number;
      instructions?: string;
    }>;
    expiry_days: number;
  }) {
    return this.request<any>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPrescriptionDetails(id: string) {
    return this.request<any>(`/prescriptions/${id}`);
  }

  async getMyPrescriptions() {
    return this.request<any[]>('/prescriptions');
  }

  async sharePrescription(id: string, share_with: string, export_format?: string) {
    return this.request<any>(`/prescriptions/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ share_with, export_format }),
    });
  }

  async reorderPrescription(prescription_id: string) {
    return this.request<any>('/prescriptions/reorder', {
      method: 'POST',
      body: JSON.stringify({ prescription_id }),
    });
  }

  // Order endpoints
  async createOrder(data: {
    pharmacy_id: string;
    prescription_id?: string;
    delivery_address?: string;
    contact_info?: string;
    is_delivery: boolean;
    preferred_time?: string;
  }) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyOrders() {
    return this.request<any[]>('/orders');
  }

  async getOrderDetails(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request<any>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Search endpoints
  async searchDoctors(params: { specialty?: string; min_rating?: number; available_date?: string }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/doctors/search?${queryParams}`);
  }

  async searchPharmacies(params: { city?: string; state?: string }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/pharmacies/search?${queryParams}`);
  }

  async searchDrugs(name: string) {
    return this.request<any[]>(`/drugs/search?name=${name}`);
  }

  // Notification endpoints
  async getMyNotifications() {
    return this.request<any[]>('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }
}

export const api = new ApiService();
