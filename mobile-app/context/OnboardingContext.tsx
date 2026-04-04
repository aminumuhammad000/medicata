import React, { createContext, useContext, useState } from 'react';

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
  // Common
  photo?: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
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

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => {
    setData(initialData);
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
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
