import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function PharmacyDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pharmacyName, setPharmacyName] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0 });
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchData = async () => {
    try {
      const [profileRes, ordersRes, notifRes] = await Promise.all([
        api.getMyProfile(),
        api.getMyOrders(),
        api.getMyNotifications()
      ]);

      if (profileRes.data) {
        setPharmacyName(profileRes.data.pharmacy_name || profileRes.data.full_name);
        
        // Redirect to onboarding if pharmacy info is missing
        if (!profileRes.data.pharmacy_name || !profileRes.data.pharmacy_address || !profileRes.data.pharmacy_license) {
          console.log('Pharmacy profile incomplete, redirecting to onboarding...');
          router.replace('/onboarding/pharmacy-info');
          return;
        }
      }

      if (ordersRes.data) {
        // Extract orders from the nested structure (PharmacyOrderDetails has order + items)
        const orderData = ordersRes.data.map((o: any) => o.order || o);
        setOrders(orderData);
        calculateStats(orderData);
      }

      if (notifRes.data) {
        const unread = notifRes.data.filter((n: any) => !n.is_read).length;
        setUnreadNotifications(unread);
      }
    } catch (error) {
      console.error('Error fetching pharmacy dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data: any[]) => {
    const pending = data.filter(o => ['pending', 'processing', 'ready_for_pickup'].includes(o.status?.toLowerCase())).length;
    const completed = data.filter(o => ['completed', 'fulfilled', 'picked_up', 'delivered'].includes(o.status?.toLowerCase())).length;
    setStats({ pending, completed });
  };

  const getStatusStyle = (status: string) => {
    const normalized = status?.toLowerCase().replace(/_/g, '');
    switch (normalized) {
      case 'pending':
        return { bg: '#FFFBEB', text: '#F59E0B' };
      case 'processing':
        return { bg: '#EFF6FF', text: '#3B82F6' };
      case 'readyforpickup':
      case 'ready':
        return { bg: '#ECFDF5', text: '#10B981' };
      case 'pickedup':
      case 'delivered':
      case 'completed':
        return { bg: '#F1F5F9', text: '#64748B' };
      default:
        return { bg: '#FFFBEB', text: '#F59E0B' };
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderOrder = ({ item }: { item: any }) => {
    const statusStyle = getStatusStyle(item.status);
    const canFulfill = ['pending', 'processing', 'ready_for_pickup'].includes(item.status?.toLowerCase());
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => router.push({ pathname: '/pharmacy/order/[id]', params: { id: item.id } })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.patientInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.patient_name || 'P').charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.patientName}>{item.patient_name || 'Unknown Patient'}</Text>
              <Text style={styles.orderMeta}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.is_delivery ? '🚚 Delivery' : '🏪 Pickup'}
              </Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {item.status?.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        
        {item.total_amount > 0 && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>₦{item.total_amount.toLocaleString()}</Text>
          </View>
        )}
        
        {canFulfill && (
          <View style={styles.orderFooter}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => router.push({ pathname: '/pharmacy/order/[id]', params: { id: item.id } })}
            >
              <Text style={styles.actionBtnText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.primaryBtn]}
              onPress={() => router.push({ pathname: '/pharmacy/order/[id]', params: { id: item.id } })}
            >
              <Text style={styles.primaryBtnText}>Process Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{pharmacyName || 'Medicare Pharmacy'}</Text>
            <Text style={styles.subtitle}>Manage incoming orders</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications" size={24} color="#1a1a1a" />
            {unreadNotifications > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#F59E0B' }]}>{stats.pending}</Text>
            <Text style={styles.statLab}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#10B981' }]}>{stats.completed}</Text>
            <Text style={styles.statLab}>Completed</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/pharmacy/scan')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="scan" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionText}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/pharmacy/inventory')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="cube" size={24} color="#10B981" />
            </View>
            <Text style={styles.quickActionText}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/pharmacy/orders')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="list" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.quickActionText}>All Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/pharmacy/search')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="search" size={24} color="#9333EA" />
            </View>
            <Text style={styles.quickActionText}>Search</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Incoming Orders</Text>
            <TouchableOpacity onPress={() => router.push('/pharmacy/orders')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {orders.length > 0 ? (
            <FlatList
              data={orders}
              renderItem={renderOrder}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          )}
        </View>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  stats: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLab: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a90e2',
  },
  list: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#9c27b0',
    fontWeight: 'bold',
  },
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  orderMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fff8e1',
  },
  badgeProcessing: {
    backgroundColor: '#e3f2fd',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffa000',
  },
  badgeTextProcessing: {
    color: '#2196f3',
  },
  badgeCompleted: {
    backgroundColor: '#e8f5e9',
  },
  badgeTextCompleted: {
    color: '#4caf50',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  amountLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D1B3A',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  orderFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  primaryBtn: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});
