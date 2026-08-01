import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../../components/onboarding/ProgressBar';

type FieldStatus = 'none' | 'valid' | 'invalid';

function InputRow({
  icon,
  status,
  children,
}: {
  icon: any;
  status?: FieldStatus;
  children: React.ReactNode;
}) {
  const borderColor = status === 'valid' ? '#22C55E' : status === 'invalid' ? '#EF4444' : '#E2E8F0';
  const bg = status === 'valid' ? '#F0FDF4' : status === 'invalid' ? '#FEF2F2' : '#F8FAFC';
  const iconColor = status === 'valid' ? '#22C55E' : status === 'invalid' ? '#EF4444' : '#94A3B8';
  return (
    <View style={[rowStyles.box, { borderColor, backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
      {children}
      {status === 'valid' && <Ionicons name="checkmark-circle" size={18} color="#22C55E" />}
      {status === 'invalid' && <Ionicons name="close-circle" size={18} color="#EF4444" />}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    gap: 10,
  },
});

export default function ContactScreen() {
  const router = useRouter();
  const { data, updateData, register, loading, error } = useOnboarding();
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);

  const phoneStatus: FieldStatus = phone.length === 0 ? 'none' : phone.length >= 7 ? 'valid' : 'invalid';
  const waStatus: FieldStatus = sameAsPhone ? 'none' : whatsapp.length === 0 ? 'none' : whatsapp.length >= 7 ? 'valid' : 'invalid';
  const addressStatus: FieldStatus = address.length === 0 ? 'none' : address.length >= 5 ? 'valid' : 'invalid';

  const isComplete = phoneStatus === 'valid' && addressStatus === 'valid';

  const handleNext = async () => {
    if (!isComplete) return;
    const updatedData = { ...data, phone, whatsapp: sameAsPhone ? phone : whatsapp, address };
    updateData(updatedData);
    const success = await register(updatedData);
    if (success) {
      if (data.userType === 'pharmacy') {
        router.push('/onboarding/pharmacy-info');
      } else if (data.userType === 'doctor') {
        router.push('/onboarding/info');
      } else {
        router.push('/onboarding/verify');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <ProgressBar currentStep={3} totalSteps={data.userType === 'patient' ? 7 : 8} label="Contact" />
          </View>

          <View style={styles.titleSection}>
            <View style={styles.iconBadge}>
              <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.iconGrad}>
                <Ionicons name="call-outline" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Contact Details</Text>
            <Text style={styles.subtitle}>
              How can we and your {data.userType === 'patient' ? 'doctor' : 'patients'} reach you?
            </Text>
          </View>

          <View style={styles.form}>
            {/* Phone */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Phone Number</Text>
                {phoneStatus === 'invalid' && <Text style={styles.hintText}>Too short</Text>}
                {phoneStatus === 'valid' && <Text style={styles.validText}>✓ Looks good</Text>}
              </View>
              <InputRow icon="call-outline" status={phoneStatus}>
                <TextInput
                  style={styles.input}
                  placeholder="+234 800 000 0000"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                />
              </InputRow>
            </View>

            {/* WhatsApp */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>WhatsApp Number</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Same as phone</Text>
                  <Switch
                    value={sameAsPhone}
                    onValueChange={setSameAsPhone}
                    trackColor={{ false: '#E2E8F0', true: '#2572D9' }}
                    thumbColor={sameAsPhone ? '#4A90E2' : '#fff'}
                  />
                </View>
              </View>
              {!sameAsPhone && (
                <InputRow icon="logo-whatsapp" status={waStatus}>
                  <TextInput
                    style={styles.input}
                    placeholder="+234 800 000 0000"
                    keyboardType="phone-pad"
                    placeholderTextColor="#94A3B8"
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                  />
                </InputRow>
              )}
              {sameAsPhone && (
                <View style={[rowStyles.box, { borderColor: '#E2E8F0', backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="logo-whatsapp" size={18} color="#94A3B8" />
                  <Text style={{ flex: 1, color: '#94A3B8', fontSize: 15 }}>Same as phone number</Text>
                </View>
              )}
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {data.userType === 'doctor' ? 'Clinic / Hospital Address' : 'Residence Address'}
                </Text>
                {addressStatus === 'invalid' && <Text style={styles.hintText}>Too short</Text>}
                {addressStatus === 'valid' && <Text style={styles.validText}>✓ Looks good</Text>}
              </View>
              <View style={[
                styles.textAreaBox,
                addressStatus === 'valid' && { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
                addressStatus === 'invalid' && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
              ]}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={addressStatus === 'valid' ? '#22C55E' : addressStatus === 'invalid' ? '#EF4444' : '#94A3B8'}
                  style={{ marginTop: 4 }}
                />
                <TextInput
                  style={[styles.input, { flex: 1, height: 80, textAlignVertical: 'top', paddingTop: 0 }]}
                  placeholder="Enter your full address"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </ScrollView>

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
              {loading ? <ActivityIndicator color="#fff" /> : (
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 8, marginBottom: 8 },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
  },
  titleSection: { alignItems: 'flex-start', paddingVertical: 16, gap: 4 },
  iconBadge: { width: 48, height: 48, borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  iconGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'left', lineHeight: 20, maxWidth: '90%' },
  form: { gap: 14 },
  inputGroup: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.5 },
  hintText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },
  validText: { fontSize: 11, color: '#22C55E', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  input: { flex: 1, fontSize: 15, color: '#0F172A', height: '100%' },
  textAreaBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 10,
    borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', minHeight: 90,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    gap: 8, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', flex: 1 },
  footer: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 8 },
  button: { borderRadius: 18, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.75 },
  buttonGrad: { height: 54, justifyContent: 'center', alignItems: 'center' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
