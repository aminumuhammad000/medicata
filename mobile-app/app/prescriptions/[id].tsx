import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PrescriptionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Prescription Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Digital Prescription</Text>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={150} color="#1a1a1a" />
          </View>
          <Text style={styles.qrId}>ID: MED-9922-X82</Text>
          <Text style={styles.qrNote}>Present this QR code at the pharmacy</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication</Text>
          <View style={styles.drugCard}>
            <Text style={styles.drugName}>Amoxicillin 500mg</Text>
            <View style={styles.dosageRow}>
              <View style={styles.dosageItem}>
                <Text style={styles.dosageLabel}>Dosage</Text>
                <Text style={styles.dosageValue}>1 Capsule</Text>
              </View>
              <View style={styles.dosageItem}>
                <Text style={styles.dosageLabel}>Frequency</Text>
                <Text style={styles.dosageValue}>3x Daily</Text>
              </View>
              <View style={styles.dosageItem}>
                <Text style={styles.dosageLabel}>Duration</Text>
                <Text style={styles.dosageValue}>7 Days</Text>
              </View>
            </View>
            <Text style={styles.instructions}>Take after meals. Finish the entire course.</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prescribed by</Text>
            <Text style={styles.infoValue}>Dr. Sarah Connor</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>June 15, 2026</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expiry Date</Text>
            <Text style={styles.infoValue}>Sept 15, 2026</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.orderButton}
          onPress={() => router.push('/pharmacy/search')}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.orderButtonText}>Order from Pharmacy</Text>
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
  qrCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#eee',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  qrId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  qrNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
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
  drugCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
  },
  drugName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  dosageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dosageItem: {
    alignItems: 'center',
  },
  dosageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dosageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  instructions: {
    fontSize: 14,
    color: '#444',
    fontStyle: 'italic',
  },
  infoSection: {
    marginBottom: 32,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  orderButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
