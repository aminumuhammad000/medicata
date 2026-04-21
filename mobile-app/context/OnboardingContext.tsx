import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

export type UserType = 'patient' | 'doctor' | 'pharmacy' | 'admin';

interface OnboardingData {
  userType: UserType;
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  // Patient specific
  dob?: string;
  gender?: string;
  allergies?: string;
  conditions?: string;
  height?: string;
  weight?: string;
  bodyType?: string;
  // Doctor specific
  licenseNumber?: string;
  specialties?: string[];
  experience?: string;
  affiliation?: string;
  bio?: string;
  languages?: string[];
  workingHours?: any;
  // Pharmacy specific
  pharmacyName?: string;
  pharmacyAddress?: string;
  pharmacyLicense?: string;
  pharmacyContactInfo?: string;
  openingHours?: string;
  // Common
  photo?: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  loading: boolean;
  error: string | null;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
  register: (registerData?: any) => Promise<boolean>;
  login: () => Promise<boolean>;
  verify: (code: string) => Promise<boolean>;
  submitPatientHealthInfo: (data?: any) => Promise<boolean>;
  submitPatientProfile: (data?: any) => Promise<boolean>;
  submitDoctorProfessionalInfo: () => Promise<boolean>;
  submitDoctorBio: () => Promise<boolean>;
  submitPharmacyInfo: (pharmacyData?: any) => Promise<boolean>;
}

const initialData: OnboardingData = {
  userType: 'patient',
  fullName: '',
  email: '',
  phone: '',
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => {
      const newData = { ...prev, ...updates };
      return newData;
    });
    setError(null);
  };

  const resetData = () => {
    setData(initialData);
    setError(null);
  };

  const register = async (registerData?: any): Promise<boolean> => {
    const finalData = registerData || data;

    if (!finalData.password) {
      setError('Password is required');
      return false;
    }

    setLoading(true);
    setError(null);

    // Convert userType to proper UserRole format (capitalize first letter)
    const role = finalData.userType.charAt(0).toUpperCase() + finalData.userType.slice(1);

    const response = await api.register({
      full_name: finalData.fullName,
      email: finalData.email,
      password: finalData.password,
      phone_number: finalData.phone || null,
      whatsapp_number: finalData.whatsapp || null,
      address: finalData.address || null,
      role: role as any,
    });

    if (response.error) {
      setError(response.error);
      setLoading(false);
      return false;
    }

    // Send verification email after successful registration
    try {
      await api.sendVerification(finalData.email);
    } catch (err) {
      console.error('Failed to send verification email:', err);
      // Don't fail registration if email fails
    }

    setLoading(false);
    return true;
  };

  const login = async (): Promise<boolean> => {
    if (!data.password) {
      setError('Password is required');
      return false;
    }

    setLoading(true);
    setError(null);

    const response = await api.login(data.email, data.password);

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return false;
    }

    return true;
  };

  const verify = async (code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const response = await api.verify(code);

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return false;
    }

    return true;
  };

  const submitPatientHealthInfo = async (healthData?: any): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const info = healthData || {
      date_of_birth: data.dob,
      gender: data.gender,
      allergies: data.allergies,
      existing_conditions: data.conditions,
    };

    const response = await api.updatePatientHealthInfo(info);

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return false;
    }

    if (response.data) {
      await api.saveUserData(response.data);
    }

    return true;
  };

  const submitPatientProfile = async (profileData?: any): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const profile = profileData || {
      bio: data.bio,
      height: data.height ? parseFloat(data.height) : undefined,
      weight: data.weight ? parseFloat(data.weight) : undefined,
      body_type: data.bodyType,
      address: data.address,
      city: data.city,
      state: data.state,
    };

    console.log('Submitting patient profile with data:', profile);

    const response = await api.updatePatientProfile(profile);

    setLoading(false);

    if (response.error) {
      console.error('Failed to submit patient profile:', response.error);
      setError(response.error);
      return false;
    }

    if (response.data) {
      console.log('Patient profile updated successfully');
      await api.saveUserData(response.data);
    }

    return true;
  };

  const submitDoctorProfessionalInfo = async (): Promise<boolean> => {
    if (!data.licenseNumber || !data.specialties || data.specialties.length === 0) {
      setError('License number and specialty are required');
      return false;
    }

    setLoading(true);
    setError(null);

    const response = await api.updateDoctorProfessionalInfo({
      medical_license_number: data.licenseNumber,
      specialty: data.specialties[0],
      years_of_experience: data.experience ? parseInt(data.experience) : undefined,
      clinic_hospital_affiliation: data.affiliation,
      profile_photo: data.photo,
      clinic_hospital_address: data.address,
    });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return false;
    }

    return true;
  };

  const submitDoctorBio = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const response = await api.updateDoctorBio({
      bio: data.bio,
      languages_spoken: data.languages?.join(', '),
      working_hours: data.workingHours ? JSON.stringify(data.workingHours) : undefined,
    });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return false;
    }

    return true;
  };

  const submitPharmacyInfo = async (pharmacyData?: any): Promise<boolean> => {
    const finalData = pharmacyData ? { ...data, ...pharmacyData } : data;
    
    if (!finalData.pharmacyName || !finalData.pharmacyAddress || !finalData.pharmacyLicense || !finalData.pharmacyContactInfo || !finalData.openingHours) {
      const missingFields = [];
      if (!finalData.pharmacyName) missingFields.push('pharmacyName');
      if (!finalData.pharmacyAddress) missingFields.push('pharmacyAddress');
      if (!finalData.pharmacyLicense) missingFields.push('pharmacyLicense');
      if (!finalData.pharmacyContactInfo) missingFields.push('pharmacyContactInfo');
      if (!finalData.openingHours) missingFields.push('openingHours');
      
      const errorMsg = `All pharmacy fields are required. Missing: ${missingFields.join(', ')}`;
      console.error(errorMsg);
      setError(errorMsg);
      return false;
    }

    setLoading(true);
    setError(null);

    const payload = {
      pharmacy_name: finalData.pharmacyName,
      pharmacy_address: finalData.pharmacyAddress,
      pharmacy_license: finalData.pharmacyLicense,
      pharmacy_contact_info: finalData.pharmacyContactInfo,
      opening_hours: finalData.openingHours,
    };

    console.log('Sending pharmacy info payload:', payload);

    try {
      const response = await api.updatePharmacyInfo(payload);

      setLoading(false);

      if (response.error) {
        console.error('API Error in submitPharmacyInfo:', response.error);
        setError(response.error);
        return false;
      }

      if (response.data) {
        console.log('Pharmacy info submitted successfully:', response.data);
        await api.saveUserData(response.data);
      }
      return true;
    } catch (err) {
      console.error('Network or unexpected error in submitPharmacyInfo:', err);
      setError('An unexpected error occurred. Please check your connection.');
      setLoading(false);
      return false;
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        loading,
        error,
        updateData,
        resetData,
        register,
        login,
        verify,
        submitPatientHealthInfo,
        submitPatientProfile,
        submitDoctorProfessionalInfo,
        submitDoctorBio,
        submitPharmacyInfo,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
