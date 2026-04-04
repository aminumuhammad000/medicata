import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';

export default function VerifyScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const [code, setCode] = useState('');

  const handleVerify = () => {
    if (code.length !== 4) return;
    // In a real app, we would call the verification API here
    router.replace('/onboarding/complete');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>Enter the 4-digit code sent to {data.phone}</Text>

          <View style={styles.codeContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="0000"
              keyboardType="number-pad"
              maxLength={4}
              value={code}
              onChangeText={setCode}
              letterSpacing={20}
              textAlign="center"
              autoFocus
            />
          </View>

          <TouchableOpacity style={styles.resendButton}>
            <Text style={styles.resendText}>Didn't receive code? <Text style={styles.resendHighlight}>Resend</Text></Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, code.length !== 4 && styles.buttonDisabled]} 
          onPress={handleVerify}
          disabled={code.length !== 4}
        >
          <Text style={styles.buttonText}>Verify Account</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  codeContainer: {
    width: '100%',
    paddingHorizontal: 40,
  },
  codeInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  resendButton: {
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendHighlight: {
    color: '#4a90e2',
    fontWeight: 'bold',
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
