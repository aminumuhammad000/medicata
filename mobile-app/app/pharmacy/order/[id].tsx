import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PharmacyOrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [status, setStatus] = useState('Processing');

  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    // In a real app, send API request
    Alert.alert("Success", `Order status updated to ${newStatus}`);
  };

  const statuses = ['Pending', 'Processing', 'Ready', 'Delivered'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Order #ORD-{id}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.patientCard}>
          <Text style={styles.label}>Patient</Text>
          <Text style={styles.patientName}>John Doe</Text>
          <Text style={styles.patientMeta}>Address: 12 Main St, Ikeja, Lagos</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescription Details</Text>
          <View style={styles.prescriptionBox}>
            <Text style={styles.medication}>Amoxicillin 500mg</Text>
            <Text style={styles.dosage}>Dosage: 1 capsule, 3 times daily</Text>
            <Text style={styles.duration}>Duration: 7 days</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.statusTimeline}>
            {statuses.map((s, i) => {
              const currentIndex = statuses.indexOf(status);
              const isDone = i <= currentIndex;
              return (
                <TouchableOpacity 
                  key={s} 
                  style={styles.statusStep}
                  onPress={() => updateStatus(s)}
                >
                  <View style={[styles.statusCircle, isDone && styles.statusCircleActive]}>
                    {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={[styles.statusLabel, isDone && styles.statusLabelActive]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.fulfillBtn, status === 'Delivered' && styles.fulfillBtnDisabled]}
          onPress={() => updateStatus('Delivered')}
          disabled={status === 'Delivered'}
        >
          <Text style={styles.fulfillBtnText}>Mark as Delivered</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  patientMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  prescriptionBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 16,
  },
  medication: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  dosage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  statusStep: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCircleActive: {
    backgroundColor: '#4caf50',
  },
  statusLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  statusLabelActive: {
    color: '#4caf50',
  },
  fulfillBtn: {
    backgroundColor: '#4a90e2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  fulfillBtnDisabled: {
    backgroundColor: '#ccc',
  },
  fulfillBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
