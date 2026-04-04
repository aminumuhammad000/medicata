import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';

export default function ContactScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);

  const handleNext = () => {
    if (!phone || !address) return;
    updateData({ 
      phone, 
      whatsapp: sameAsPhone ? phone : whatsapp, 
      address 
    });
    router.push('/onboarding/info');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Contact Details</Text>
        <Text style={styles.subtitle}>How can we and your {data.userType === 'patient' ? 'doctor' : 'patients'} reach you?</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: +234 800 000 0000"
              keyboardType="phone-pad"
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
                trackColor={{ false: '#eee', true: '#4a90e2' }}
              />
            </View>
          </View>

          {!sameAsPhone && (
            <TextInput
              style={styles.input}
              placeholder="Ex: +234 800 000 0000"
              keyboardType="phone-pad"
              value={whatsapp}
              onChangeText={setWhatsapp}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{data.userType === 'doctor' ? 'Clinic/Hospital Address' : 'Residence Address'}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your full address"
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[styles.button, (!phone || !address) && styles.buttonDisabled]} 
        onPress={handleNext}
        disabled={!phone || !address}
      >
        <Text style={styles.buttonText}>Next</Text>
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
    height: 100,
    textAlignVertical: 'top',
  },
  whatsappHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 12,
    color: '#666',
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
