import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
              <TextInput
                style={styles.input}
                placeholder="Ex: HealthPlus Pharmacy"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={pharmacyName}
                onChangeText={setPharmacyName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pharmacy Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your pharmacy address"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
                numberOfLines={3}
                value={pharmacyAddress}
                onChangeText={setPharmacyAddress}
              />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pharmacy License Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: PH-12345678"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={pharmacyLicense}
                onChangeText={setPharmacyLicense}
              />
              <Text style={styles.helperText}>This helps us verify your business for user trust.</Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Public Contact Info</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: +234 800 000 0000, email@example.com"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={pharmacyContactInfo}
                onChangeText={setPharmacyContactInfo}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Opening Hours</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Mon-Fri: 8AM-8PM, Sat: 9AM-5PM"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
                numberOfLines={2}
                value={openingHours}
                onChangeText={setOpeningHours}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0D1B3A', '#1E3A5F', '#2572D9']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.stepIndicatorContainer}>
              {[1, 2, 3].map((s) => (
                <View 
                  key={s} 
                  style={[
                    styles.stepDot, 
                    s === step && styles.stepDotActive,
                    s < step && styles.stepDotCompleted
                  ]} 
                />
              ))}
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
            <Text style={styles.errorText}>{error}</Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.button, (!isStepValid() || loading) && styles.buttonDisabled, { flex: 1 }]} 
            onPress={handleNext}
            disabled={!isStepValid() || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2572D9', '#4A90E2']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {step === totalSteps ? 'Complete Setup' : 'Next Step'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {step === 1 && (
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={() => router.push('/pharmacy/dashboard')}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B3A',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  stepDot: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepDotActive: {
    backgroundColor: '#4A90E2',
    width: 48,
  },
  stepDotCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingBottom: 24,
    gap: 16,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      }
    }),
  },
  skipButton: {
    marginHorizontal: 32,
    marginBottom: 24,
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
