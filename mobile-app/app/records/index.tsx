import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

type FilterType = 'all' | 'visits' | 'prescriptions' | 'labs';

export default function RecordsScreen() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const loadData = async () => {
    try {
      const res = await api.getMyConsultations();
      setConsultations(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const filteredRecords = consultations.filter(item => {
    const matchesSearch =
      (item.doctor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reason || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'visits') return true;
    if (activeFilter === 'prescriptions') return !!item.prescription_id;
    if (activeFilter === 'labs') return item.status === 'completed';
    return true;
  });

  const getStatusConfig = (item: any) => {
    if (item.status === 'completed') return { label: 'Completed', bg: '#ECFDF5', color: '#059669' };
    if (item.status === 'pending') return { label: 'Pending', bg: '#FFF7ED', color: '#D97706' };
    if (item.status === 'accepted') return { label: 'Active', bg: '#EFF6FF', color: '#2563EB' };
    if (item.status === 'cancelled') return { label: 'Cancelled', bg: '#FEF2F2', color: '#DC2626' };
    return { label: item.status || 'Unknown', bg: '#F1F5F9', color: '#64748B' };
  };

  const getModeConfig = (mode: string) => {
    switch ((mode || '').toLowerCase()) {
      case 'video': return { icon: 'videocam-outline', label: 'Video' };
      case 'audio': return { icon: 'call-outline', label: 'Audio' };
      case 'chat': return { icon: 'chatbubbles-outline', label: 'Chat' };
      default: return { icon: 'people-outline', label: 'In-person' };
    }
  };

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'All Records', icon: 'layers-outline' },
    { key: 'visits', label: 'Clinical Visits', icon: 'calendar-outline' },
    { key: 'prescriptions', label: 'Prescriptions', icon: 'medical-outline' },
    { key: 'labs', label: 'Diagnostics', icon: 'flask-outline' },
  ];

  const stats = {
    total: consultations.length,
    completed: consultations.filter(c => c.status === 'completed').length,
    prescriptions: consultations.filter(c => !!c.prescription_id).length,
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const statusConfig = getStatusConfig(item);
    const modeConfig = getModeConfig(item.mode);
    const date = new Date(item.scheduled_at || Date.now());
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <Animated.View entering={FadeInDown.delay(index * 60)}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: item.id } } as any)}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {(item.doctor_name || 'D').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.doctorName} numberOfLines={1}>
                Dr. {item.doctor_name || 'Medical Practitioner'}
              </Text>
              <Text style={styles.specialtyText}>
                {item.specialty || 'General Practice'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Reason / chief complaint */}
          {item.reason ? (
            <View style={styles.reasonRow}>
              <Ionicons name="document-text-outline" size={12} color="#94A3B8" />
              <Text style={styles.reasonText} numberOfLines={1}>{item.reason}</Text>
            </View>
          ) : null}

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color="#64748B" />
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color="#64748B" />
              <Text style={styles.metaText}>{formattedTime}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons name={modeConfig.icon as any} size={12} color="#2563EB" />
              <Text style={[styles.metaText, { color: '#2563EB' }]}>{modeConfig.label}</Text>
            </View>

            {item.prescription_id ? (
              <TouchableOpacity
                style={styles.rxBadge}
                onPress={() => router.push({ pathname: '/prescriptions/[id]', params: { id: item.prescription_id } } as any)}
              >
                <Ionicons name="medical" size={10} color="#2563EB" />
                <Text style={styles.rxBadgeText}>View Rx</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.enterDesk}>
                <Text style={styles.enterDeskText}>View Desk</Text>
                <Ionicons name="arrow-forward" size={11} color="#2563EB" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Accessing Health Records...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Medical Records</Text>
          <Text style={styles.headerSubtitle}>Electronic health history</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={loadData}>
          <Ionicons name="sync" size={16} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Visits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#059669' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.prescriptions}</Text>
          <Text style={styles.statLabel}>Prescriptions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#7C3AED' }]}>A+</Text>
          <Text style={styles.statLabel}>Blood Group</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            placeholder="Search physician, diagnosis, notes..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
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

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Ionicons name={f.icon as any} size={12} color={activeFilter === f.key ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Record Count Label */}
      {filteredRecords.length > 0 && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'} found
          </Text>
        </View>
      )}

      {/* Records List */}
      <FlatList
        data={filteredRecords}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
                ? `No records match "${searchQuery}". Try a different search term.`
                : 'Diagnostic reports, physician notes, prescriptions, and clinical case files will appear here after your first visit.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push('/bookings/search')}
              >
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },

  // Search
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
  },

  // Filters
  filterRow: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 5,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Count label
  countRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // List
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  specialtyText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Reason row
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reasonText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 2,
  },
  rxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    marginLeft: 'auto',
  },
  rxBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  enterDesk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  enterDeskText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 28,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
