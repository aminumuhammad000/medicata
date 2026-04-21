import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

export default function OrdersScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const [refreshing, setRefreshing] = useState(false);
  const tabs = ['All', 'Pending', 'Processing', 'Ready', 'Picked Up'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const role = await api.getUserRole();
      setUserRole(role);
      const response = await api.getMyOrders();
      setOrders(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // Map UI tab labels to backend snake_case enum values
  const tabStatusMap: Record<string, string> = {
    'Pending': 'pending',
    'Processing': 'processing',
    'Ready': 'ready_for_pickup',
    'Picked Up': 'picked_up',
  };
  const filteredOrders = activeTab === 'All'
    ? orders
    : orders.filter(o => {
        const backendStatus = (o.status || '').toLowerCase().replace(/ /g, '_');
        return backendStatus === (tabStatusMap[activeTab] || activeTab.toLowerCase());
      });

  const isPharmacy = userRole?.toLowerCase() === 'pharmacy';

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, isPharmacy && styles.pharmacyCard]}
      onPress={() => router.push({ pathname: '/pharmacy/order/[id]', params: { id: item.id } } as any)}
    >
      <View style={styles.cardInfo}>
        <View style={[styles.iconBg, getStatusIconStyle(item.status)]}>
          <Ionicons name="cart" size={24} color="#fff" />
        </View>
        <View style={styles.details}>
          <Text style={styles.orderId}>Order #ORD-{item.id.slice(0, 8)}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          <Text style={styles.userLabel}>{isPharmacy ? `From: ${item.patient_name || 'Customer'}` : `Pharmacy: ${item.pharmacy_name || 'Partner'}`}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>{item.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Pending': return styles.badgePending;
      case 'Processing': return styles.badgeProcessing;
      case 'Ready': return styles.badgeReady;
      case 'PickedUp': return styles.badgePickedUp;
      default: return styles.badgeDefault;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'Pending': return { color: '#F59E0B' };
      case 'Processing': return { color: '#3B82F6' };
      case 'Ready': return { color: '#10B981' };
      case 'PickedUp': return { color: '#64748B' };
      default: return { color: '#64748B' };
    }
  };

  const getStatusIconStyle = (status: string) => {
    switch (status) {
      case 'Pending': return { backgroundColor: '#F59E0B' };
      case 'Processing': return { backgroundColor: '#3B82F6' };
      case 'Ready': return { backgroundColor: '#10B981' };
      case 'PickedUp': return { backgroundColor: '#94A3B8' };
      default: return { backgroundColor: '#94A3B8' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isPharmacy && (
        <LinearGradient
          colors={['#0D1B3A', '#1E3A5F']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      
      <View style={styles.header}>
        <Text style={[styles.title, isPharmacy && { color: '#FFF' }]}>
          {isPharmacy ? 'Order Management' : 'My Orders'}
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab, isPharmacy && activeTab === tab && styles.pharmacyActiveTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText, isPharmacy && activeTab === tab && { color: '#FFF' }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.mainContent, isPharmacy && styles.pharmacyMainContent]}>
        {loading ? (
          <ActivityIndicator size="large" color={isPharmacy ? "#FFF" : "#4a90e2"} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={isPharmacy ? '#FFFFFF' : '#3B82F6'}
                colors={['#3B82F6']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={64} color={isPharmacy ? 'rgba(255,255,255,0.2)' : '#E2E8F0'} />
                <Text style={[styles.emptyText, isPharmacy && { color: '#94A3B8' }]}>
                  {activeTab === 'All' ? 'No orders yet' : `No ${activeTab} orders`}
                </Text>
                {isPharmacy && (
                  <Text style={styles.emptySubText}>Orders placed by patients will appear here</Text>
                )}
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 160,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTab: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  pharmacyActiveTab: {
    backgroundColor: '#0D1B3A',
    borderColor: '#0D1B3A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFF',
  },
  mainContent: {
    flex: 1,
  },
  pharmacyMainContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#F8FAFC',
    paddingTop: 8,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' },
      default: { elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10 }
    }),
  },
  pharmacyCard: {
    borderRadius: 28,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  date: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  userLabel: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '700',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  badgePending: { backgroundColor: '#FFFBEB' },
  badgeProcessing: { backgroundColor: '#EFF6FF' },
  badgeReady: { backgroundColor: '#ECFDF5' },
  badgePickedUp: { backgroundColor: '#F1F5F9' },
  badgeDefault: { backgroundColor: '#F8FAFC' },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  emptySubText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 40,
  },
});

