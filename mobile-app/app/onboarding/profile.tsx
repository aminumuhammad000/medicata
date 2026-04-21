import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const router = useRouter();
  const { data, updateData, submitPatientProfile, submitDoctorBio, loading, error } = useOnboarding();
  
  // Common state
  const [bio, setBio] = useState('');

  // Patient state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyType, setBodyType] = useState('');

  // Doctor state
  const [hospital, setHospital] = useState('');
  const [languages, setLanguages] = useState('');

  const handleNext = async () => {
    if (data.userType === 'patient') {
      updateData({ bio, height, weight, bodyType });
      const success = await submitPatientProfile({
        bio,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        body_type: bodyType,
        address: data.address, // Include existing address from state
      });
      if (success) {
        router.push('/onboarding/terms');
      }
    } else if (data.userType === 'doctor') {
      updateData({ bio, affiliation: hospital, languages: languages.split(',').map(l => l.trim()) });
      const success = await submitDoctorBio();
      if (success) {
        router.push('/onboarding/terms');
      }
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {data.userType === 'patient' ? 'Profile & Body Info' : 'Bio & Affiliation'}
            </Text>
            <Text style={styles.subtitle}>
              {data.userType === 'patient' 
                ? 'Tell us more about yourself for better health tracking' 
                : 'Add a professional bio and your hospital affiliation'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Short Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us a bit about yourself..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
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
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
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
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
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
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
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
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={hospital}
                    onChangeText={setHospital}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Languages Spoken (Comma separated)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: English, Hausa, Yoruba"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={languages}
                    onChangeText={setLanguages}
                  />
                </View>
              </>
            )}
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={loading}
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
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
});
