import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await api.getMyOrders();
      setOrders(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({ pathname: '/pharmacy/order/[id]', params: { id: item.id } })}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconContainer, getStatusIconStyle(item.status)]}>
          <Ionicons name="cart" size={24} color="#fff" />
        </View>
        <View style={styles.details}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
          <Text style={styles.pharmacy}>{item.pharmacy_name || 'Pharmacy'}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.badge, getStatusStyle(item.status)]}>
          <Text style={[styles.badgeText, getStatusTextStyle(item.status)]}>{item.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const getStatusStyle = (status: string) => {
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
      case 'Pending': return styles.badgeTextPending;
      case 'Processing': return styles.badgeTextProcessing;
      case 'Ready': return styles.badgeTextReady;
      case 'PickedUp': return styles.badgeTextPickedUp;
      default: return styles.badgeTextDefault;
    }
  };

  const getStatusIconStyle = (status: string) => {
    switch (status) {
      case 'Pending': return styles.iconPending;
      case 'Processing': return styles.iconProcessing;
      case 'Ready': return styles.iconReady;
      case 'PickedUp': return styles.iconPickedUp;
      default: return styles.iconDefault;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  list: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDefault: {
    backgroundColor: '#999',
  },
  iconPending: {
    backgroundColor: '#ff9800',
  },
  iconProcessing: {
    backgroundColor: '#2196f3',
  },
  iconReady: {
    backgroundColor: '#4caf50',
  },
  iconPickedUp: {
    backgroundColor: '#9e9e9e',
  },
  details: {
    marginLeft: 16,
    gap: 2,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  pharmacy: {
    fontSize: 12,
    color: '#4a90e2',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  badgeDefault: {
    backgroundColor: '#f5f5f5',
  },
  badgePending: {
    backgroundColor: '#fff3e0',
  },
  badgeProcessing: {
    backgroundColor: '#e3f2fd',
  },
  badgeReady: {
    backgroundColor: '#e8f5e9',
  },
  badgePickedUp: {
    backgroundColor: '#f5f5f5',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#999',
  },
  badgeTextDefault: {
    color: '#999',
  },
  badgeTextPending: {
    color: '#ff9800',
  },
  badgeTextProcessing: {
    color: '#2196f3',
  },
  badgeTextReady: {
    color: '#4caf50',
  },
  badgeTextPickedUp: {
    color: '#9e9e9e',
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
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
