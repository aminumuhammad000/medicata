import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

import OrdersScreen from '../orders/index';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ExploreScreen() {
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
    return <OrdersScreen isTab={true} />;
  }

  return <ConsultationsScreen />;
}

function ConsultationsScreen() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchConsultations = async () => {
    try {
      const response = await api.getMyConsultations();
      if (response.error) {
        setError(response.error);
      } else {
        // Map backend data to UI format
        const mappedData = (response.data || []).map(item => ({
          id: item.id,
          doctor: item.doctor_name || 'System Doctor',
          date: new Date(item.scheduled_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
          time: new Date(item.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
          mode: item.mode.charAt(0).toUpperCase() + item.mode.slice(1),
          status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          rawStatus: item.status
        }));
        setConsultations(mappedData);
      }
    } catch (err) {
      setError('Failed to load consultations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConsultations();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/consultations/desk/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.doctorInfo}>
          <Ionicons name="person-circle" size={40} color="#4a90e2" />
          <View style={styles.details}>
            <Text style={styles.doctorName}>{item.doctor}</Text>
            <Text style={styles.dateTime}>{item.date} • {item.time}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge, 
          item.rawStatus === 'completed' && styles.statusBadgeCompleted,
          item.rawStatus === 'cancelled' && styles.statusBadgeCancelled,
          item.rawStatus === 'pending' && styles.statusBadgePending
        ]}>
          <Text style={[
            styles.statusText, 
            item.rawStatus === 'completed' && styles.statusTextCompleted,
            item.rawStatus === 'cancelled' && styles.statusTextCancelled,
            item.rawStatus === 'pending' && styles.statusTextPending
          ]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.modeRow}>
          <Ionicons name={item.mode === 'Video' ? 'videocam' : 'chatbubbles'} size={16} color="#666" />
          <Text style={styles.modeText}>{item.mode} Consultation</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => router.push(`/consultations/desk/${item.id}`)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Consultations</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}><Text style={[styles.tabText, styles.tabTextActive]}>Upcoming</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Past</Text></TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchConsultations} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={consultations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4a90e2']} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={64} color="#eee" />
              <Text style={styles.emptyText}>No consultations found</Text>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0D1B3A',
    letterSpacing: -0.5,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
  },
  tabActive: {
    backgroundColor: '#0D1B3A',
    borderColor: '#0D1B3A',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  details: {
    gap: 2,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D1B3A',
  },
  dateTime: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
  },
  statusBadgeCompleted: {
    backgroundColor: '#f0fdf4',
  },
  statusBadgeCancelled: {
    backgroundColor: '#fef2f2',
  },
  statusBadgePending: {
    backgroundColor: '#fffbeb',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d97706',
    textTransform: 'uppercase',
  },
  statusTextPending: {
    color: '#d97706',
  },
  statusTextCompleted: {
    color: '#16a34a',
  },
  statusTextCancelled: {
    color: '#dc2626',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2572D9',
  },
  empty: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0D1B3A',
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '800',
  },
  viewButton: {},
});
