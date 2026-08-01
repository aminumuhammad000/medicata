import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding, UserType } from '../../context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

export default function UserTypeScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();

  const handleSelect = (type: UserType) => {
    updateData({ userType: type });
    router.push('/onboarding/account');
  };

  const options: { type: UserType; title: string; description: string; icon: any; color: string; bg: string }[] = [
    {
      type: 'patient',
      title: 'Patient',
      description: 'Book consultations and manage your health records',
      icon: 'person-outline',
      color: '#2572D9',
      bg: '#EFF6FF',
    },
    {
      type: 'doctor',
      title: 'Doctor',
      description: 'Consult patients and issue e-prescriptions',
      icon: 'medkit-outline',
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
    {
      type: 'pharmacy',
      title: 'Pharmacy',
      description: 'Fulfill medication orders and manage inventory',
      icon: 'storefront-outline',
      color: '#059669',
      bg: '#ECFDF5',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.topBackButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>Select your profile type to get started</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.type}
            style={styles.option}
            onPress={() => handleSelect(opt.type)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconContainer, { backgroundColor: opt.bg }]}>
              <Ionicons name={opt.icon} size={28} color={opt.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.optionTitle}>{opt.title}</Text>
              <Text style={styles.optionDescription}>{opt.description}</Text>
            </View>
            <View style={[styles.arrowContainer, { backgroundColor: opt.bg }]}>
              <Ionicons name="chevron-forward" size={18} color={opt.color} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBackButton: {
    padding: 16,
    marginTop: 10,
    marginLeft: 10,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 14,
  },
  option: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  optionDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
