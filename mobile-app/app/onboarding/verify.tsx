import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../../components/onboarding/ProgressBar';
import { api } from '../../services/api';

export default function VerifyScreen() {
  const router = useRouter();
  const { data, verify, loading, error } = useOnboarding();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const handleVerify = async () => {
    if (code.length !== 4) return;
    
    const success = await verify(code);
    if (success) {
      if (data.userType === 'pharmacy') {
        router.push('/onboarding/pharmacy-info');
      } else if (data.userType === 'doctor') {
        router.push('/onboarding/info');
      } else {
        router.push('/onboarding/profile');
      }
    }
  };

  const handleResend = async () => {
    setSending(true);
    setSentMessage('');
    try {
      const response = await api.sendVerification(data.email);
      if (response.data) {
        setSentMessage('Verification code sent to your email');
      }
    } catch (err) {
      console.error('Failed to send verification:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <ProgressBar currentStep={4} totalSteps={data.userType === 'patient' ? 7 : 8} label="Security" />
          </View>

          <View style={styles.titleSection}>
            <View style={styles.iconBadge}>
              <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.iconGrad}>
                <Ionicons name="shield-checkmark" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Verification</Text>
            <Text style={styles.subtitle}>Enter the 4-digit code sent to {data.email}</Text>
          </View>

          <View style={styles.codeSection}>
            <View style={styles.codeContainer}>
              <TextInput
                style={styles.codeInput}
                placeholder="0000"
                placeholderTextColor="#CBD5E1"
                keyboardType="number-pad"
                maxLength={4}
                value={code}
                onChangeText={setCode}
                autoFocus
              />
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {sentMessage && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.successText}>{sentMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.resendButton}
              activeOpacity={0.7}
              onPress={handleResend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#2572D9" />
              ) : (
                <Text style={styles.resendText}>Didn't receive code? <Text style={styles.resendHighlight}>Resend Code</Text></Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, code.length !== 4 && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={code.length !== 4 || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={code.length === 4 ? ['#4A90E2', '#2572D9'] : ['#CBD5E1', '#CBD5E1']}
              style={styles.buttonGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Verify Account</Text>
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
  codeSection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  codeContainer: {
    width: '100%',
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 24,
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 12,
    textAlign: 'center',
  },
  resendButton: {
    marginTop: 20,
    padding: 10,
  },
  resendText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  resendHighlight: {
    color: '#2572D9',
    fontWeight: '700',
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
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    width: '100%',
  },
  successText: {
    color: '#22C55E',
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
});
