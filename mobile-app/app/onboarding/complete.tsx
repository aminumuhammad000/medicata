import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';

export default function CompleteScreen() {
  const router = useRouter();
  const { data } = useOnboarding();

  const handleFinish = () => {
    // In a real app, redirect to the relevant dashboard
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Text style={styles.icon}>✅</Text>
        </View>
        <Text style={styles.title}>All Set!</Text>
        <Text style={styles.subtitle}>
          Welcome to Medicata, {data.fullName}. Your account has been verified and you're ready to go.
        </Text>
        
        {data.userType === 'patient' ? (
          <Text style={styles.tutorial}>
            Tip: You can now search for doctors by specialty and book your first consultation.
          </Text>
        ) : (
          <Text style={styles.tutorial}>
            Tip: Complete your profile settings to start receiving patient consultations.
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleFinish}
      >
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  tutorial: {
    fontSize: 14,
    color: '#4a90e2',
    textAlign: 'center',
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
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
