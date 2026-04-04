import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const handleNext = () => {
    if (!accepted) return;
    router.push('/onboarding/verify');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Terms & Privacy</Text>
        <Text style={styles.subtitle}>Please review our terms of service</Text>

        <ScrollView style={styles.termsBox}>
          <Text style={styles.termsText}>
            Welcome to Medicata! By using this app, you agree to the following terms:{"\n\n"}
            1. Medical Information: All medical data shared is confidential and encrypted.{"\n\n"}
            2. Professional Responsibility: Doctors are responsible for the clinical decisions made during consultations.{"\n\n"}
            3. Privacy: We collect data to provide healthcare services as outlined in our Privacy Policy.{"\n\n"}
            4. Emergency: Medicata is not for emergency use. In case of emergency, please visit the nearest hospital.{"\n\n"}
            5. Accuracy: You agree to provide accurate medical information.{"\n\n"}
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Text>
        </ScrollView>

        <TouchableOpacity 
          style={styles.checkboxRow} 
          onPress={() => setAccepted(!accepted)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxActive]} />
          <Text style={styles.checkboxLabel}>I agree to the Terms of Service and Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, !accepted && styles.buttonDisabled]} 
        onPress={handleNext}
        disabled={!accepted}
      >
        <Text style={styles.buttonText}>Confirm & Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 32,
  },
  termsBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  termsText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  checkboxActive: {
    backgroundColor: '#4a90e2',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  button: {
    backgroundColor: '#4a90e2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
