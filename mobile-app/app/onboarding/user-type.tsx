import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding, UserType } from '../../context/OnboardingContext';

export default function UserTypeScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();

  const handleSelect = (type: UserType) => {
    updateData({ userType: type });
    router.push('/onboarding/account');
  };

  const UserOption = ({ type, title, description, icon }: any) => (
    <TouchableOpacity 
      style={styles.option} 
      onPress={() => handleSelect(type)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Who are you?</Text>
      <Text style={styles.subtitle}>Select your user type to continue</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <UserOption 
          type="patient"
          title="Patient"
          description="Book consultations and manage your health"
          icon="👤"
        />
        <UserOption 
          type="doctor"
          title="Doctor"
          description="Consult patients and issue prescriptions"
          icon="⚕️"
        />
        <UserOption 
          type="pharmacy"
          title="Pharmacy"
          description="Fulfill medication orders and prescriptions"
          icon="💊"
        />
        <UserOption 
          type="admin"
          title="Admin"
          description="Verify medical licenses and manage the platform"
          icon="🏢"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
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
  scrollContent: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
