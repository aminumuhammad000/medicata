import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function OrdersScreen({ isTab = false }: { isTab?: boolean }) {
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
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'ready': return '#10B981';
      case 'ready_for_pickup': return '#10B981';
      case 'completed': return '#10B981';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#64748B';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  }

  const content = (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
    >
      {orders.length > 0 ? (
        orders.map((order, index) => (
          <Animated.View 
              key={order.id} 
              entering={FadeInDown.delay(index * 100)}
              style={styles.orderCard}
          >
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => router.push(`/orders/${order.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.orderIdent}>
                  <Text style={styles.orderNo}>Order #{order.id.toString().slice(0, 8).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '10' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.pharmacyRow}>
                <Ionicons name="business" size={14} color="#64748B" />
                <Text style={styles.pharmacyName}>{order.pharmacy_name || 'Pharmacy'}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.itemCount}>{order.items?.length || 0} Items</Text>
                <Text style={styles.orderTotal}>₦{order.total_amount?.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
              <Ionicons name="cart-outline" size={48} color="#E2E8F0" />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>When you place an order, it will appear here for tracking.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/pharmacy/search')}>
              <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  if (isTab) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Order History</Text>
        </View>
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 38 }} />
      </View>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    backgroundColor: '#F8FAFC', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  scrollContent: { 
    padding: 16, 
    paddingBottom: 40 
  },
  orderCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9'
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 10 
  },
  orderIdent: { 
    gap: 1 
  },
  orderNo: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  orderDate: { 
    fontSize: 11, 
    color: '#94A3B8', 
    fontWeight: '700' 
  },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  statusText: { 
    fontSize: 9, 
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  pharmacyRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 12 
  },
  pharmacyName: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#64748B' 
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#F8FAFC', 
    paddingTop: 12 
  },
  itemCount: { 
    fontSize: 12, 
    color: '#94A3B8', 
    fontWeight: '700' 
  },
  orderTotal: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#0F172A' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 80, 
    paddingHorizontal: 40 
  },
  emptyIconBg: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#0F172A', 
    marginBottom: 8 
  },
  emptySubtitle: { 
    fontSize: 13, 
    color: '#94A3B8', 
    textAlign: 'center', 
    lineHeight: 18, 
    marginBottom: 24,
    fontWeight: '600',
  },
  shopBtn: { 
    backgroundColor: '#2563EB', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 14 
  },
  shopBtnText: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: '800' 
  },
});
