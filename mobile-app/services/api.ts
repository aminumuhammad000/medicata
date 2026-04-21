import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use machine's IP address for Expo Go on mobile device (localhost won't work on physical devices)
// If on web, route directly to localhost.
const API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:8080/api' : 'http://192.168.100.10:8080/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;
  private tokenLoaded = false;

  constructor() {
    // Don't load token in constructor to avoid window is not defined error
  }

  private async loadToken() {
    if (this.tokenLoaded) return;
    this.token = await AsyncStorage.getItem('auth_token');
    this.tokenLoaded = true;
  }

  private async saveToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  private async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  async saveUserData(user: any) {
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
    // Also persist role separately so role-based navigation reads work immediately
    if (user?.role) {
      await AsyncStorage.setItem('user_role', user.role.toLowerCase());
    }
  }


  async getUserData(): Promise<any> {
    const data = await AsyncStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

  async getUserRole(): Promise<string | null> {
    const user = await this.getUserData();
    return user?.role || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    await this.loadToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`[API Request] ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body as string) : '');
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`[API Response Status] ${response.status} ${response.statusText}`);

      // Handle empty responses (like 204 No Content)
      const text = await response.text();
      let data: any = {};
      
      if (text) {
        try {
          data = JSON.parse(text);
          console.log('[API Response Data]', data);
        } catch (e) {
          console.log('[API Response Text]', text);
          // If response is not JSON but has content, might be success text or error
          if (!response.ok) return { error: text || 'Request failed' };
          data = { message: text };
        }
      }

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Request failed';
        console.error(`[API Error] ${errorMsg}`);
        return { error: errorMsg };
      }

      return { data };
    } catch (error) {
      console.error('[API Network Error]', error);
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
    address?: string;
    role: any;
  }) {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data?.token) {
      await this.saveToken(response.data.token);
    }

    if (response.data?.user) {
      await this.saveUserData(response.data.user);
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

    if (response.data?.user) {
      await this.saveUserData(response.data.user);
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

  async getMyProfile() {
    return this.request<any>('/me');
  }

  async getMe() {
    return this.getMyProfile();
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
    return this.request<any>('/profile/patient', {
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

  async updateDoctorProfile(data: {
    bio?: string;
    specialty?: string;
    years_of_experience?: number;
    clinic_hospital_affiliation?: string;
    languages_spoken?: string;
  }) {
    return this.request<any>('/doctor/profile', {
      method: 'PATCH',
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

  async getChatHistory(consultationId: string) {
    return this.request<any[]>(`/consultations/${consultationId}/messages`);
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

  async dispensePrescription(id: string) {
    return this.request<any>(`/prescriptions/${id}/dispense`, {
      method: 'POST',
    });
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

  async addOrderItem(orderId: string, drugId: string, quantity: number, price: number) {
    return this.request<any>(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify({ drug_id: drugId, quantity, price }),
    });
  }

  // Search endpoints
  async searchDoctors(params: { specialty?: string; min_rating?: number; available_date?: string }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/doctors/search?${queryParams}`);
  }

  async getDoctorById(id: string) {
    return this.request<any>(`/doctors/${id}/profile`);
  }

  async getPharmacyById(id: string) {
    return this.request<any>(`/pharmacies/${id}`);
  }

  async searchPharmacies(params: { city?: string; state?: string }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/pharmacies/search?${queryParams}`);
  }

  async searchDrugs(name: string) {
    // 1. Try fetching from OpenFDA for high-quality drug labels
    try {
      const fdaResponse = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${name}"&limit=10`);
      const fdaData = await fdaResponse.json();
      
      if (fdaData.results && fdaData.results.length > 0) {
        return {
          data: fdaData.results.map((item: any) => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            name: item.openfda.brand_name?.[0] || item.openfda.generic_name?.[0] || 'Unknown Drug',
            generic_name: item.openfda.generic_name?.[0],
            brand_name: item.openfda.brand_name?.[0],
            category: item.openfda.pharm_class_epc?.[0] || 'Medication',
            strengths: item.openfda.substance_name,
            dosage_forms: item.openfda.route,
            is_fda: true
          }))
        };
      }
    } catch (e) {
      console.warn('OpenFDA search failed, falling back to internal API:', e);
    }

    // 2. Fallback to internal drug database - Backend expects 'q' parameter
    return this.request<any[]>(`/drugs/search?q=${name}`);
  }

  async createDrug(data: {
    name: string;
    generic_name?: string;
    brand_name?: string;
    category?: string;
    description?: string;
    dosage_forms?: string[];
    strengths?: string[];
    manufacturer?: string;
    requires_prescription?: boolean;
  }) {
    return this.request<any>('/drugs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCategories() {
    return this.request<{ categories: string[] }>('/drugs/categories');
  }

  async searchDrugsByCategory(category: string) {
    return this.request<any[]>(`/drugs/search?category=${category}`);
  }

  async getPharmacyStock() {
    return this.request<any[]>('/pharmacy/stock');
  }

  async updatePharmacyStock(data: {
    drug_id: string;
    price: number;
    quantity: number;
    is_available?: boolean;
    expiry_date?: string;
  }) {
    return this.request<any>('/pharmacy/stock', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayoutInfo(data: {
    bank_name: string;
    account_number: string;
    account_name: string;
  }) {
    return this.request<any>('/pharmacy/payout-info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Used by profile.tsx to update pharmacy business info
  async updatePharmacyProfile(data: {
    pharmacy_name?: string;
    pharmacy_address?: string;
    pharmacy_license?: string;
    opening_hours?: string;
    pharmacy_contact_info?: string;
  }) {
    return this.request<any>('/pharmacy/info', {
      method: 'POST',
      body: JSON.stringify({
        pharmacy_name: data.pharmacy_name || '',
        pharmacy_address: data.pharmacy_address || '',
        pharmacy_license: data.pharmacy_license || '',
        pharmacy_contact_info: data.pharmacy_contact_info || '',
        opening_hours: data.opening_hours || '',
      }),
    });
  }

  async getReviews(targetId: string) {
    return this.request<any[]>(`/reviews?target_id=${targetId}`);
  }

  // Notification endpoints
  async getMyNotifications() {
    return this.request<any[]>('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  // Review endpoints
  async submitReview(consultationId: string, rating: number, comment?: string) {
    return this.request(`/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        consultation_id: consultationId,
        rating,
        comment,
      }),
    });
  }

  // Analytics endpoints
  async getDoctorAnalytics() {
    return this.request<any>('/doctor/analytics');
  }

  // Prescription verification (Public)
  async verifyPrescription(token: string) {
    return this.request<any>(`/prescriptions/verify/${token}`);
  }

  // Wallet endpoints
  async getWalletBalance() {
    return this.request<any>('/wallet/balance');
  }

  async getWalletTransactions() {
    return this.request<any[]>('/wallet/transactions');
  }

  async addMoneyToWallet(amount: number, paymentMethod: string) {
    return this.request<any>('/wallet/add', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method: paymentMethod }),
    });
  }

  async withdrawMoney(amount: number, bankAccount: string) {
    return this.request<any>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, bank_account: bankAccount }),
    });
  }

  // WebSocket connection URL
  getWebSocketUrl() {
    return Platform.OS === 'web' 
      ? 'ws://localhost:8080/ws'
      : 'ws://192.168.100.10:8080/ws';
  }
}

export const api = new ApiService();
