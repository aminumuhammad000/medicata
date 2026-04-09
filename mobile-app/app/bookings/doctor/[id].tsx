import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState('video');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modes = [
    { id: 'video', name: 'Video', icon: 'videocam' },
    { id: 'audio', name: 'Audio', icon: 'mic' },
    { id: 'chat', name: 'Chat', icon: 'chatbubbles' },
    { id: 'in_person', name: 'In-person', icon: 'people' },
  ];

  const handleBook = async () => {
    if (!reason) return;
    
    setLoading(true);
    setError('');
    
    try {
      const scheduledAt = new Date();
      scheduledAt.setHours(9, 0, 0, 0);
      
      await api.bookConsultation({
        doctor_id: id as string,
        scheduled_at: scheduledAt.toISOString(),
        mode: mode,
        reason: reason,
        symptoms: reason,
      });
      router.replace('/(tabs)/explore');
    } catch (err: any) {
      setError(err.message || 'Failed to book consultation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.title}>Doctor Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileSection}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
            <Text style={styles.name}>Dr. Sarah Connor</Text>
            <Text style={styles.specialty}>Cardiologist • 12 years exp.</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#ff9800" />
              <Text style={styles.ratingText}>4.8 (120 reviews)</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>
              Passionate cardiologist with over 12 years of experience in treating complex heart conditions. 
              Focused on preventative care and non-invasive procedures.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consultation Mode</Text>
            <View style={styles.modesRow}>
              {modes.map((m) => (
                <TouchableOpacity 
                  key={m.id} 
                  style={[styles.modeCard, mode === m.id && styles.modeCardActive]}
                  onPress={() => setMode(m.id)}
                >
                  <Ionicons name={m.icon as any} size={20} color={mode === m.id ? '#fff' : '#4a90e2'} />
                  <Text style={[styles.modeName, mode === m.id && styles.modeNameActive]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Details</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Reason for visit or symptoms..."
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
            />
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Consultation Fee</Text>
            <Text style={styles.price}>₦15,000</Text>
          </View>
          <TouchableOpacity 
            style={[styles.bookButton, (!reason || loading) && styles.bookButtonDisabled]} 
            onPress={handleBook}
            disabled={!reason || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  specialty: {
    fontSize: 16,
    color: '#4a90e2',
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  modesRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a90e2',
    gap: 8,
  },
  modeCardActive: {
    backgroundColor: '#4a90e2',
  },
  modeName: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '600',
  },
  modeNameActive: {
    color: '#fff',
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  bookButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 2,
    alignItems: 'center',
    marginLeft: 20,
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
