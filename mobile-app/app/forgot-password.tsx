import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
        setMessage(response.data?.message || 'Password reset code sent to your email');
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>
 
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: john@example.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
 
              <TouchableOpacity 
                style={[styles.button, (!email || loading) && styles.buttonDisabled]} 
                onPress={handleSendCode}
                disabled={!email || loading}
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
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={code}
                      onChangeText={setCode}
                    />
                  </View>
 
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
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
 
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back to Login</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    marginBottom: 40,
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
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  resetTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
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
  backButton: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  backText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '700',
  },
});
