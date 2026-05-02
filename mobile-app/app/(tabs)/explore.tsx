import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

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

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchConsultations = async () => {
    try {
      const response = await api.getMyConsultations();
      if (response.error) {
        setError(response.error);
      } else {
        // Map backend data to UI format
        const mappedData = (response.data || []).map(item => ({
          id: item.id,
          doctor: item.doctor_name || item.patient_name || 'System User',
          date: new Date(item.scheduled_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
          time: new Date(item.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
          mode: item.mode.charAt(0).toUpperCase() + item.mode.slice(1),
          status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          rawStatus: item.status,
          scheduled_at: new Date(item.scheduled_at)
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

  const filteredConsultations = consultations.filter(c => {
    if (activeTab === 'upcoming') {
      return c.rawStatus === 'pending' || c.rawStatus === 'accepted';
    } else {
      return c.rawStatus === 'completed' || c.rawStatus === 'cancelled';
    }
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      style={styles.doctorExploreCard}
      onPress={() => router.push(`/consultations/desk/${item.id}`)}
    >
      <View style={styles.doctorExploreHeader}>
        <View style={styles.doctorExploreAvatar}>
          <LinearGradient
            colors={['#0D1B3A', '#1a2a4e']}
            style={styles.doctorExploreGradient}
          >
            <Text style={styles.doctorExploreAvatarText}>{(item.doctor || 'S').charAt(0)}</Text>
          </LinearGradient>
        </View>
        <View style={styles.doctorExploreInfo}>
          <Text style={styles.doctorExploreName}>{item.doctor}</Text>
          <View style={styles.doctorExploreMetaRow}>
            <Ionicons name="calendar-outline" size={12} color="#64748B" />
            <Text style={styles.doctorExploreMeta}>{item.date}</Text>
            <View style={styles.dotSeparator} />
            <Ionicons name="time-outline" size={12} color="#64748B" />
            <Text style={styles.doctorExploreMeta}>{item.time}</Text>
          </View>
        </View>
        <View style={[
          styles.doctorStatusBadge, 
          item.rawStatus === 'completed' && styles.doctorStatusBadgeCompleted,
          item.rawStatus === 'cancelled' && styles.doctorStatusBadgeCancelled,
          item.rawStatus === 'pending' && styles.doctorStatusBadgePending
        ]}>
          <Text style={[
            styles.doctorStatusText, 
            item.rawStatus === 'completed' && styles.doctorStatusTextCompleted,
            item.rawStatus === 'cancelled' && styles.doctorStatusTextCancelled,
            item.rawStatus === 'pending' && styles.doctorStatusTextPending
          ]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.doctorExploreFooter}>
        <View style={styles.doctorModeRow}>
          <Ionicons name={item.mode === 'Video' ? 'videocam' : 'chatbubbles'} size={14} color="#64748B" />
          <Text style={styles.doctorModeText}>{item.mode} Session</Text>
        </View>
        <View style={styles.doctorViewAction}>
          <Text style={styles.doctorViewText}>Enter Desk</Text>
          <Ionicons name="arrow-forward" size={14} color="#2572D9" />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.doctorLoadingContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
      </View>
    );
  }

  return (
    <View style={styles.doctorContainer}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.doctorHeader}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.doctorHeaderTitle}>Appointments</Text>
          <Text style={styles.doctorHeaderSubtitle}>Manage your medical schedule</Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.doctorTabs}>
        <TouchableOpacity 
          style={[styles.doctorTab, activeTab === 'upcoming' && styles.doctorTabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.doctorTabText, activeTab === 'upcoming' && styles.doctorTabTextActive]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.doctorTab, activeTab === 'past' && styles.doctorTabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.doctorTabText, activeTab === 'past' && styles.doctorTabTextActive]}>Past History</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.doctorErrorContainer}>
          <Text style={styles.doctorErrorText}>{error}</Text>
          <TouchableOpacity onPress={fetchConsultations} style={styles.doctorRetryButton}>
            <Text style={styles.doctorRetryText}>Retry Fetch</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConsultations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.doctorList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D1B3A" />
          }
          ListEmptyComponent={
            <View style={styles.doctorEmpty}>
              <Ionicons name="calendar-outline" size={64} color="#E2E8F0" />
              <Text style={styles.doctorEmptyText}>No appointments found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  doctorContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  doctorLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  doctorHeader: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  doctorHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 20,
  },
  doctorHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  doctorTabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
    gap: 12,
  },
  doctorTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doctorTabActive: {
    backgroundColor: '#0D1B3A',
    borderColor: '#0D1B3A',
  },
  doctorTabText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  doctorTabTextActive: {
    color: '#fff',
  },
  doctorList: {
    padding: 24,
    paddingBottom: 40,
  },
  doctorExploreCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  doctorExploreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorExploreAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginRight: 12,
  },
  doctorExploreGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorExploreAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doctorExploreInfo: {
    flex: 1,
  },
  doctorExploreName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  doctorExploreMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorExploreMeta: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 2,
  },
  doctorStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
  },
  doctorStatusBadgeCompleted: {
    backgroundColor: '#F0FDF4',
  },
  doctorStatusBadgeCancelled: {
    backgroundColor: '#FEF2F2',
  },
  doctorStatusBadgePending: {
    backgroundColor: '#FFF7ED',
  },
  doctorStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  doctorStatusTextPending: {
    color: '#D97706',
  },
  doctorStatusTextCompleted: {
    color: '#16A34A',
  },
  doctorStatusTextCancelled: {
    color: '#DC2626',
  },
  doctorExploreFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  doctorModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorModeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  doctorViewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorViewText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2572D9',
  },
  doctorEmpty: {
    marginTop: 80,
    alignItems: 'center',
  },
  doctorEmptyText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
    fontWeight: '600',
  },
  doctorErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  doctorErrorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  doctorRetryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0D1B3A',
    borderRadius: 12,
  },
  doctorRetryText: {
    color: '#fff',
    fontWeight: '800',
  },
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
