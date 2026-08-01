import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Dimensions, Image } from 'react-native';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const validateEmail = (text: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  };

  const emailStatus = email.length === 0 ? 'none' : validateEmail(email) ? 'valid' : 'invalid';
  const passwordStatus = password.length === 0 ? 'none' : password.length >= 6 ? 'valid' : 'invalid';


  const handleLogin = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.login(email, password);
      
      if (response.error) {
        setError(response.error);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient removed for clean white theme */}

      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity 
              style={styles.topBackButton}
              onPress={() => router.replace('/onboarding/welcome')}
            >
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            
            <View style={styles.content}>
              <View style={styles.headerSection}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('../assets/logo.png')} 
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Medicata</Text>
                <Text style={styles.subtitle}>Your Health, Our Priority. Login to access your portal.</Text>
              </View>
   
              <View style={styles.form}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={[
                    styles.inputContainer,
                    emailFocused && styles.inputFocused,
                    emailStatus === 'valid' && styles.inputValid,
                    emailStatus === 'invalid' && styles.inputInvalid
                  ]}>
                    <Ionicons name="mail-outline" size={20} color={emailFocused ? '#4A90E2' : '#94A3B8'} />
                    <TextInput
                      style={styles.input}
                      placeholder="john@example.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>
                </View>
   
                <View style={styles.inputWrapper}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[
                    styles.inputContainer,
                    passwordFocused && styles.inputFocused,
                    passwordStatus === 'valid' && styles.inputValid,
                    passwordStatus === 'invalid' && styles.inputInvalid
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? '#4A90E2' : '#94A3B8'} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#94A3B8" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
   
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
    
              <TouchableOpacity 
                style={[styles.button, (!email || !password || loading) && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={!email || !password || loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4A90E2', '#2572D9']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <Text style={styles.buttonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
   
              <View style={styles.footer}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/onboarding/welcome')}>
                  <Text style={styles.signupHighlight}> Create Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      }
    })
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 60,
  },
  inputFocused: {
    borderColor: '#4A90E2',
    backgroundColor: '#F1F5F9',
  },
  inputValid: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  inputInvalid: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#0F172A',
    height: '100%',
  },
  forgotText: {
    color: '#4A90E2',
    fontSize: 13,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#2572D9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  signupText: {
    fontSize: 15,
    color: '#64748B',
  },
  signupHighlight: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '800',
  },
  topBackButton: {
    padding: 16,
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
});
