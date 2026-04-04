import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ConsultationDesk() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  const handleComplete = () => {
    // In a real app, send API request
    router.replace('/doctor/dashboard');
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
          <Text style={styles.title}>Consultation Desk</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.patientCard}>
            <View style={styles.patientInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>A</Text>
              </View>
              <View>
                <Text style={styles.patientName}>Amina Muhammad</Text>
                <Text style={styles.patientMeta}>Female • 28 years • O+ Positive</Text>
              </View>
            </View>
            <View style={styles.tagRow}>
              <View style={styles.tag}><Text style={styles.tagText}>Reason: Fever</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>Mode: Video</Text></View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            <TextInput
              style={styles.input}
              placeholder="Primary diagnosis..."
              value={diagnosis}
              onChangeText={setDiagnosis}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clinical Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Detailed findings and observations..."
              multiline
              numberOfLines={6}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/doctor/prescription/create')}
            >
              <Ionicons name="medical" size={20} color="#4a90e2" />
              <Text style={styles.actionButtonText}>Add Prescription</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="flask" size={20} color="#4a90e2" />
              <Text style={styles.actionButtonText}>Request Lab Test</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.completeButton, (!notes || !diagnosis) && styles.completeButtonDisabled]} 
            onPress={handleComplete}
            disabled={!notes || !diagnosis}
          >
            <Text style={styles.completeButtonText}>Complete Consultation</Text>
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
  patientCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  patientMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tagText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
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
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    height: 150,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0e3ff',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  completeButton: {
    backgroundColor: '#4a90e2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
