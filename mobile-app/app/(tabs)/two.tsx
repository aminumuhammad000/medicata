import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import InventoryScreen from '../pharmacy/inventory';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UnifiedRecord {
  id: string;
  type: 'Consultation' | 'Prescription' | 'Order';
  title: string;
  date: string;
  subtitle?: string;
  status?: string;
  timestamp: number;
  raw?: any;
}

export default function UnifiedTwoScreen() {
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
  if (userRole === 'pharmacy') return <InventoryScreen isTab={true} />;
  if (userRole === 'doctor') return <DoctorPatientsScreen />;
  return <RecordsScreen />;
}

// ─── Doctor Patient Directory ────────────────────────────────────────────────
function DoctorPatientsScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await api.getMyConsultations();
      if (res.data) {
        const uniquePatients: any[] = [];
        const seenIds = new Set();
        (res.data as any[]).forEach(c => {
          if (c.patient_id && !seenIds.has(c.patient_id)) {
            seenIds.add(c.patient_id);
            uniquePatients.push({
              id: c.patient_id,
              name: c.patient_name || 'Unknown Patient',
              last_visit: new Date(c.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              reason: c.reason || 'General Consultation',
              consultation_id: c.id,
              last_status: c.status,
            });
          }
        });
        setPatients(uniquePatients);
        setFilteredPatients(uniquePatients);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const filtered = patients.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  useEffect(() => { fetchPatients(); }, []);

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return { label: 'Completed', bg: '#ECFDF5', color: '#059669' };
      case 'pending': return { label: 'Pending', bg: '#FFF7ED', color: '#D97706' };
      case 'accepted': return { label: 'Active', bg: '#EFF6FF', color: '#2563EB' };
      case 'cancelled': return { label: 'Cancelled', bg: '#FEF2F2', color: '#DC2626' };
      default: return { label: status || 'Unknown', bg: '#F1F5F9', color: '#64748B' };
    }
  };

  const renderPatient = ({ item, index }: { item: any; index: number }) => {
    const statusConfig = getStatusConfig(item.last_status);
    return (
      <Animated.View entering={FadeInDown.delay(index * 60)}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: item.consultation_id } } as any)}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{(item.name || 'P').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={11} color="#64748B" />
              <Text style={styles.metaText}>{item.last_visit}</Text>
              {item.reason ? (
                <>
                  <View style={styles.metaDot} />
                  <Text style={styles.metaText} numberOfLines={1}>{item.reason}</Text>
                </>
              ) : null}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading patients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Patient Directory</Text>
              <Text style={styles.headerSubtitle}>{patients.length} registered patients</Text>
            </View>
            <TouchableOpacity style={styles.headerBtn} onPress={() => { setRefreshing(true); fetchPatients(); }}>
              <Ionicons name="sync" size={16} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or condition..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={filteredPatients}
        renderItem={renderPatient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPatients(); }} colors={['#2563EB']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="people-outline" size={30} color="#2563EB" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Matching Patients' : 'No Patients Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No patients match "${searchQuery}".`
                : 'Your patient list grows as you complete consultations.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Patient Medical Records ─────────────────────────────────────────────────
function RecordsScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'Consultation' | 'Prescription' | 'Order'>('all');

  const fetchRecords = useCallback(async () => {
    try {
      const [consultationsRes, prescriptionsRes, ordersRes] = await Promise.all([
        api.getMyConsultations(),
        api.getMyPrescriptions(),
        api.getMyOrders(),
      ]);

      const unified: UnifiedRecord[] = [];

      if (Array.isArray(consultationsRes.data)) {
        consultationsRes.data.forEach((c: any) => {
          unified.push({
            id: c.id,
            type: 'Consultation',
            title: c.reason || 'General Consultation',
            date: new Date(c.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            subtitle: c.doctor_name ? `Dr. ${c.doctor_name}` : 'Doctor Assigned',
            status: c.status,
            timestamp: new Date(c.scheduled_at).getTime(),
            raw: c,
          });
        });
      }

      if (Array.isArray(prescriptionsRes.data)) {
        prescriptionsRes.data.forEach((p: any) => {
          unified.push({
            id: p.id,
            type: 'Prescription',
            title: 'Prescription Record',
            date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            subtitle: `Verified: ${p.is_verified ? 'Yes' : 'Pending'}`,
            timestamp: new Date(p.created_at).getTime(),
            raw: p,
          });
        });
      }

      if (Array.isArray(ordersRes.data)) {
        ordersRes.data.forEach((o: any) => {
          unified.push({
            id: o.id,
            type: 'Order',
            title: o.pharmacy_name || 'Pharmacy Order',
            date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            subtitle: `Status: ${o.status}`,
            status: o.status,
            timestamp: new Date(o.created_at).getTime(),
            raw: o,
          });
        });
      }

      unified.sort((a, b) => b.timestamp - a.timestamp);
      setRecords(unified);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  const onRefresh = () => { setRefreshing(true); fetchRecords(); };

  const filteredRecords = records.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subtitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const typeConfig = (type: string) => {
    switch (type) {
      case 'Consultation': return { icon: 'calendar-outline', color: '#2563EB', bg: '#EFF6FF' };
      case 'Prescription': return { icon: 'medical-outline', color: '#7C3AED', bg: '#F5F3FF' };
      case 'Order': return { icon: 'bag-outline', color: '#059669', bg: '#ECFDF5' };
      default: return { icon: 'document-outline', color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const statusConfig = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return { label: 'Completed', bg: '#ECFDF5', color: '#059669' };
      case 'pending': return { label: 'Pending', bg: '#FFF7ED', color: '#D97706' };
      case 'accepted': return { label: 'Active', bg: '#EFF6FF', color: '#2563EB' };
      case 'cancelled': return { label: 'Cancelled', bg: '#FEF2F2', color: '#DC2626' };
      default: return null;
    }
  };

  const filters: { key: 'all' | 'Consultation' | 'Prescription' | 'Order'; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'layers-outline' },
    { key: 'Consultation', label: 'Visits', icon: 'calendar-outline' },
    { key: 'Prescription', label: 'Prescriptions', icon: 'medical-outline' },
    { key: 'Order', label: 'Orders', icon: 'bag-outline' },
  ];

  const stats = {
    total: records.length,
    consultations: records.filter(r => r.type === 'Consultation').length,
    prescriptions: records.filter(r => r.type === 'Prescription').length,
    orders: records.filter(r => r.type === 'Order').length,
  };

  const renderRecord = ({ item, index }: { item: UnifiedRecord; index: number }) => {
    const tc = typeConfig(item.type);
    const sc = statusConfig(item.status);
    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => {
            if (item.type === 'Consultation') {
              router.push({ pathname: '/consultations/desk/[id]', params: { id: item.id } } as any);
            }
          }}
        >
          <View style={[styles.typeIconBg, { backgroundColor: tc.bg }]}>
            <Ionicons name={tc.icon as any} size={18} color={tc.color} />
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              {sc && (
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.typePill, { backgroundColor: tc.bg }]}>
                <Text style={[styles.typePillText, { color: tc.color }]}>{item.type}</Text>
              </View>
              <Text style={styles.metaDate}>{item.date}</Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading health records...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Medical Records</Text>
            <Text style={styles.headerSubtitle}>Your unified health history</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => { setRefreshing(true); fetchRecords(); }}>
            <Ionicons name="sync" size={16} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.consultations}</Text>
          <Text style={styles.statLabel}>Visits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#7C3AED' }]}>{stats.prescriptions}</Text>
          <Text style={styles.statLabel}>Prescriptions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#059669' }]}>{stats.orders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search records..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Ionicons name={f.icon as any} size={12} color={activeFilter === f.key ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredRecords}
        renderItem={renderRecord}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="shield-checkmark-outline" size={30} color="#2563EB" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Matching Records' : 'Health Ledger Empty'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No records match "${searchQuery}".`
                : 'Your consultations, prescriptions, and pharmacy orders will appear here once you start using Medicata.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/bookings/search' as any)}>
                <Ionicons name="search-outline" size={15} color="#FFFFFF" />
                <Text style={styles.ctaButtonText}>Find a Doctor</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  // Search
  searchSection: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, borderRadius: 10, height: 40, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '600', padding: 0 },

  // Stats
  statsBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: '#E2E8F0' },

  // Filters
  filterRow: { backgroundColor: '#FFFFFF', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9', gap: 5, marginRight: 6 },
  filterChipActive: { backgroundColor: '#2563EB' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF' },

  // List
  listContent: { padding: 16, paddingBottom: 40 },

  // Card (shared)
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  avatarContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  typeIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 6 },
  cardSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1' },
  typePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  typePillText: { fontSize: 10, fontWeight: '800' },
  metaDate: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24 },
  emptyIconBg: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19, fontWeight: '500', marginBottom: 28 },
  ctaButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12, gap: 8 },
  ctaButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
