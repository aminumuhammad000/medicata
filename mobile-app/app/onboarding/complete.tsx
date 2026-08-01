import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

export default function CompleteScreen() {
  const router = useRouter();
  const { data } = useOnboarding();

  const handleFinish = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.successBadge}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
          </View>
        </View>
        
        <View style={styles.textSection}>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Welcome aboard, {data.fullName}. Your account is ready and your healthcare journey begins now.
          </Text>
        </View>
        
        <View style={styles.tutorialBox}>
          <View style={styles.tipBadge}>
            <Ionicons name="bulb" size={20} color="#2572D9" />
          </View>
          <Text style={styles.tutorial}>
            {data.userType === 'patient' 
              ? 'Start by searching for top-rated doctors in your area.'
              : data.userType === 'doctor'
              ? 'Complete your profile bio to help patients find you easily.'
              : 'Add your first products to start fulfilling local orders.'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleFinish}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#4A90E2', '#2572D9']}
            style={styles.buttonGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.buttonInner}>
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 140,
    height: 140,
  },
  successBadge: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '85%',
  },
  tutorialBox: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 24,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  tipBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorial: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 18,
    overflow: 'hidden',
    // Removed all shadows as requested
  },
  buttonGrad: {
    height: 56,
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
