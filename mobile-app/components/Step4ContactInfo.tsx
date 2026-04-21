import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

interface Step4ContactInfoProps {
  onComplete: () => void;
}

export default function Step4ContactInfo({ onComplete }: Step4ContactInfoProps) {
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!phone) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // We'll use a generic update profile call or a specific pharmacy info update
      // Based on the schema, these fields go into the users table
      const response = await api.updatePatientProfile({
        phone_number: phone,
        whatsapp_number: whatsapp,
        address: address,
      } as any);

      if (response.error) {
        setError(response.error);
      } else {
        onComplete();
      }
    } catch (err) {
      setError('Failed to update contact information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(13, 27, 58, 0.95)', 'rgba(30, 58, 95, 0.98)']}
        style={styles.container}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="call" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Contact Information</Text>
            <Text style={styles.subtitle}>Step 4: Complete your pharmacy profile to start accepting orders</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number (Required)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="phone-portrait-outline" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: +234 800 000 0000"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>WhatsApp Number (Recommended)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="logo-whatsapp" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: +234 800 000 0000"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  keyboardType="phone-pad"
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Physical Address (Optional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter pharmacy address"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  numberOfLines={2}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <TouchableOpacity 
              style={[styles.button, (!phone || loading) && styles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={!phone || loading}
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
                  <Text style={styles.buttonText}>Complete Onboarding</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inner: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#2572D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
});
