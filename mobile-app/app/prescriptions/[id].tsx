import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../services/api';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function PrescriptionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    loadPrescription();
  }, [id]);

  const loadPrescription = async () => {
    try {
      const response = await api.getPrescriptionDetails(id as string);
      if (response.data) {
        setPrescription(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!viewShotRef.current) return;
    
    setExporting(true);
    try {
      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Prescription Card',
          UTI: 'public.png'
        });
      } else {
        Alert.alert('Success', 'Prescription card captured. Sharing not available.');
      }
    } catch (err: any) {
      console.error('Export error:', err);
      Alert.alert('Error', 'Failed to generate prescription card');
    } finally {
      setExporting(false);
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
    Alert.alert(
      "Confirm Reorder",
      "This will create a new pharmacy order with the items from this prescription. Would you like to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Reorder",
          onPress: async () => {
            setReordering(true);
            try {
              // Note: We need a pharmacy to order from. 
              // For "Buy Again", we'll redirect to pharmacy search with this prescription pre-selected
              // This is the most robust UX so they can choose a pharmacy that has stock.
              router.push({
                pathname: '/pharmacy/search',
                params: { prescription_id: id as string }
              });
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to initiate reorder');
            } finally {
              setReordering(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Prescription Details</Text>
        <TouchableOpacity onPress={handleExport} disabled={exporting || loading}>
          {exporting ? (
            <ActivityIndicator size="small" color="#4a90e2" />
          ) : (
            <Ionicons name="download-outline" size={24} color="#4a90e2" />
          )}
        </TouchableOpacity>
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
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={styles.exportContainer}>
              <View style={styles.qrCard}>
                <View style={styles.brandRow}>
                  <Ionicons name="medical" size={24} color="#4a90e2" />
                  <Text style={styles.brandName}>MEDICATA</Text>
                </View>
                <Text style={styles.qrTitle}>Digital Prescription</Text>
                <View style={styles.qrPlaceholder}>
                  <QRCode
                    value={prescription?.prescription?.qr_code_token || prescription?.prescription?.id}
                    size={150}
                    color="#1a1a1a"
                    backgroundColor="#fff"
                  />
                </View>
                <Text style={styles.qrId}>ID: {prescription?.prescription?.id?.slice(0, 13).toUpperCase()}...</Text>
                <Text style={styles.qrNote}>Present this QR code at the pharmacy</Text>
              </View>

              {prescription.items && prescription.items.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Medication</Text>
                  {prescription.items.map((wrapper: any, index: number) => {
                    const { item, drug } = wrapper;
                    return (
                      <View key={index} style={styles.drugCard}>
                        <Text style={styles.drugName}>{drug?.name || 'Medication'}</Text>
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
                  <Text style={styles.infoLabel}>Patient</Text>
                  <Text style={styles.infoValue}>{prescription?.prescription?.patient_name || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Doctor</Text>
                  <Text style={styles.infoValue}>Dr. {prescription?.prescription?.doctor_name || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>{prescription?.prescription?.is_verified ? 'Verified' : 'Pending'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{prescription?.prescription?.created_at ? new Date(prescription.prescription.created_at).toLocaleDateString() : 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expires</Text>
                  <Text style={[styles.infoValue, { color: '#ef4444' }]}>{prescription?.prescription?.expiry_date ? new Date(prescription.prescription.expiry_date).toLocaleDateString() : 'N/A'}</Text>
                </View>
              </View>
            </ViewShot>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.actionButton, prescription?.prescription?.is_shared && styles.actionButtonDisabled]}
                onPress={handleShare}
                disabled={prescription?.prescription?.is_shared || sharing}
              >
                {sharing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="share-social" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Link Pharmacy</Text>
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
    backgroundColor: '#f8fafc',
  },
  exportContainer: {
    backgroundColor: '#f8fafc',
    padding: 2, // Slight padding for clean capture
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D1B3A',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    padding: 20,
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      }
    })
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  qrId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  qrNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drugCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 12,
  },
  drugName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  dosageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  dosageItem: {
    alignItems: 'flex-start',
  },
  dosageLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dosageValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  instructions: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  orderButton: {
    backgroundColor: '#0D1B3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    marginBottom: 40,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
