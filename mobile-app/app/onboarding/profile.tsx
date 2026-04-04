import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  
  // Common state
  const [bio, setBio] = useState('');

  // Patient state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyType, setBodyType] = useState('');

  // Doctor state
  const [hospital, setHospital] = useState('');
  const [languages, setLanguages] = useState('');

  const handleNext = () => {
    if (data.userType === 'patient') {
      updateData({ bio, height, weight, bodyType });
    } else if (data.userType === 'doctor') {
      updateData({ bio, affiliation: hospital, languages: languages.split(',').map(l => l.trim()) });
    }
    router.push('/onboarding/terms');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {data.userType === 'patient' ? 'Profile & Body Info' : 'Bio & Affiliation'}
          </Text>
          <Text style={styles.subtitle}>
            {data.userType === 'patient' 
              ? 'Tell us more about yourself for better health tracking' 
              : 'Add a professional bio and your hospital affiliation'}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Short Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us a bit about yourself..."
                multiline
                numberOfLines={4}
                value={bio}
                onChangeText={setBio}
              />
            </View>

            {data.userType === 'patient' ? (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 180"
                      keyboardType="numeric"
                      value={height}
                      onChangeText={setHeight}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 75"
                      keyboardType="numeric"
                      value={weight}
                      onChangeText={setWeight}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Body Type (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Slim, Athletic, Average"
                    value={bodyType}
                    onChangeText={setBodyType}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hospital Affiliation</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: General Hospital Lagos"
                    value={hospital}
                    onChangeText={setHospital}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Languages Spoken (Comma separated)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: English, Hausa, Yoruba"
                    value={languages}
                    onChangeText={setLanguages}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleNext}
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    backgroundColor: '#4a90e2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
