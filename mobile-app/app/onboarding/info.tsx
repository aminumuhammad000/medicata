import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../../components/onboarding/ProgressBar';

const SPECIALTIES = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 
  'General Practice', 'Gynecology', 'Neurology', 'Oncology', 
  'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 
  'Pulmonology', 'Radiology', 'Urology'
].sort();

const EXPERIENCES = Array.from({length: 40}, (_, i) => String(i + 1));

type FieldStatus = 'none' | 'valid' | 'invalid';

function InputRow({ icon, status, children }: { icon: any; status?: FieldStatus; children: React.ReactNode }) {
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
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 10,
  },
});

export default function InfoScreen() {
  const router = useRouter();
  const { data, updateData, submitPatientHealthInfo, submitDoctorProfessionalInfo, loading, error } = useOnboarding();

  // Patient state
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [genotype, setGenotype] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');

  // Doctor state
  const [license, setLicense] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  
  // Modal states
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);

  const licenseStatus: FieldStatus = license.length === 0 ? 'none' : license.length >= 4 ? 'valid' : 'invalid';
  const specialtyStatus: FieldStatus = specialty.length === 0 ? 'none' : specialty.length >= 3 ? 'valid' : 'invalid';
  const experienceStatus: FieldStatus = experience.length === 0 ? 'none' : /^\d+$/.test(experience) ? 'valid' : 'invalid';

  const isComplete = data.userType === 'patient'
    ? (dob && gender)
    : (licenseStatus === 'valid' && specialtyStatus === 'valid' && experienceStatus === 'valid');

  const handleNext = async () => {
    if (data.userType === 'patient') {
      updateData({ dob: dob.toISOString().split('T')[0], gender, allergies, conditions });
      const success = await submitPatientHealthInfo({
        date_of_birth: dob.toISOString().split('T')[0],
        gender, blood_group: bloodGroup, genotype, allergies, existing_conditions: conditions,
      });
      if (success) router.push('/onboarding/profile');
    } else if (data.userType === 'doctor') {
      updateData({ licenseNumber: license, specialties: [specialty], experience });
      const success = await submitDoctorProfessionalInfo();
      if (success) router.push('/onboarding/doctor-verify');
    }
  };

  const totalSteps = data.userType === 'patient' ? 7 : 8;
  const isPatient = data.userType === 'patient';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <ProgressBar currentStep={5} totalSteps={totalSteps} label={isPatient ? 'Health Info' : 'Professional'} />
          </View>

          <View style={styles.titleSection}>
            <View style={styles.iconBadge}>
              <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.iconGrad}>
                <Ionicons name={isPatient ? 'heart-outline' : 'ribbon-outline'} size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>{isPatient ? 'Health Information' : 'Professional Info'}</Text>
            <Text style={styles.subtitle}>
              {isPatient ? 'Tell us about your medical background' : 'Share your credentials and expertise'}
            </Text>
          </View>

          {/* PATIENT FORM */}
          {isPatient ? (
            <View style={styles.form}>
              {/* Date of Birth */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  style={[rowStyles.box, { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                  <Text style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>{dob.toLocaleDateString()}</Text>
                  <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dob} mode="date" display="default"
                    onChange={(_, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setDob(selectedDate);
                    }}
                  />
                )}
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.chipRow}>
                  {[
                    { label: 'Male', icon: 'male-outline' },
                    { label: 'Female', icon: 'female-outline' },
                    { label: 'Other', icon: 'person-outline' },
                  ].map(g => (
                    <TouchableOpacity
                      key={g.label}
                      style={[styles.chip, gender === g.label && styles.chipActive]}
                      onPress={() => setGender(g.label)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={g.icon as any}
                        size={16}
                        color={gender === g.label ? '#fff' : '#64748B'}
                      />
                      <Text style={[styles.chipText, gender === g.label && styles.chipTextActive]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Blood Group + Genotype */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Blood Group</Text>
                  <InputRow icon="water-outline">
                    <TextInput
                      style={styles.input}
                      placeholder="O+"
                      placeholderTextColor="#94A3B8"
                      value={bloodGroup}
                      onChangeText={setBloodGroup}
                    />
                  </InputRow>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Genotype</Text>
                  <InputRow icon="flask-outline">
                    <TextInput
                      style={styles.input}
                      placeholder="AA"
                      placeholderTextColor="#94A3B8"
                      value={genotype}
                      onChangeText={setGenotype}
                    />
                  </InputRow>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Allergies <Text style={styles.optional}>(optional)</Text></Text>
                <InputRow icon="alert-circle-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="Peanuts, Penicillin..."
                    placeholderTextColor="#94A3B8"
                    value={allergies}
                    onChangeText={setAllergies}
                  />
                </InputRow>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Existing Conditions <Text style={styles.optional}>(optional)</Text></Text>
                <InputRow icon="medkit-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="Asthma, Diabetes..."
                    placeholderTextColor="#94A3B8"
                    value={conditions}
                    onChangeText={setConditions}
                  />
                </InputRow>
              </View>
            </View>
          ) : (
            /* DOCTOR FORM */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Medical License No.</Text>
                  {licenseStatus === 'invalid' && <Text style={styles.hintText}>At least 4 chars</Text>}
                  {licenseStatus === 'valid' && <Text style={styles.validText}>✓ Valid</Text>}
                </View>
                <InputRow icon="shield-checkmark-outline" status={licenseStatus}>
                  <TextInput
                    style={styles.input}
                    placeholder="MD-12345678"
                    placeholderTextColor="#94A3B8"
                    value={license}
                    onChangeText={setLicense}
                  />
                </InputRow>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Specialty</Text>
                  {specialtyStatus === 'valid' && <Text style={styles.validText}>✓ Valid</Text>}
                </View>
                <TouchableOpacity onPress={() => setShowSpecModal(true)} activeOpacity={0.8}>
                  <InputRow icon="star-outline" status={specialtyStatus}>
                    <Text style={[styles.input, { textAlignVertical: 'center', paddingTop: Platform.OS === 'ios' ? 18 : 12, color: specialty ? '#0F172A' : '#94A3B8' }]}>
                      {specialty || 'Select your specialty'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                  </InputRow>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Years of Experience</Text>
                  {experienceStatus === 'valid' && <Text style={styles.validText}>✓ Valid</Text>}
                </View>
                <TouchableOpacity onPress={() => setShowExpModal(true)} activeOpacity={0.8}>
                  <InputRow icon="time-outline" status={experienceStatus}>
                    <Text style={[styles.input, { textAlignVertical: 'center', paddingTop: Platform.OS === 'ios' ? 18 : 12, color: experience ? '#0F172A' : '#94A3B8' }]}>
                      {experience ? `${experience} Years` : 'Select your experience'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                  </InputRow>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
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

      {/* Specialty Main Modal */}
      <Modal visible={showSpecModal} transparent animationType="slide" onRequestClose={() => setShowSpecModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSpecModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Specialty</Text>
              <TouchableOpacity onPress={() => setShowSpecModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList 
              data={SPECIALTIES}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={styles.modalListItem}
                  onPress={() => { setSpecialty(item); setShowSpecModal(false); }}
                >
                  <Text style={[styles.modalItemText, specialty === item && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {specialty === item && <Ionicons name="checkmark-circle" size={20} color="#2563EB" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Experience Main Modal */}
      <Modal visible={showExpModal} transparent animationType="slide" onRequestClose={() => setShowExpModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowExpModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Years of Experience</Text>
              <TouchableOpacity onPress={() => setShowExpModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList 
              data={EXPERIENCES}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={styles.modalListItem}
                  onPress={() => { setExperience(item); setShowExpModal(false); }}
                >
                  <Text style={[styles.modalItemText, experience === item && styles.modalItemTextActive]}>
                    {item} {item === '1' ? 'Year' : 'Years'}
                  </Text>
                  {experience === item && <Ionicons name="checkmark-circle" size={20} color="#2563EB" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.5 },
  optional: { fontSize: 11, color: '#94A3B8', textTransform: 'none', fontWeight: '500' },
  hintText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },
  validText: { fontSize: 11, color: '#22C55E', fontWeight: '600' },
  input: { flex: 1, fontSize: 15, color: '#0F172A', height: '100%' },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#2572D9', borderColor: '#2572D9' },
  chipText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
    borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: '#FECACA', marginTop: 8,
  },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', flex: 1 },
  footer: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 8 },
  button: { borderRadius: 18, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.75 },
  buttonGrad: { height: 54, justifyContent: 'center', alignItems: 'center' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  modalListItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemText: { fontSize: 16, color: '#334155', fontWeight: '500' },
  modalItemTextActive: { color: '#2563EB', fontWeight: '800' }
});
