import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [recentConsultation, setRecentConsultation] = useState<any>(null);
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Check if we already have some user data to show something immediately
    try {
      const user = await api.getUserData();
      setUserData(user);
      // Save fresh data to storage so it persists and matches what the server has
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      
      setUserRole(user.role);
      setLoading(false); // Show UI with cached data first
    } catch (error) {
      setLoading(true);
    }
    
    await fetchData();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchData = async () => {
    try {
      // Fetch fresh user data from server
      const meRes = await api.getMe();
      const user = meRes.data;
      
      if (user) {
        setUserData(user);
        setUserRole(user.role);
        await AsyncStorage.setItem('user_data', JSON.stringify(user));
        await AsyncStorage.setItem('user_role', user.role);
      }
      
      const role = user?.role || await api.getUserRole();

      // Fetch consultations (Skip for Pharmacy as they do not manage consultations)
      if (role !== 'Pharmacy' && role !== 'pharmacy') {
        try {
          const consultationsRes = await api.getMyConsultations();
          const consultations = consultationsRes.data || [];
          
          if (role === 'Patient' || role === 'patient' || !role) {
          const upcoming = consultations
            .filter(c => c.status === 'scheduled' || c.status === 'pending')
            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
          setRecentConsultation(upcoming[0] || consultations[0]);
        } else if (role === 'Doctor') {
          const today = new Date().toDateString();
          const todaysAppointments = consultations.filter(c => new Date(c.scheduled_at).toDateString() === today);
          const pending = consultations.filter(c => c.status === 'pending');
          const completed = consultations.filter(c => c.status === 'completed');
          
          setStats((prev: any) => ({
            ...prev,
            today: todaysAppointments.length,
            pending: pending.length,
            earnings: completed.length * 5000
          }));
          
          const nextAppt = consultations
            .filter(c => c.status === 'pending' || c.status === 'accepted')
            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
          setRecentConsultation(nextAppt);
        }
      } catch (e) {
        console.error('Failed to fetch consultations:', e);
      }
      }

      // Fetch orders if applicable
      if (role === 'Pharmacy' || role === 'Patient' || !role) {
        try {
          const ordersRes = await api.getMyOrders();
          const orders = ordersRes.data || [];
          
          if (role === 'Pharmacy') {
            const pending = orders.filter(o => o.status === 'pending' || o.status === 'processing');
            const completed = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
            
            setStats((prev: any) => ({
              ...prev,
              total: orders.length,
              pending: pending.length,
              revenue: completed.length * 3500
            }));
            
            setRecentOrder(orders[0]);
          }
        } catch (e) {
          console.error('Failed to fetch orders:', e);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  // Patient Dashboard
  const PatientDashboard = () => {
    const categories = [
      { id: 1, name: 'General', icon: 'medical' },
      { id: 2, name: 'Cardiology', icon: 'heart' },
      { id: 3, name: 'Pediatrics', icon: 'person' },
      { id: 4, name: 'Neurology', icon: 'flash' },
    ];

    return (
      <>
        <View style={styles.header}>
          <View>
            <Text style={styles.subGreeting}>Welcome back,</Text>
            <Text style={styles.greeting}>{userData?.full_name?.split(' ')[0] || 'Patient'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profilePic}
            onPress={() => router.push('/profile' as any)}
          >
            <LinearGradient
              colors={['#e3f2fd', '#f8f9fa']}
              style={styles.profilePicGradient}
            >
              <Ionicons name="person" size={24} color="#4a90e2" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
 
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#4a90e2" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search doctors, clinics..." 
            placeholderTextColor="#999"
          />
        </View>
 
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Services</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/bookings/search')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#EBF4FF' }]}>
                <Ionicons name="add-circle" size={28} color="#2563EB" />
              </View>
              <Text style={styles.actionLabel}>Book Doctor</Text>
              <Text style={styles.actionSubLabel}>Find specialists</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/pharmacy/search')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="medical" size={28} color="#7C3AED" />
              </View>
              <Text style={styles.actionLabel}>Pharmacy</Text>
              <Text style={styles.actionSubLabel}>Order meds</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/prescriptions/index')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="document-text" size={28} color="#059669" />
              </View>
              <Text style={styles.actionLabel}>Health Records</Text>
              <Text style={styles.actionSubLabel}>View history</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/medi-chat')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="sparkles" size={28} color="#D97706" />
              </View>
              <Text style={styles.actionLabel}>Medi AI</Text>
              <Text style={styles.actionSubLabel}>AI assistance</Text>
            </TouchableOpacity>
          </View>
        </View>
 
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consultation Categories</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryCard}
                onPress={() => router.push({ pathname: '/bookings/search', params: { specialty: cat.name } })}
              >
                <View style={styles.catIconBg}>
                  <Ionicons name={cat.icon as any} size={20} color="#4a90e2" />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
 
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentConsultation ? (
            <TouchableOpacity 
              style={styles.activityCard}
              onPress={() => router.push('/explore')}
            >
              <View style={styles.activityStatusIndicator} />
              <View style={styles.activityInfo}>
                <Text style={styles.activityType}>
                  {recentConsultation.status === 'scheduled' || recentConsultation.status === 'pending' ? 'Upcoming Appointment' : 'Latest Session'}
                </Text>
                <Text style={styles.activityDetail}>
                  {recentConsultation.doctor_name || 'Doctor'} • {recentConsultation.scheduled_at ? new Date(recentConsultation.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date TBD'} at {recentConsultation.scheduled_at ? new Date(recentConsultation.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="calendar-outline" size={32} color="#E2E8F0" />
              <Text style={styles.emptyActivityText}>No recent activity yet</Text>
            </View>
          )}
        </View>
      </>
    );
  };

  // Doctor Dashboard
  const DoctorDashboard = () => {
    const doctorStats = [
      { label: 'Total', value: stats.total_appointments || '0', icon: 'calendar', color: '#4a90e2' },
      { label: 'Today', value: stats.today || '0', icon: 'today', color: '#2196f3' },
      { label: 'Pending', value: stats.pending || '0', icon: 'time', color: '#ff9800' },
      { label: 'Earnings', value: `₦${(stats.earnings || 0).toLocaleString()}`, icon: 'wallet', color: '#4caf50' },
    ];

    return (
      <>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome, Dr. {userData?.full_name?.split(' ')[1] || 'Doctor'}</Text>
            <Text style={styles.subGreeting}>You have {stats.today || 0} appointments today</Text>
          </View>
          <TouchableOpacity 
            style={styles.profilePic}
            onPress={() => router.push('/profile' as any)}
          >
            <Ionicons name="person-circle" size={40} color="#4a90e2" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {doctorStats.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next Appointment</Text>
            <TouchableOpacity onPress={() => router.push('/explore')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          {recentConsultation ? (
            <TouchableOpacity 
              style={styles.activityCard}
              onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: recentConsultation.id } } as any)}
            >
              <View style={styles.activityInfo}>
                <Text style={styles.activityType}>{recentConsultation.patient_name || 'Patient'} - {recentConsultation.reason}</Text>
                <Text style={styles.activityDetail}>
                  {recentConsultation.scheduled_at ? new Date(recentConsultation.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'} - {recentConsultation.mode}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Text style={styles.emptyActivityText}>No appointments scheduled</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/doctor/prescription/create')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="document-text" size={24} color="#4caf50" />
              </View>
              <Text style={styles.actionLabel}>Prescribe</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/explore')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="calendar" size={24} color="#4a90e2" />
              </View>
              <Text style={styles.actionLabel}>Visits</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  // Pharmacy Dashboard — aligned with UserJourney.md Step 2:
  // View new prescriptions, track pending/completed orders, see notifications
  const PharmacyDashboard = () => {
    const isProfileIncomplete = !userData?.pharmacy_name || !userData?.pharmacy_contact_info || !userData?.pharmacy_address;

    const pharmacyStats = [
      { label: 'Pending', value: stats.pending || '0', icon: 'time-outline', color: '#F59E0B' },
      { label: 'Total Orders', value: stats.total || '0', icon: 'cart-outline', color: '#3B82F6' },
      { label: 'Revenue', value: `₦${(stats.revenue || 0).toLocaleString()}`, icon: 'wallet-outline', color: '#10B981' },
    ];

    return (
      <View style={styles.pharmacyDashboard}>
        <LinearGradient
          colors={['#0D1B3A', '#1E3A5F']}
          style={styles.pharmacyHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.subGreeting, { color: 'rgba(255,255,255,0.7)' }]}>Welcome back,</Text>
            <Text style={[styles.greeting, { color: '#FFFFFF' }]}>{userData?.pharmacy_name || userData?.full_name || 'Pharmacy'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.profilePic, { borderColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => router.push('/profile' as any)}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={styles.profilePicGradient}
            >
              <Ionicons name="business-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Profile Completion Prompt — User Friendly setup */}
        {isProfileIncomplete && (
          <TouchableOpacity 
            style={styles.setupCard}
            onPress={() => router.push('/onboarding/pharmacy-info')}
          >
            <LinearGradient
              colors={['#FFF7ED', '#FFFBEB']}
              style={styles.setupGradient}
            >
              <View style={styles.setupIconBg}>
                <Ionicons name="rocket-outline" size={24} color="#F59E0B" />
              </View>
              <View style={styles.setupInfo}>
                <Text style={styles.setupTitle}>Complete your setup</Text>
                <Text style={styles.setupSubTitle}>Fill in your business details to start receiving orders.</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#F59E0B" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {pharmacyStats.map((s, i) => (
            <View key={i} style={[styles.statCard, styles.pharmacyStatCard]}>
              <View style={[styles.statIconCircle, { backgroundColor: `${s.color}22` }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* New Prescriptions — Step 2: "View new prescriptions sent by doctors/patients" */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Prescriptions</Text>
            <TouchableOpacity onPress={() => router.push('/explore' as any)}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentOrder ? (
            <TouchableOpacity
              style={styles.pharmacyActivityCard}
              onPress={() => router.push({ pathname: '/pharmacy/order/[id]', params: { id: recentOrder.id } } as any)}
            >
              <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.pharmacyActivityGradient}>
                <View style={[styles.statIconCircle, { backgroundColor: '#EEF2FF', marginRight: 16 }]}>
                  <Ionicons name="document-text-outline" size={22} color="#4F46E5" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityDetail}>From: {recentOrder.patient_name || 'Customer'}</Text>
                  <Text style={styles.activitySubDetail}>
                    {new Date(recentOrder.created_at).toLocaleDateString()} • Status: {recentOrder.status}
                  </Text>
                </View>
                <View style={[styles.orderBadge, { marginBottom: 0 }]}>
                  <Text style={styles.orderBadgeText}>{recentOrder.status?.toUpperCase()}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="notifications-off-outline" size={32} color="#E2E8F0" />
              <Text style={styles.emptyActivityText}>No new prescriptions</Text>
            </View>
          )}
        </View>

        {/* Quick Actions — Step 3 & 4 shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.pharmacyActionCard]}
              onPress={() => router.push('/explore' as any)}
            >
              <View style={[styles.iconBg, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="cart-outline" size={26} color="#4F46E5" />
              </View>
              <Text style={styles.actionLabel}>Orders</Text>
              <Text style={styles.actionSubLabel}>Manage queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.pharmacyActionCard]}
              onPress={() => router.push('/(tabs)/scan' as any)}
            >
              <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="qr-code-outline" size={26} color="#10B981" />
              </View>
              <Text style={styles.actionLabel}>Dispense</Text>
              <Text style={styles.actionSubLabel}>Scan QR code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.pharmacyActionCard]}
              onPress={() => router.push('/(tabs)/two' as any)}
            >
              <View style={[styles.iconBg, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="cube-outline" size={26} color="#F59E0B" />
              </View>
              <Text style={styles.actionLabel}>Stock</Text>
              <Text style={styles.actionSubLabel}>Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.pharmacyActionCard]}
              onPress={() => router.push('/(tabs)/reputation' as any)}
            >
              <View style={[styles.iconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="stats-chart-outline" size={26} color="#7C3AED" />
              </View>
              <Text style={styles.actionLabel}>Insights</Text>
              <Text style={styles.actionSubLabel}>Performance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };


  if (loading && !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={{ marginTop: 10, color: '#64748B' }}>Loading your dashboard...</Text>
          
          <TouchableOpacity 
            style={{ marginTop: 40, padding: 10 }}
            onPress={() => loadDashboardData()}
          >
            <Text style={{ color: '#4a90e2', fontWeight: 'bold' }}>Retry Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginTop: 20, padding: 10 }}
            onPress={async () => {
              await AsyncStorage.multiRemove(['auth_token', 'user_data', 'user_role']);
              router.replace('/login');
            }}
          >
            <Text style={{ color: '#f44336' }}>Sign Out & Restart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4a90e2"]} />
        }
      >
        {(userRole?.toLowerCase() === 'patient' || !userRole) && <PatientDashboard />}
        {userRole?.toLowerCase() === 'doctor' && <DoctorDashboard />}
        {userRole?.toLowerCase() === 'pharmacy' && <PharmacyDashboard />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  profilePicGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 10px rgba(15, 23, 42, 0.03)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
      }
    }),
  },
  searchInput: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
    color: '#0F172A',
    fontWeight: '500',
  },
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  seeAll: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'flex-start',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(15, 23, 42, 0.05)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
      }
    }),
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionSubLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  categoriesScroll: {
    marginLeft: -24,
    paddingLeft: 24,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  catIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  pharmacyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pharmacyRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  pharmacyRatingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
      }
    }),
  },
  activityStatusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityDetail: {
    fontSize: 16,
    color: '#0F172A',
    marginTop: 4,
    fontWeight: '700',
  },
  emptyActivityCard: {
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyActivityText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 10px rgba(15, 23, 42, 0.05)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }
    }),
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  // Pharmacy Specific Styles
  pharmacyDashboard: {
    flex: 1,
    marginHorizontal: -24,
    marginTop: -24,
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  pharmacyHeaderGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 280,
  },
  pharmacyStatCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 0,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacyActivityCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pharmacyActivityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  orderBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  orderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  activitySubDetail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  pharmacyActionCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  setupCard: {
    marginBottom: 28,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FED7AA',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(249, 115, 22, 0.08)' },
      default: {
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      }
    }),
  },
  setupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  setupIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupInfo: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9A3412',
  },
  setupSubTitle: {
    fontSize: 12,
    color: '#C2410C',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
});
