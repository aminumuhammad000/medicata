import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ContactScreen() {
  const router = useRouter();
  const { data, updateData, register, loading, error } = useOnboarding();
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);

  const handleNext = async () => {
    const updatedData = { 
      ...data,
      phone, 
      whatsapp: sameAsPhone ? phone : whatsapp, 
      address 
    };
    
    updateData(updatedData);
    
    // Register after collecting phone number
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

  const isComplete = phone && address;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0D1B3A', '#1E3A5F', '#2572D9']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Contact Details</Text>
          <Text style={styles.subtitle}>How can we and your {data.userType === 'patient' ? 'doctor' : 'patients'} reach you?</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: +234 800 000 0000"
              keyboardType="phone-pad"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.whatsappHeader}>
            <Text style={styles.label}>WhatsApp Number</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Same as phone</Text>
              <Switch 
                value={sameAsPhone} 
                onValueChange={setSameAsPhone}
                trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#2572D9' }}
                thumbColor={sameAsPhone ? '#4A90E2' : 'rgba(255, 255, 255, 0.5)'}
              />
            </View>
          </View>

          {!sameAsPhone && (
            <TextInput
              style={styles.input}
              placeholder="Ex: +234 800 000 0000"
              keyboardType="phone-pad"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={whatsapp}
              onChangeText={setWhatsapp}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{data.userType === 'doctor' ? 'Clinic/Hospital Address' : 'Residence Address'}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your full address"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[styles.button, !isComplete && styles.buttonDisabled]} 
        onPress={handleNext}
        disabled={!isComplete}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#2572D9', '#4A90E2']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.buttonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
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
    height: 100,
    textAlignVertical: 'top',
  },
  whatsappHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
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
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
