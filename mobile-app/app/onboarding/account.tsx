import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../../components/onboarding/ProgressBar';

const validateEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

type FieldStatus = 'none' | 'valid' | 'invalid';

function FieldRow({
  label,
  hint,
  icon,
  status,
  children,
}: {
  label: string;
  hint?: string;
  icon: any;
  status: FieldStatus;
  children: React.ReactNode;
}) {
  const borderColor =
    status === 'valid' ? '#22C55E' :
    status === 'invalid' ? '#EF4444' : '#E2E8F0';
  const bg =
    status === 'valid' ? '#F0FDF4' :
    status === 'invalid' ? '#FEF2F2' : '#F8FAFC';
  const iconColor =
    status === 'valid' ? '#22C55E' :
    status === 'invalid' ? '#EF4444' : '#94A3B8';

  return (
    <View style={fieldStyles.wrapper}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>{label}</Text>
        {status === 'valid' && (
          <View style={fieldStyles.validBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
            <Text style={fieldStyles.validText}>Looks good</Text>
          </View>
        )}
        {status === 'invalid' && hint && (
          <Text style={fieldStyles.hintText}>{hint}</Text>
        )}
      </View>
      <View style={[fieldStyles.inputBox, { borderColor, backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={iconColor} style={fieldStyles.inputIcon} />
        {children}
        {status === 'valid' && <Ionicons name="checkmark-circle" size={18} color="#22C55E" />}
        {status === 'invalid' && <Ionicons name="close-circle" size={18} color="#EF4444" />}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  validText: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '600',
  },
  hintText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    gap: 10,
  },
  inputIcon: {},
});

export default function AccountScreen() {
  const router = useRouter();
  const { data, updateData, register, loading, error } = useOnboarding();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const nameStatus: FieldStatus = fullName.length === 0 ? 'none' : fullName.trim().length >= 3 ? 'valid' : 'invalid';
  const emailStatus: FieldStatus = email.length === 0 ? 'none' : validateEmail(email) ? 'valid' : 'invalid';
  const passStatus: FieldStatus = password.length === 0 ? 'none' : password.length >= 6 ? 'valid' : 'invalid';

  const isComplete = nameStatus === 'valid' && emailStatus === 'valid' && passStatus === 'valid';

  const handleNext = async () => {
    if (!isComplete) return;

    if (data.userType === 'pharmacy') {
      const success = await register({ fullName, email, password, userType: 'pharmacy' });
      if (success) router.push('/onboarding/verify');
    } else {
      updateData({ fullName, email, password });
      router.push('/onboarding/contact');
    }
  };

  const totalSteps = data.userType === 'patient' ? 7 : 8;

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
          {/* Header area */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <ProgressBar currentStep={2} totalSteps={totalSteps} label="Account" />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <View style={styles.iconBadge}>
              <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.iconGrad}>
                <Ionicons name="person-add-outline" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Fill in your details to set up your profile</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <FieldRow
              label="Full Name"
              hint="At least 3 characters"
              icon="person-outline"
              status={nameStatus}
            >
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
              />
            </FieldRow>

            <FieldRow
              label="Email Address"
              hint="Enter a valid email"
              icon="mail-outline"
              status={emailStatus}
            >
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
              />
            </FieldRow>

            <FieldRow
              label="Password"
              hint="At least 6 characters"
              icon="lock-closed-outline"
              status={passStatus}
            >
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </FieldRow>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1, 2, 3].map(level => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      password.length >= level * 3 && (
                        password.length >= 9 ? styles.strengthStrong :
                        password.length >= 6 ? styles.strengthMedium :
                        styles.strengthWeak
                      )
                    ]}
                  />
                ))}
                <Text style={styles.strengthLabel}>
                  {password.length < 6 ? 'Too short' : password.length < 9 ? 'Fair' : 'Strong'}
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Next button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !isComplete && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!isComplete || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isComplete ? ['#4A90E2', '#2572D9'] : ['#CBD5E1', '#CBD5E1']}
              style={styles.buttonGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Continue</Text>
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
  form: {
    gap: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    height: '100%',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  strengthWeak: {
    backgroundColor: '#EF4444',
  },
  strengthMedium: {
    backgroundColor: '#F59E0B',
  },
  strengthStrong: {
    backgroundColor: '#22C55E',
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    minWidth: 50,
    textAlign: 'right',
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
  },
  errorText: {
    color: '#EF4444',
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
