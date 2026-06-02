import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const res = await api.getMyOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'ready': return '#10B981';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#64748B';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <Animated.View 
                key={order.id} 
                entering={FadeInDown.delay(index * 100)}
                style={styles.orderCard}
            >
              <TouchableOpacity onPress={() => router.push(`/orders/${order.id}`)}>
                <View style={styles.cardHeader}>
                  <View style={styles.orderIdent}>
                    <Text style={styles.orderNo}>Order #{order.id.toString().slice(0, 8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.pharmacyRow}>
                  <Ionicons name="business" size={16} color="#64748B" />
                  <Text style={styles.pharmacyName}>{order.pharmacy_name || 'Pharmacy'}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.itemCount}>Items: {order.items?.length || 0}</Text>
                  <Text style={styles.orderTotal}>₦{order.total_amount?.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
                <Ionicons name="cart-outline" size={60} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>When you order medications, they will appear here.</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/pharmacy/search')}>
                <Text style={styles.shopBtnText}>Browse Pharmacies</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  orderCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', ...Platform.select({ ios: { shadowColor: '#0D1B3A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }, android: { elevation: 3 } }) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderIdent: { gap: 2 },
  orderNo: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  orderDate: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  pharmacyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  pharmacyName: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  itemCount: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  orderTotal: { fontSize: 18, fontWeight: '900', color: '#0D1B3A' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  shopBtn: { backgroundColor: '#4A90E2', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 18 },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
