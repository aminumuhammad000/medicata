import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function PharmacyInfoScreen() {
  const router = useRouter();
  const { data, updateData, submitPharmacyInfo, loading, error } = useOnboarding();
  
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [pharmacyLicense, setPharmacyLicense] = useState('');
  const [pharmacyContactInfo, setPharmacyContactInfo] = useState('');
  const [openingHours, setOpeningHours] = useState('');

  const handleNext = async () => {
    updateData({ 
      pharmacyName, 
      pharmacyAddress, 
      pharmacyLicense, 
      pharmacyContactInfo, 
      openingHours 
    });
    
    const success = await submitPharmacyInfo();
    if (success) {
      router.push('/onboarding/terms');
    }
  };

  const isComplete = pharmacyName && pharmacyAddress && pharmacyLicense && pharmacyContactInfo && openingHours;

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
            <Text style={styles.title}>Pharmacy Information</Text>
            <Text style={styles.subtitle}>Tell us about your pharmacy</Text>
          </View>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pharmacy License Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: PH-12345678"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={pharmacyLicense}
                onChangeText={setPharmacyLicense}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Information</Text>
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

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={[styles.button, (!isComplete || loading) && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={!isComplete || loading}
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
              <Text style={styles.buttonText}>Next</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
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
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
