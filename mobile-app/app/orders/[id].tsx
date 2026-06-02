import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';
import SvgQRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      const res = await api.getOrderDetails(id as string);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { icon: 'time', color: '#F59E0B', label: 'Payment Pending' };
      case 'processing': return { icon: 'sync', color: '#3B82F6', label: 'Preparing Order' };
      case 'ready': return { icon: 'checkmark-circle', color: '#10B981', label: 'Ready for Pickup' };
      case 'completed': return { icon: 'bicycle', color: '#10B981', label: 'Order Completed' };
      case 'cancelled': return { icon: 'close-circle', color: '#EF4444', label: 'Cancelled' };
      default: return { icon: 'help-circle', color: '#64748B', label: status };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
      </View>
    );
  }

  const status = getStatusInfo(order?.status);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusSection}>
           <View style={[styles.statusIconBg, { backgroundColor: status.color + '15' }]}>
              <Ionicons name={status.icon as any} size={40} color={status.color} />
           </View>
           <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
           <Text style={styles.orderNo}>ID: {id?.toString().toUpperCase()}</Text>
        </View>

        <View style={styles.card}>
           <Text style={styles.cardTitle}>Pharmacy</Text>
           <View style={styles.pharmacyRow}>
              <View style={styles.itemIcon}>
                 <Ionicons name="business" size={20} color="#4A90E2" />
              </View>
              <View>
                 <Text style={styles.pharmacyName}>{order?.pharmacy_name || 'Loading...'}</Text>
                 <Text style={styles.pharmacyAddress}>{order?.pharmacy_address || 'Address not available'}</Text>
              </View>
           </View>
        </View>

        <View style={styles.card}>
           <Text style={styles.cardTitle}>Items</Text>
           {order?.items?.map((item: any, idx: number) => (
              <View key={idx} style={styles.itemRow}>
                 <Text style={styles.itemName}>{item.drug_name || 'Medication'}</Text>
                 <Text style={styles.itemPrice}>x{item.quantity} • ₦{(item.price * item.quantity).toLocaleString()}</Text>
              </View>
           ))}
           <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₦{order?.total_amount?.toLocaleString()}</Text>
           </View>
        </View>

        <View style={styles.qrSection}>
           <Text style={styles.qrTitle}>Pickup QR Code</Text>
           <Text style={styles.qrDesc}>Show this code at the pharmacy to verify your identity and collect your medications.</Text>
           <View style={styles.qrContainer}>
              <SvgQRCode value={id as string} size={180} />
           </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeHeader: { backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  statusSection: { alignItems: 'center', marginBottom: 32 },
  statusIconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statusLabel: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  orderNo: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
  pharmacyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  pharmacyName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  pharmacyAddress: { fontSize: 13, color: '#64748B', marginTop: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  itemPrice: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  totalValue: { fontSize: 20, fontWeight: '900', color: '#0D1B3A' },
  qrSection: { alignItems: 'center', padding: 32, backgroundColor: '#fff', borderRadius: 32, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1' },
  qrTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  qrDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  qrContainer: { padding: 20, backgroundColor: '#fff', borderRadius: 24, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 15 }, android: { elevation: 5 } }) }
});
