import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

interface UnifiedRecord {
  id: string;
  type: 'Consultation' | 'Prescription' | 'Order';
  title: string;
  date: string;
  subtitle?: string;
  status?: string;
  timestamp: number;
}

import InventoryScreen from '../pharmacy/inventory';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UnifiedTwoScreen() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      let role = await AsyncStorage.getItem('user_role');
      // Fallback to user_data.role for existing sessions
      if (!role) {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          role = user?.role?.toLowerCase() || null;
          if (role) await AsyncStorage.setItem('user_role', role);
        }
      }
      setUserRole(role?.toLowerCase() || 'patient');
      setInitLoading(false);
    };
    getRole();
  }, []);

  if (initLoading) return null;

  if (userRole === 'pharmacy') {
    return <InventoryScreen isTab={true} />;
  }

  return <RecordsScreen />;
}

function RecordsScreen() {
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      const [consultationsRes, prescriptionsRes, ordersRes] = await Promise.all([
        api.getMyConsultations(),
        api.getMyPrescriptions(),
        api.getMyOrders(),
      ]);

      const unified: UnifiedRecord[] = [];

      // Map Consultations
      if (Array.isArray(consultationsRes.data)) {
        consultationsRes.data.forEach((c: any) => {
          unified.push({
            id: c.id,
            type: 'Consultation',
            title: c.reason || 'General Consultation',
            date: new Date(c.scheduled_at).toLocaleDateString(),
            subtitle: c.doctor_name ? `Dr. ${c.doctor_name}` : 'Doctor Assigned',
            status: c.status,
            timestamp: new Date(c.scheduled_at).getTime(),
          });
        });
      }

      // Map Prescriptions
      if (Array.isArray(prescriptionsRes.data)) {
        prescriptionsRes.data.forEach((p: any) => {
          unified.push({
            id: p.id,
            type: 'Prescription',
            title: 'Prescription Record',
            date: new Date(p.created_at).toLocaleDateString(),
            subtitle: `Verified: ${p.is_verified ? 'Yes' : 'No'}`,
            timestamp: new Date(p.created_at).getTime(),
          });
        });
      }

      // Map Orders
      if (Array.isArray(ordersRes.data)) {
        ordersRes.data.forEach((o: any) => {
          unified.push({
            id: o.id,
            type: 'Order',
            title: o.pharmacy_name || 'Pharmacy Order',
            date: new Date(o.created_at).toLocaleDateString(),
            subtitle: `Status: ${o.status}`,
            status: o.status,
            timestamp: new Date(o.created_at).getTime(),
          });
        });
      }

      // Sort by date descending
      unified.sort((a, b) => b.timestamp - a.timestamp);
      setRecords(unified);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const renderRecord = ({ item }: { item: UnifiedRecord }) => (
    <TouchableOpacity style={styles.card}>
      <View style={[
        styles.iconBox, 
        { backgroundColor: item.type === 'Consultation' ? '#E3F2FD' : item.type === 'Prescription' ? '#F3E5F5' : '#E8F5E9' }
      ]}>
        <Ionicons 
          name={item.type === 'Consultation' ? 'calendar' : item.type === 'Prescription' ? 'medical' : 'cart'} 
          size={24} 
          color={item.type === 'Consultation' ? '#2196F3' : item.type === 'Prescription' ? '#9C27B0' : '#4CAF50'} 
        />
      </View>
      <View style={styles.details}>
        <View style={styles.recordHeader}>
          <Text style={[
            styles.type, 
            { color: item.type === 'Consultation' ? '#2196F3' : item.type === 'Prescription' ? '#9C27B0' : '#4CAF50' }
          ]}>{item.type}</Text>
          {item.status && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          )}
        </View>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.meta}>{item.date} {item.subtitle ? `• ${item.subtitle}` : ''}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0D1B3A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <Text style={styles.headerSubtitle}>History of your consultations and orders</Text>
      </View>
      
      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D1B3A']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="rgba(13, 27, 58, 0.1)" />
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptySubtitle}>Your medical history will appear here once you book consultations or order medicine.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0D1B3A',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(13, 27, 58, 0.5)',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...(Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      }
    }) as any),
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  type: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(13, 27, 58, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D1B3A',
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.4)',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D1B3A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(13, 27, 58, 0.5)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
