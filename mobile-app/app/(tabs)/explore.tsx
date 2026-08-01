import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import OrdersScreen from '../orders/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ExploreScreen() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      let role = await AsyncStorage.getItem('user_role');
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
  if (userRole === 'pharmacy') return <OrdersScreen isTab={true} />;
  return <ConsultationsScreen />;
}

// ─────────────────────────────────────────────────────────────
// Consultations Screen
// ─────────────────────────────────────────────────────────────
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
        const mappedData = (response.data || []).map((item: any) => ({
          id: item.id,
          doctor: item.doctor_name || item.patient_name || 'System User',
          specialty: item.specialty || 'General',
          reason: item.reason || 'Consultation',
          date: new Date(item.scheduled_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          time: new Date(item.scheduled_at).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          }),
          mode: item.mode.charAt(0).toUpperCase() + item.mode.slice(1),
          rawMode: item.mode,
          status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          rawStatus: item.status,
          scheduled_at: new Date(item.scheduled_at),
        }));
        setConsultations(mappedData);
        setError('');
      }
    } catch {
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

  const filteredConsultations = consultations.filter((c) => {
    if (activeTab === 'upcoming')
      return c.rawStatus === 'pending' || c.rawStatus === 'accepted' || c.rawStatus === 'scheduled';
    return c.rawStatus === 'completed' || c.rawStatus === 'cancelled';
  });

  const activeCount = consultations.filter(
    (c) => c.rawStatus === 'pending' || c.rawStatus === 'accepted' || c.rawStatus === 'scheduled'
  ).length;

  const getStatusStyle = (rawStatus: string) => {
    switch (rawStatus) {
      case 'completed':
        return { bg: '#ECFDF5', text: '#059669', dot: '#10B981', label: '● Done' };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', label: '● Cancelled' };
      case 'accepted':
        return { bg: '#ECFDF5', text: '#059669', dot: '#10B981', label: '● Active' };
      case 'scheduled':
        return { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', label: '● Scheduled' };
      default:
        return { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B', label: '● Pending' };
    }
  };

  const getModeIcon = (rawMode: string): any => {
    if (rawMode === 'video') return 'videocam-outline';
    if (rawMode === 'audio') return 'call-outline';
    return 'chatbubbles-outline';
  };

  const getAccentColor = (rawStatus: string) => {
    switch (rawStatus) {
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'accepted': return '#10B981';
      case 'scheduled': return '#3B82F6';
      default: return '#F59E0B';
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const statusStyle = getStatusStyle(item.rawStatus);
    const accentColor = getAccentColor(item.rawStatus);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: '/consultations/desk/[id]',
              params: { id: item.id },
            } as any)
          }
        >
          {/* Left accent stripe */}
          <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />

          <View style={styles.cardBody}>
            {/* Top row */}
            <View style={styles.cardTopRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(item.doctor || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{item.doctor}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{item.reason}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {statusStyle.label}
                </Text>
              </View>
            </View>

            {/* Chips row */}
            <View style={styles.chipsRow}>
              <View style={styles.chip}>
                <Ionicons name="calendar-outline" size={11} color="#64748B" />
                <Text style={styles.chipText}>{item.date}</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={11} color="#64748B" />
                <Text style={styles.chipText}>{item.time}</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name={getModeIcon(item.rawMode)} size={11} color="#64748B" />
                <Text style={styles.chipText}>{item.mode}</Text>
              </View>
            </View>

            {/* Footer CTA */}
            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.deskBtn}
                onPress={() =>
                  router.push({
                    pathname: '/consultations/desk/[id]',
                    params: { id: item.id },
                  } as any)
                }
              >
                <Text style={styles.deskBtnText}>Open Desk</Text>
                <Ionicons name="arrow-forward" size={13} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading appointments…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerNav}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Appointments</Text>
            <View style={styles.headerSubRow}>
              <View style={[styles.activeDot, activeCount === 0 && { backgroundColor: '#CBD5E1' }]} />
              <Text style={styles.headerSub}>
                {activeCount} active · {consultations.length} total
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.syncBtn} onPress={fetchConsultations}>
            <Ionicons name="sync-outline" size={18} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {(['upcoming', 'past'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'upcoming' ? 'Active' : 'History'}
              </Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* ── Content ── */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={40} color="#CBD5E1" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchConsultations} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConsultations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons
                  name={activeTab === 'upcoming' ? 'calendar-outline' : 'time-outline'}
                  size={36}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming' ? 'No Active Appointments' : 'No History Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming'
                  ? 'Scheduled consultations and live sessions will appear here.'
                  : 'Completed and past consultations will be listed here.'}
              </Text>
              {activeTab === 'upcoming' && (
                <TouchableOpacity
                  style={styles.ctaBtn}
                  onPress={() => router.push('/bookings/search')}
                >
                  <Ionicons name="search" size={16} color="#fff" />
                  <Text style={styles.ctaBtnText}>Find a Doctor</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)' },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  syncBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Tabs ─────────────────────────────────────────────────
  tabsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: 20,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // ── List ─────────────────────────────────────────────────
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Card ─────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EEFB',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)' },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  // ── Chips ─────────────────────────────────────────────────
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },

  // ── Card Footer CTA ────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
  },
  deskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deskBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },

  // ── Error ─────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#2563EB',
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // ── Empty State ────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 28,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
