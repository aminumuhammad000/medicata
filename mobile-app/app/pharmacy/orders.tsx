import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Orders', color: '#64748B' },
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'processing', label: 'Processing', color: '#3B82F6' },
  { value: 'ready_for_pickup', label: 'Ready', color: '#10B981' },
  { value: 'picked_up', label: 'Completed', color: '#64748B' },
];

export default function PharmacyOrders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    revenue: 0,
  });

  const fetchOrders = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await api.getMyOrders();
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Extract orders from PharmacyOrderDetails structure
      const orderData = response.data?.map((o: any) => ({
        ...o.order,
        items: o.items,
        total_amount: o.order?.total_amount || o.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0,
      })) || [];
      
      setOrders(orderData);
      calculateStats(orderData);
      filterOrders(orderData, selectedStatus, searchQuery);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data: any[]) => {
    const total = data.length;
    const pending = data.filter(o => o.status === 'pending').length;
    const processing = data.filter(o => o.status === 'processing').length;
    const completed = data.filter(o => ['picked_up', 'completed', 'delivered'].includes(o.status?.toLowerCase())).length;
    const revenue = data.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    setStats({ total, pending, processing, completed, revenue });
  };

  const filterOrders = (data: any[], status: string, query: string) => {
    let filtered = [...data];
    
    if (status !== 'all') {
      filtered = filtered.filter(o => o.status?.toLowerCase().replace(/_/g, '') === status.toLowerCase().replace(/_/g, ''));
    }
    
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(o => 
        o.patient_name?.toLowerCase().includes(lowerQuery) ||
        o.id?.toString().toLowerCase().includes(lowerQuery)
      );
    }
    
    setFilteredOrders(filtered);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders(orders, selectedStatus, searchQuery);
  }, [selectedStatus, searchQuery, orders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(true);
  }, []);

  const getStatusStyle = (status: string) => {
    const normalized = status?.toLowerCase().replace(/_/g, '');
    switch (normalized) {
      case 'pending': return { backgroundColor: '#FFFBEB', color: '#F59E0B' };
      case 'processing': return { backgroundColor: '#EFF6FF', color: '#3B82F6' };
      case 'readyforpickup':
      case 'ready': return { backgroundColor: '#ECFDF5', color: '#10B981' };
      case 'pickedup':
      case 'delivered':
      case 'completed': return { backgroundColor: '#F1F5F9', color: '#64748B' };
      default: return { backgroundColor: '#F8FAFC', color: '#64748B' };
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    const statusStyle = getStatusStyle(item.status);
    const orderId = item.id?.toString().slice(0, 8).toUpperCase() || 'UNKNOWN';
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => router.push({ pathname: '/pharmacy/order/[id]', params: { id: item.id } })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.orderIdBadge}>
              <Text style={styles.orderIdText}>#{orderId}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {item.status?.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.patientRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(item.patient_name || 'P').charAt(0)}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{item.patient_name || 'Unknown Patient'}</Text>
            <Text style={styles.patientMeta}>
              {item.is_delivery ? '🚚 Delivery' : '🏪 Pickup'}
              {item.items?.length ? ` • ${item.items.length} item${item.items.length > 1 ? 's' : ''}` : ''}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amountValue}>₦{(item.total_amount || 0).toLocaleString()}</Text>
          </View>
        </View>

        {item.delivery_address && (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color="#94A3B8" />
            <Text style={styles.addressText} numberOfLines={1}>{item.delivery_address}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.processing}</Text>
          <Text style={styles.statLabel}>Processing</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Revenue Card */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueIcon}>
          <Ionicons name="wallet-outline" size={24} color="#4F46E5" />
        </View>
        <View style={styles.revenueInfo}>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <Text style={styles.revenueValue}>₦{stats.revenue.toLocaleString()}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient name or order ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_OPTIONS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedStatus === item.value && styles.filterChipActive]}
              onPress={() => setSelectedStatus(item.value)}
            >
              <View style={[styles.filterDot, { backgroundColor: item.color }]} />
              <Text style={[styles.filterText, selectedStatus === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try adjusting your filters'
                : 'Orders will appear here when patients place them'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  revenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  revenueIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  revenueInfo: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4F46E5',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 52,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderIdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  orderDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4F46E5',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  patientMeta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D1B3A',
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addressText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
