import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function PrescriptionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    loadPrescription();
  }, [id]);

  const loadPrescription = async () => {
    try {
      const data = await api.getPrescriptionDetails(id as string);
      setPrescription(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      await api.sharePrescription(id as string, 'pharmacy');
      Alert.alert('Success', 'Prescription shared successfully');
      loadPrescription();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to share prescription');
    } finally {
      setSharing(false);
    }
  };

  const handleReorder = async () => {
    setReordering(true);
    try {
      await api.reorderPrescription(id as string);
      Alert.alert('Success', 'Prescription reordered successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reorder prescription');
    } finally {
      setReordering(false);
    }
  };

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
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : prescription ? (
          <>
            <View style={styles.qrCard}>
              <Text style={styles.qrTitle}>Digital Prescription</Text>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={150} color="#1a1a1a" />
              </View>
              <Text style={styles.qrId}>ID: {prescription.id}</Text>
              <Text style={styles.qrNote}>Present this QR code at the pharmacy</Text>
            </View>

            {prescription.items && prescription.items.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medication</Text>
                {prescription.items.map((item: any, index: number) => {
                  return (
                    <View key={index} style={styles.drugCard}>
                      <Text style={styles.drugName}>{item.drug_name || 'Medication'}</Text>
                      <View style={styles.dosageRow}>
                        <View style={styles.dosageItem}>
                          <Text style={styles.dosageLabel}>Dosage</Text>
                          <Text style={styles.dosageValue}>{item.dosage}</Text>
                        </View>
                        <View style={styles.dosageItem}>
                          <Text style={styles.dosageLabel}>Frequency</Text>
                          <Text style={styles.dosageValue}>{item.frequency}</Text>
                        </View>
                        <View style={styles.dosageItem}>
                          <Text style={styles.dosageLabel}>Duration</Text>
                          <Text style={styles.dosageValue}>{item.duration_days} Days</Text>
                        </View>
                      </View>
                      {item.instructions && (
                        <Text style={styles.instructions}>{item.instructions}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{prescription.is_verified ? 'Verified' : 'Pending'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Shared</Text>
                <Text style={styles.infoValue}>{prescription.is_shared ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{new Date(prescription.created_at).toLocaleDateString()}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.actionButton, prescription.is_shared && styles.actionButtonDisabled]}
                onPress={handleShare}
                disabled={prescription.is_shared || sharing}
              >
                {sharing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="share-social" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Share</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleReorder}
                disabled={reordering}
              >
                {reordering ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Reorder</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.orderButton}
              onPress={() => router.push('/pharmacy/search')}
            >
              <Ionicons name="cart" size={20} color="#fff" />
              <Text style={styles.orderButtonText}>Order from Pharmacy</Text>
            </TouchableOpacity>
          </>
        ) : null}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
