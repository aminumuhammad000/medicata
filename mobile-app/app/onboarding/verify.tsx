import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
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
      router.replace('/onboarding/complete');
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
        <View style={styles.content}>
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>Enter the 4-digit code sent to {data.email}</Text>

          <View style={styles.codeContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="0000"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              keyboardType="number-pad"
              maxLength={4}
              value={code}
              onChangeText={setCode}
              letterSpacing={20}
              textAlign="center"
              autoFocus
            />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {sentMessage && (
            <Text style={styles.successText}>{sentMessage}</Text>
          )}

          <TouchableOpacity 
            style={styles.resendButton} 
            activeOpacity={0.7}
            onPress={handleResend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#4A90E2" />
            ) : (
              <Text style={styles.resendText}>Didn't receive code? <Text style={styles.resendHighlight}>Resend</Text></Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, code.length !== 4 && styles.buttonDisabled]} 
          onPress={handleVerify}
          disabled={code.length !== 4 || loading}
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
              <Text style={styles.buttonText}>Verify Account</Text>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    marginBottom: 48,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  codeContainer: {
    width: '100%',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  codeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 24,
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 24,
  },
  resendButton: {
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  resendHighlight: {
    color: '#4A90E2',
    fontWeight: '700',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  successText: {
    color: '#4CAF50',
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
