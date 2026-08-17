interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;
  private tokenLoaded = false;
  private apiBaseUrl: string = 'http://localhost:5002/api';

  constructor() {
    // If the host is not localhost, fall back to default online URL
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        this.apiBaseUrl = 'https://api.medicata.ng/api';
      }
    }
  }

  private loadToken() {
    if (this.tokenLoaded) return;
    this.token = localStorage.getItem('auth_token');
    this.tokenLoaded = true;
  }

  private saveToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async saveUserData(user: any) {
    localStorage.setItem('user_data', JSON.stringify(user));
    if (user?.role) {
      localStorage.setItem('user_role', user.role.toLowerCase());
    }
  }

  async getUserData(): Promise<any> {
    const data = localStorage.getItem('user_data');
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
    this.loadToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const url = `${this.apiBaseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const text = await response.text();
      let data: any = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          if (!response.ok) return { error: text || 'Request failed' };
          data = { message: text };
        }
      }

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Request failed';
        return { error: errorMsg };
      }

      return { data };
    } catch (error) {
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
      this.saveToken(response.data.token);
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
      this.saveToken(response.data.token);
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
    this.clearToken();
  }

  async savePushToken(token: string) {
    return this.request<any>('/auth/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getMyProfile() {
    return this.request<any>('/me');
  }

  async getMe() {
    return this.getMyProfile();
  }

  // Patient onboarding endpoints
  async updatePatientHealthInfo(data: {
    age: number;
    gender: string;
    blood_type: string;
    genotype?: string;
    height?: number;
    weight?: number;
    body_type?: string;
    allergies: string[];
    chronic_conditions: string[];
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relationship: string;
  }) {
    return this.request<any>('/patient/health-info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePatientProfile(data: {
    full_name?: string;
    phone_number?: string;
    whatsapp_number?: string;
    address?: string;
  }) {
    return this.request<any>('/patient/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDoctorProfessionalInfo(data: {
    license_number: string;
    specialty: string;
    hospital_affiliation?: string;
    consultation_fee: string;
    experience_years: number;
    languages_spoken?: string[];
  }) {
    return this.request<any>('/doctor/professional-info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDoctorBio(data: { bio: string }) {
    return this.request<any>('/doctor/bio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDoctorProfile(data: {
    full_name?: string;
    phone_number?: string;
    whatsapp_number?: string;
  }) {
    return this.request<any>('/doctor/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updatePharmacyInfo(data: {
    pharmacy_name: string;
    pharmacy_address: string;
    opening_hours: string;
  }) {
    return this.request<any>('/pharmacy/info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfilePhoto(photo_base64: string) {
    return this.request<any>('/profile/photo', {
      method: 'POST',
      body: JSON.stringify({ photo: photo_base64 }),
    });
  }

  async bookConsultation(data: {
    doctor_id: string;
    scheduled_at: string;
    mode: 'video' | 'chat';
    reason: string;
  }) {
    return this.request<any>('/consultations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLiveKitToken(consultationId: string) {
    return this.request<{ token: string }>(`/consultations/${consultationId}/join-video`);
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

  async addPatientFeedback(id: string, feedback: any) {
    return this.request<any>(`/consultations/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async addLabTestComment(id: string, summary: string) {
    return this.request<any>(`/consultations/labs/comment/${id}`, {
      method: 'POST',
      body: JSON.stringify({ comment: summary }),
    });
  }

  async getChatHistory(consultationId: string) {
    return this.request<any[]>(`/consultations/${consultationId}/messages`);
  }

  async createPrescription(data: {
    consultation_id?: string;
    patient_id?: string;
    medication: string;
    dosage: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    valid_until?: string;
    qr_hash?: string;
    prescription_token?: string;
    refills_remaining?: number;
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

  async createOrder(data: {
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

  async getOrderDetails(orderId: string) {
    return this.request<any>(`/orders/${orderId}`);
  }

  async payOrderWithWallet(orderId: string) {
    return this.request<any>(`/orders/${orderId}/pay-wallet`, {
      method: 'POST',
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request<any>(`/orders/${orderId}/status`, {
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
  async searchDoctors(params: { specialty?: string; min_rating?: number; available_date?: string; name?: string }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<any>(`/doctors/search?${queryParams}`);
  }

  async getDoctorById(id: string) {
    return this.request<any>(`/doctors/${id}/profile`);
  }

  async getPharmacyById(id: string) {
    return this.request<any>(`/pharmacies/${id}`);
  }

  async searchPharmacies(params: { location?: string; drug_name?: string }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/pharmacies/search?${queryParams}`);
  }

  async getAvailability(doctorId: string, date: string) {
    return this.request<any[]>(`/availability/${doctorId}/${date}`);
  }

  async searchPatients(query: string) {
    return this.request<any[]>(`/patients/search?q=${query}`);
  }

  async searchDrugs(name: string) {
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

  async getSchedules() {
    return this.request<any[]>('/schedule');
  }

  async createSchedule(data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes?: number;
  }) {
    return this.request<any>('/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteSchedule(id: string) {
    return this.request<any>(`/schedule/${id}`, {
      method: 'DELETE',
    });
  }

  async requestLabTest(data: {
    consultation_id?: string;
    patient_id: string;
    tests: Array<{ id: string; name: string }>;
    instructions?: string;
  }) {
    return this.request<any>('/consultations/labs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Lab Test Management
  async getConsultationLabTests(consultationId: string) {
    return this.request<any[]>(`/consultations/${consultationId}/lab-tests`);
  }

  async getLabTest(labTestId: string) {
    return this.request<any>(`/lab-tests/${labTestId}`);
  }

  async updateLabTestStatus(labTestId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    return this.request<any>(`/lab-tests/${labTestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async uploadLabResult(labTestId: string, resultSummary?: string) {
    return this.request<any>(`/lab-tests/${labTestId}/results`, {
      method: 'POST',
      body: JSON.stringify({ result_summary: resultSummary }),
    });
  }

  async getPatientHistory(patientId: string) {
    return this.request<any>(`/patients/${patientId}/history`);
  }

  // Medication Reminders
  async getMyReminders() {
    return this.request<any[]>('/medication/reminders');
  }

  async createReminder(data: {
    prescription_id?: string;
    medication_name: string;
    dosage?: string;
    frequency: string;
    times: string[];
    start_date: string;
    end_date?: string;
  }) {
    return this.request<any>('/medication/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReminderStatus(id: string, isActive: boolean) {
    return this.request<any>(`/medication/reminders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  async deleteReminder(id: string) {
    return this.request<any>(`/medication/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  // Get prescriptions for a consultation
  async getConsultationPrescriptions(consultationId: string) {
    return this.request<any[]>(`/consultations/${consultationId}/prescriptions`);
  }

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

  async markAsRead(id: string) {
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

  async getPharmacyAnalytics() {
    return this.request<any>('/pharmacy/analytics');
  }

  async uploadVerificationDocuments(documents: any[]) {
    return this.request<any>('/doctor/verify', {
      method: 'POST',
      body: JSON.stringify({ documents }),
    });
  }

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

  async initializeCheckout(data: { amount: number, type: string, order_id?: string, consultation_id?: string }) {
    return this.request<any>('/wallet/checkout/initialize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkPaymentStatus(reference: string) {
    return this.request<{ status: string }>(`/wallet/status/${reference}`);
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
}

export const api = new ApiService();
