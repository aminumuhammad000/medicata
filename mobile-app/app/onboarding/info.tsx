import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function InfoScreen() {
  const router = useRouter();
  const { data, updateData, submitPatientHealthInfo, submitDoctorProfessionalInfo, loading, error } = useOnboarding();
  
  // Patient state
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');

  // Doctor state
  const [license, setLicense] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');

  const handleNext = async () => {
    if (data.userType === 'patient') {
      updateData({ dob, gender, allergies, conditions });
      const success = await submitPatientHealthInfo();
      if (success) {
        router.push('/onboarding/profile');
      }
    } else if (data.userType === 'doctor') {
      updateData({ licenseNumber: license, specialties: [specialty], experience });
      const success = await submitDoctorProfessionalInfo();
      if (success) {
        router.push('/onboarding/profile');
      }
    }
  };

  const isComplete = data.userType === 'patient' 
    ? (dob && gender) 
    : (license && specialty && experience);

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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {data.userType === 'patient' ? 'Health Information' : 'Professional Info'}
            </Text>
            <Text style={styles.subtitle}>
              {data.userType === 'patient' 
                ? 'Tell us about your medical background' 
                : 'Tell us about your medical background and credentials'}
            </Text>
          </View>

          {data.userType === 'patient' ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.chipContainer}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity 
                      key={g}
                      style={[styles.chip, gender === g && styles.chipActive]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Allergies (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Peanuts, Penicillin"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={allergies}
                  onChangeText={setAllergies}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Existing Conditions (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Asthma, Diabetes"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={conditions}
                  onChangeText={setConditions}
                />
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Medical License Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: MD-12345678"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={license}
                  onChangeText={setLicense}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specialty</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Cardiologist"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={specialty}
                  onChangeText={setSpecialty}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Years of Experience</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 10"
                  keyboardType="numeric"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={experience}
                  onChangeText={setExperience}
                />
              </View>
            </View>
          )}

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.button, (!isComplete || loading) && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={!isComplete || loading}
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
              <Text style={styles.buttonText}>Next</Text>
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
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
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
  chipContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActive: {
    backgroundColor: '#2572D9',
    borderColor: '#2572D9',
  },
  chipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorText: {
    color: '#FF6B6B',
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
