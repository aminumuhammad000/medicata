import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';

export default function PharmacyOrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await api.getOrderDetails(id as string);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.updateOrderStatus(id as string, newStatus);
      setOrder({ ...order, status: newStatus });
      Alert.alert("Success", `Order status updated to ${newStatus}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const statuses = ['Pending', 'Processing', 'Ready', 'PickedUp'];

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
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : order ? (
          <>
            <View style={styles.patientCard}>
              <Text style={styles.label}>Patient</Text>
              <Text style={styles.patientName}>{order.patient_name || 'Patient'}</Text>
              <Text style={styles.patientMeta}>Address: {order.delivery_address || 'N/A'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prescription Details</Text>
              <View style={styles.prescriptionBox}>
                <Text style={styles.medication}>Prescription ID: {order.prescription_id}</Text>
                <Text style={styles.dosage}>Delivery: {order.is_delivery ? 'Yes' : 'No'}</Text>
                {order.preferred_time && (
                  <Text style={styles.duration}>Preferred Time: {order.preferred_time}</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Status</Text>
              <View style={styles.statusTimeline}>
                {statuses.map((s, i) => {
                  const currentIndex = statuses.indexOf(order.status);
                  const isDone = i <= currentIndex;
                  return (
                    <TouchableOpacity 
                      key={s} 
                      style={styles.statusStep}
                      onPress={() => !updating && updateStatus(s)}
                      disabled={updating}
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
              style={[styles.fulfillBtn, order.status === 'PickedUp' && styles.fulfillBtnDisabled]}
              onPress={() => updateStatus('PickedUp')}
              disabled={order.status === 'PickedUp' || updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.fulfillBtnText}>Mark as Picked Up</Text>
              )}
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
});
