import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';

export default function PrescriptionDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadPrescription();
  }, [id]);

  const loadPrescription = async () => {
    try {
      if (id) {
        const res = await api.getPrescriptionDetails(id);
        if (res.data) {
          setData(res.data);
        }
      }
    } catch (error) {
      console.error('Failed to load prescription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ff3b30" />
        <Text style={styles.errorText}>Prescription not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { prescription, items = [] } = data || {};
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${prescription?.qr_code_token || 'N/A'}&size=200x200&bgcolor=ffffff`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Digital Prescription</Text>
        <TouchableOpacity onPress={() => alert('Download starting...')}>
          <Ionicons name="download-outline" size={24} color="#4a90e2" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.qrSection}>
          <View style={styles.qrFrame}>
            <Image source={{ uri: qrUrl }} style={styles.qrImage} />
          </View>
          <Text style={styles.qrHint}>Show this QR code at any partner pharmacy</Text>
          <Text style={styles.refId}>Ref: {prescription?.qr_code_token ? prescription.qr_code_token.slice(0, 8).toUpperCase() : 'N/A'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardHeader}>Medications</Text>
          {items.map((item: any) => (
            <View key={item.id} style={styles.medItem}>
              <View style={styles.medIcon}>
                <Ionicons name="medical" size={20} color="#4a90e2" />
              </View>
              <View style={styles.medDetails}>
                <Text style={styles.medName}>{item.drug.name}</Text>
                <Text style={styles.medMeta}>{item.item.dosage} • {item.item.frequency}</Text>
                <Text style={styles.medPeriod}>For {item.item.duration_days} days ({item.item.quantity} units)</Text>
                {item.item.instructions ? (
                  <Text style={styles.medInst}>{item.item.instructions}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.doctorCard}>
          <Text style={styles.cardHeader}>Issued By</Text>
          <View style={styles.docInfo}>
            <View style={styles.docAvatar}>
              <Text style={styles.docAvatarText}>D</Text>
            </View>
            <View>
              <Text style={styles.docName}>Dr. {prescription.doctor_name || 'Medical Specialist'}</Text>
              <Text style={styles.docMeta}>Valid until: {new Date(prescription.expiry_date).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.orderBtn}
          onPress={() => router.push({ pathname: '/patient/pharmacies', params: { prescriptionId: id } })}
        >
          <Text style={styles.orderBtnText}>Find Pharmacy & Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  qrSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  qrFrame: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrHint: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  refId: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#bbb',
    letterSpacing: 2,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  medItem: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  medIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medDetails: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  medMeta: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '600',
    marginTop: 2,
  },
  medPeriod: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  medInst: {
    marginTop: 8,
    fontSize: 13,
    color: '#888',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    fontStyle: 'italic',
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  docName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  docMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  orderBtn: {
    backgroundColor: '#1a1a1a',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  orderBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  backBtn: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  backBtnText: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});
