import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../../components/onboarding/ProgressBar';

export default function PharmacyInfoScreen() {
  const router = useRouter();
  const { data, updateData, submitPharmacyInfo, loading, error } = useOnboarding();
  
  const [step, setStep] = useState(1);
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [pharmacyLicense, setPharmacyLicense] = useState('');
  const [pharmacyContactInfo, setPharmacyContactInfo] = useState('');
  const [openingHours, setOpeningHours] = useState('');

  const totalSteps = 3;

  const handleNext = async () => {
    const currentData = { 
      pharmacyName, 
      pharmacyAddress, 
      pharmacyLicense, 
      pharmacyContactInfo, 
      openingHours 
    };

    // Always update context for consistency
    updateData(currentData);

    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }

    // Submit with explicit data to avoid relying on async context state
    try {
      const success = await submitPharmacyInfo(currentData);
      if (success) {
        console.log('Pharmacy info submitted successfully');
        router.push('/onboarding/terms');
      } else {
        console.error('Pharmacy info submission failed. Error from context:', error);
      }
    } catch (err) {
      console.error('Unexpected error during pharmacy info submission:', err);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return !!pharmacyName && !!pharmacyAddress;
      case 2: return !!pharmacyLicense;
      case 3: return !!pharmacyContactInfo && !!openingHours;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pharmacy Name</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="HealthPlus Pharmacy"
                  placeholderTextColor="#94A3B8"
                  value={pharmacyName}
                  onChangeText={setPharmacyName}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pharmacy Address</Text>
              <View style={styles.textAreaBox}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter your pharmacy address"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  value={pharmacyAddress}
                  onChangeText={setPharmacyAddress}
                />
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pharmacy License Number</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="PH-12345678"
                  placeholderTextColor="#94A3B8"
                  value={pharmacyLicense}
                  onChangeText={setPharmacyLicense}
                />
              </View>
              <Text style={styles.helperText}>This helps us verify your business for user trust.</Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Public Contact Info</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="+234 800 000 0000"
                  placeholderTextColor="#94A3B8"
                  value={pharmacyContactInfo}
                  onChangeText={setPharmacyContactInfo}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Opening Hours</Text>
              <View style={styles.textAreaBox}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Mon-Fri: 8AM-8PM, Sat: 9AM-5PM"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={2}
                  value={openingHours}
                  onChangeText={setOpeningHours}
                />
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity onPress={step === 1 ? () => router.back() : handleBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <ProgressBar currentStep={step + 4} totalSteps={8} label="Business Profile" />
          </View>

          <View style={styles.titleSection}>
            <View style={styles.iconBadge}>
              <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.iconGrad}>
                <Ionicons name="business-outline" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>
              {step === 1 ? 'Basic Details' : step === 2 ? 'Verification' : 'Operations'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 ? 'Tell us your pharmacy name and where you are located.' : 
               step === 2 ? 'Provide your medical license number for verification.' : 
               'How can patients contact you and when are you open?'}
            </Text>
          </View>

          {renderStep()}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 1 && (
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={() => router.push('/onboarding/terms')}
              disabled={loading}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, (!isStepValid() || loading) && styles.buttonDisabled]} 
            onPress={handleNext}
            disabled={!isStepValid() || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isStepValid() ? ['#4A90E2', '#2572D9'] : ['#CBD5E1', '#CBD5E1']}
              style={styles.buttonGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>
                    {step === totalSteps ? 'Complete Setup' : 'Next Step'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'flex-start',
    paddingVertical: 16,
    gap: 4,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  iconGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'left',
    lineHeight: 20,
    maxWidth: '90%',
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputBox: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: '#0F172A',
  },
  textAreaBox: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    padding: 16,
    minHeight: 100,
  },
  textArea: {
    fontSize: 15,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: -4,
    fontStyle: 'italic',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8,
  },
  button: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonGrad: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
