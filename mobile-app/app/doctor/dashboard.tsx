import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, StatusBar, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DoctorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [consultations, setConsultations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    today: '0',
    pending: '0',
    earnings: '₦0',
    completionRate: '0%'
  });

  // Force Doctor Portal Theme on Mount
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#0D1B3A');
    }
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, consultationsRes, analyticsRes] = await Promise.all([
        api.getMyProfile(),
        api.getMyConsultations(),
        api.getDoctorAnalytics()
      ]);

      if (profileRes.data) {
        setDoctorName(profileRes.data.full_name);
      }

      if (consultationsRes.data) {
        const sorted = (consultationsRes.data as any[]).sort((a, b) => 
          new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
        );
        setConsultations(sorted);
      }

      if (analyticsRes.data) {
        const a = analyticsRes.data;
        const rate = a.total_appointments > 0 
          ? Math.round((a.completed_this_month / a.total_appointments) * 100) 
          : 0;
          
        setStats({
          today: (a.today_appointments || 0).toString(),
          pending: (a.pending_appointments || 0).toString(),
          earnings: `₦${((a.total_earnings || 0) / 1000).toFixed(1)}k`,
          completionRate: `${rate}%`
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.updateConsultationStatus(id, status);
      fetchData();
    } catch (error) {
      alert('Failed to update appointment status');
    }
  };

  const renderAppointment = ({ item }: { item: any }) => (
    <View style={styles.appointmentCard}>
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => {
          if (item.status === 'accepted' || item.status === 'pending') {
            router.push({ pathname: '/consultations/desk/[id]', params: { id: item.id } })
          } else {
            alert('This appointment is no longer active.');
          }
        }}
        style={styles.cardMain}
      >
        <View style={styles.patientAvatar}>
          <LinearGradient
            colors={['#4a90e2', '#357abd']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{(item.patient_name || 'P').charAt(0)}</Text>
          </LinearGradient>
          {item.status === 'pending' && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.patientName} numberOfLines={1}>{item.patient_name || 'Unknown Patient'}</Text>
            <Text style={styles.appointmentTime}>
              {new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          <Text style={styles.appointmentReason} numberOfLines={1}>{item.reason}</Text>
          
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, 
              item.status === 'pending' ? styles.pendingBadge : 
              item.status === 'completed' ? styles.completedBadge : styles.acceptedBadge]}>
              <Text style={[styles.statusText, 
                item.status === 'pending' ? styles.pendingText : 
                item.status === 'completed' ? styles.completedText : styles.acceptedText]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            <View style={styles.modeBadge}>
              <Ionicons name={item.mode === 'video' ? 'videocam' : 'chatbubbles'} size={12} color="#666" />
              <Text style={styles.modeText}>{item.mode}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </TouchableOpacity>
      
      {item.status === 'pending' && (
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectBtn]} 
            onPress={() => handleStatusUpdate(item.id, 'cancelled')}
          >
            <Text style={styles.rejectBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptBtn]} 
            onPress={() => handleStatusUpdate(item.id, 'accepted')}
          >
            <Text style={styles.acceptBtnText}>Accept Request</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
        <Text style={styles.loadingText}>Preparing Medical Portal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0D1B3A', '#1a2a4e']}
        style={styles.topSection}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good Day,</Text>
              <Text style={styles.doctorNameText}>Dr. {doctorName.split(' ')[0] || 'Medical Expert'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.notifButton}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications" size={22} color="#fff" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Today</Text>
              <Text style={styles.statValue}>{stats.today}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{stats.pending}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Earnings</Text>
              <Text style={styles.statValue}>{stats.earnings}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D1B3A" />}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Consultation Requests</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.seeAllText}>View Schedule</Text>
          </TouchableOpacity>
        </View>

        {consultations.length > 0 ? (
          <FlatList
            data={consultations.slice(0, 8)}
            renderItem={renderAppointment}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color="#E2E8F0" />
            <Text style={styles.emptyText}>No appointments scheduled today</Text>
          </View>
        )}

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/doctor/schedule/manage')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="calendar" size={24} color="#0EA5E9" />
              </View>
              <Text style={styles.actionLabel}>Schedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/doctor/prescription/create')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="medical" size={24} color="#22C55E" />
              </View>
              <Text style={styles.actionLabel}>New Rx</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/doctor/labs/request')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="flask" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionLabel}>Lab Test</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/(tabs)/two')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="people" size={24} color="#EC4899" />
              </View>
              <Text style={styles.actionLabel}>Patients</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  topSection: {
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  doctorNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#0D1B3A',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 13,
    color: '#4a90e2',
    fontWeight: '700',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    marginRight: 16,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  appointmentTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  appointmentReason: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingBadge: {
    backgroundColor: '#FFF7ED',
  },
  acceptedBadge: {
    backgroundColor: '#F0F9FF',
  },
  completedBadge: {
    backgroundColor: '#F0FDF4',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pendingText: {
    color: '#F59E0B',
  },
  acceptedText: {
    color: '#0EA5E9',
  },
  completedText: {
    color: '#22C55E',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#F1F5F9',
  },
  acceptBtn: {
    backgroundColor: '#0D1B3A',
  },
  rejectBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  quickActionsSection: {
    marginTop: 32,
    marginBottom: 40,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickActionItem: {
    alignItems: 'center',
    width: (width - 48 - 48) / 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});
