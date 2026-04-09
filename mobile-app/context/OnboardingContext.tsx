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
  register: () => Promise<boolean>;
  login: () => Promise<boolean>;
  verify: (code: string) => Promise<boolean>;
  submitPatientHealthInfo: () => Promise<boolean>;
  submitPatientProfile: () => Promise<boolean>;
  submitDoctorProfessionalInfo: () => Promise<boolean>;
  submitDoctorBio: () => Promise<boolean>;
  submitPharmacyInfo: () => Promise<boolean>;
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
    setData((prev) => ({ ...prev, ...updates }));
    setError(null);
  };

  const resetData = () => {
    setData(initialData);
    setError(null);
  };

  const register = async (): Promise<boolean> => {
    if (!data.password) {
      setError('Password is required');
      return false;
    }

    setLoading(true);
    setError(null);

    // Convert userType to proper UserRole format (capitalize first letter)
    const role = data.userType.charAt(0).toUpperCase() + data.userType.slice(1);

    const response = await api.register({
      full_name: data.fullName,
      email: data.email,
      password: data.password,
      phone_number: data.phone,
      whatsapp_number: data.whatsapp,
      role: role as any,
    });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return false;
    }

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

  const submitPatientHealthInfo = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const response = await api.updatePatientHealthInfo({
      date_of_birth: data.dob,
      gender: data.gender,
      allergies: data.allergies,
      existing_conditions: data.conditions,
    });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return false;
    }

    return true;
  };

  const submitPatientProfile = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const response = await api.updatePatientProfile({
      bio: data.bio,
      height: data.height ? parseFloat(data.height) : undefined,
      weight: data.weight ? parseFloat(data.weight) : undefined,
      body_type: data.bodyType,
      address: data.address,
      city: data.city,
      state: data.state,
    });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return false;
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

  const submitPharmacyInfo = async (): Promise<boolean> => {
    if (!data.pharmacyName || !data.pharmacyAddress || !data.pharmacyLicense || !data.pharmacyContactInfo || !data.openingHours) {
      setError('All pharmacy fields are required');
      return false;
    }

    setLoading(true);
    setError(null);

    const response = await api.updatePharmacyInfo({
      pharmacy_name: data.pharmacyName,
      pharmacy_address: data.pharmacyAddress,
      pharmacy_license: data.pharmacyLicense,
      pharmacy_contact_info: data.pharmacyContactInfo,
      opening_hours: data.openingHours,
    });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return false;
    }

    return true;
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
