import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';


export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeLength, setCodeLength] = useState(6);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const digitRefs = useRef<(TextInput | null)[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const validateEmail = (text: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  };

  const emailStatus = email.length === 0 ? 'none' : validateEmail(email) ? 'valid' : 'invalid';
  const codeStatus = code.length === 0 ? 'none' : code.length === codeLength ? 'valid' : 'invalid';
  const postResetStatus = newPassword.length === 0 ? 'none' : newPassword.length >= 6 ? 'valid' : 'invalid';

  const handleSendCode = async () => {
    if (!email) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await api.forgotPassword(email);
      
      if (response.error) {
        setError(response.error);
      } else {
        const msg = response.data?.message || 'Password reset code sent to your email';
        setMessage(msg);
        // Extract code length from message (e.g. "6-digit" → 6)
        const match = msg.match(/(\d+)[- ]?digit/i);
        const len = match ? parseInt(match[1], 10) : 6;
        setCodeLength(len);
        setDigits(Array(len).fill(''));
        digitRefs.current = Array(len).fill(null);
      }
    } catch (err) {
      setError('Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !code || !newPassword) return;
    
    setResetting(true);
    setError('');
    setMessage('');
    
    try {
      const response = await api.resetPassword(email, code, newPassword);
      
      if (response.error) {
        setError(response.error);
      } else {
        setMessage('Password reset successfully!');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    const newDigits = [...digits];
    // Only take the last entered character
    newDigits[index] = text.slice(-1);
    setDigits(newDigits);
    setCode(newDigits.join(''));
    // Auto-advance to next box
    if (text && index < codeLength - 1) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient removed for light theme */}

      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity 
            style={styles.topBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          
          <View style={styles.content}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[
                  styles.inputRow,
                  emailStatus === 'valid' && styles.inputValid,
                  emailStatus === 'invalid' && styles.inputInvalid
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={
                      emailStatus === 'valid' ? '#22C55E' :
                      emailStatus === 'invalid' ? '#EF4444' : '#94A3B8'
                    }
                  />
                  <TextInput
                    style={styles.inputInner}
                    placeholder="Ex: john@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                  {emailStatus === 'valid' && <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
                  {emailStatus === 'invalid' && <Ionicons name="close-circle" size={20} color="#EF4444" />}
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, (emailStatus !== 'valid' || loading) && styles.buttonDisabled]} 
                onPress={handleSendCode}
                disabled={emailStatus !== 'valid' || loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#2572D9', '#4A90E2']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Code</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {message && (
                <Text style={styles.successText}>{message}</Text>
              )}

              {message && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.resetTitle}>Create New Password</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Reset Code</Text>
                    <View style={styles.otpRow}>
                      {digits.map((digit, i) => (
                        <TextInput
                          key={i}
                          ref={ref => { digitRefs.current[i] = ref; }}
                          style={[
                            styles.otpBox,
                            digit ? (codeStatus === 'valid' ? styles.otpBoxValid : styles.otpBoxFilled) : styles.otpBoxEmpty
                          ]}
                          value={digit}
                          onChangeText={text => handleDigitChange(text, i)}
                          onKeyPress={e => handleDigitKeyPress(e, i)}
                          keyboardType="number-pad"
                          maxLength={1}
                          textAlign="center"
                          selectTextOnFocus
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                      style={[
                        styles.input,
                        postResetStatus === 'valid' && styles.inputValid,
                        postResetStatus === 'invalid' && styles.inputInvalid
                      ]}
                      placeholder="Enter new password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.button, (!email || !code || !newPassword || resetting) && styles.buttonDisabled]} 
                    onPress={handleResetPassword}
                    disabled={!email || !code || !newPassword || resetting}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#2572D9', '#4A90E2']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {resetting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Reset Password</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </View>
          </View>
        </ScrollView>
 
        {/* Bottom back button removed in favor of top back button */}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
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
    color: '#1E293B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    gap: 10,
  },
  inputInner: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  inputValid: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  inputInvalid: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  resetTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  successText: {
    color: '#22C55E',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '700',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpBoxEmpty: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  otpBoxFilled: {
    borderColor: '#4A90E2',
    backgroundColor: '#EFF6FF',
  },
  otpBoxValid: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  topBackButton: {
    padding: 16,
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
});
