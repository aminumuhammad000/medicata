import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';

export default function InfoScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  
  // Patient state
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');

  // Doctor state
  const [license, setLicense] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');

  const handleNext = () => {
    if (data.userType === 'patient') {
      updateData({ dob, gender, allergies, conditions });
    } else if (data.userType === 'doctor') {
      updateData({ licenseNumber: license, specialties: [specialty], experience });
    }
    router.push('/onboarding/profile');
  };

  const isComplete = data.userType === 'patient' 
    ? (dob && gender) 
    : (license && specialty && experience);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {data.userType === 'patient' ? 'Health Information' : 'Professional Info'}
          </Text>
          <Text style={styles.subtitle}>
            {data.userType === 'patient' 
              ? 'Tell us about your medical background' 
              : 'Tell us about your medical background and credentials'}
          </Text>

          {data.userType === 'patient' ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
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
                  value={allergies}
                  onChangeText={setAllergies}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Existing Conditions (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Asthma, Diabetes"
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
                  value={license}
                  onChangeText={setLicense}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specialty</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Cardiologist"
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
                  value={experience}
                  onChangeText={setExperience}
                />
              </View>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.button, !isComplete && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={!isComplete}
        >
          <Text style={styles.buttonText}>Next</Text>
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
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
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
