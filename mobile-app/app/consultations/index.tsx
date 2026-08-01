import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function ConsultationsScreen() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      const response = await api.getMyConsultations();
      setConsultations(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    switch (activeFilter) {
      case 'upcoming':
        return consultations.filter(item => ['pending', 'accepted', 'scheduled'].includes(item.status?.toLowerCase()));
      case 'completed':
        return consultations.filter(item => item.status?.toLowerCase() === 'completed');
      case 'cancelled':
        return consultations.filter(item => item.status?.toLowerCase() === 'cancelled');
      default:
        return consultations;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': 
        return { bg: '#FFF7ED', text: '#D97706', label: 'Pending Approval' };
      case 'accepted': 
        return { bg: '#EFF6FF', text: '#2563EB', label: 'Confirmed' };
      case 'scheduled': 
        return { bg: '#F5F3FF', text: '#7C3AED', label: 'Scheduled' };
      case 'completed': 
        return { bg: '#ECFDF5', text: '#059669', label: 'Completed' };
      case 'cancelled': 
        return { bg: '#FEF2F2', text: '#DC2626', label: 'Cancelled' };
      default: 
        return { bg: '#F1F5F9', text: '#475569', label: status?.toUpperCase() || 'UNKNOWN' };
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode?.toLowerCase()) {
      case 'video': return 'videocam-outline';
      case 'audio': return 'call-outline';
      case 'chat': return 'chatbubbles-outline';
      default: return 'people-outline';
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusConfig = getStatusConfig(item.status);
    const dateObj = new Date(item.scheduled_at);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity 
        style={[styles.card, item.status === 'cancelled' && styles.cardDisabled]}
        onPress={() => {
          if (item.status !== 'cancelled') {
            router.push({ pathname: '/consultations/desk/[id]', params: { id: item.id } });
          } else {
            alert('This appointment has been cancelled.');
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.doctorInfo}>
            <View style={[styles.doctorAvatar, { backgroundColor: item.status === 'completed' ? '#F0FDF4' : '#F0F9FF' }]}>
              <Text style={[styles.avatarText, { color: item.status === 'completed' ? '#059669' : '#0284C7' }]}>
                {(item.doctor_name || 'D').charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.doctorName}>Dr. {item.doctor_name || 'Healthcare Practitioner'}</Text>
              <Text style={styles.specialtyText}>{item.specialty || 'General Practitioner'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.footerDetail}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.footerText}>{formattedDate}</Text>
          </View>
          <View style={styles.footerDetail}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.footerText}>{formattedTime}</Text>
          </View>
          <View style={styles.footerDetail}>
            <Ionicons name={getModeIcon(item.mode)} size={14} color="#2563EB" />
            <Text style={[styles.footerText, styles.modeText]}>{item.mode || 'video'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Consultations</Text>
        <TouchableOpacity style={styles.infoBtn} onPress={loadConsultations}>
          <Ionicons name="reload" size={16} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips Container */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>All Sessions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'upcoming' && styles.filterChipActive]}
            onPress={() => setActiveFilter('upcoming')}
          >
            <Text style={[styles.filterText, activeFilter === 'upcoming' && styles.filterTextActive]}>Upcoming</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'completed' && styles.filterChipActive]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.filterText, activeFilter === 'completed' && styles.filterTextActive]}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'cancelled' && styles.filterChipActive]}
            onPress={() => setActiveFilter('cancelled')}
          >
            <Text style={[styles.filterText, activeFilter === 'cancelled' && styles.filterTextActive]}>Cancelled</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Fetching visits history...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadConsultations}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getFilteredData()}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No appointments found</Text>
              <Text style={styles.emptySubtitle}>You don't have any consultation sessions matching this filter.</Text>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 4,
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
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  modeText: {
    textTransform: 'uppercase',
    color: '#2563EB',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});
