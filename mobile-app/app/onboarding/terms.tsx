import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../../components/onboarding/ProgressBar';

export default function TermsScreen() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const handleNext = () => {
    if (!accepted) return;
    router.push('/onboarding/complete');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <ProgressBar currentStep={7} totalSteps={7} label="Legal" />
        </View>

        <View style={styles.titleSection}>
          <View style={styles.iconBadge}>
            <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.iconGrad}>
              <Ionicons name="document-lock-outline" size={24} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Terms & Privacy</Text>
          <Text style={styles.subtitle}>Please review our terms of service before you proceed.</Text>
        </View>

        <ScrollView style={styles.termsBox} showsVerticalScrollIndicator={false}>
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
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
            {accepted && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>I agree to the Terms of Service and Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, !accepted && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={!accepted}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={accepted ? ['#4A90E2', '#2572D9'] : ['#CBD5E1', '#CBD5E1']}
            style={styles.buttonGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.buttonInner}>
              <Text style={styles.buttonText}>Confirm & Finish</Text>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  termsBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  termsText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2572D9',
    borderColor: '#2572D9',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    fontWeight: '500',
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
});
